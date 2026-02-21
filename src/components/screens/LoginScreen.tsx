'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

export default function LoginScreen() {
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);
  const supabase = createClient();

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setLoading(provider);
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 50% 30%, rgba(59,130,246,0.2) 0%, transparent 55%),' +
          'radial-gradient(ellipse at 50% 90%, rgba(20,184,166,0.12) 0%, transparent 50%),' +
          'linear-gradient(180deg, #0e1f3d 0%, #132a50 50%, #0e1f3d 100%)',
      }}
    >
      {/* Decorative glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <motion.div
        className="flex flex-col items-center gap-8 relative z-10 w-full max-w-sm"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Logo area */}
        <div className="flex flex-col items-center gap-3">
          <motion.span
            className="text-7xl"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            🐾
          </motion.span>
          <h1
            className="text-4xl font-black tracking-tight text-center"
            style={{
              background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #60a5fa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Creature Clash
          </h1>
          <p className="text-white/40 text-sm font-medium text-center">
            The card battle game for young champions
          </p>
        </div>

        {/* Auth buttons */}
        <div className="flex flex-col gap-3 w-full">
          <motion.button
            onClick={() => handleOAuth('google')}
            disabled={loading !== null}
            className="flex items-center justify-center gap-3 w-full py-3.5 px-6 rounded-xl font-bold text-base transition-all disabled:opacity-50"
            style={{
              background: '#fff',
              color: '#1f1f1f',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.1)',
            }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {loading === 'google' ? 'Signing in...' : 'Continue with Google'}
          </motion.button>
        </div>

        {/* Footer */}
        <p className="text-white/20 text-xs text-center mt-4 leading-relaxed">
          Parents: sign in to save your child&apos;s progress,
          <br />
          collection, and decks across devices.
        </p>
      </motion.div>
    </div>
  );
}
