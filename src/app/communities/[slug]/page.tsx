// ============================================================
// /communities/[slug] — Community detail with rooms list
// ============================================================
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, Loader2, Users, Globe, Lock, BadgeCheck, Hash, Plus,
  MessageSquare, Megaphone, UserPlus, UserMinus, AlertCircle,
} from 'lucide-react';

interface Community {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  emoji: string;
  banner_color: string;
  visibility: 'public' | 'invite_only';
  verified: boolean;
  member_count: number;
  owner_id: string;
  created_at: string;
}

interface Room {
  id: string;
  slug: string;
  name: string;
  emoji: string | null;
  color: string | null;
  description: string | null;
  is_announcements: boolean;
  sort_order: number;
  status: string;
}

interface Member {
  user_id: string;
  role: 'owner' | 'mod' | 'member';
  anon_name?: string;
}

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [community, setCommunity] = useState<Community | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [myRole, setMyRole] = useState<'owner' | 'mod' | 'member' | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [error, setError] = useState('');

  // Inline "add room" form (owner/mod only)
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomSlug, setNewRoomSlug] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    const { data: c, error: cErr } = await supabase
      .from('communities')
      .select('id, slug, name, description, emoji, banner_color, visibility, verified, member_count, owner_id, created_at')
      .eq('slug', slug)
      .maybeSingle<Community>();

    if (cErr || !c) {
      setError(cErr?.message || 'Community not found.');
      setLoading(false);
      return;
    }
    setCommunity(c);

    // My membership
    const { data: m } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', c.id)
      .eq('user_id', user.id)
      .maybeSingle<{ role: 'owner' | 'mod' | 'member' }>();
    setMyRole(m?.role || null);

    // Rooms
    const { data: rs } = await supabase
      .from('community_rooms')
      .select('id, slug, name, emoji, color, description, is_announcements, sort_order, status')
      .eq('community_id', c.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    setRooms((rs || []) as Room[]);

    // Members preview (top 20)
    const { data: ms } = await supabase
      .from('community_members')
      .select('user_id, role')
      .eq('community_id', c.id)
      .limit(20);
    if (ms && ms.length > 0) {
      const ids = ms.map((x: { user_id: string }) => x.user_id);
      const { data: users } = await supabase.from('users').select('id, anon_name').in('id', ids);
      const handleMap: Record<string, string> = {};
      (users || []).forEach((u: { id: string; anon_name: string }) => { handleMap[u.id] = u.anon_name; });
      setMembers(ms.map((x: { user_id: string; role: 'owner' | 'mod' | 'member' }) => ({
        ...x,
        anon_name: handleMap[x.user_id] || 'Anon',
      })));
    } else {
      setMembers([]);
    }

    setLoading(false);
  }, [user, slug]);

  useEffect(() => {
    load();
  }, [load]);

  const join = async () => {
    if (!user || !community) return;
    setActioning(true);
    const { error: err } = await supabase
      .from('community_members')
      .insert({ community_id: community.id, user_id: user.id, role: 'member' });
    setActioning(false);
    if (err) {
      alert("Couldn't join: " + err.message);
      return;
    }
    load();
  };

  const leave = async () => {
    if (!user || !community) return;
    if (!confirm(`Leave ${community.name}?`)) return;
    setActioning(true);
    const { error: err } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', community.id)
      .eq('user_id', user.id);
    setActioning(false);
    if (err) {
      alert("Couldn't leave: " + err.message);
      return;
    }
    load();
  };

  const addRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !community) return;
    if (newRoomName.trim().length < 2) return;
    const finalSlug = (newRoomSlug || slugify(newRoomName)).trim();
    if (!/^[a-z0-9-]+$/.test(finalSlug)) {
      alert('Slug can only have lowercase letters, numbers, dashes.');
      return;
    }
    setActioning(true);
    const { error: err } = await supabase.from('community_rooms').insert({
      community_id: community.id,
      slug: finalSlug,
      name: newRoomName.trim(),
      emoji: '💬',
      color: community.banner_color,
      sort_order: rooms.length + 1,
      status: 'approved',
      is_active: true,
      created_by: user.id,
    });
    setActioning(false);
    if (err) {
      alert("Couldn't create room: " + err.message);
      return;
    }
    setNewRoomName('');
    setNewRoomSlug('');
    setShowAddRoom(false);
    load();
  };

  if (authLoading || !isAuthenticated) return null;
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bb-grid flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#888]" />
      </div>
    );
  }
  if (!community) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bb-grid flex flex-col items-center justify-center px-4">
        <p className="text-sm text-[#555] mb-3">{error || 'Community not found.'}</p>
        <Link href="/communities" className="bb-btn bb-btn-green text-sm px-4 py-2">
          Back to communities
        </Link>
      </div>
    );
  }

  const canManage = myRole === 'owner' || myRole === 'mod' || user?.role === 'admin';

  return (
    <div className="min-h-[calc(100vh-4rem)] bb-grid">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
        <Link href="/communities" className="inline-flex items-center gap-1 text-xs font-bold text-[#555] hover:text-[#111] mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> All communities
        </Link>

        {/* Banner */}
        <div className="bb-card overflow-hidden mb-6">
          <div
            className="relative h-32 sm:h-44 p-4 sm:p-6 flex items-end border-b-[3px] border-[#111]"
            style={{
              backgroundColor: community.banner_color,
              backgroundImage: 'repeating-linear-gradient(45deg, rgba(17,17,17,0.06) 0 4px, transparent 4px 12px)',
            }}
          >
            <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border-[2px] border-[#111] bg-white/95 px-2 py-1 text-[11px] font-black">
              {community.visibility === 'public' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {community.visibility === 'public' ? 'Public' : 'Invite-only'}
            </div>
            <div className="text-5xl sm:text-6xl drop-shadow-[3px_3px_0_#111]">{community.emoji}</div>
          </div>

          <div className="bg-white p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black text-[#111] flex items-center gap-1.5">
                  {community.name}
                  {community.verified && <BadgeCheck className="h-5 w-5 text-[#00D09C]" />}
                </h1>
                {community.description && (
                  <p className="text-xs sm:text-sm text-[#555] mt-1">{community.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-[#888]">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" /> {community.member_count} members
                  </span>
                  <span>·</span>
                  <span>{rooms.length} room{rooms.length === 1 ? '' : 's'}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {myRole ? (
                  <>
                    <Link
                      href={`/feed/new?community=${community.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border-[2px] border-[#111] bg-[#00D09C] px-3 py-2 text-xs font-black text-white shadow-[2px_2px_0_#111]"
                    >
                      <Plus className="h-3.5 w-3.5" /> Post
                    </Link>
                    {myRole !== 'owner' && (
                      <button
                        onClick={leave}
                        disabled={actioning}
                        className="inline-flex items-center gap-1.5 rounded-xl border-[2px] border-[#111] bg-white px-3 py-2 text-xs font-black text-[#111] shadow-[2px_2px_0_#111] disabled:opacity-50"
                      >
                        <UserMinus className="h-3.5 w-3.5" /> Leave
                      </button>
                    )}
                  </>
                ) : (
                  community.visibility === 'public' && (
                    <button
                      onClick={join}
                      disabled={actioning}
                      className="inline-flex items-center gap-1.5 rounded-xl border-[2px] border-[#111] bg-[#B794F6] px-4 py-2 text-xs font-black text-white shadow-[2px_2px_0_#111] hover:shadow-[1px_1px_0_#111] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50"
                    >
                      {actioning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />} Join
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rooms */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-black text-[#111]">Rooms</h2>
          {canManage && (
            <button
              onClick={() => setShowAddRoom(!showAddRoom)}
              className="inline-flex items-center gap-1 rounded-xl border-[2px] border-[#111] bg-[#00D09C] px-2.5 py-1 text-[11px] font-black text-white shadow-[2px_2px_0_#111]"
            >
              <Plus className="h-3 w-3" /> {showAddRoom ? 'Cancel' : 'Add room'}
            </button>
          )}
        </div>

        {showAddRoom && canManage && (
          <form onSubmit={addRoom} className="bb-card bg-white p-3 sm:p-4 mb-4 space-y-2">
            <div className="flex gap-2">
              <input
                value={newRoomName}
                onChange={(e) => { setNewRoomName(e.target.value); if (!newRoomSlug) setNewRoomSlug(slugify(e.target.value)); }}
                placeholder="Room name (e.g. study-group)"
                maxLength={50}
                className="flex-1 rounded-xl border-[2px] border-[#111] px-3 py-2 text-sm shadow-[2px_2px_0_#111] focus:outline-none focus:bg-[#FDEBD3]"
                required
              />
              <input
                value={newRoomSlug}
                onChange={(e) => setNewRoomSlug(slugify(e.target.value))}
                placeholder="slug"
                maxLength={40}
                className="w-32 rounded-xl border-[2px] border-[#111] px-3 py-2 text-sm shadow-[2px_2px_0_#111] focus:outline-none focus:bg-[#FDEBD3] font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={actioning || !newRoomName.trim()}
              className="rounded-xl border-[2px] border-[#111] bg-[#00D09C] px-3 py-1.5 text-xs font-black text-white shadow-[2px_2px_0_#111] disabled:opacity-50"
            >
              {actioning ? 'Creating…' : 'Create room'}
            </button>
          </form>
        )}

        {rooms.length === 0 ? (
          <div className="bb-card bg-white p-6 text-center text-xs text-[#555]">
            <Hash className="h-8 w-8 text-[#888] mx-auto mb-2" />
            No rooms yet.
          </div>
        ) : (
          <ul className="space-y-2 mb-6">
            {rooms.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/community/${r.slug}`}
                  className="flex items-center gap-3 bb-card bg-white p-3 hover:shadow-[5px_5px_0_#111] hover:-translate-y-0.5 transition-all"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg border-[2px] border-[#111] text-lg flex-shrink-0"
                    style={{ backgroundColor: r.color || community.banner_color }}
                  >
                    {r.is_announcements ? <Megaphone className="h-4 w-4 text-white" /> : (r.emoji || '#')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-[#111] flex items-center gap-1.5">
                      {r.is_announcements && (
                        <span className="text-[9px] font-black uppercase rounded-full bg-[#FBBF24] border border-[#111] px-1.5 py-px text-[#111]">
                          Announce
                        </span>
                      )}
                      {r.name}
                    </p>
                    {r.description && (
                      <p className="text-[11px] text-[#555] line-clamp-1">{r.description}</p>
                    )}
                  </div>
                  <MessageSquare className="h-4 w-4 text-[#888] flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Members preview */}
        {members.length > 0 && (
          <>
            <h2 className="text-base sm:text-lg font-black text-[#111] mb-3">Members</h2>
            <div className="bb-card bg-white p-3 sm:p-4">
              <ul className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <li
                    key={m.user_id}
                    className="inline-flex items-center gap-1.5 rounded-full border-[2px] border-[#111] bg-[#FDEBD3] px-2.5 py-1 text-[11px] font-bold"
                  >
                    {m.anon_name}
                    {m.role !== 'member' && (
                      <span className="rounded-full bg-[#B794F6] border border-[#111] px-1.5 py-0 text-white text-[9px] uppercase">
                        {m.role}
                      </span>
                    )}
                  </li>
                ))}
                {community.member_count > members.length && (
                  <li className="inline-flex items-center text-[11px] text-[#555] px-2">
                    +{community.member_count - members.length} more
                  </li>
                )}
              </ul>
            </div>
          </>
        )}
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
    .substring(0, 40);
}
