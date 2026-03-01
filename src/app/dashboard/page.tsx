// ============================================================
// Dashboard Page — GenZ IITian Connect
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
  AlertTriangle,
  Settings,
  FileText,
  ExternalLink,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) return null;

  const currentPlan = PLANS.find((p) => p.id === user.planType);

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-white mb-1">
              Welcome back{user.displayName ? `, ${user.displayName}` : ''}
            </h1>
            <p className="text-brand-text-secondary text-sm">
              Your study connect dashboard
            </p>
          </div>
          <Link
            href="/connect"
            className="glow-btn flex items-center gap-2 rounded-full bg-brand-accent px-6 py-3 text-sm font-bold text-white hover:bg-brand-accent-hover transition-colors"
          >
            <Zap className="h-4 w-4" />
            Start Connecting
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={MessageSquare}
            label="Total Connects"
            value={user.matchesUsedToday.toString()}
            subtitle="Today"
            color="accent"
          />
          <StatCard
            icon={Clock}
            label="Time Connected"
            value="0h 0m"
            subtitle="Today"
            color="success"
          />
          <StatCard
            icon={TrendingUp}
            label="Connect Streak"
            value="0 days"
            subtitle="Keep going!"
            color="warning"
          />
          <StatCard
            icon={Shield}
            label="Safety Score"
            value="100%"
            subtitle="Excellent"
            color="success"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Connect */}
            <div className="rounded-2xl border-2 border-brand-border bg-brand-card p-6">
              <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-brand-accent" />
                Quick Connect
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/connect"
                  className="group rounded-xl border border-brand-border bg-brand-bg p-5 hover:border-brand-accent/30 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-accent/10 group-hover:bg-brand-accent/20 transition-colors">
                      <MessageSquare className="h-5 w-5 text-brand-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Text Chat</p>
                      <p className="text-xs text-brand-text-muted">Available for all</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-brand-success flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-success animate-pulse" />
                      Students online
                    </span>
                    <ArrowRight className="h-4 w-4 text-brand-text-muted group-hover:text-brand-accent transition-colors" />
                  </div>
                </Link>

                <Link
                  href="/connect"
                  className={`group rounded-xl border p-5 transition-all ${
                    currentPlan?.videoEnabled
                      ? 'border-brand-border bg-brand-bg hover:border-brand-accent/30'
                      : 'border-brand-border bg-brand-bg opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-accent/10">
                      <Video className="h-5 w-5 text-brand-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Video Chat</p>
                      <p className="text-xs text-brand-text-muted">
                        {currentPlan?.videoEnabled ? 'Pro & Premium' : 'Upgrade to Pro'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    {currentPlan?.videoEnabled ? (
                      <span className="text-xs text-brand-success flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-success animate-pulse" />
                        Available
                      </span>
                    ) : (
                      <span className="text-xs text-brand-warning">Locked</span>
                    )}
                    <ArrowRight className="h-4 w-4 text-brand-text-muted group-hover:text-brand-accent transition-colors" />
                  </div>
                </Link>
              </div>
            </div>

            {/* Usage */}
            <div className="rounded-2xl border-2 border-brand-border bg-brand-card p-6">
              <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-brand-accent" />
                Today&apos;s Usage
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-brand-text-secondary">
                      Connects Used
                    </span>
                    <span className="font-medium">
                      {formatMatchCount(user.matchesUsedToday, user.maxMatchesPerDay)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-brand-bg overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-accent transition-all"
                      style={{
                        width:
                          user.maxMatchesPerDay === -1
                            ? '5%'
                            : `${(user.matchesUsedToday / user.maxMatchesPerDay) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Tips */}
            <div className="rounded-2xl border-2 border-brand-border bg-brand-card p-6">
              <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-brand-success" />
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
                    className="flex items-center gap-2 rounded-lg bg-brand-bg border border-brand-border px-3 py-2.5 text-sm text-brand-text-secondary"
                  >
                    <CheckCircle2 className="h-4 w-4 text-brand-success flex-shrink-0" />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="rounded-2xl border-2 border-brand-border bg-brand-card p-6">
              <div className="text-center mb-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-accent/20 mb-3">
                  <User className="h-8 w-8 text-brand-accent" />
                </div>
                <p className="font-black text-white">{user.displayName || 'Student'}</p>
                <p className="text-sm text-brand-text-muted truncate">{user.email}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-text-muted">Plan</span>
                  <span className="font-medium text-brand-accent flex items-center gap-1 uppercase">
                    {user.planType === 'premium' && <Crown className="h-3.5 w-3.5 text-brand-warning" />}
                    {user.planType}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-text-muted">Verified</span>
                  <span className="text-brand-success flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Yes
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-text-muted">Status</span>
                  <span className={user.isBanned ? 'text-brand-danger' : 'text-brand-success'}>
                    {user.isBanned ? 'Banned' : 'Active'}
                  </span>
                </div>
              </div>

              {user.planType === 'free' && (
                <Link
                  href="/plans"
                  className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-brand-accent/10 border border-brand-accent/20 py-2.5 text-sm font-medium text-brand-accent hover:bg-brand-accent/20 transition-colors"
                >
                  <Crown className="h-4 w-4" />
                  Upgrade Plan
                </Link>
              )}
            </div>

            {/* Quick Links */}
            <div className="rounded-2xl border-2 border-brand-border bg-brand-card p-4 space-y-1">
              <SidebarLink
                href="/plans"
                icon={CreditCard}
                label="Manage Plan"
              />
              <SidebarLink
                href="/legal/privacy"
                icon={Shield}
                label="Privacy & Safety"
              />
              <SidebarLink
                href="/legal/guidelines"
                icon={FileText}
                label="Community Guidelines"
              />
              <SidebarLink
                href="/legal/data-deletion"
                icon={Settings}
                label="Request Data Deletion"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
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
  color: 'accent' | 'success' | 'warning' | 'danger';
}) {
  const colorMap = {
    accent: 'bg-brand-accent/10 text-brand-accent',
    success: 'bg-brand-success/10 text-brand-success',
    warning: 'bg-brand-warning/10 text-brand-warning',
    danger: 'bg-brand-danger/10 text-brand-danger',
  };

  return (
    <div className="rounded-2xl border-2 border-brand-border bg-brand-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorMap[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm text-brand-text-muted">{label}</span>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs text-brand-text-muted mt-1">{subtitle}</p>
    </div>
  );
}

// Sidebar Link Component
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
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg transition-colors"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
