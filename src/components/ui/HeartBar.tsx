'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeartBarProps {
  current: number;
  max?: number;
  label: string;
}

export default function HeartBar({ current, max = 10, label }: HeartBarProps) {
  const prevRef = useRef(current);
  const [shaking, setShaking] = useState(false);
  const [flash, setFlash] = useState(false);
  const [crackingIdx, setCrackingIdx] = useState<number | null>(null);
  const [countPop, setCountPop] = useState(false);

  useEffect(() => {
    const prev = prevRef.current;
    if (current < prev) {
      setShaking(true);
      setFlash(true);
      setCrackingIdx(current);
      setCountPop(true);

      const shakeTimer = setTimeout(() => setShaking(false), 500);
      const flashTimer = setTimeout(() => setFlash(false), 300);
      const crackTimer = setTimeout(() => setCrackingIdx(null), 600);
      const popTimer = setTimeout(() => setCountPop(false), 400);

      return () => {
        clearTimeout(shakeTimer);
        clearTimeout(flashTimer);
        clearTimeout(crackTimer);
        clearTimeout(popTimer);
      };
    }
    prevRef.current = current;
  }, [current]);

  return (
    <div className="relative">
      {/* Red flash overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div
            className="absolute -inset-2 rounded-xl pointer-events-none z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ background: 'radial-gradient(ellipse, rgba(255,50,50,0.3) 0%, transparent 70%)' }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="flex items-center gap-2"
        animate={shaking ? { x: [-4, 4, -3, 3, -1, 1, 0] } : { x: 0 }}
        transition={shaking ? { duration: 0.4 } : {}}
      >
        <span className="text-sm font-bold text-white/80 uppercase tracking-wide min-w-[40px]">
          {label}
        </span>
        <div className="flex gap-0.5">
          {Array.from({ length: max }).map((_, i) => {
            const isCracking = crackingIdx !== null && i === crackingIdx;
            const isFilled = i < current;

            return (
              <div key={i} className="relative">
                <AnimatePresence mode="wait">
                  {isCracking ? (
                    <motion.span
                      key={`crack-${i}`}
                      className="text-xl inline-block"
                      initial={{ scale: 1.6, rotate: 0 }}
                      animate={{ scale: [1.6, 0.3], rotate: [0, 30], opacity: [1, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      💔
                    </motion.span>
                  ) : isFilled ? (
                    <motion.span
                      key={`fill-${i}`}
                      className="text-xl inline-block"
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.4, opacity: 0, rotate: 30 }}
                    >
                      ❤️
                    </motion.span>
                  ) : (
                    <motion.span
                      key={`empty-${i}`}
                      className="text-xl inline-block opacity-25 grayscale"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 0.25 }}
                    >
                      🖤
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        <motion.span
          className="text-xl font-black text-white ml-1"
          animate={countPop
            ? { scale: [1, 1.4, 1], color: ['#ffffff', '#ff4444', '#ffffff'] }
            : { scale: 1 }
          }
          transition={{ duration: 0.4 }}
        >
          {current}
        </motion.span>
      </motion.div>
    </div>
  );
}
