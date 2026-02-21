'use client';

import { useCallback, useRef } from 'react';

type SoundName = 'tap' | 'play' | 'attack' | 'hit' | 'win' | 'lose' | 'draw' | 'reveal' | 'packOpen' | 'rarePull' | 'mythicPull' | 'cardFlip';

const FREQUENCIES: Record<string, { freq: number; duration: number; type: OscillatorType }> = {
  tap: { freq: 800, duration: 0.08, type: 'sine' },
  play: { freq: 523, duration: 0.15, type: 'triangle' },
  attack: { freq: 200, duration: 0.2, type: 'sawtooth' },
  hit: { freq: 150, duration: 0.3, type: 'square' },
  win: { freq: 880, duration: 0.5, type: 'sine' },
  lose: { freq: 220, duration: 0.4, type: 'sine' },
  draw: { freq: 660, duration: 0.12, type: 'triangle' },
  reveal: { freq: 1046, duration: 0.15, type: 'sine' },
  cardFlip: { freq: 400, duration: 0.1, type: 'triangle' },
  packOpen: { freq: 300, duration: 0.3, type: 'triangle' },
  rarePull: { freq: 523, duration: 0.6, type: 'sine' },
  mythicPull: { freq: 440, duration: 1.0, type: 'sine' },
};

export function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const playSound = useCallback(
    (name: SoundName) => {
      try {
        const ctx = getCtx();

        if (name === 'mythicPull') {
          playMythicFanfare(ctx);
          return;
        }

        if (name === 'rarePull') {
          playRareChime(ctx);
          return;
        }

        if (name === 'packOpen') {
          playPackRip(ctx);
          return;
        }

        if (name === 'cardFlip') {
          playCardFlip(ctx);
          return;
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const { freq, duration, type } = FREQUENCIES[name];

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        if (name === 'win') {
          osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + duration);
        } else if (name === 'lose') {
          osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Audio not available
      }
    },
    [getCtx]
  );

  return { playSound };
}

function playCardFlip(ctx: AudioContext) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(300, t);
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.08);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.12);
}

function playPackRip(ctx: AudioContext) {
  const t = ctx.currentTime;
  // Low thud + rising sweep
  const noise = ctx.createOscillator();
  const noiseGain = ctx.createGain();
  noise.type = 'sawtooth';
  noise.frequency.setValueAtTime(80, t);
  noise.frequency.exponentialRampToValueAtTime(200, t + 0.15);
  noiseGain.gain.setValueAtTime(0.1, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  noise.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(t);
  noise.stop(t + 0.25);

  // Shimmer
  const shimmer = ctx.createOscillator();
  const shimmerGain = ctx.createGain();
  shimmer.type = 'sine';
  shimmer.frequency.setValueAtTime(800, t + 0.1);
  shimmer.frequency.exponentialRampToValueAtTime(1600, t + 0.35);
  shimmerGain.gain.setValueAtTime(0.08, t + 0.1);
  shimmerGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  shimmer.connect(shimmerGain);
  shimmerGain.connect(ctx.destination);
  shimmer.start(t + 0.1);
  shimmer.stop(t + 0.4);
}

function playRareChime(ctx: AudioContext) {
  const t = ctx.currentTime;
  // Three-note ascending chime
  const notes = [523, 659, 784]; // C5, E5, G5
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t + i * 0.12);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.15, t + i * 0.12 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t + i * 0.12);
    osc.stop(t + i * 0.12 + 0.35);
  });
}

function playMythicFanfare(ctx: AudioContext) {
  const t = ctx.currentTime;
  // Five-note triumphant fanfare: C5 E5 G5 C6 E6
  const notes = [523, 659, 784, 1046, 1318];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t + i * 0.1);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.14, t + i * 0.1 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t + i * 0.1);
    osc.stop(t + i * 0.1 + 0.55);
  });

  // Sub-bass impact
  const bass = ctx.createOscillator();
  const bassGain = ctx.createGain();
  bass.type = 'sine';
  bass.frequency.setValueAtTime(60, t);
  bass.frequency.exponentialRampToValueAtTime(40, t + 0.5);
  bassGain.gain.setValueAtTime(0.2, t);
  bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  bass.connect(bassGain);
  bassGain.connect(ctx.destination);
  bass.start(t);
  bass.stop(t + 0.5);
}
