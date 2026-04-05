// ============================================================
// Dashboard Page — GenZ IITian Connect (Neo-Brutalist Light Theme)
// ============================================================
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { formatMatchCount, formatINR } from '@/lib/utils';
import { PLANS } from '@/lib/constants';
import {
  Zap,
  MessageSquare,
  Video,
  Shield,
  User,
  CreditCard,
  BarChart3,
  Clock,
  TrendingUp,
  ArrowRight,
  Crown,
  CheckCircle2,
  Settings,
  FileText,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    } else if (user && !user.profileComplete) {
      router.push('/auth/complete-profile');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user) return null;

  const currentPlan = PLANS.find((p) => p.id === user.planType);

  return (
    <div className="min-h-[calc(100vh-4rem)] bb-grid">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-[#111] mb-1">
              Welcome back{user.displayName ? `, ${user.displayName}` : ''}
            </h1>
            <p className="text-[#555] text-sm">Your study connect dashboard</p>
          </div>
          <Link
            href="/connect"
            className="bb-btn bb-btn-green px-6 py-3 text-sm"
          >
            <Zap className="h-4 w-4" />
            Start Connecting
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={MessageSquare} label="Total Connects" value={user.matchesUsedToday.toString()} subtitle="Today" color="green" />
          <StatCard icon={Clock} label="Time Connected" value="0h 0m" subtitle="Today" color="purple" />
          <StatCard icon={TrendingUp} label="Connect Streak" value="0 days" subtitle="Keep going!" color="orange" />
          <StatCard icon={Shield} label="Safety Score" value="100%" subtitle="Excellent" color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Connect */}
            <div className="bb-card bg-white p-6">
              <h2 className="text-lg font-black text-[#111] mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#00D09C]" />
                Quick Connect
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/connect"
                  className="group rounded-xl border-[2px] border-[#111] bg-[#FDEBD3] p-5 shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00D09C] border-[2px] border-[#111]">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#111]">Text Chat</p>
                      <p className="text-xs text-[#888]">Available for all</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#00D09C] font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#00D09C] animate-pulse" />
                      Students online
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#888] group-hover:text-[#00D09C] transition-colors" />
                  </div>
                </Link>

                <Link
                  href="/connect"
                  className={`group rounded-xl border-[2px] border-[#111] p-5 transition-all ${
                    currentPlan?.videoEnabled
                      ? 'bg-[#FDEBD3] shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px]'
                      : 'bg-gray-100 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B794F6] border-[2px] border-[#111]">
                      <Video className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#111]">Video Chat</p>
                      <p className="text-xs text-[#888]">
                        {currentPlan?.videoEnabled ? 'Pro & Premium' : 'Upgrade to Pro'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    {currentPlan?.videoEnabled ? (
                      <span className="text-xs text-[#00D09C] font-semibold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#00D09C] animate-pulse" />
                        Available
                      </span>
                    ) : (
                      <span className="text-xs text-[#FB923C] font-semibold">Locked</span>
                    )}
                    <ArrowRight className="h-4 w-4 text-[#888] group-hover:text-[#00D09C] transition-colors" />
                  </div>
                </Link>
              </div>
            </div>

            {/* Usage */}
            <div className="bb-card bg-white p-6">
              <h2 className="text-lg font-black text-[#111] mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#B794F6]" />
                Today&apos;s Usage
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#555]">Connects Used</span>
                    <span className="font-bold text-[#111]">
                      {formatMatchCount(user.matchesUsedToday, user.maxMatchesPerDay)}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-[#FDEBD3] border-[2px] border-[#111] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#00D09C] transition-all"
                      style={{
                        width: user.maxMatchesPerDay === -1 ? '5%' : `${(user.matchesUsedToday / user.maxMatchesPerDay) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Tips */}
            <div className="bb-card bg-white p-6">
              <h2 className="text-lg font-black text-[#111] mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#00D09C]" />
                Safety Reminders
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Never share personal information',
                  'Report any inappropriate behavior',
                  'No recording or screenshots',
                  'Be respectful to all students',
                ].map((tip) => (
                  <div
                    key={tip}
                    className="flex items-center gap-2 rounded-xl bg-[#FDEBD3] border-[2px] border-[#111] px-3 py-2.5 text-sm text-[#111] font-medium shadow-[2px_2px_0px_#111]"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#00D09C] flex-shrink-0" />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bb-card bg-white p-6">
              <div className="text-center mb-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#00D09C] border-[3px] border-[#111] mb-3 overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="h-8 w-8 text-white" />
                  )}
                </div>
                <p className="font-black text-[#111]">{user.displayName || 'Student'}</p>
                <p className="text-sm text-[#888] truncate">{user.email}</p>
                {user.collegeName && (
                  <p className="text-xs text-[#00D09C] font-semibold mt-1">{user.collegeName}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#888]">Plan</span>
                  <span className="font-bold text-[#00D09C] flex items-center gap-1 uppercase">
                    {user.planType === 'premium' && <Crown className="h-3.5 w-3.5 text-[#FB923C]" />}
                    {user.planType}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#888]">Verified</span>
                  <span className="text-[#00D09C] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Yes
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#888]">Status</span>
                  <span className={`font-semibold ${user.isBanned ? 'text-[#FF3B3B]' : 'text-[#00D09C]'}`}>
                    {user.isBanned ? 'Banned' : 'Active'}
                  </span>
                </div>
              </div>

              {user.planType === 'free' && (
                <Link
                  href="/plans"
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#FB923C] border-[2px] border-[#111] py-2.5 text-sm font-bold text-white shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  <Crown className="h-4 w-4" />
                  Upgrade Plan
                </Link>
              )}
            </div>

            {/* Quick Links */}
            <div className="bb-card bg-white p-4 space-y-1">
              <SidebarLink href="/plans" icon={CreditCard} label="Manage Plan" />
              <SidebarLink href="/legal/privacy" icon={Shield} label="Privacy & Safety" />
              <SidebarLink href="/legal/guidelines" icon={FileText} label="Community Guidelines" />
              <SidebarLink href="/legal/data-deletion" icon={Settings} label="Request Data Deletion" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle: string;
  color: 'green' | 'purple' | 'orange' | 'coral';
}) {
  const colorMap = {
    green: { bg: 'bg-[#00D09C]', iconColor: 'text-white' },
    purple: { bg: 'bg-[#B794F6]', iconColor: 'text-white' },
    orange: { bg: 'bg-[#FB923C]', iconColor: 'text-white' },
    coral: { bg: 'bg-[#FF6B6B]', iconColor: 'text-white' },
  };

  return (
    <div className="bb-card bg-white p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl border-[2px] border-[#111] ${colorMap[color].bg}`}>
          <Icon className={`h-4 w-4 ${colorMap[color].iconColor}`} />
        </div>
        <span className="text-sm text-[#888] font-medium">{label}</span>
      </div>
      <p className="text-2xl font-black text-[#111]">{value}</p>
      <p className="text-xs text-[#888] mt-1">{subtitle}</p>
    </div>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#555] font-medium hover:text-[#111] hover:bg-[#FDEBD3] transition-colors"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
