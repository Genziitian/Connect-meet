// ============================================================
// Friend DM thread — text only (voice/video unlock for admin friends in v2)
// ============================================================
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import EmojiPicker from '@/components/EmojiPicker';
import {
  ArrowLeft, Send, Smile, Loader2, AlertCircle, Shield, Phone, Video,
} from 'lucide-react';

interface FriendInfo {
  friendship_id: string;
  peer_id: string;
  peer_handle: string;
  peer_role: 'user' | 'admin' | 'moderator';
  status: string;
  met_context: { kind?: string; name?: string; note?: string } | null;
}

interface DM {
  id: string;
  friendship_id: string;
  sender_id: string;
  content: string;
  reply_to: string | null;
  created_at: string;
  read_at: string | null;
}

export default function FriendDMPage() {
  const params = useParams();
  const router = useRouter();
  const friendshipId = params.id as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [friend, setFriend] = useState<FriendInfo | null>(null);
  const [messages, setMessages] = useState<DM[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const init = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Fetch friendship + peer info via v_my_friends
    const { data: f, error: fErr } = await supabase
      .from('v_my_friends')
      .select('friendship_id, peer_id, peer_handle, peer_role, status, met_context')
      .eq('friendship_id', friendshipId)
      .maybeSingle<FriendInfo>();

    if (fErr || !f) {
      setError(fErr?.message || 'Friendship not found.');
      setLoading(false);
      return;
    }
    if (f.status !== 'accepted') {
      setError('This friend request has not been accepted yet.');
      setLoading(false);
      return;
    }
    setFriend(f);

    // Messages
    const { data: msgs } = await supabase
      .from('dm_messages')
      .select('id, friendship_id, sender_id, content, reply_to, created_at, read_at')
      .eq('friendship_id', friendshipId)
      .order('created_at', { ascending: true })
      .limit(200);
    setMessages((msgs || []) as DM[]);

    setLoading(false);
  }, [user, friendshipId]);

  useEffect(() => {
    init();
  }, [init]);

  // Realtime new messages
  useEffect(() => {
    if (!friendshipId) return;
    const channel = supabase
      .channel(`dm-${friendshipId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dm_messages',
          filter: `friendship_id=eq.${friendshipId}`,
        },
        (payload) => {
          const msg = payload.new as DM;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [friendshipId]);

  // Auto-scroll on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Mark incoming messages as read whenever they appear
  useEffect(() => {
    if (!user || messages.length === 0) return;
    const unread = messages.filter((m) => m.sender_id !== user.id && !m.read_at);
    if (unread.length === 0) return;
    supabase
      .from('dm_messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', unread.map((m) => m.id))
      .then(() => {});
  }, [user, messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !friend || !input.trim() || sending) return;
    setSending(true);
    setError('');

    const { error: err } = await supabase.from('dm_messages').insert({
      friendship_id: friend.friendship_id,
      sender_id: user.id,
      content: input.trim(),
    });

    if (err) setError(err.message);
    else setInput('');
    setSending(false);
  };

  const insertEmoji = (emoji: string) => {
    const el = inputRef.current;
    if (!el) {
      setInput((p) => p + emoji);
      return;
    }
    const start = el.selectionStart ?? input.length;
    const end = el.selectionEnd ?? input.length;
    setInput(input.slice(0, start) + emoji + input.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  if (authLoading || !isAuthenticated) return null;
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bb-grid flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#888]" />
      </div>
    );
  }
  if (!friend) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bb-grid flex flex-col items-center justify-center px-4">
        <p className="text-sm text-[#555] mb-3">{error || 'Friend not found.'}</p>
        <Link href="/friends" className="bb-btn bb-btn-green text-sm px-4 py-2">
          Back to friends
        </Link>
      </div>
    );
  }

  const isAdmin = friend.peer_role === 'admin';

  return (
    <div className="h-[calc(100vh-4rem)] bb-grid flex flex-col">
      <div className="flex-1 flex flex-col bg-white lg:rounded-2xl lg:border-[3px] lg:border-[#111] lg:shadow-[5px_5px_0_#111] overflow-hidden lg:m-4 lg:max-w-3xl lg:mx-auto lg:w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b-[3px] border-[#111] bg-white">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/friends"
              className="flex h-8 w-8 items-center justify-center rounded-lg border-[2px] border-[#111] bg-white shadow-[2px_2px_0_#111] flex-shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
            <Avatar handle={friend.peer_handle} large />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-black text-[#111] truncate">{friend.peer_handle}</p>
                {isAdmin && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-[#FF6B6B] border border-[#111] px-1.5 py-px text-[9px] font-black uppercase text-white flex-shrink-0">
                    <Shield className="h-2.5 w-2.5" /> Staff
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#888] font-medium">
                {friend.met_context?.name
                  ? `met in #${friend.met_context.name}`
                  : isAdmin
                  ? 'GenZ IITian team'
                  : 'friend'}
              </p>
            </div>
          </div>

          {/* Voice/video buttons — only shown for admin friends */}
          {isAdmin && (
            <div className="flex gap-1.5 flex-shrink-0">
              <button
                onClick={() => alert('Voice calls launching soon!')}
                className="flex h-8 w-8 items-center justify-center rounded-lg border-[2px] border-[#111] bg-[#00D09C] text-white shadow-[2px_2px_0_#111]"
                title="Voice call (admin friends)"
              >
                <Phone className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => alert('Video calls launching soon!')}
                className="flex h-8 w-8 items-center justify-center rounded-lg border-[2px] border-[#111] bg-[#B794F6] text-white shadow-[2px_2px_0_#111]"
                title="Video call (admin friends)"
              >
                <Video className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Privacy notice */}
        <div className="px-3 py-1.5 bg-[#FBBF24]/30 border-b border-[#111]/10 text-center">
          <p className="text-[10px] text-[#111] font-bold">
            🔒 Anonymous DM · only you and {friend.peer_handle} see this thread
          </p>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-4 pb-3 bg-[#FDEBD3]">
          {messages.length === 0 ? (
            <p className="text-center text-xs text-[#888] py-8">
              {isAdmin
                ? 'Send a message — our team usually replies within a few hours.'
                : 'No messages yet — say hi 👋'}
            </p>
          ) : (
            messages.map((m) => {
              const fromMe = m.sender_id === user?.id;
              return (
                <div
                  key={m.id}
                  className={`flex w-full mt-3 ${fromMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end gap-2 max-w-[80%] ${fromMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!fromMe && <Avatar handle={friend.peer_handle} />}
                    <div className={`min-w-0 ${fromMe ? 'text-right' : 'text-left'}`}>
                      <div
                        className={`inline-block max-w-full rounded-2xl border-[2px] border-[#111] px-3 py-2 shadow-[2px_2px_0_#111] ${
                          fromMe
                            ? 'bg-[#00D09C] text-white rounded-tr-md'
                            : 'bg-white text-[#111] rounded-tl-md'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words leading-snug">
                          {m.content}
                        </p>
                      </div>
                      <p className="text-[9px] text-[#888] mt-0.5 px-1">
                        {formatTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {error && (
          <div className="mx-3 mb-2 rounded-lg border-[2px] border-[#FF3B3B]/30 bg-[#FF3B3B]/10 px-3 py-2 text-xs text-[#FF3B3B] font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {/* Composer */}
        <form onSubmit={handleSend} className="bg-white border-t-[2px] border-[#111] p-2 sm:p-3 flex items-center gap-1.5 sm:gap-2 relative">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmoji((v) => !v)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border-[2px] border-[#111] shadow-[2px_2px_0_#111] ${
                showEmoji ? 'bg-[#FDEBD3]' : 'bg-white hover:bg-[#FDEBD3]'
              }`}
              title="Emoji"
            >
              <Smile className="h-4 w-4 text-[#888]" />
            </button>
            {showEmoji && (
              <EmojiPicker
                onPick={(emoji) => insertEmoji(emoji)}
                onClose={() => setShowEmoji(false)}
              />
            )}
          </div>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${friend.peer_handle}…`}
            className="flex-1 min-w-0 rounded-xl border-[2px] border-[#111] bg-[#FDEBD3] px-3 py-2 text-sm shadow-[2px_2px_0_#111] focus:outline-none focus:bg-white"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="flex items-center gap-1 h-9 px-3 sm:px-4 rounded-xl bg-[#00D09C] border-[2px] border-[#111] text-white text-xs font-black shadow-[2px_2px_0_#111] hover:shadow-[1px_1px_0_#111] hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50 transition-all"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */

const COLORS = ['#B794F6', '#FB923C', '#00D09C', '#FF6B6B', '#FBBF24'];

function Avatar({ handle, large }: { handle: string; large?: boolean }) {
  const color = COLORS[hashStr(handle) % COLORS.length];
  const initial = (handle || '?').charAt(0).toUpperCase();
  const size = large ? 'h-9 w-9 sm:h-10 sm:w-10 text-sm' : 'h-7 w-7 text-[11px]';
  return (
    <div
      className={`flex items-center justify-center rounded-full border-[2px] border-[#111] flex-shrink-0 ${size}`}
      style={{ backgroundColor: color }}
    >
      <span className="font-black text-white">{initial}</span>
    </div>
  );
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
