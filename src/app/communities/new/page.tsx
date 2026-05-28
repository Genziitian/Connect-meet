// ============================================================
// /communities/new — Create a new community
// ============================================================
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, AlertCircle, Loader2, Globe, Lock,
} from 'lucide-react';

const EMOJIS = ['👥', '🎓', '💻', '🎨', '🎮', '📚', '🚀', '⚡', '🔥', '🌱', '🧪', '🎵', '🏀', '🍕'];
const COLORS = ['#00D09C', '#B794F6', '#FF6B6B', '#FBBF24', '#FB923C', '#06B6D4', '#10B981', '#EF4444'];

export default function NewCommunityPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('👥');
  const [color, setColor] = useState('#00D09C');
  const [visibility, setVisibility] = useState<'public' | 'invite_only'>('public');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  // Auto-derive slug from name
  useEffect(() => {
    if (!slug || slug === slugify(name.substring(0, name.length - 1))) {
      setSlug(slugify(name));
    }
  }, [name, slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    if (name.trim().length < 3) return setError('Name must be at least 3 characters.');
    if (slug.length < 3) return setError('Slug must be at least 3 characters.');
    if (!/^[a-z0-9-]+$/.test(slug)) return setError('Slug can only contain lowercase, numbers, and dashes.');

    setSubmitting(true);
    const { data, error: err } = await supabase
      .from('communities')
      .insert({
        owner_id: user.id,
        slug,
        name: name.trim(),
        description: description.trim() || null,
        emoji,
        banner_color: color,
        visibility,
      })
      .select('slug')
      .single();

    setSubmitting(false);
    if (err) {
      if (err.message.includes('communities_slug_key') || err.code === '23505') {
        setError('That slug is already taken. Try another.');
      } else {
        setError(err.message);
      }
      return;
    }
    router.push(`/communities/${data.slug}`);
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bb-grid py-6 px-4">
      <div className="mx-auto max-w-2xl">
        <Link href="/communities" className="inline-flex items-center gap-1 text-xs font-bold text-[#555] hover:text-[#111] mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to communities
        </Link>

        <h1 className="text-2xl sm:text-3xl font-black text-[#111] mb-1">Create a community</h1>
        <p className="text-xs text-[#555] mb-5">
          You&apos;ll be the owner. We&apos;ll auto-create <strong>#announcements</strong> and <strong>#general</strong> rooms.
        </p>

        <div className="bb-card bg-white p-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-[#FF3B3B]/10 border-[2px] border-[#FF3B3B]/30 px-3 py-2 mb-4 text-xs text-[#FF3B3B] font-medium">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}

          {/* Preview card */}
          <div
            className="rounded-xl border-[3px] border-[#111] shadow-[3px_3px_0_#111] overflow-hidden mb-5"
          >
            <div
              className="relative flex items-end h-24 p-3"
              style={{
                backgroundColor: color,
                backgroundImage: 'repeating-linear-gradient(45deg, rgba(17,17,17,0.06) 0 4px, transparent 4px 12px)',
              }}
            >
              <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full border-[2px] border-[#111] bg-white/95 px-2 py-0.5 text-[10px] font-black">
                {visibility === 'public' ? <Globe className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                {visibility === 'public' ? 'Public' : 'Invite'}
              </div>
              <div className="text-4xl drop-shadow-[2px_2px_0_#111]">{emoji}</div>
            </div>
            <div className="bg-white p-3">
              <p className="font-black text-[#111]">{name || 'Your community name'}</p>
              {description && <p className="text-xs text-[#555] line-clamp-2 mt-1">{description}</p>}
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-[#111] mb-1 uppercase tracking-wider">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. CS Hostel Block 5"
                maxLength={80}
                className="w-full rounded-xl border-[2px] border-[#111] px-3 py-2.5 text-sm shadow-[3px_3px_0_#111] focus:outline-none focus:bg-[#FDEBD3]"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#111] mb-1 uppercase tracking-wider">Slug</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#888]">/communities/</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder="cs-hostel-block-5"
                  maxLength={50}
                  className="flex-1 rounded-xl border-[2px] border-[#111] px-3 py-2 text-sm shadow-[3px_3px_0_#111] focus:outline-none focus:bg-[#FDEBD3] font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#111] mb-1 uppercase tracking-wider">
                Description <span className="text-[#888] font-medium normal-case">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this community for?"
                rows={3}
                maxLength={500}
                className="w-full rounded-xl border-[2px] border-[#111] px-3 py-2 text-sm shadow-[3px_3px_0_#111] focus:outline-none focus:bg-[#FDEBD3] resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#111] mb-2 uppercase tracking-wider">Emoji</label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border-[2px] border-[#111] text-lg ${
                      emoji === e ? 'bg-[#00D09C] shadow-[2px_2px_0_#111]' : 'bg-white hover:bg-[#FDEBD3]'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#111] mb-2 uppercase tracking-wider">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-9 w-9 rounded-lg border-[2px] border-[#111] ${
                      color === c ? 'ring-2 ring-offset-2 ring-[#111] shadow-[2px_2px_0_#111]' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#111] mb-2 uppercase tracking-wider">Visibility</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border-[2px] border-[#111] px-3 py-2 text-xs font-black shadow-[2px_2px_0_#111] ${
                    visibility === 'public' ? 'bg-[#00D09C] text-white' : 'bg-white text-[#111]'
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" /> Public
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('invite_only')}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border-[2px] border-[#111] px-3 py-2 text-xs font-black shadow-[2px_2px_0_#111] ${
                    visibility === 'invite_only' ? 'bg-[#B794F6] text-white' : 'bg-white text-[#111]'
                  }`}
                >
                  <Lock className="h-3.5 w-3.5" /> Invite-only
                </button>
              </div>
              <p className="text-[10px] text-[#888] mt-1.5">
                {visibility === 'public'
                  ? 'Anyone can browse + join freely.'
                  : 'Only invited members can join. Posts hidden from non-members.'}
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl border-[2px] border-[#111] bg-[#B794F6] py-3 text-sm font-black text-white shadow-[3px_3px_0_#111] hover:shadow-[1px_1px_0_#111] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 transition-all"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create community'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 50);
}
