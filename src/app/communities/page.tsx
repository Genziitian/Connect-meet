// ============================================================
// /communities — Browse + manage communities (WhatsApp-style)
// ============================================================
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import {
  Plus, Loader2, Users, Search, Sparkles, BadgeCheck, Lock, Globe,
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
  created_at: string;
  my_role?: 'owner' | 'mod' | 'member';
}

export default function CommunitiesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [mine, setMine] = useState<Community[]>([]);
  const [discover, setDiscover] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: my }, { data: pub }] = await Promise.all([
      supabase.from('v_my_communities').select('*').order('joined_at', { ascending: false }),
      supabase
        .from('communities')
        .select('id, slug, name, description, emoji, banner_color, visibility, verified, member_count, created_at')
        .eq('visibility', 'public')
        .order('member_count', { ascending: false })
        .limit(40),
    ]);
    const mineList = (my || []) as Community[];
    const mineIds = new Set(mineList.map((c) => c.id));
    setMine(mineList);
    setDiscover(((pub || []) as Community[]).filter((c) => !mineIds.has(c.id)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (authLoading || !isAuthenticated) return null;

  const filterFn = (c: Community) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bb-grid">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border-[2px] border-[#111] bg-[#B794F6] px-3 py-1 text-[10px] font-black text-white shadow-[2px_2px_0px_#111] mb-3">
              <Sparkles className="h-3 w-3" />
              COMMUNITIES
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-[#111] leading-tight tracking-tight">
              Join the <span className="text-[#B794F6]">circle</span>.
              <br />
              Build your <span className="text-[#00D09C]">tribe</span>.
            </h1>
            <p className="text-sm text-[#555] mt-2 sm:mt-3 max-w-lg">
              Communities group multiple chat rooms — like a server with channels. Public to join, or invite-only.
            </p>
          </div>
          <Link
            href="/communities/new"
            prefetch
            aria-label="Create community"
            className="inline-flex items-center justify-center gap-1.5 rounded-full sm:rounded-xl border-[2px] sm:border-[3px] border-[#111] bg-[#B794F6] text-white font-black shadow-[3px_3px_0_#111] sm:shadow-[4px_4px_0_#111] hover:shadow-[1px_1px_0_#111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#111] transition-all whitespace-nowrap h-10 w-10 sm:h-auto sm:w-auto sm:px-4 sm:py-2.5 text-xs sm:text-sm"
          >
            <Plus className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Create community</span>
          </Link>
        </div>

        {/* Search */}
        <div className="bb-card bg-white p-3 sm:p-4 mb-6">
          <div className="flex items-center gap-2 rounded-xl border-[2px] border-[#111] bg-[#FDEBD3] px-3 py-2 shadow-[2px_2px_0px_#111]">
            <Search className="h-4 w-4 text-[#888]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search communities…"
              className="flex-1 bg-transparent text-sm font-medium text-[#111] placeholder:text-[#888] focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#888] mx-auto" />
          </div>
        ) : (
          <>
            {/* My communities */}
            {mine.length > 0 && (
              <>
                <h2 className="text-base sm:text-lg font-black text-[#111] flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-[#00D09C]" />
                  Your communities
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {mine.filter(filterFn).map((c) => (
                    <CommunityCard key={c.id} c={c} joined />
                  ))}
                </div>
              </>
            )}

            {/* Discover */}
            <h2 className="text-base sm:text-lg font-black text-[#111] mb-3">
              {mine.length > 0 ? 'Discover more' : 'Discover communities'}
            </h2>
            {discover.filter(filterFn).length === 0 ? (
              <div className="bb-card bg-white p-8 text-center">
                <Users className="h-10 w-10 text-[#888] mx-auto mb-3" />
                <p className="text-sm font-bold text-[#111] mb-1">
                  {query ? 'No matches.' : 'No public communities yet.'}
                </p>
                <p className="text-xs text-[#555] mb-4">Be the first to start one.</p>
                <Link
                  href="/communities/new"
                  className="inline-flex items-center gap-1.5 rounded-xl border-[2px] border-[#111] bg-[#B794F6] px-4 py-2 text-xs font-black text-white shadow-[2px_2px_0_#111]"
                >
                  <Plus className="h-3.5 w-3.5" /> Create one
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {discover.filter(filterFn).map((c) => (
                  <CommunityCard key={c.id} c={c} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CommunityCard({ c, joined = false }: { c: Community; joined?: boolean }) {
  return (
    <Link
      href={`/communities/${c.slug}`}
      className="bb-card bg-white overflow-hidden hover:shadow-[6px_6px_0px_#111] hover:-translate-y-0.5 transition-all block"
    >
      <div
        className="relative flex items-end h-24 sm:h-28 p-3 sm:p-4 border-b-[2px] border-[#111]"
        style={{
          backgroundColor: c.banner_color,
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(17,17,17,0.06) 0 4px, transparent 4px 12px)',
        }}
      >
        {joined && c.my_role && (
          <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full border-[2px] border-[#111] bg-white px-2 py-0.5 text-[9px] font-black shadow-[1.5px_1.5px_0_#111] uppercase">
            {c.my_role}
          </div>
        )}
        <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full border-[2px] border-[#111] bg-white/95 px-2 py-0.5 text-[10px] font-black">
          {c.visibility === 'public' ? <Globe className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
          {c.visibility === 'public' ? 'Public' : 'Invite'}
        </div>
        <div className="text-4xl drop-shadow-[2px_2px_0_#111]">{c.emoji}</div>
      </div>
      <div className="p-3 sm:p-4">
        <p className="font-black text-[#111] text-sm sm:text-base mb-1 flex items-center gap-1">
          {c.name}
          {c.verified && <BadgeCheck className="h-3.5 w-3.5 text-[#00D09C]" />}
        </p>
        {c.description && (
          <p className="text-[11px] sm:text-xs text-[#555] line-clamp-2 mb-2">{c.description}</p>
        )}
        <div className="flex items-center gap-1 text-[10px] font-bold text-[#888]">
          <Users className="h-3 w-3" /> {c.member_count} member{c.member_count === 1 ? '' : 's'}
        </div>
      </div>
    </Link>
  );
}
