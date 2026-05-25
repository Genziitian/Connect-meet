// ============================================================
// Pick Your Mode — Connect Lobby (per mockup)
// ============================================================
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { io, Socket } from 'socket.io-client';
import {
  MessageSquare,
  Video,
  Hash,
  Zap,
  Shield,
  Loader2,
} from 'lucide-react';

interface LiveStats {
  onlineUsers: number;
  inQueue: number;
  activeSessions: number;
  breakdown: {
    textQueue: number;
    videoQueue: number;
    activeText: number;
    activeVideo: number;
  };
}

type Mode = 'text' | 'video' | 'room';

interface Topic {
  id: string;
  slug: string;
  label: string;
  emoji: string | null;
}

const MOODS = ['😎 Chill talk', '🎯 Focus mode', '😂 Fun', '🌙 Late night'];
const YEARS = ['1st year', '2nd year', '3rd year', '4th year', 'BS/MS', 'PhD'];
const LANGS = ['EN', 'EN · HI', 'HI', 'TA', 'TE', 'BN'];

export default function PickModePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [mode, setMode] = useState<Mode>('text');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topic, setTopic] = useState('');
  const [year, setYear] = useState('');
  const [mood, setMood] = useState('');
  const [lang, setLang] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Live data
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [activeRoomMembers, setActiveRoomMembers] = useState(0);
  const [statsConnected, setStatsConnected] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    supabase
      .from('topics')
      .select('id, slug, label, emoji')
      .eq('is_active', true)
      .then(({ data }) => setTopics((data || []) as Topic[]));
  }, []);

  // Subscribe to live socket stats
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const socket: Socket = io(url, { transports: ['websocket', 'polling'] });
    socket.on('connect', () => setStatsConnected(true));
    socket.on('disconnect', () => setStatsConnected(false));
    socket.on('stats:update', (payload: LiveStats) => setStats(payload));
    return () => {
      socket.disconnect();
    };
  }, []);

  // Active members across all community rooms (last 30 min)
  useEffect(() => {
    const fetchRoomCount = async () => {
      const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('community_messages')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', since);
      setActiveRoomMembers(count ?? 0);
    };
    fetchRoomCount();
    const t = setInterval(fetchRoomCount, 30000);
    return () => clearInterval(t);
  }, []);

  const isPro = user?.planType !== 'free';

  const handleStart = () => {
    if (!agreed) return;
    setSubmitting(true);

    if (mode === 'room') {
      router.push('/community');
      return;
    }

    const params = new URLSearchParams();
    params.set('mode', mode);
    if (topic) params.set('topic', topic);
    if (year && isPro) params.set('year', year);
    if (mood && isPro) params.set('mood', mood);
    if (lang && isPro) params.set('lang', lang);
    router.push(`/connect?${params.toString()}`);
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bb-grid py-8 px-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border-[2px] border-[#111] px-3 py-1 text-[10px] font-black text-white shadow-[2px_2px_0px_#111] mb-4 ${
              statsConnected ? 'bg-[#00D09C]' : 'bg-[#888]'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full bg-white ${statsConnected ? 'animate-pulse' : ''}`} />
            {stats
              ? `${stats.onlineUsers} students online · ${stats.activeSessions} live session${stats.activeSessions === 1 ? '' : 's'}`
              : 'Connecting to live server…'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#111] leading-tight">
            Pick your mode.
            <br />
            <span className="text-[#00D09C]">We&apos;ll do the matching.</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT — Form (2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Mode picker */}
            <div className="bb-card bg-white p-5">
              <p className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-3">Chat mode</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <ModeCard
                  active={mode === 'text'}
                  onClick={() => setMode('text')}
                  icon={MessageSquare}
                  color="#00D09C"
                  title="Text"
                  subtitle="Anonymous 1-on-1"
                  queue="~3s queue"
                />
                <ModeCard
                  active={mode === 'video'}
                  onClick={() => setMode('video')}
                  icon={Video}
                  color="#B794F6"
                  title="Video"
                  subtitle="Cam + text"
                  queue="~8s queue"
                />
                <ModeCard
                  active={mode === 'room'}
                  onClick={() => setMode('room')}
                  icon={Hash}
                  color="#FF3B3B"
                  title="Room"
                  subtitle="Group chat"
                  queue="Pick a room"
                />
              </div>
            </div>

            {/* Smart filters */}
            <div className="bb-card bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-[#888] uppercase tracking-wider">
                  Smart filters
                </p>
                <span
                  className={`text-[10px] font-black uppercase rounded px-2 py-0.5 ${
                    isPro ? 'bg-[#00D09C] text-white' : 'bg-[#888]/20 text-[#555]'
                  }`}
                >
                  {isPro ? 'Pro' : 'Upgrade to unlock'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Topic interest"
                  value={topic}
                  onChange={setTopic}
                  options={topics.map((t) => ({ value: t.slug, label: `${t.emoji || '#'} ${t.label}` }))}
                  placeholder="Any topic"
                  enabled
                />
                <Select
                  label="Year"
                  value={year}
                  onChange={setYear}
                  options={YEARS.map((y) => ({ value: y, label: y }))}
                  placeholder="Any year"
                  enabled={isPro}
                />
                <Select
                  label="Mood"
                  value={mood}
                  onChange={setMood}
                  options={MOODS.map((m) => ({ value: m, label: m }))}
                  placeholder="Any mood"
                  enabled={isPro}
                />
                <Select
                  label="Language"
                  value={lang}
                  onChange={setLang}
                  options={LANGS.map((l) => ({ value: l, label: l }))}
                  placeholder="Any language"
                  enabled={isPro}
                />
              </div>
            </div>

            {/* Agreement */}
            <label className="bb-card bg-[#FB923C]/15 border-[#FB923C] p-3 flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-xs font-bold text-[#111]">
                By starting you agree to community rules. Violations = ban.
              </span>
            </label>

            {/* Start button */}
            <button
              onClick={handleStart}
              disabled={!agreed || submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl border-[2px] border-[#111] bg-[#00D09C] py-4 text-base font-black text-white hover:bg-[#00B084] shadow-[4px_4px_0px_#111] hover:shadow-[2px_2px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  {mode === 'room' ? 'Browse Rooms' : `Start ${cap(mode)} Connect`}
                </>
              )}
            </button>
          </div>

          {/* RIGHT — sidebar (1 col) */}
          <div className="space-y-4">
            {/* Who's waiting — LIVE */}
            <WhosWaitingCard stats={stats} activeRoomMembers={activeRoomMembers} connected={statsConnected} />

            {/* Quick rules */}
            <div className="bb-card bg-[#FF3B3B]/15 border-[#FF3B3B] p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Shield className="h-4 w-4 text-[#FF3B3B]" />
                <p className="text-[10px] font-black text-[#111] uppercase tracking-wider">
                  Quick rules
                </p>
              </div>
              <ul className="space-y-1 text-[11px] font-medium text-[#111]">
                <li>• Be respectful. Always.</li>
                <li>• No nudity, no harassment.</li>
                <li>• No personal info — keep it anon.</li>
                <li>• Report sketchy behavior. We act fast.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function ModeCard({
  active,
  onClick,
  icon: Icon,
  color,
  title,
  subtitle,
  queue,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  title: string;
  subtitle: string;
  queue: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-xl border-[2px] border-[#111] p-4 text-left transition-all ${
        active
          ? 'shadow-[4px_4px_0px_#111] -translate-y-0.5'
          : 'shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px] opacity-75 hover:opacity-100'
      }`}
      style={{ backgroundColor: active ? `${color}25` : 'white' }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg border-[2px] border-[#111] mb-2"
        style={{ backgroundColor: color }}
      >
        <Icon className="h-4 w-4 text-white" />
      </div>
      <p className="text-sm font-black text-[#111]">{title}</p>
      <p className="text-[10px] text-[#555] font-medium">{subtitle}</p>
      <p className="text-[10px] font-bold mt-1" style={{ color }}>
        {queue}
      </p>
      {active && (
        <div
          className="absolute top-2 right-2 h-3 w-3 rounded-full border-[2px] border-[#111]"
          style={{ backgroundColor: color }}
        />
      )}
    </button>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  enabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  enabled: boolean;
}) {
  return (
    <div>
      <label className="block text-[9px] font-black text-[#888] uppercase tracking-wider mb-1">
        {label}
      </label>
      <select
        disabled={!enabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border-[2px] border-[#111] px-3 py-2 text-xs font-bold shadow-[3px_3px_0px_#111] focus:outline-none ${
          enabled ? 'bg-white' : 'bg-[#eee] cursor-not-allowed opacity-60'
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const DOT_COLORS = ['#B794F6', '#00D09C', '#FB923C', '#FF3B3B', '#FACC15'];

function WhosWaitingCard({
  stats,
  activeRoomMembers,
  connected,
}: {
  stats: LiveStats | null;
  activeRoomMembers: number;
  connected: boolean;
}) {
  if (!stats) {
    return (
      <div className="bb-card bg-white p-4">
        <p className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-2">
          Who&apos;s waiting
        </p>
        <p className="text-xs text-[#888]">{connected ? 'Loading…' : 'Connecting to server…'}</p>
      </div>
    );
  }

  const inQueue = stats.inQueue;
  const dotCount = Math.min(inQueue, 5);
  const remainder = Math.max(0, inQueue - 5);
  const totalDisplay = inQueue + activeRoomMembers;

  return (
    <div className="bb-card bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-black text-[#888] uppercase tracking-wider">
          Who&apos;s waiting
        </p>
        <span
          className={`inline-flex items-center gap-1 text-[9px] font-black ${
            connected ? 'text-[#00D09C]' : 'text-[#888]'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-[#00D09C] animate-pulse' : 'bg-[#888]'}`}
          />
          {connected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {inQueue === 0 && activeRoomMembers === 0 ? (
        <p className="text-xs text-[#555] py-2">
          The queue is quiet right now. <span className="font-bold text-[#00D09C]">Be the first to jump in!</span>
        </p>
      ) : (
        <>
          <div className="flex items-center gap-1.5 mb-1">
            {Array.from({ length: dotCount }).map((_, i) => (
              <div
                key={i}
                className="h-7 w-7 rounded-full border-[2px] border-[#111] animate-pulse"
                style={{ backgroundColor: DOT_COLORS[i % DOT_COLORS.length] }}
              />
            ))}
            {remainder > 0 && (
              <div className="h-7 w-7 rounded-full border-[2px] border-[#111] bg-white flex items-center justify-center text-[9px] font-black">
                +{remainder}
              </div>
            )}
          </div>
          <p className="text-xl font-black text-[#111] mt-2">{totalDisplay.toLocaleString()}</p>
          <p className="text-[10px] font-bold text-[#888]">
            {inQueue} in queue · {activeRoomMembers} in rooms
          </p>
          <p className="text-[9px] text-[#888] mt-1">
            {stats.breakdown.textQueue} text · {stats.breakdown.videoQueue} video · {activeRoomMembers} in rooms
          </p>
        </>
      )}
    </div>
  );
}
