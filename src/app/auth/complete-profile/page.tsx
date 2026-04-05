// ============================================================
// Complete Profile Page — GenZ IITian Connect
// ============================================================
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  User,
  GraduationCap,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
    if (user?.profileComplete) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!displayName.trim()) { setError('Please enter your name'); return; }
    if (!collegeName.trim()) { setError('Please enter your college name'); return; }
    if (!gender) { setError('Please select your gender'); return; }
    setError('');
    setSaving(true);
    try {
      await updateProfile({ displayName: displayName.trim(), collegeName: collegeName.trim(), gender });
      router.push('/dashboard');
    } catch {
      setError('Failed to save profile. Please try again.');
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bb-grid">
        <Loader2 className="h-8 w-8 animate-spin text-[#00D09C]" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bb-grid">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#00D09C] border-[3px] border-[#111] shadow-[3px_3px_0px_#111] mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-[#111] mb-2">Complete Your Profile</h1>
          <p className="text-[#555] text-sm">Tell us about yourself to get started</p>
        </div>

        {/* Card */}
        <div className="bb-card bg-white p-6 sm:p-8">
          {/* Logged in as */}
          <div className="flex items-center gap-3 rounded-xl bg-[#FDEBD3] border-[2px] border-[#111] px-4 py-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00D09C] border-[2px] border-[#111] overflow-hidden flex-shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#111] truncate">{user.email}</p>
              <p className="text-xs text-[#00D09C] font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Signed in with Google
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-[#FF3B3B]/10 border-[2px] border-[#FF3B3B]/30 px-4 py-3 mb-6 text-sm text-[#FF3B3B] font-medium">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-[#111] mb-2">
                Full Name <span className="text-[#FF3B3B]">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888]" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border-[2px] border-[#111] bg-[#FDEBD3] pl-10 pr-4 py-3 text-sm text-[#111] placeholder:text-[#999] focus:border-[#00D09C] focus:ring-1 focus:ring-[#00D09C] outline-none transition-colors"
                />
              </div>
            </div>

            {/* College Name */}
            <div>
              <label className="block text-sm font-bold text-[#111] mb-2">
                College / University <span className="text-[#FF3B3B]">*</span>
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888]" />
                <input
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  placeholder="e.g. IIT Madras BS Degree"
                  className="w-full rounded-xl border-[2px] border-[#111] bg-[#FDEBD3] pl-10 pr-4 py-3 text-sm text-[#111] placeholder:text-[#999] focus:border-[#00D09C] focus:ring-1 focus:ring-[#00D09C] outline-none transition-colors"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-bold text-[#111] mb-2">
                Gender <span className="text-[#FF3B3B]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GENDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setGender(opt.value)}
                    className={`rounded-xl border-[2px] px-3 py-2.5 text-sm font-bold transition-all ${
                      gender === opt.value
                        ? 'border-[#111] bg-[#00D09C] text-white shadow-[3px_3px_0px_#111]'
                        : 'border-[#ddd] bg-white text-[#555] hover:border-[#111]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-bold text-[#111] mb-2">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full rounded-xl border-[2px] border-[#ddd] bg-gray-50 px-4 py-3 text-sm text-[#888] cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-[#888]">From your Google account (cannot be changed)</p>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bb-btn bb-btn-green flex items-center justify-center gap-2 py-3 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Complete Profile
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
