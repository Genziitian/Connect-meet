// ============================================================
// Settings — privacy preferences
// ============================================================
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Settings as SettingsIcon, UserPlus, Loader2, Check } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [allowRequests, setAllowRequests] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('users')
      .select('allow_friend_requests')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setAllowRequests(data?.allow_friend_requests ?? true);
        setLoading(false);
      });
  }, [user]);

  const toggle = async (next: boolean) => {
    if (!user || saving) return;
    setSaving(true);
    setAllowRequests(next); // optimistic
    const { error } = await supabase
      .from('users')
      .update({ allow_friend_requests: next })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      setAllowRequests(!next);
      alert('Failed: ' + error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  };

  if (authLoading || !isAuthenticated || loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bb-grid flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#888]" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bb-grid py-6 px-4">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#555] hover:text-[#111] mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#888] border-[2px] border-[#111] shadow-[3px_3px_0_#111]">
            <SettingsIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#111]">Settings</h1>
            <p className="text-xs text-[#555]">Privacy preferences</p>
          </div>
        </div>

        <div className="bb-card bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#B794F6] border-[2px] border-[#111] flex-shrink-0">
              <UserPlus className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-black text-[#111] mb-1">Allow friend requests</h2>
              <p className="text-xs text-[#555]">
                When OFF, the &quot;Add Friend&quot; button is hidden for you in community rooms and chats.
                Existing friends and admins are unaffected.
              </p>
            </div>
            <button
              onClick={() => toggle(!allowRequests)}
              disabled={saving}
              className={`relative h-7 w-12 rounded-full border-[2px] border-[#111] transition-all flex-shrink-0 ${
                allowRequests ? 'bg-[#00D09C]' : 'bg-[#888]/30'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white border border-[#111] transition-all ${
                  allowRequests ? 'left-6' : 'left-0.5'
                }`}
              />
            </button>
          </div>
          {saved && (
            <p className="mt-3 text-xs text-[#00875A] font-bold flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Saved
            </p>
          )}
        </div>

        <p className="text-[10px] text-[#888] mt-4 text-center">
          More settings coming soon. To delete your account, contact help@genziitian.in
        </p>
      </div>
    </div>
  );
}
