// ============================================================
// /feed/new — Create a discussion post
// ============================================================
'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, AlertCircle, Loader2, Hash, Users } from 'lucide-react';

interface Topic {
  id: string;
  slug: string;
  label: string;
  emoji: string | null;
  color: string | null;
}

interface RoomOption {
  id: string;
  slug: string;
  name: string;
  community_id: string | null;
  community_name: string | null;
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={null}>
      <CreatePostInner />
    </Suspense>
  );
}

function CreatePostInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [scope, setScope] = useState<'topic' | 'room'>('topic');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [topicId, setTopicId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    supabase
      .from('topics')
      .select('id, slug, label, emoji, color')
      .eq('is_active', true)
      .order('label')
      .then(({ data }) => setTopics((data || []) as Topic[]));
  }, []);

  // Load rooms the user can post in (community member or standalone)
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Get communities user is in
      const { data: myComms } = await supabase
        .from('v_my_communities')
        .select('id, name');
      const commIds = (myComms || []).map((c: { id: string }) => c.id);

      // Rooms in those communities (non-announcements) + admins can post anywhere
      const isAdmin = user.role === 'admin';
      let query = supabase
        .from('community_rooms')
        .select('id, slug, name, community_id, is_announcements');

      if (!isAdmin && commIds.length > 0) {
        query = query.in('community_id', commIds);
      } else if (!isAdmin) {
        // user has no communities; show nothing
        setRooms([]);
        return;
      }

      const { data: rs } = await query;
      const result: RoomOption[] = (rs || [])
        .filter((r: { is_announcements: boolean }) => !r.is_announcements || isAdmin)
        .map((r: { id: string; slug: string; name: string; community_id: string | null }) => ({
          id: r.id,
          slug: r.slug,
          name: r.name,
          community_id: r.community_id,
          community_name: null,
        }));

      // Fetch community names for grouping
      if (result.length > 0) {
        const ids = Array.from(new Set(result.map((r) => r.community_id).filter(Boolean))) as string[];
        if (ids.length > 0) {
          const { data: cs } = await supabase.from('communities').select('id, name').in('id', ids);
          const nameMap: Record<string, string> = {};
          (cs || []).forEach((c: { id: string; name: string }) => { nameMap[c.id] = c.name; });
          result.forEach((r) => {
            r.community_name = r.community_id ? nameMap[r.community_id] || null : null;
          });
        }
      }
      setRooms(result);
    };
    load();
  }, [user]);

  // Default selection from query string
  useEffect(() => {
    const t = search.get('topic');
    const r = search.get('room');
    if (t && topics.length > 0) {
      const found = topics.find((x) => x.slug === t);
      if (found) {
        setScope('topic');
        setTopicId(found.id);
      }
    }
    if (r) {
      setScope('room');
      setRoomId(r);
    }
  }, [search, topics]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    if (title.trim().length < 4) return setError('Title must be at least 4 characters.');
    if (scope === 'topic' && !topicId) return setError('Pick a topic.');
    if (scope === 'room' && !roomId) return setError('Pick a room.');

    setSubmitting(true);
    const { data, error: err } = await supabase
      .from('posts')
      .insert({
        author_id: user.id,
        title: title.trim(),
        body: body.trim() || null,
        topic_id: scope === 'topic' ? topicId : null,
        room_id: scope === 'room' ? roomId : null,
      })
      .select('id')
      .single();

    setSubmitting(false);
    if (err) {
      if (err.message.includes('row-level security')) {
        setError("Can't post here — you need to be a member of this community.");
      } else {
        setError(err.message);
      }
      return;
    }
    router.push(`/feed/${data.id}`);
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bb-grid py-6 px-4">
      <div className="mx-auto max-w-2xl">
        <Link href="/feed" className="inline-flex items-center gap-1 text-xs font-bold text-[#555] hover:text-[#111] mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to feed
        </Link>

        <h1 className="text-2xl font-black text-[#111] mb-1">Create a post</h1>
        <p className="text-xs text-[#555] mb-5">Anonymous. Posts as your anon handle.</p>

        <div className="bb-card bg-white p-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-[#FF3B3B]/10 border-[2px] border-[#FF3B3B]/30 px-3 py-2 mb-4 text-xs text-[#FF3B3B] font-medium">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {/* Scope picker */}
            <div>
              <label className="block text-[10px] font-black text-[#111] mb-2 uppercase tracking-wider">Post to</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setScope('topic')}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border-[2px] border-[#111] px-3 py-2 text-xs font-black shadow-[2px_2px_0_#111] ${
                    scope === 'topic' ? 'bg-[#00D09C] text-white' : 'bg-white text-[#111]'
                  }`}
                >
                  <Hash className="h-3.5 w-3.5" /> Global Topic
                </button>
                <button
                  type="button"
                  onClick={() => setScope('room')}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border-[2px] border-[#111] px-3 py-2 text-xs font-black shadow-[2px_2px_0_#111] ${
                    scope === 'room' ? 'bg-[#B794F6] text-white' : 'bg-white text-[#111]'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" /> Community Room
                </button>
              </div>
            </div>

            {scope === 'topic' ? (
              <div>
                <label className="block text-[10px] font-black text-[#111] mb-1 uppercase tracking-wider">
                  Topic
                </label>
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  className="w-full rounded-xl border-[2px] border-[#111] px-3 py-2.5 text-sm shadow-[3px_3px_0_#111] focus:outline-none bg-white"
                  required
                >
                  <option value="">Pick a topic…</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.emoji || '#'} {t.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-black text-[#111] mb-1 uppercase tracking-wider">
                  Room
                </label>
                {rooms.length === 0 ? (
                  <p className="text-xs text-[#555] rounded-lg bg-[#FBBF24]/15 border-[2px] border-[#FBBF24]/30 p-3">
                    You&apos;re not a member of any community room yet. <Link href="/communities" className="font-bold text-[#00D09C] underline">Browse communities</Link> first.
                  </p>
                ) : (
                  <select
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full rounded-xl border-[2px] border-[#111] px-3 py-2.5 text-sm shadow-[3px_3px_0_#111] focus:outline-none bg-white"
                    required
                  >
                    <option value="">Pick a room…</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.community_name ? `${r.community_name} → ${r.name}` : r.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-[#111] mb-1 uppercase tracking-wider">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's on your mind?"
                maxLength={200}
                className="w-full rounded-xl border-[2px] border-[#111] px-3 py-2.5 text-sm shadow-[3px_3px_0_#111] focus:outline-none focus:bg-[#FDEBD3]"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#111] mb-1 uppercase tracking-wider">
                Body <span className="text-[#888] font-medium normal-case">(optional)</span>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Add more context — the longer the better."
                rows={6}
                maxLength={5000}
                className="w-full rounded-xl border-[2px] border-[#111] px-3 py-2.5 text-sm shadow-[3px_3px_0_#111] focus:outline-none focus:bg-[#FDEBD3] resize-none"
              />
              <p className="text-[10px] text-[#888] text-right mt-1">{body.length}/5000</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl border-[2px] border-[#111] bg-[#00D09C] py-3 text-sm font-black text-white shadow-[3px_3px_0_#111] hover:shadow-[1px_1px_0_#111] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 transition-all"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post anonymously'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
