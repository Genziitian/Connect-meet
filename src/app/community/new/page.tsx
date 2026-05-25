// ============================================================
// Request a new community room — pending admin approval
// ============================================================
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, AlertCircle, Loader2, CheckCircle2, Hash } from 'lucide-react';

const COLORS = [
  { name: 'Green',  value: '#00D09C' },
  { name: 'Purple', value: '#B794F6' },
  { name: 'Coral',  value: '#FF6B6B' },
  { name: 'Orange', value: '#FB923C' },
  { name: 'Yellow', value: '#FBBF24' },
];

const EMOJIS = ['🌙', '🍙', '🎯', '🎧', '💪', '🚀', '📚', '☕', '🎮', '🎬', '🌸', '⚡', '🧠', '💡', '🔥'];

export default function NewRoomRequestPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagline, setTagline] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [color, setColor] = useState(COLORS[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    if (name.trim().length < 4) return setError('Room name must be at least 4 characters.');
    if (description.trim().length < 15) return setError('Description must be at least 15 characters.');

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);

    if (!slug) return setError('Could not derive a slug from this name.');

    setSubmitting(true);

    const isAdmin = user.role === 'admin';
    const nowIso = new Date().toISOString();

    const { error: err } = await supabase.from('community_rooms').insert({
      slug,
      name: name.trim(),
      description: description.trim(),
      tagline: tagline.trim() || null,
      emoji,
      color,
      host_alias: user.anonName || 'Anon',
      created_by: user.id,
      status: isAdmin ? 'approved' : 'pending',
      is_active: isAdmin, // admins go live immediately
      requested_at: nowIso,
      ...(isAdmin && {
        reviewed_at: nowIso,
        reviewed_by: user.id,
      }),
    });

    setSubmitting(false);

    if (err) {
      if (err.code === '23505') setError('A room with that name (slug) already exists. Try a different name.');
      else setError(err.message);
      return;
    }

    setSubmitted(true);
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bb-grid py-6 sm:py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/community"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#555] hover:text-[#111] mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to community
        </Link>

        {submitted ? (
          <div className="bb-card bg-white p-6 sm:p-8 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-[#111] bg-[#00D09C] shadow-[3px_3px_0_#111] mb-4">
              <CheckCircle2 className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-[#111] mb-2">
              {user?.role === 'admin' ? 'Room live!' : 'Request submitted'}
            </h1>
            <p className="text-sm text-[#555] mb-6">
              {user?.role === 'admin'
                ? 'Auto-approved (admin). Your room is now live and visible on /community.'
                : "An admin will review your room shortly. You'll be able to start chatting once it's approved."}
            </p>
            <Link href="/community" className="bb-btn bb-btn-green text-sm px-5 py-2.5">
              {user?.role === 'admin' ? 'Open community' : 'Back to community'}
            </Link>
          </div>
        ) : (
          <div className="bb-card bg-white p-5 sm:p-7">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B794F6] border-[2px] border-[#111] shadow-[2px_2px_0_#111]">
                <Hash className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-[#111]">
                  {user?.role === 'admin' ? 'Create a new room' : 'Request a new room'}
                </h1>
                <p className="text-xs text-[#555]">
                  {user?.role === 'admin'
                    ? 'Admin: auto-approved and goes live immediately.'
                    : 'An admin will approve before it goes live.'}
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-[#FF3B3B]/10 border-[2px] border-[#FF3B3B]/30 px-3 py-2 mb-4 text-xs text-[#FF3B3B] font-medium">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[10px] font-black text-[#111] mb-1 uppercase tracking-wider">
                  Room name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cricket Talks"
                  maxLength={80}
                  className="w-full rounded-xl border-[2px] border-[#111] px-3 py-2.5 text-sm shadow-[3px_3px_0_#111] focus:outline-none focus:bg-[#FDEBD3]"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-black text-[#111] mb-1 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this room about? Who's it for?"
                  rows={3}
                  maxLength={300}
                  className="w-full rounded-xl border-[2px] border-[#111] px-3 py-2.5 text-sm shadow-[3px_3px_0_#111] focus:outline-none focus:bg-[#FDEBD3] resize-none"
                  required
                />
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-[10px] font-black text-[#111] mb-1 uppercase tracking-wider">
                  Tagline / hashtags <span className="font-medium text-[#888] normal-case">(optional)</span>
                </label>
                <input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="#cricket #ipl #fantasy"
                  maxLength={80}
                  className="w-full rounded-xl border-[2px] border-[#111] px-3 py-2.5 text-sm shadow-[3px_3px_0_#111] focus:outline-none focus:bg-[#FDEBD3]"
                />
              </div>

              {/* Emoji */}
              <div>
                <label className="block text-[10px] font-black text-[#111] mb-1.5 uppercase tracking-wider">
                  Room emoji
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border-[2px] border-[#111] text-xl shadow-[2px_2px_0_#111] transition-all ${
                        emoji === e ? 'bg-[#FDEBD3] -translate-y-0.5' : 'bg-white hover:bg-[#FDEBD3]'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-[10px] font-black text-[#111] mb-1.5 uppercase tracking-wider">
                  Banner color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={`h-10 w-10 rounded-xl border-[2px] border-[#111] shadow-[2px_2px_0_#111] transition-all ${
                        color === c.value ? 'ring-2 ring-offset-2 ring-[#111] -translate-y-0.5' : ''
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-xl border-[2px] border-[#111] overflow-hidden shadow-[3px_3px_0_#111]">
                <div
                  className="flex items-end h-20 p-3 border-b-[2px] border-[#111]"
                  style={{ backgroundColor: color, backgroundImage: 'repeating-linear-gradient(45deg, rgba(17,17,17,0.06) 0 4px, transparent 4px 12px)' }}
                >
                  <span className="text-2xl drop-shadow-[2px_2px_0_#111]">{emoji}</span>
                </div>
                <div className="p-3 bg-white">
                  <p className="text-sm font-black text-[#111]">{name || 'Room name preview'}</p>
                  <p className="text-[11px] text-[#555] mt-0.5 line-clamp-2">{description || 'Description preview'}</p>
                  {tagline && <p className="text-[10px] text-[#888] mt-1 font-bold">{tagline}</p>}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-[2px] border-[#111] bg-[#00D09C] py-3 text-sm font-black text-white shadow-[3px_3px_0_#111] hover:shadow-[1px_1px_0_#111] hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50 transition-all"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : user?.role === 'admin' ? (
                  'Create room (auto-approve)'
                ) : (
                  'Submit for approval'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
