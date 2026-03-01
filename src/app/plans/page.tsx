// ============================================================
// Plans Page — GenZ IITian Connect
// ============================================================
'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { PLANS } from '@/lib/constants';
import { formatINR } from '@/lib/utils';
import {
  CheckCircle2,
  X,
  Star,
  Shield,
  Zap,
  MessageSquare,
  Video,
  Filter,
  Crown,
  ArrowRight,
} from 'lucide-react';

export default function PlansPage() {
  const { user, isAuthenticated, updatePlan } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-accent/10 px-4 py-1.5 text-sm text-brand-accent mb-6">
            <Zap className="h-4 w-4" />
            Student-Friendly Pricing
          </div>
          <h1 className="text-3xl sm:text-5xl font-black mb-4">
            Choose Your <span className="gradient-text">Study Connect</span> Plan
          </h1>
          <p className="text-brand-text-secondary">
            Start free, upgrade anytime. All plans include verified-only matching and safety features.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {PLANS.map((plan) => {
            const isCurrent = isAuthenticated && user?.planType === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-8 transition-all ${
                  plan.highlighted
                    ? 'border-brand-accent bg-brand-accent/5 ring-2 ring-brand-accent/20 scale-[1.03]'
                    : 'border-brand-border bg-brand-card hover:border-brand-accent/30'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-accent px-4 py-1 text-xs font-bold text-white shadow-lg">
                      <Star className="h-3 w-3" /> MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    {plan.id === 'free' && <MessageSquare className="h-5 w-5 text-brand-text-muted" />}
                    {plan.id === 'pro' && <Video className="h-5 w-5 text-brand-accent" />}
                    {plan.id === 'premium' && <Crown className="h-5 w-5 text-brand-warning" />}
                    <h2 className="text-xl font-black text-white">{plan.name}</h2>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">{formatINR(plan.price)}</span>
                    {plan.price > 0 && (
                      <span className="text-brand-text-muted">/{plan.period}</span>
                    )}
                  </div>
                  {plan.price > 0 && (
                    <p className="text-xs text-brand-text-muted mt-1">
                      Cancel anytime • No lock-in
                    </p>
                  )}
                </div>

                {/* Matches info */}
                <div className="rounded-lg bg-brand-bg border border-brand-border p-3 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-brand-text-muted">Daily Connects</span>
                    <span className="font-bold text-brand-text-primary">
                      {plan.matchesPerDay === -1 ? '∞ Unlimited' : plan.matchesPerDay}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-brand-success mt-0.5 flex-shrink-0" />
                      <span className="text-brand-text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isAuthenticated ? (
                  isCurrent ? (
                    <div className="w-full rounded-lg border border-brand-success/30 bg-brand-success/10 py-3 text-center text-sm font-semibold text-brand-success">
                      Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => updatePlan(plan.id)}
                      className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-colors ${
                        plan.highlighted
                          ? 'glow-btn bg-brand-accent text-white hover:bg-brand-accent-hover'
                          : 'border border-brand-border text-brand-text-secondary hover:text-brand-text-primary hover:border-brand-accent/50'
                      }`}
                    >
                      {plan.price === 0 ? 'Downgrade' : 'Upgrade Now'}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )
                ) : (
                  <Link
                    href="/auth/login"
                    className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-colors ${
                      plan.highlighted
                        ? 'glow-btn bg-brand-accent text-white hover:bg-brand-accent-hover'
                        : 'border border-brand-border text-brand-text-secondary hover:text-brand-text-primary hover:border-brand-accent/50'
                    }`}
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Comparison table */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-white text-center mb-8">
            Feature Comparison
          </h2>
          <div className="rounded-2xl border-2 border-brand-border bg-brand-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left px-6 py-4 text-sm font-medium text-brand-text-muted">Feature</th>
                  <th className="px-6 py-4 text-sm font-medium text-brand-text-muted">Starter</th>
                  <th className="px-6 py-4 text-sm font-medium text-brand-accent">Pro</th>
                  <th className="px-6 py-4 text-sm font-medium text-brand-warning">Premium</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Text Chat', starter: true, pro: true, premium: true },
                  { feature: 'Video Chat', starter: false, pro: true, premium: true },
                  { feature: 'Daily Connects', starter: '5', pro: '50', premium: '∞' },
                  { feature: 'Topic Filters', starter: false, pro: true, premium: true },
                  { feature: 'Priority Matching', starter: false, pro: false, premium: true },
                  { feature: 'Background Blur', starter: false, pro: false, premium: true },
                  { feature: 'AI Study Assistant', starter: false, pro: false, premium: true },
                  { feature: 'Report & Block', starter: true, pro: true, premium: true },
                  { feature: 'Verified Access', starter: true, pro: true, premium: true },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-brand-border last:border-0">
                    <td className="px-6 py-3 text-sm text-brand-text-secondary">{row.feature}</td>
                    <td className="px-6 py-3 text-center">
                      <FeatureCell value={row.starter} />
                    </td>
                    <td className="px-6 py-3 text-center">
                      <FeatureCell value={row.pro} />
                    </td>
                    <td className="px-6 py-3 text-center">
                      <FeatureCell value={row.premium} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-sm font-medium text-brand-text-primary">{value}</span>;
  }
  return value ? (
    <CheckCircle2 className="h-4 w-4 text-brand-success mx-auto" />
  ) : (
    <X className="h-4 w-4 text-brand-text-muted mx-auto" />
  );
}
