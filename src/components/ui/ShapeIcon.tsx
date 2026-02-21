'use client';

import { Shape, SHAPE_COLORS } from '@/types';

interface ShapeIconProps {
  shape: Shape;
  size?: number;
  className?: string;
}

export default function ShapeIcon({ shape, size = 32, className = '' }: ShapeIconProps) {
  const color = SHAPE_COLORS[shape];
  const s = size;
  const half = s / 2;

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      className={className}
      aria-label={shape}
    >
      {shape === 'circle' && (
        <circle cx={half} cy={half} r={half * 0.85} fill={color} />
      )}
      {shape === 'square' && (
        <rect
          x={s * 0.1}
          y={s * 0.1}
          width={s * 0.8}
          height={s * 0.8}
          rx={s * 0.08}
          fill={color}
        />
      )}
      {shape === 'triangle' && (
        <polygon
          points={`${half},${s * 0.08} ${s * 0.92},${s * 0.92} ${s * 0.08},${s * 0.92}`}
          fill={color}
        />
      )}
      {shape === 'star' && (
        <polygon
          points={starPoints(half, half, half * 0.85, half * 0.4, 5)}
          fill={color}
        />
      )}
      {shape === 'diamond' && (
        <polygon
          points={`${half},${s * 0.05} ${s * 0.95},${half} ${half},${s * 0.95} ${s * 0.05},${half}`}
          fill={color}
        />
      )}
    </svg>
  );
}

function starPoints(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  points: number
): string {
  const step = Math.PI / points;
  const pts: string[] = [];
  for (let i = 0; i < 2 * points; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = i * step - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}
