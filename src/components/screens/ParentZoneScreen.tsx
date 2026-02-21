'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import ShapeIcon from '@/components/ui/ShapeIcon';
import type { Shape } from '@/types';
import { useUIScale, type UIScalePreset } from '@/lib/ui-scale';

const SCALE_OPTIONS: { value: UIScalePreset; label: string; desc: string }[] = [
  { value: 'kid', label: '🧒 Kid', desc: 'Larger cards & text' },
  { value: 'normal', label: '👤 Normal', desc: 'Standard sizing' },
  { value: 'compact', label: '🔍 Compact', desc: 'Fits more on screen' },
];

const AVATAR_SHAPES: Shape[] = ['star', 'circle', 'square', 'triangle', 'diamond'];

export default function ParentZoneScreen() {
  const { user, signOut } = useAuth();
  const supabase = createClient();
  const { preset: uiScale, setPreset: setUIScale } = useUIScale();

  const [displayName, setDisplayName] = useState('Little Champion');
  const [avatarShape, setAvatarShape] = useState<Shape>('star');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('display_name, avatar_shape')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name || 'Little Champion');
          setAvatarShape((data.avatar_shape as Shape) || 'star');
        }
        setLoaded(true);
      });
  }, [user, supabase]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() || 'Little Champion', avatar_shape: avatarShape })
      .eq('id', user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (!loaded) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        style={{ color: 'rgba(255,255,255,0.3)' }}
      >
        <span className="text-sm">Loading profile...</span>
      </div>
    );
  }

  return (
    <div
      className="px-4 py-8"
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse at 50% 20%, rgba(59,130,246,0.15) 0%, transparent 55%),' +
          'linear-gradient(180deg, #0e1f3d 0%, #132a50 50%, #0e1f3d 100%)',
      }}
    >
      <div className="max-w-md mx-auto flex flex-col gap-8">
        {/* Header */}
        <motion.div
          className="text-center"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1
            className="text-3xl font-black tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Parent Zone
          </h1>
          <p className="text-white/30 text-sm mt-1">
            Manage your child&apos;s profile
          </p>
        </motion.div>

        {/* Account info */}
        <motion.div
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <label className="text-xs font-bold text-white/30 uppercase tracking-wider">
            Signed in as
          </label>
          <p className="text-white/70 text-sm mt-1 truncate">
            {user?.email || 'Unknown'}
          </p>
        </motion.div>

        {/* Display name */}
        <motion.div
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <label className="text-xs font-bold text-white/30 uppercase tracking-wider">
            Player Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={24}
            className="w-full mt-2 px-4 py-2.5 rounded-xl text-white text-base font-bold outline-none transition-all"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '2px solid rgba(59,130,246,0.2)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(59,130,246,0.5)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(59,130,246,0.2)')}
          />
        </motion.div>

        {/* Avatar shape */}
        <motion.div
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <label className="text-xs font-bold text-white/30 uppercase tracking-wider">
            Avatar Shape
          </label>
          <div className="flex gap-3 mt-3 justify-center">
            {AVATAR_SHAPES.map((shape) => (
              <motion.button
                key={shape}
                onClick={() => setAvatarShape(shape)}
                className="flex items-center justify-center w-12 h-12 rounded-xl transition-all"
                style={{
                  background: avatarShape === shape
                    ? 'rgba(59,130,246,0.2)'
                    : 'rgba(255,255,255,0.04)',
                  border: avatarShape === shape
                    ? '2px solid rgba(59,130,246,0.5)'
                    : '2px solid rgba(255,255,255,0.08)',
                  boxShadow: avatarShape === shape
                    ? '0 0 12px rgba(59,130,246,0.2)'
                    : 'none',
                }}
                whileTap={{ scale: 0.9 }}
              >
                <ShapeIcon shape={shape} size={24} />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* UI Scale */}
        <motion.div
          className="rounded-2xl p-4"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.22 }}
        >
          <label className="text-xs font-bold text-white/30 uppercase tracking-wider">
            Card Size
          </label>
          <div className="flex gap-2 mt-3">
            {SCALE_OPTIONS.map((opt) => (
              <motion.button
                key={opt.value}
                onClick={() => setUIScale(opt.value)}
                className="flex-1 rounded-xl py-2.5 px-2 text-center transition-all"
                style={{
                  background: uiScale === opt.value
                    ? 'rgba(59,130,246,0.2)'
                    : 'rgba(255,255,255,0.04)',
                  border: uiScale === opt.value
                    ? '2px solid rgba(59,130,246,0.5)'
                    : '2px solid rgba(255,255,255,0.08)',
                  boxShadow: uiScale === opt.value
                    ? '0 0 12px rgba(59,130,246,0.2)'
                    : 'none',
                }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-sm font-bold text-white/90">{opt.label}</div>
                <div className="text-[10px] text-white/40 mt-0.5">{opt.desc}</div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Save button */}
        <motion.button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-xl font-bold text-base transition-all disabled:opacity-50"
          style={{
            background: saved
              ? 'linear-gradient(135deg, #22c55e, #14b8a6)'
              : 'linear-gradient(135deg, #3b82f6, #6366f1)',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
          }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </motion.button>

        {/* Sign out */}
        <motion.button
          onClick={handleSignOut}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: 'rgba(239,68,68,0.8)',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Sign Out
        </motion.button>
      </div>
    </div>
  );
}
