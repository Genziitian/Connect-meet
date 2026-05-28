// ============================================================
// Friends — list + pending requests (mobile-first)
// ============================================================
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import {
  UserPlus, Users, Inbox, Check, X, Loader2, MessageCircle, Shield, ArrowRight,
} from 'lucide-react';

interface FriendRow {
  friendship_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  created_at: string;
  responded_at: string | null;
  intro_message: string | null;
  met_context: { kind?: string; name?: string; note?: string } | null;
  peer_id: string;
  peer_handle: string;
  peer_role: 'user' | 'admin' | 'moderator';
  peer_avatar: string | null;
  direction: 'incoming' | 'outgoing';
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

type Tab = 'friends' | 'requests';

export default function FriendsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [rows, setRows] = useState<FriendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('friends');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('v_my_friends')
      .select('*')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
    setRows((data || []) as FriendRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: any friendship change for me → reload
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`friendships-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_messages' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  const accepted = rows.filter((r) => r.status === 'accepted');
  const incoming = rows.filter((r) => r.status === 'pending' && r.direction === 'incoming');
  const outgoing = rows.filter((r) => r.status === 'pending' && r.direction === 'outgoing');

  // Sort accepted: admins first, then by last message
  const sortedAccepted = [...accepted].sort((a, b) => {
    if (a.peer_role === 'admin' && b.peer_role !== 'admin') return -1;
    if (a.peer_role !== 'admin' && b.peer_role === 'admin') return 1;
    const aT = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bT = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return bT - aT;
  });

  const totalUnread = accepted.reduce((sum, f) => sum + (f.unread_count || 0), 0);

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bb-grid py-6 px-4">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B794F6] border-[2px] border-[#111] shadow-[3px_3px_0_#111]">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#111]">Friends</h1>
              <p className="text-xs text-[#555] font-medium">
                Connect anonymously. Admins are auto-friends.
              </p>
            </div>
          </div>
          {totalUnread > 0 && (
            <span className="rounded-full bg-[#FF3B3B] text-white text-xs font-black border-[2px] border-[#111] shadow-[2px_2px_0_#111] px-2.5 py-1">
              {totalUnread} new
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('friends')}
            className={`flex items-center gap-1.5 rounded-xl border-[2px] border-[#111] px-3 py-2 text-xs font-black shadow-[2px_2px_0_#111] transition-all ${
              tab === 'friends' ? 'bg-[#00D09C] text-white' : 'bg-white text-[#111]'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Friends · {accepted.length}
          </button>
          <button
            onClick={() => setTab('requests')}
            className={`flex items-center gap-1.5 rounded-xl border-[2px] border-[#111] px-3 py-2 text-xs font-black shadow-[2px_2px_0_#111] transition-all ${
              tab === 'requests' ? 'bg-[#FB923C] text-white' : 'bg-white text-[#111]'
            }`}
          >
            <Inbox className="h-3.5 w-3.5" />
            Requests
            {incoming.length > 0 && (
              <span className="rounded-full bg-[#FF3B3B] text-white text-[10px] font-black px-1.5 py-0.5">
                {incoming.length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#888] mx-auto" />
          </div>
        ) : tab === 'friends' ? (
          <FriendList rows={sortedAccepted} />
        ) : (
          <RequestsTab incoming={incoming} outgoing={outgoing} />
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */

function FriendList({ rows }: { rows: FriendRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="bb-card bg-white p-8 text-center">
        <UserPlus className="h-10 w-10 text-[#888] mx-auto mb-3" />
        <p className="text-sm font-bold text-[#111] mb-1">No friends yet</p>
        <p className="text-xs text-[#555]">
          Tap the <span className="font-black">+ Add Friend</span> button on someone you vibe with in a community room.
        </p>
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {rows.map((f) => (
        <li key={f.friendship_id}>
          <Link
            href={`/friends/${f.friendship_id}`}
            className="bb-card bg-white p-3 sm:p-4 flex items-center gap-3 hover:shadow-[5px_5px_0_#111] hover:-translate-y-0.5 transition-all"
          >
            <Avatar handle={f.peer_handle} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-sm font-black text-[#111] truncate">{f.peer_handle}</p>
                {f.peer_role === 'admin' && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-[#FF6B6B] border border-[#111] px-1.5 py-px text-[9px] font-black uppercase text-white">
                    <Shield className="h-2.5 w-2.5" /> Staff
                  </span>
                )}
                {f.met_context?.name && f.peer_role !== 'admin' && (
                  <span className="text-[10px] text-[#888] truncate">· met in #{f.met_context.name}</span>
                )}
              </div>
              <p className="text-xs text-[#555] truncate">
                {f.last_message || (
                  <span className="italic text-[#888]">
                    {f.peer_role === 'admin' ? 'Reach out anytime for help' : 'Say hi 👋'}
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {f.last_message_at && (
                <span className="text-[10px] text-[#888] font-medium">
                  {formatRelative(f.last_message_at)}
                </span>
              )}
              {f.unread_count > 0 && (
                <span className="rounded-full bg-[#00D09C] text-white text-[10px] font-black border border-[#111] px-1.5 py-0.5">
                  {f.unread_count}
                </span>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function RequestsTab({ incoming, outgoing }: { incoming: FriendRow[]; outgoing: FriendRow[] }) {
  if (incoming.length === 0 && outgoing.length === 0) {
    return (
      <div className="bb-card bg-white p-8 text-center">
        <Inbox className="h-10 w-10 text-[#888] mx-auto mb-3" />
        <p className="text-sm font-bold text-[#111] mb-1">No pending requests</p>
        <p className="text-xs text-[#555]">
          You&apos;ll see incoming requests and your sent ones here.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {incoming.length > 0 && (
        <section>
          <p className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-2">
            Incoming · {incoming.length}
          </p>
          <ul className="space-y-2">
            {incoming.map((f) => (
              <IncomingRow key={f.friendship_id} f={f} />
            ))}
          </ul>
        </section>
      )}
      {outgoing.length > 0 && (
        <section>
          <p className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-2">
            You sent · {outgoing.length}
          </p>
          <ul className="space-y-2">
            {outgoing.map((f) => (
              <OutgoingRow key={f.friendship_id} f={f} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function IncomingRow({ f }: { f: FriendRow }) {
  const [busy, setBusy] = useState<null | 'accept' | 'decline'>(null);

  const respond = async (status: 'accepted' | 'declined') => {
    setBusy(status === 'accepted' ? 'accept' : 'decline');
    const { error } = await supabase
      .from('friendships')
      .update({ status, responded_at: new Date().toISOString() })
      .eq('id', f.friendship_id);
    if (error) {
      alert('Failed: ' + error.message);
      setBusy(null);
    }
    // Realtime channel will refresh the list
  };

  return (
    <li className="bb-card bg-white p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <Avatar handle={f.peer_handle} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-[#111]">{f.peer_handle}</p>
          {f.met_context?.name && (
            <p className="text-[10px] text-[#888]">met in #{f.met_context.name}</p>
          )}
          {f.intro_message && (
            <p className="mt-1.5 text-xs text-[#555] rounded-lg bg-[#FDEBD3] border border-[#eee] px-2 py-1.5">
              &ldquo;{f.intro_message}&rdquo;
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => respond('accepted')}
          disabled={busy !== null}
          className="flex-1 flex items-center justify-center gap-1 rounded-lg border-[2px] border-[#111] bg-[#00D09C] py-1.5 text-xs font-black text-white shadow-[2px_2px_0_#111] hover:shadow-[1px_1px_0_#111] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 transition-all"
        >
          {busy === 'accept' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Accept
        </button>
        <button
          onClick={() => respond('declined')}
          disabled={busy !== null}
          className="flex-1 flex items-center justify-center gap-1 rounded-lg border-[2px] border-[#111] bg-white py-1.5 text-xs font-black text-[#111] shadow-[2px_2px_0_#111] hover:shadow-[1px_1px_0_#111] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 transition-all"
        >
          {busy === 'decline' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          Decline
        </button>
      </div>
    </li>
  );
}

function OutgoingRow({ f }: { f: FriendRow }) {
  const [busy, setBusy] = useState(false);

  const cancel = async () => {
    if (!window.confirm(`Cancel request to ${f.peer_handle}?`)) return;
    setBusy(true);
    const { error } = await supabase.from('friendships').delete().eq('id', f.friendship_id);
    if (error) {
      alert('Failed: ' + error.message);
      setBusy(false);
    }
  };

  return (
    <li className="bb-card bg-white p-3 sm:p-4 flex items-center gap-3">
      <Avatar handle={f.peer_handle} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-[#111] truncate">{f.peer_handle}</p>
        <p className="text-[10px] text-[#888]">
          Sent {formatRelative(f.created_at)} · waiting for response
        </p>
      </div>
      <button
        onClick={cancel}
        disabled={busy}
        className="rounded-lg border-[2px] border-[#111] bg-[#888]/10 px-2.5 py-1 text-[10px] font-black text-[#555] shadow-[2px_2px_0_#111] disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Cancel'}
      </button>
    </li>
  );
}

/* ──────────────────────────────────────────────────────────── */

const COLORS = ['#B794F6', '#FB923C', '#00D09C', '#FF6B6B', '#FBBF24'];

function Avatar({ handle }: { handle: string }) {
  const color = COLORS[hashStr(handle) % COLORS.length];
  const initial = (handle || '?').charAt(0).toUpperCase();
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-full border-[2px] border-[#111] flex-shrink-0 shadow-[2px_2px_0_#111]"
      style={{ backgroundColor: color }}
    >
      <span className="text-sm font-black text-white">{initial}</span>
    </div>
  );
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
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
