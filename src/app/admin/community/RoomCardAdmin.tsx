'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Power, Loader2, ExternalLink, Pin, PinOff } from 'lucide-react';

interface Props {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isPinned: boolean;
}

export default function RoomCardAdmin({ id, slug, name, description, isActive, isPinned }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<null | 'toggle' | 'pin'>(null);

  // Local optimistic mirrors of props
  const [localActive, setLocalActive] = useState(isActive);
  const [localPinned, setLocalPinned] = useState(isPinned);
  useEffect(() => setLocalActive(isActive), [isActive]);
  useEffect(() => setLocalPinned(isPinned), [isPinned]);

  const toggle = async () => {
    if (!user) return;
    const next = !localActive;
    if (!window.confirm(`${next ? 'Reactivate' : 'Deactivate'} room "${name}"?`)) return;

    // Optimistic flip
    setLocalActive(next);
    setBusy('toggle');

    const { error } = await supabase
      .from('community_rooms')
      .update({ is_active: next })
      .eq('id', id);
    if (error) {
      setLocalActive(!next); // revert
      alert('Failed: ' + error.message);
      setBusy(null);
      return;
    }
    supabase
      .from('moderation_actions')
      .insert({
        actor_id: user.id,
        action: next ? 'reactivate_room' : 'deactivate_room',
        target_room_id: id,
      })
      .then(() => {});
    setBusy(null);
    startTransition(() => router.refresh());
  };

  const togglePin = async () => {
    if (!user) return;
    const next = !localPinned;

    // Optimistic flip
    setLocalPinned(next);
    setBusy('pin');

    const { error } = await supabase
      .from('community_rooms')
      .update({
        is_pinned: next,
        pinned_at: next ? new Date().toISOString() : null,
        pinned_by: next ? user.id : null,
      })
      .eq('id', id);
    if (error) {
      setLocalPinned(!next); // revert
      alert('Failed: ' + error.message);
      setBusy(null);
      return;
    }
    supabase
      .from('moderation_actions')
      .insert({
        actor_id: user.id,
        action: next ? 'pin_room' : 'unpin_room',
        target_room_id: id,
      })
      .then(() => {});
    setBusy(null);
    startTransition(() => router.refresh());
  };

  return (
    <div className="bb-card bg-white p-4">
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {localPinned &&<Pin className="h-3.5 w-3.5 text-[#00D09C] flex-shrink-0" />}
          <h3 className="text-sm font-black text-[#111] truncate">{name}</h3>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {localPinned &&(
            <span className="text-[9px] font-bold uppercase rounded px-2 py-0.5 bg-[#00D09C]/15 text-[#00875A]">
              pinned
            </span>
          )}
          <span
            className={`text-[9px] font-bold uppercase rounded px-2 py-0.5 ${
              localActive ? 'bg-[#00D09C]/15 text-[#00875A]' : 'bg-[#888]/15 text-[#555]'
            }`}
          >
            {localActive ? 'active' : 'paused'}
          </span>
        </div>
      </div>
      <p className="text-[11px] text-[#555] mb-2 line-clamp-2">{description || '—'}</p>
      <p className="text-[10px] font-mono text-[#888] mb-3">/{slug}</p>
      <div className="flex gap-1.5">
        <Link
          href={`/community/${slug}`}
          target="_blank"
          className="flex-1 flex items-center justify-center gap-1 rounded-lg border-[2px] border-[#111] bg-white px-2 py-1.5 text-[10px] font-black shadow-[2px_2px_0_#111] hover:bg-[#FDEBD3]"
        >
          <ExternalLink className="h-3 w-3" /> Open
        </Link>
        <button
          onClick={togglePin}
          disabled={busy !== null}
          title={localPinned ? 'Unpin from top' : 'Pin to top of /community'}
          className={`flex items-center justify-center gap-1 rounded-lg border-[2px] border-[#111] px-2 py-1.5 text-[10px] font-black text-white shadow-[2px_2px_0_#111] hover:shadow-[1px_1px_0_#111] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#111] disabled:opacity-60 transition-all ${
            localPinned ? 'bg-[#888]' : 'bg-[#00D09C]'
          }`}
        >
          {busy === 'pin' ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : localPinned ? (
            <PinOff className="h-3 w-3" />
          ) : (
            <Pin className="h-3 w-3" />
          )}
        </button>
        <button
          onClick={toggle}
          disabled={busy !== null}
          className={`flex-1 flex items-center justify-center gap-1 rounded-lg border-[2px] border-[#111] px-2 py-1.5 text-[10px] font-black text-white shadow-[2px_2px_0_#111] hover:shadow-[1px_1px_0_#111] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#111] disabled:opacity-60 transition-all ${
            localActive ? 'bg-[#FF3B3B]' : 'bg-[#00D09C]'
          }`}
        >
          {busy === 'toggle' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Power className="h-3 w-3" />}
          {localActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  );
}
