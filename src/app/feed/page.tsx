// ============================================================
// /feed — Reddit-style discussion list (anonymous, vote + comment)
// ============================================================
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import {
  Plus, MessageSquare, ArrowUp, ArrowDown, Loader2, Hash, Flame, Clock, Pin,
} from 'lucide-react';

interface FeedPost {
  id: string;
  kind: 'discussion' | 'poll';
  title: string;
  body: string | null;
  author_id: string;
  author_handle: string;
  author_role: string;
  topic_id: string | null;
  topic_slug: string | null;
  topic_label: string | null;
  topic_color: string | null;
  room_id: string | null;
  room_slug: string | null;
  room_name: string | null;
  community_id: string | null;
  community_slug: string | null;
  community_name: string | null;
  is_pinned: boolean;
  is_locked: boolean;
  comment_count: number;
  upvote_count: number;
  created_at: string;
  my_vote: -1 | 0 | 1;
}

type Sort = 'hot' | 'new';

export default function FeedPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<Sort>('hot');
  const [topicFilter, setTopicFilter] = useState<string>('');
  const [topics, setTopics] = useState<{ id: string; slug: string; label: string; emoji: string | null }[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    supabase
      .from('topics')
      .select('id, slug, label, emoji')
      .eq('is_active', true)
      .then(({ data }) => setTopics(data || []));
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase.from('v_feed_posts').select('*').limit(50);
    if (topicFilter) query = query.eq('topic_slug', topicFilter);
    if (sort === 'hot') query = query.order('upvote_count', { ascending: false }).order('created_at', { ascending: false });
    else query = query.order('created_at', { ascending: false });
    const { data } = await query;
    setPosts((data || []) as FeedPost[]);
    setLoading(false);
  }, [user, sort, topicFilter]);

  useEffect(() => {
    load();
  }, [load]);

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bb-grid py-6 px-4">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-black text-[#111]">Feed</h1>
            <p className="text-xs text-[#555] font-medium">
              Anonymous discussion across topics & communities
            </p>
          </div>
          <Link
            href="/feed/new"
            prefetch
            className="inline-flex items-center gap-1.5 rounded-xl border-[2px] border-[#111] bg-[#00D09C] px-3 py-2 text-xs font-black text-white shadow-[3px_3px_0_#111] hover:shadow-[1px_1px_0_#111] active:translate-x-[1px] active:translate-y-[1px] transition-all"
          >
            <Plus className="h-3.5 w-3.5" /> New post
          </Link>
        </div>

        {/* Sort tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setSort('hot')}
            className={`inline-flex items-center gap-1 rounded-xl border-[2px] border-[#111] px-3 py-1.5 text-xs font-black shadow-[2px_2px_0_#111] whitespace-nowrap ${
              sort === 'hot' ? 'bg-[#FF6B6B] text-white' : 'bg-white text-[#111]'
            }`}
          >
            <Flame className="h-3.5 w-3.5" /> Hot
          </button>
          <button
            onClick={() => setSort('new')}
            className={`inline-flex items-center gap-1 rounded-xl border-[2px] border-[#111] px-3 py-1.5 text-xs font-black shadow-[2px_2px_0_#111] whitespace-nowrap ${
              sort === 'new' ? 'bg-[#00D09C] text-white' : 'bg-white text-[#111]'
            }`}
          >
            <Clock className="h-3.5 w-3.5" /> New
          </button>
        </div>

        {/* Topic chip filter */}
        {topics.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            <button
              onClick={() => setTopicFilter('')}
              className={`inline-flex items-center gap-1 rounded-full border-[2px] border-[#111] px-2.5 py-1 text-[11px] font-black shadow-[2px_2px_0_#111] whitespace-nowrap ${
                topicFilter === '' ? 'bg-[#111] text-white' : 'bg-white text-[#111]'
              }`}
            >
              All
            </button>
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => setTopicFilter(t.slug)}
                className={`inline-flex items-center gap-1 rounded-full border-[2px] border-[#111] px-2.5 py-1 text-[11px] font-black shadow-[2px_2px_0_#111] whitespace-nowrap ${
                  topicFilter === t.slug ? 'bg-[#B794F6] text-white' : 'bg-white text-[#111]'
                }`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#888] mx-auto" />
          </div>
        ) : posts.length === 0 ? (
          <div className="bb-card bg-white p-8 text-center">
            <MessageSquare className="h-10 w-10 text-[#888] mx-auto mb-3" />
            <p className="text-sm font-bold text-[#111] mb-1">No posts yet</p>
            <p className="text-xs text-[#555] mb-4">Be the first to start the discussion.</p>
            <Link
              href="/feed/new"
              className="inline-flex items-center gap-1.5 rounded-xl border-[2px] border-[#111] bg-[#00D09C] px-4 py-2 text-xs font-black text-white shadow-[2px_2px_0_#111]"
            >
              <Plus className="h-3.5 w-3.5" /> Write the first post
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} onVoted={load} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, onVoted }: { post: FeedPost; onVoted: () => void }) {
  const { user } = useAuth();
  const [myVote, setMyVote] = useState<-1 | 0 | 1>(post.my_vote);
  const [localCount, setLocalCount] = useState(post.upvote_count);

  useEffect(() => {
    setMyVote(post.my_vote);
    setLocalCount(post.upvote_count);
  }, [post.my_vote, post.upvote_count]);

  const vote = async (val: 1 | -1) => {
    if (!user) return;
    const next = myVote === val ? 0 : val;
    const delta = next - myVote;
    // Optimistic
    setMyVote(next);
    setLocalCount((c) => c + delta);

    const { error } = await supabase
      .from('post_votes')
      .upsert({ post_id: post.id, user_id: user.id, value: next }, { onConflict: 'post_id,user_id' });
    if (error) {
      // Revert
      setMyVote(myVote);
      setLocalCount(post.upvote_count);
      alert('Vote failed: ' + error.message);
    } else {
      // The trigger updates the count server-side; we refresh on a delay
      setTimeout(onVoted, 500);
    }
  };

  return (
    <li className="bb-card bg-white p-3 sm:p-4 hover:shadow-[5px_5px_0_#111] hover:-translate-y-0.5 transition-all">
      <div className="flex gap-3">
        {/* Vote column */}
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => vote(1)}
            className={`flex h-7 w-7 items-center justify-center rounded-md border-[2px] border-[#111] shadow-[1.5px_1.5px_0_#111] ${
              myVote === 1 ? 'bg-[#00D09C] text-white' : 'bg-white text-[#888] hover:bg-[#00D09C]/15'
            }`}
            title="Upvote"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <span className={`text-sm font-black tabular-nums ${
            myVote === 1 ? 'text-[#00D09C]' : myVote === -1 ? 'text-[#FF3B3B]' : 'text-[#111]'
          }`}>
            {localCount}
          </span>
          <button
            onClick={() => vote(-1)}
            className={`flex h-7 w-7 items-center justify-center rounded-md border-[2px] border-[#111] shadow-[1.5px_1.5px_0_#111] ${
              myVote === -1 ? 'bg-[#FF3B3B] text-white' : 'bg-white text-[#888] hover:bg-[#FF3B3B]/15'
            }`}
            title="Downvote"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body */}
        <Link href={`/feed/${post.id}`} className="flex-1 min-w-0 block">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap text-[10px] font-bold">
            {post.is_pinned && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#00D09C] border border-[#111] px-1.5 py-px text-white font-black uppercase">
                <Pin className="h-2.5 w-2.5" /> Pinned
              </span>
            )}
            {post.topic_label && (
              <span
                className="inline-flex items-center gap-0.5 rounded-full border border-[#111] px-1.5 py-px text-white"
                style={{ backgroundColor: topicColor(post.topic_color) }}
              >
                <Hash className="h-2.5 w-2.5" /> {post.topic_label}
              </span>
            )}
            {post.community_name && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#B794F6] border border-[#111] px-1.5 py-px text-white">
                {post.community_name}
              </span>
            )}
            {post.room_name && post.community_name && (
              <span className="text-[#888]">· {post.room_name}</span>
            )}
            <span className="text-[#888]">· {post.author_handle}</span>
            <span className="text-[#888]">· {formatRelative(post.created_at)}</span>
          </div>
          <h3 className="text-sm sm:text-base font-black text-[#111] mb-1 leading-tight">{post.title}</h3>
          {post.body && (
            <p className="text-xs sm:text-sm text-[#555] line-clamp-3 mb-2">{post.body}</p>
          )}
          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#888]">
            <MessageSquare className="h-3 w-3" /> {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
          </div>
        </Link>
      </div>
    </li>
  );
}

function topicColor(c: string | null) {
  // Topics store named colors ('green', 'red', etc.). Map to hex.
  const map: Record<string, string> = {
    green: '#00D09C',
    red: '#FF3B3B',
    purple: '#B794F6',
    orange: '#FB923C',
    yellow: '#FBBF24',
  };
  if (!c) return '#888';
  if (c.startsWith('#')) return c;
  return map[c] || '#888';
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}
