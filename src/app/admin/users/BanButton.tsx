'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Ban, ShieldCheck, Loader2 } from 'lucide-react';

interface Props {
  userId: string;
  email: string;
  isBanned: boolean;
}

export default function BanButton({ userId, email, isBanned }: Props) {
  const router = useRouter();
  const { user: me } = useAuth();
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    if (!me) return;
    if (userId === me.id) {
      alert("You can't ban yourself.");
      return;
    }

    if (isBanned) {
      if (!window.confirm(`Unban ${email}?`)) return;
      setBusy(true);
      const { error } = await supabase
        .from('users')
        .update({ is_banned: false, ban_reason: null, ban_expires_at: null })
        .eq('id', userId);
      if (error) { alert('Failed: ' + error.message); setBusy(false); return; }
      await supabase.from('moderation_actions').insert({
        actor_id: me.id, action: 'unban_user', target_user_id: userId,
      });
      setBusy(false);
      router.refresh();
      return;
    }

    const reason = window.prompt(`Ban ${email}?\n\nReason (shown internally):`);
    if (reason === null) return;
    setBusy(true);
    const { error } = await supabase
      .from('users')
      .update({ is_banned: true, ban_reason: reason || 'Unspecified', ban_expires_at: null })
      .eq('id', userId);
    if (error) { alert('Failed: ' + error.message); setBusy(false); return; }
    await supabase.from('moderation_actions').insert({
      actor_id: me.id, action: 'ban_user', target_user_id: userId, reason: reason || 'Unspecified',
    });
    setBusy(false);
    router.refresh();
  };

  return (
    <button
      onClick={handle}
      disabled={busy}
      className={`inline-flex items-center gap-1 rounded-md border-[2px] border-[#111] px-2 py-0.5 text-[10px] font-black shadow-[1.5px_1.5px_0_#111] transition-all disabled:opacity-50 ${
        isBanned ? 'bg-[#00D09C] text-white' : 'bg-[#FF3B3B] text-white'
      }`}
    >
      {busy ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isBanned ? (
        <ShieldCheck className="h-3 w-3" />
      ) : (
        <Ban className="h-3 w-3" />
      )}
      {isBanned ? 'Unban' : 'Ban'}
    </button>
  );
}
