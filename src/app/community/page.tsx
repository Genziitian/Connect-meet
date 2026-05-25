// ============================================================
// Community — Rooms list (per mockup screen 08)
// ============================================================
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Hash, Sparkles, MessageSquare, Loader2, Pin } from 'lucide-react';

interface Room {
  id: string;
  slug: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  tagline: string;
  host_alias: string;
  is_pinned: boolean;
  active_count: number;
  member_count: number;
  last_message_at: string | null;
}

type Filter = 'all' | 'live' | 'new' | 'trending' | 'following';

export default function CommunityPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    supabase
      .from('v_room_stats')
      .select('*')
      .then(({ data }) => {
        setRooms((data || []) as Room[]);
        setLoading(false);
      });
  }, []);

  const pinnedRooms = rooms.filter((r) => r.is_pinned);
  const unpinned = rooms.filter((r) => !r.is_pinned);
  const liveRooms = unpinned.filter((r) => r.active_count > 0);
  const otherRooms = unpinned.filter((r) => r.active_count === 0);

  const filtered = rooms.filter((r) => {
    if (query) {
      const q = query.toLowerCase();
      if (!r.name.toLowerCase().includes(q) && !r.tagline.toLowerCase().includes(q)) return false;
    }
    if (filter === 'live') return r.active_count > 0;
    if (filter === 'trending') return r.member_count > 5;
    return true;
  });

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bb-grid">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border-[2px] border-[#111] bg-[#FF6B6B] px-3 py-1 text-[10px] font-black text-white shadow-[2px_2px_0px_#111] mb-3">
              <Sparkles className="h-3 w-3" />
              NEW · Community Rooms
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-[#111] leading-tight tracking-tight">
              Find your <span className="text-[#FF6B6B]">tribe</span>.
              <br />
              Drop into a <span className="text-[#00D09C]">room</span>.
            </h1>
            <p className="text-sm text-[#555] mt-2 sm:mt-3 max-w-lg">
              Group rooms, hosted by verified students. No followers, no algorithm — just real talk.
            </p>
          </div>
          <Link
            href="/community/new"
            prefetch
            aria-label="Host a Room"
            className="inline-flex items-center justify-center gap-1.5 rounded-full sm:rounded-xl border-[2px] sm:border-[3px] border-[#111] bg-[#FF6B6B] text-white font-black shadow-[3px_3px_0_#111] sm:shadow-[4px_4px_0_#111] hover:shadow-[1px_1px_0_#111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#111] transition-all whitespace-nowrap h-10 w-10 sm:h-auto sm:w-auto sm:px-4 sm:py-2.5 text-xs sm:text-sm"
          >
            <Plus className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Host a Room</span>
          </Link>
        </div>

        {/* Search + filter chips */}
        <div className="bb-card bg-white p-3 sm:p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 rounded-xl border-[2px] border-[#111] bg-[#FDEBD3] px-3 py-2 shadow-[2px_2px_0px_#111]">
            <Search className="h-4 w-4 text-[#888]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search rooms, topics, vibes…"
              className="flex-1 bg-transparent text-sm font-medium text-[#111] placeholder:text-[#888] focus:outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'live', 'new', 'trending', 'following'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border-[2px] border-[#111] px-3 py-1.5 text-[11px] font-black uppercase shadow-[2px_2px_0px_#111] whitespace-nowrap transition-all ${
                  filter === f
                    ? 'bg-[#FF6B6B] text-white'
                    : 'bg-white text-[#111] hover:bg-[#FDEBD3]'
                }`}
              >
                {f === 'live' ? 'Live now' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#888] mx-auto" />
          </div>
        ) : (
          <>
            {/* Pinned rooms */}
            {filter === 'all' && pinnedRooms.length > 0 && (
              <>
                <h2 className="text-base sm:text-lg font-black text-[#111] flex items-center gap-2 mb-3">
                  <Pin className="h-4 w-4 text-[#00D09C]" />
                  Pinned by admin
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {pinnedRooms.map((r) => (
                    <RoomCard key={r.id} room={r} />
                  ))}
                </div>
              </>
            )}

            {/* Live now section */}
            {filter === 'all' && liveRooms.length > 0 && (
              <>
                <h2 className="text-base sm:text-lg font-black text-[#111] flex items-center gap-2 mb-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FF3B3B] animate-pulse" />
                  Live now — happening this minute
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {liveRooms.map((r, i) => (
                    <RoomCard key={r.id} room={r} big={i === 0} />
                  ))}
                </div>
              </>
            )}

            {/* All rooms or filtered */}
            <h2 className="text-base sm:text-lg font-black text-[#111] mb-3">
              {filter === 'all' ? 'All rooms' : `Showing ${filtered.length}`}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(filter === 'all' ? otherRooms : filtered).map((r) => (
                <RoomCard key={r.id} room={r} />
              ))}
            </div>

            {filtered.length === 0 && filter !== 'all' && (
              <div className="bb-card bg-white p-8 text-center text-sm text-[#555]">
                No rooms match. Try a different filter.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RoomCard({ room, big = false }: { room: Room; big?: boolean }) {
  const isLive = room.active_count > 0;
  return (
    <Link
      href={`/community/${room.slug}`}
      className="bb-card bg-white overflow-hidden hover:shadow-[6px_6px_0px_#111] hover:-translate-y-0.5 transition-all"
    >
      {/* Top color block */}
      <div
        className={`relative flex items-end ${big ? 'h-28 sm:h-32 p-4' : 'h-20 sm:h-24 p-3'} border-b-[2px] border-[#111]`}
        style={{ backgroundColor: room.color, backgroundImage: 'repeating-linear-gradient(45deg, rgba(17,17,17,0.06) 0 4px, transparent 4px 12px)' }}
      >
        {room.is_pinned && (
          <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full border-[2px] border-[#111] bg-[#00D09C] px-2 py-0.5 text-[9px] font-black text-white shadow-[1.5px_1.5px_0_#111]">
            <Pin className="h-2.5 w-2.5" /> PINNED
          </div>
        )}
        <div
          className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-full border-[2px] border-[#111] bg-white/95 px-2 py-0.5 text-[10px] font-black"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-[#FF3B3B] animate-pulse' : 'bg-[#00D09C]'}`} />
          {isLive ? 'LIVE' : `${room.member_count} member${room.member_count === 1 ? '' : 's'}`}
        </div>
        <div className={`${big ? 'text-4xl' : 'text-3xl'} drop-shadow-[2px_2px_0_#111]`}>{room.emoji}</div>
      </div>

      {/* Body */}
      <div className="p-3 sm:p-4">
        <p className={`font-black text-[#111] mb-1 ${big ? 'text-base sm:text-lg' : 'text-sm sm:text-[15px]'}`}>
          {room.name}
        </p>
        <p className="text-[11px] sm:text-xs text-[#555] line-clamp-2 mb-2 sm:mb-3">{room.description}</p>
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-[#888] font-bold truncate">Host · {room.host_alias}</p>
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#00D09C]">
            <MessageSquare className="h-3 w-3" /> Text room
          </span>
        </div>
      </div>
    </Link>
  );
}
