'use client';

import Image from 'next/image';

interface PlaymatBackgroundProps {
  src?: string;
}

export default function PlaymatBackground({
  src = '/ui/playmat_v1.png',
}: PlaymatBackgroundProps) {
  return (
    <div className="playmat-bg">
      {/* Layer 0: Mat image */}
      <Image
        src={src}
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
        priority
        quality={90}
      />

      {/* Layer 1a: Noise texture for material feel */}
      <div className="playmat-noise" />

      {/* Layer 1b: Perspective depth — darkens top/bottom edges */}
      <div className="playmat-perspective" />

      {/* Layer 1c: Vignette — darkens corners for camera depth */}
      <div className="playmat-vignette" />

      {/* Layer 1d: Subtle center spotlight */}
      <div className="playmat-spotlight" />
    </div>
  );
}
