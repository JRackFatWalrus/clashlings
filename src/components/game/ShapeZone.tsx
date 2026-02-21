'use client';

import { Shape, ShapeCard } from '@/types';
import ShapeIcon from '@/components/ui/ShapeIcon';

interface ShapeZoneProps {
  shapes: ShapeCard[];
  usedShapes?: Record<Shape, number>;
  label: string;
}

export default function ShapeZone({ shapes, usedShapes, label }: ShapeZoneProps) {
  const grouped = shapes.reduce(
    (acc, s) => {
      acc[s.shape] = (acc[s.shape] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div
      className="flex flex-col items-center gap-1 p-2 rounded-lg min-w-[56px]"
      style={{
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">{label}</span>
      {Object.entries(grouped).map(([shape, total]) => {
        const used = usedShapes ? (usedShapes[shape as Shape] || 0) : 0;
        const available = total - used;
        return (
          <div key={shape} className="flex items-center gap-0.5">
            <ShapeIcon shape={shape as ShapeCard['shape']} size={18} />
            <span className={`text-xs font-bold ${available > 0 ? 'text-white/90' : 'text-white/25'}`}>
              {available}/{total}
            </span>
          </div>
        );
      })}
      {shapes.length === 0 && (
        <span className="text-white/20 text-[10px]">empty</span>
      )}
    </div>
  );
}
