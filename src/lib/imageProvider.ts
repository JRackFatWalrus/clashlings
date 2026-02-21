/**
 * Image generation provider abstraction.
 * Supports multiple API formats:
 *   - Google Gemini image generation (generateContent)
 *   - Google Imagen (predict)
 *   - OpenAI DALL-E style
 *   - Generic base64 response APIs
 *
 * Also provides removeBackground() for the cutout pipeline.
 */

export interface ImageProviderOptions {
  apiUrl: string;
  apiKey: string;
}

export interface BgRemoveOptions {
  apiUrl: string;
  apiKey: string;
}

const DEFAULT_MAX_RETRIES = 4;
const INITIAL_BACKOFF_MS = 2000;

export class ImageProvider {
  private apiUrl: string;
  private apiKey: string;
  private maxRetries: number;
  private isGoogle: boolean;
  private isGeminiContent: boolean;
  private bgRemoveUrl: string | null;
  private bgRemoveKey: string | null;

  constructor(
    opts: ImageProviderOptions,
    maxRetries = DEFAULT_MAX_RETRIES,
    bgRemove?: BgRemoveOptions,
  ) {
    this.apiUrl = opts.apiUrl;
    this.apiKey = opts.apiKey;
    this.maxRetries = maxRetries;
    this.isGoogle = opts.apiUrl.includes('googleapis.com');
    this.isGeminiContent = opts.apiUrl.includes('generateContent');
    this.bgRemoveUrl = bgRemove?.apiUrl ?? null;
    this.bgRemoveKey = bgRemove?.apiKey ?? null;
  }

  get canRemoveBackground(): boolean {
    return !!this.bgRemoveUrl && !!this.bgRemoveKey;
  }

  async generateImage(prompt: string): Promise<Buffer> {
    if (this.isGoogle) {
      return this.generateImageGoogle(prompt);
    }
    return this.generateImageGeneric(prompt);
  }

  private async generateImageGoogle(prompt: string): Promise<Buffer> {
    const separator = this.apiUrl.includes('?') ? '&' : '?';
    const url = `${this.apiUrl}${separator}key=${this.apiKey}`;

    const body = this.isGeminiContent
      ? {
          contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }
      : {
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio: '1:1' },
        };

    return this.callWithRetry(async () => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 429 || res.status === 502 || res.status === 503) {
        await this.handleRetryableStatus(res);
        throw new RetryableError(`Status ${res.status}`);
      }

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Google API error ${res.status}: ${text.slice(0, 500)}`);
      }

      const data = await res.json();

      // Gemini generateContent response: candidates[].content.parts[].inlineData
      if (data.candidates && Array.isArray(data.candidates)) {
        for (const candidate of data.candidates) {
          const parts = candidate?.content?.parts;
          if (Array.isArray(parts)) {
            for (const part of parts) {
              if (part?.inlineData?.data) {
                return Buffer.from(part.inlineData.data, 'base64');
              }
            }
          }
        }
      }

      // Google Imagen predict response: predictions[].bytesBase64Encoded
      if (data.predictions && Array.isArray(data.predictions) && data.predictions.length > 0) {
        const b64 = data.predictions[0].bytesBase64Encoded;
        if (typeof b64 === 'string') {
          return Buffer.from(b64, 'base64');
        }
      }

      throw new Error(`No image in Google response: ${JSON.stringify(data).slice(0, 400)}`);
    });
  }

  private async generateImageGeneric(prompt: string): Promise<Buffer> {
    return this.callWithRetry(async () => {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          prompt,
          size: '512x512',
          format: 'png',
          n: 1,
        }),
      });

      if (res.status === 429 || res.status === 502 || res.status === 503) {
        await this.handleRetryableStatus(res);
        throw new RetryableError(`Status ${res.status}`);
      }

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`API error ${res.status}: ${text.slice(0, 300)}`);
      }

      const data = await res.json();
      const base64 = extractBase64(data);
      if (!base64) {
        throw new Error('No base64 image data in response');
      }

      return Buffer.from(base64, 'base64');
    });
  }

  async removeBackground(imageBuffer: Buffer): Promise<Buffer> {
    if (!this.bgRemoveUrl || !this.bgRemoveKey) {
      throw new Error(
        'Background removal not configured. Set BG_REMOVE_API_URL and BG_REMOVE_API_KEY.',
      );
    }

    const url = this.bgRemoveUrl;
    const key = this.bgRemoveKey;

    return this.callWithRetry(async () => {
      const base64Input = imageBuffer.toString('base64');

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({ image: base64Input, format: 'png' }),
      });

      if (res.status === 429 || res.status === 502 || res.status === 503) {
        await this.handleRetryableStatus(res);
        throw new RetryableError(`Status ${res.status}`);
      }

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`BG remove error ${res.status}: ${text.slice(0, 300)}`);
      }

      const contentType = res.headers.get('content-type') ?? '';
      if (contentType.includes('image/')) {
        const arrayBuf = await res.arrayBuffer();
        return Buffer.from(arrayBuf);
      }

      const data = await res.json();
      const base64 = extractBase64(data);
      if (!base64) {
        throw new Error('No base64 image data in bg-remove response');
      }
      return Buffer.from(base64, 'base64');
    });
  }

  private async callWithRetry(fn: () => Promise<Buffer>): Promise<Buffer> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        const jitter = Math.random() * backoff * 0.3;
        const waitMs = backoff + jitter;
        console.log(`  Retry ${attempt}/${this.maxRetries} in ${Math.round(waitMs)}ms...`);
        await sleep(waitMs);
      }

      try {
        return await fn();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const isRetryable =
          err instanceof RetryableError ||
          lastError.message.includes('ECONNRESET') ||
          lastError.message.includes('ETIMEDOUT') ||
          lastError.message.includes('fetch failed');

        if (!isRetryable) throw lastError;
      }
    }

    throw lastError ?? new Error('Max retries exceeded');
  }

  private async handleRetryableStatus(res: Response): Promise<void> {
    if (res.status === 429) {
      const retryAfter = res.headers.get('retry-after');
      const waitSec = retryAfter ? parseInt(retryAfter, 10) : 0;
      if (waitSec > 0) {
        console.log(`  Rate limited. Waiting ${waitSec}s (Retry-After header)...`);
        await sleep(waitSec * 1000);
      }
    }
  }
}

class RetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetryableError';
  }
}

function extractBase64(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;

  if (typeof obj.image === 'string') return obj.image;

  // OpenAI: { data: [{ b64_json }] }
  if (Array.isArray(obj.data) && obj.data.length > 0) {
    const first = obj.data[0] as Record<string, unknown>;
    if (typeof first.b64_json === 'string') return first.b64_json;
  }

  if (Array.isArray(obj.images) && typeof obj.images[0] === 'string') {
    return obj.images[0];
  }

  if (typeof obj.output === 'string') return obj.output;
  if (typeof obj.result === 'string') return obj.result;

  // Google Imagen: { predictions: [{ bytesBase64Encoded }] }
  if (Array.isArray(obj.predictions) && obj.predictions.length > 0) {
    const first = obj.predictions[0] as Record<string, unknown>;
    if (typeof first.bytesBase64Encoded === 'string') return first.bytesBase64Encoded;
  }

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
