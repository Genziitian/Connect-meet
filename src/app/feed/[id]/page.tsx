// ============================================================
// /feed/[id] — Post detail + comments + voting
// ============================================================
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, ArrowUp, ArrowDown, Loader2, AlertCircle, MessageSquare,
  Hash, Pin, Lock, Send,
} from 'lucide-react';

interface FeedPost {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  author_id: string;
  author_handle: string;
  topic_label: string | null;
  topic_color: string | null;
  community_name: string | null;
  room_name: string | null;
  is_pinned: boolean;
  is_locked: boolean;
  comment_count: number;
  upvote_count: number;
  created_at: string;
  my_vote: -1 | 0 | 1;
}

interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string;
  body: string;
  upvote_count: number;
  is_deleted: boolean;
  created_at: string;
  author_handle?: string;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [post, setPost] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [myCommentVotes, setMyCommentVotes] = useState<Record<string, -1 | 0 | 1>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    const [{ data: p, error: pErr }, { data: cs }] = await Promise.all([
      supabase.from('v_feed_posts').select('*').eq('id', postId).maybeSingle<FeedPost>(),
      supabase
        .from('comments')
        .select('id, post_id, parent_id, author_id, body, upvote_count, is_deleted, created_at')
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true }),
    ]);

    if (pErr || !p) {
      setError(pErr?.message || 'Post not found.');
      setLoading(false);
      return;
    }
    setPost(p);

    // Fetch author handles for comments
    const commentList = (cs || []) as Comment[];
    if (commentList.length > 0) {
      const ids = Array.from(new Set(commentList.map((c) => c.author_id)));
      const { data: users } = await supabase
        .from('users')
        .select('id, anon_name')
        .in('id', ids);
      const handleMap: Record<string, string> = {};
      (users || []).forEach((u: { id: string; anon_name: string }) => { handleMap[u.id] = u.anon_name; });
      commentList.forEach((c) => { c.author_handle = handleMap[c.author_id] || 'Anon'; });

      // Load my votes on these comments
      const { data: cv } = await supabase
        .from('comment_votes')
        .select('comment_id, value')
        .eq('user_id', user.id)
        .in('comment_id', commentList.map((c) => c.id));
      const voteMap: Record<string, -1 | 0 | 1> = {};
      (cv || []).forEach((v: { comment_id: string; value: -1 | 0 | 1 }) => { voteMap[v.comment_id] = v.value; });
      setMyCommentVotes(voteMap);
    }
    setComments(commentList);

    setLoading(false);
  }, [user, postId]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: new comments + post vote changes
  useEffect(() => {
    if (!postId) return;
    const channel = supabase
      .channel(`post-${postId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` }, () => load())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts', filter: `id=eq.${postId}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, load]);

  const votePost = async (val: 1 | -1) => {
    if (!user || !post) return;
    const next = post.my_vote === val ? 0 : val;
    // Optimistic
    setPost({ ...post, my_vote: next, upvote_count: post.upvote_count + (next - post.my_vote) });
    const { error: err } = await supabase
      .from('post_votes')
      .upsert({ post_id: post.id, user_id: user.id, value: next }, { onConflict: 'post_id,user_id' });
    if (err) {
      alert('Vote failed: ' + err.message);
      load();
    }
  };

  const voteComment = async (commentId: string, val: 1 | -1) => {
    if (!user) return;
    const cur = myCommentVotes[commentId] || 0;
    const next = cur === val ? 0 : val;
    setMyCommentVotes((prev) => ({ ...prev, [commentId]: next as -1 | 0 | 1 }));
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, upvote_count: c.upvote_count + (next - cur) } : c))
    );
    const { error: err } = await supabase
      .from('comment_votes')
      .upsert({ comment_id: commentId, user_id: user.id, value: next }, { onConflict: 'comment_id,user_id' });
    if (err) {
      alert('Vote failed: ' + err.message);
      load();
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !post || !reply.trim() || sending) return;
    setSending(true);
    const { error: err } = await supabase.from('comments').insert({
      post_id: post.id,
      author_id: user.id,
      body: reply.trim(),
    });
    setSending(false);
    if (err) {
      alert('Failed: ' + err.message);
      return;
    }
    setReply('');
  };

  if (authLoading || !isAuthenticated) return null;
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bb-grid flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#888]" />
      </div>
    );
  }
  if (!post) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bb-grid flex flex-col items-center justify-center px-4">
        <p className="text-sm text-[#555] mb-3">{error || 'Post not found.'}</p>
        <Link href="/feed" className="bb-btn bb-btn-green text-sm px-4 py-2">
          Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bb-grid py-6 px-4">
      <div className="mx-auto max-w-3xl">
        <Link href="/feed" className="inline-flex items-center gap-1 text-xs font-bold text-[#555] hover:text-[#111] mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to feed
        </Link>

        {/* Post card */}
        <div className="bb-card bg-white p-4 sm:p-5 mb-5">
          <div className="flex gap-3">
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
              <button
                onClick={() => votePost(1)}
                className={`flex h-8 w-8 items-center justify-center rounded-md border-[2px] border-[#111] shadow-[1.5px_1.5px_0_#111] ${
                  post.my_vote === 1 ? 'bg-[#00D09C] text-white' : 'bg-white text-[#888] hover:bg-[#00D09C]/15'
                }`}
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <span className={`text-sm font-black ${
                post.my_vote === 1 ? 'text-[#00D09C]' : post.my_vote === -1 ? 'text-[#FF3B3B]' : 'text-[#111]'
              }`}>{post.upvote_count}</span>
              <button
                onClick={() => votePost(-1)}
                className={`flex h-8 w-8 items-center justify-center rounded-md border-[2px] border-[#111] shadow-[1.5px_1.5px_0_#111] ${
                  post.my_vote === -1 ? 'bg-[#FF3B3B] text-white' : 'bg-white text-[#888] hover:bg-[#FF3B3B]/15'
                }`}
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-2 flex-wrap text-[10px] font-bold">
                {post.is_pinned && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-[#00D09C] border border-[#111] px-1.5 py-px text-white uppercase">
                    <Pin className="h-2.5 w-2.5" /> Pinned
                  </span>
                )}
                {post.is_locked && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-[#888] border border-[#111] px-1.5 py-px text-white uppercase">
                    <Lock className="h-2.5 w-2.5" /> Locked
                  </span>
                )}
                {post.topic_label && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-[#00D09C] border border-[#111] px-1.5 py-px text-white">
                    <Hash className="h-2.5 w-2.5" /> {post.topic_label}
                  </span>
                )}
                {post.community_name && (
                  <span className="rounded-full bg-[#B794F6] border border-[#111] px-1.5 py-px text-white">
                    {post.community_name} {post.room_name && `· ${post.room_name}`}
                  </span>
                )}
                <span className="text-[#888]">· {post.author_handle}</span>
                <span className="text-[#888]">· {formatRelative(post.created_at)}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-[#111] mb-2 leading-tight">{post.title}</h1>
              {post.body && (
                <p className="text-sm text-[#333] whitespace-pre-wrap leading-relaxed">{post.body}</p>
              )}
              <p className="mt-3 text-[10px] font-bold text-[#888]">
                {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
              </p>
            </div>
          </div>
        </div>

        {/* Comment composer */}
        {!post.is_locked && (
          <form onSubmit={submitComment} className="bb-card bg-white p-3 sm:p-4 mb-5">
            <textarea
              ref={inputRef}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Add a comment…"
              rows={3}
              maxLength={2000}
              className="w-full rounded-xl border-[2px] border-[#111] px-3 py-2 text-sm shadow-[2px_2px_0_#111] focus:outline-none focus:bg-[#FDEBD3] resize-none mb-2"
            />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-[#888]">Anonymous as your alias</p>
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl border-[2px] border-[#111] bg-[#00D09C] px-3 py-1.5 text-xs font-black text-white shadow-[2px_2px_0_#111] hover:shadow-[1px_1px_0_#111] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 transition-all"
              >
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Comment
              </button>
            </div>
          </form>
        )}

        {/* Comments list */}
        {comments.length === 0 ? (
          <div className="bb-card bg-white p-6 text-center text-xs text-[#555]">
            <MessageSquare className="h-8 w-8 text-[#888] mx-auto mb-2" />
            No comments yet — be the first.
          </div>
        ) : (
          <ul className="space-y-2">
            {comments.map((c) => (
              <CommentRow
                key={c.id}
                c={c}
                myVote={myCommentVotes[c.id] || 0}
                onVote={(val) => voteComment(c.id, val)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CommentRow({
  c, myVote, onVote,
}: { c: Comment; myVote: -1 | 0 | 1; onVote: (val: 1 | -1) => void }) {
  return (
    <li className="bb-card bg-white p-3">
      <div className="flex gap-2">
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => onVote(1)}
            className={`flex h-6 w-6 items-center justify-center rounded-md border-[1.5px] border-[#111] ${
              myVote === 1 ? 'bg-[#00D09C] text-white' : 'bg-white text-[#888] hover:bg-[#00D09C]/15'
            }`}
          >
            <ArrowUp className="h-3 w-3" />
          </button>
          <span className={`text-[11px] font-black ${
            myVote === 1 ? 'text-[#00D09C]' : myVote === -1 ? 'text-[#FF3B3B]' : 'text-[#111]'
          }`}>{c.upvote_count}</span>
          <button
            onClick={() => onVote(-1)}
            className={`flex h-6 w-6 items-center justify-center rounded-md border-[1.5px] border-[#111] ${
              myVote === -1 ? 'bg-[#FF3B3B] text-white' : 'bg-white text-[#888] hover:bg-[#FF3B3B]/15'
            }`}
          >
            <ArrowDown className="h-3 w-3" />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-[#111] mb-1">
            {c.author_handle} <span className="text-[#888] font-medium">· {formatRelative(c.created_at)}</span>
          </p>
          <p className="text-xs sm:text-sm text-[#111] whitespace-pre-wrap leading-snug">{c.body}</p>
        </div>
      </div>
    </li>
  );
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
