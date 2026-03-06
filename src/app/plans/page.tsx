// ============================================================
// Plans Page — GenZ IITian Connect (Neo-Brutalist Light Theme)
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
  Zap,
  MessageSquare,
  Video,
  Crown,
  ArrowRight,
} from 'lucide-react';

export default function PlansPage() {
  const { user, isAuthenticated, updatePlan } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] bb-grid">
      {/* Header */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border-[2px] border-[#111] bg-[#00D09C] px-4 py-1.5 text-sm text-white font-bold shadow-[2px_2px_0px_#111] mb-6">
            <Zap className="h-4 w-4" />
            Student-Friendly Pricing
          </div>
          <h1 className="text-3xl sm:text-5xl font-black mb-4 text-[#111]">
            Choose Your{' '}
            <span className="text-[#00D09C]">Study Connect</span> Plan
          </h1>
          <p className="text-[#555]">
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
                className={`relative rounded-2xl border-[3px] border-[#111] p-8 transition-all ${
                  plan.highlighted
                    ? 'bg-[#00D09C] shadow-[6px_6px_0px_#111] scale-[1.03]'
                    : 'bg-white shadow-[4px_4px_0px_#111]'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#111] px-4 py-1 text-xs font-black text-white shadow-lg">
                      <Star className="h-3 w-3" /> MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    {plan.id === 'free' && <MessageSquare className="h-5 w-5 text-[#888]" />}
                    {plan.id === 'pro' && <Video className="h-5 w-5 text-white" />}
                    {plan.id === 'premium' && <Crown className="h-5 w-5 text-[#FB923C]" />}
                    <h2 className={`text-xl font-black ${plan.highlighted ? 'text-white' : 'text-[#111]'}`}>
                      {plan.name}
                    </h2>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-black ${plan.highlighted ? 'text-white' : 'text-[#111]'}`}>
                      {formatINR(plan.price)}
                    </span>
                    {plan.price > 0 && (
                      <span className={plan.highlighted ? 'text-white/70' : 'text-[#888]'}>
                        /{plan.period}
                      </span>
                    )}
                  </div>
                  {plan.price > 0 && (
                    <p className={`text-xs mt-1 ${plan.highlighted ? 'text-white/60' : 'text-[#888]'}`}>
                      Cancel anytime • No lock-in
                    </p>
                  )}
                </div>

                {/* Matches info */}
                <div className={`rounded-lg border-[2px] border-[#111] p-3 mb-6 ${plan.highlighted ? 'bg-white/20' : 'bg-[#FDEBD3]'}`}>
                  <div className="flex justify-between items-center text-sm">
                    <span className={plan.highlighted ? 'text-white/80' : 'text-[#888]'}>
                      Daily Connects
                    </span>
                    <span className={`font-black ${plan.highlighted ? 'text-white' : 'text-[#111]'}`}>
                      {plan.matchesPerDay === -1 ? '∞ Unlimited' : plan.matchesPerDay}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.highlighted ? 'text-white' : 'text-[#00D09C]'}`} />
                      <span className={plan.highlighted ? 'text-white/90' : 'text-[#555]'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isAuthenticated ? (
                  isCurrent ? (
                    <div className="w-full rounded-xl border-[2px] border-[#111] bg-[#00D09C]/10 py-3 text-center text-sm font-bold text-[#00D09C]">
                      Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => updatePlan(plan.id)}
                      className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold border-[2px] border-[#111] transition-all ${
                        plan.highlighted
                          ? 'bg-white text-[#111] shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px]'
                          : 'bg-[#FDEBD3] text-[#111] shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px]'
                      }`}
                    >
                      {plan.price === 0 ? 'Downgrade' : 'Upgrade Now'}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )
                ) : (
                  <Link
                    href="/auth/login"
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold border-[2px] border-[#111] transition-all ${
                      plan.highlighted
                        ? 'bg-white text-[#111] shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px]'
                        : 'bg-[#FDEBD3] text-[#111] shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px]'
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
          <h2 className="text-2xl font-black text-[#111] text-center mb-8">
            Feature Comparison
          </h2>
          <div className="bb-card bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b-[2px] border-[#111]">
                  <th className="text-left px-6 py-4 text-sm font-black text-[#111]">Feature</th>
                  <th className="px-6 py-4 text-sm font-black text-[#888]">Starter</th>
                  <th className="px-6 py-4 text-sm font-black text-[#00D09C]">Pro</th>
                  <th className="px-6 py-4 text-sm font-black text-[#FB923C]">Premium</th>
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
                  <tr key={row.feature} className="border-b border-[#eee] last:border-0">
                    <td className="px-6 py-3 text-sm text-[#555] font-medium">{row.feature}</td>
                    <td className="px-6 py-3 text-center"><FeatureCell value={row.starter} /></td>
                    <td className="px-6 py-3 text-center"><FeatureCell value={row.pro} /></td>
                    <td className="px-6 py-3 text-center"><FeatureCell value={row.premium} /></td>
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
    return <span className="text-sm font-bold text-[#111]">{value}</span>;
  }
  return value ? (
    <CheckCircle2 className="h-4 w-4 text-[#00D09C] mx-auto" />
  ) : (
    <X className="h-4 w-4 text-[#ccc] mx-auto" />
  );
}
