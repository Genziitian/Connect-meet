'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Check, X, Loader2 } from 'lucide-react';

export default function JoinRequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [busy, setBusy] = useState<null | 'approve' | 'reject'>(null);

  const approve = async () => {
    if (!user) return;
    setBusy('approve');
    const { error } = await supabase
      .from('community_join_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        reject_reason: null,
      })
      .eq('id', requestId);
    setBusy(null);
    if (error) {
      alert('Failed: ' + error.message);
      return;
    }
    router.refresh();
  };

  const reject = async () => {
    if (!user) return;
    const reason = window.prompt('Reject reason (shown to student):');
    if (reason === null) return;
    setBusy('reject');
    const { error } = await supabase
      .from('community_join_requests')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        reject_reason: reason || 'Did not meet community guidelines.',
      })
      .eq('id', requestId);
    setBusy(null);
    if (error) {
      alert('Failed: ' + error.message);
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={approve}
        disabled={busy !== null}
        className="flex-1 flex items-center justify-center gap-1 rounded-lg border-[2px] border-[#111] bg-[#00D09C] py-1.5 text-[11px] font-black text-white shadow-[2px_2px_0_#111] hover:shadow-[1px_1px_0_#111] hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50 transition-all"
      >
        {busy === 'approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Approve
      </button>
      <button
        onClick={reject}
        disabled={busy !== null}
        className="flex-1 flex items-center justify-center gap-1 rounded-lg border-[2px] border-[#111] bg-[#FF3B3B] py-1.5 text-[11px] font-black text-white shadow-[2px_2px_0_#111] hover:shadow-[1px_1px_0_#111] hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50 transition-all"
      >
        {busy === 'reject' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        Reject
      </button>
    </div>
  );
}
