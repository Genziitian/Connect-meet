// ============================================================
// Plans Page — GenZ IITian Connect (Neo-Brutalist Light Theme)
// ============================================================
'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { PLANS } from '@/lib/constants';
import {
  CheckCircle2,
  X,
  Star,
  Zap,
  MessageSquare,
  Video,
  Crown,
  ArrowRight,
  Clock,
  BookOpen,
  Users,
  GraduationCap,
  Sparkles,
  Bell,
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
            Student-Friendly Plans
          </div>
          <h1 className="text-3xl sm:text-5xl font-black mb-4 text-[#111]">
            Choose Your{' '}
            <span className="text-[#00D09C]">Study Connect</span> Plan
          </h1>
          <p className="text-[#555] text-lg">
            Start free with full access. Premium features dropping soon — stay tuned!
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-start">
          {PLANS.map((plan) => {
            const isCurrent = isAuthenticated && user?.planType === plan.id;
            const isComingSoon = plan.comingSoon;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-[3px] border-[#111] p-8 transition-all ${
                  plan.highlighted
                    ? 'bg-[#00D09C] shadow-[6px_6px_0px_#111] scale-[1.03]'
                    : 'bg-white shadow-[4px_4px_0px_#111]'
                }`}
              >
                {/* Badges */}
                {plan.highlighted && !isComingSoon && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#111] px-4 py-1 text-xs font-black text-white shadow-lg">
                      <Star className="h-3 w-3" /> MOST POPULAR
                    </span>
                  </div>
                )}

                {isComingSoon && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FB923C] to-[#FF6B6B] border-[2px] border-[#111] px-4 py-1.5 text-xs font-black text-white shadow-[2px_2px_0px_#111]">
                      <Sparkles className="h-3 w-3" /> COMING SOON
                    </span>
                  </div>
                )}

                {/* Plan name & icon */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    {plan.id === 'free' && (
                      <div className="p-2 rounded-lg bg-[#FDEBD3] border-[2px] border-[#111]">
                        <MessageSquare className="h-5 w-5 text-[#111]" />
                      </div>
                    )}
                    {plan.id === 'pro' && (
                      <div className={`p-2 rounded-lg border-[2px] border-[#111] ${isComingSoon ? 'bg-white/20' : 'bg-white/30'}`}>
                        <Video className="h-5 w-5 text-white" />
                      </div>
                    )}
                    {plan.id === 'premium' && (
                      <div className="p-2 rounded-lg bg-[#FDEBD3] border-[2px] border-[#111]">
                        <Crown className="h-5 w-5 text-[#FB923C]" />
                      </div>
                    )}
                    <h2 className={`text-xl font-black ${plan.highlighted ? 'text-white' : 'text-[#111]'}`}>
                      {plan.name}
                    </h2>
                  </div>

                  {/* Price — hidden for coming soon */}
                  {isComingSoon ? (
                    <div className="relative">
                      <div className="flex items-baseline gap-1 blur-md select-none pointer-events-none">
                        <span className={`text-4xl font-black ${plan.highlighted ? 'text-white' : 'text-[#111]'}`}>
                          ₹XXX
                        </span>
                        <span className={plan.highlighted ? 'text-white/70' : 'text-[#888]'}>
                          /month
                        </span>
                      </div>
                      <div className="absolute inset-0 flex items-center">
                        <span className={`text-sm font-bold ${plan.highlighted ? 'text-white/80' : 'text-[#888]'}`}>
                          Price reveal soon ✨
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-black ${plan.highlighted ? 'text-white' : 'text-[#111]'}`}>
                          FREE
                        </span>
                        <span className={plan.highlighted ? 'text-white/70' : 'text-[#00D09C]'}>
                          forever
                        </span>
                      </div>
                      <p className="text-xs mt-1 text-[#888]">
                        No credit card required
                      </p>
                    </>
                  )}
                </div>

                {/* Matches info */}
                <div className={`rounded-lg border-[2px] border-[#111] p-3 mb-6 ${
                  isComingSoon
                    ? plan.highlighted ? 'bg-white/10' : 'bg-[#f5f5f5]'
                    : plan.highlighted ? 'bg-white/20' : 'bg-[#FDEBD3]'
                }`}>
                  <div className="flex justify-between items-center text-sm">
                    <span className={plan.highlighted ? 'text-white/80' : 'text-[#888]'}>
                      Daily Connects
                    </span>
                    <span className={`font-black ${
                      isComingSoon
                        ? 'blur-sm select-none'
                        : plan.highlighted ? 'text-white' : 'text-[#111]'
                    }`}>
                      {plan.matchesPerDay === -1 ? '∞ Unlimited' : plan.matchesPerDay}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className={`space-y-3 mb-8 ${isComingSoon ? 'opacity-80' : ''}`}>
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                        plan.highlighted ? 'text-white' : 'text-[#00D09C]'
                      }`} />
                      <span className={plan.highlighted ? 'text-white/90' : 'text-[#555]'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isComingSoon ? (
                  <div className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold border-[2px] border-dashed cursor-not-allowed ${
                    plan.highlighted
                      ? 'border-white/40 bg-white/10 text-white/70'
                      : 'border-[#ccc] bg-[#f9f9f9] text-[#aaa]'
                  }`}>
                    <Bell className="h-4 w-4" />
                    Notify Me When Available
                  </div>
                ) : isAuthenticated ? (
                  isCurrent ? (
                    <div className="w-full rounded-xl border-[2px] border-[#111] bg-[#00D09C]/10 py-3 text-center text-sm font-bold text-[#00D09C]">
                      ✓ Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => updatePlan(plan.id)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold border-[2px] border-[#111] bg-[#FDEBD3] text-[#111] shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                    >
                      {plan.price === 0 ? 'Downgrade' : 'Upgrade Now'}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )
                ) : (
                  <Link
                    href="/auth/login"
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold border-[2px] border-[#111] bg-[#00D09C] text-white shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* What's coming section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 rounded-full border-[2px] border-[#111] bg-[#FB923C] px-4 py-1.5 text-sm text-white font-bold shadow-[2px_2px_0px_#111] mb-4">
              <Sparkles className="h-4 w-4" />
              What&apos;s Coming
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#111]">
              Exciting Features on the Way
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: BookOpen,
                title: 'Subject-wise Courses',
                desc: 'Structured courses for every subject with curated study material.',
                color: '#B794F6',
              },
              {
                icon: Users,
                title: '1:1 Mentorship',
                desc: 'Connect with seniors and toppers for personalized guidance.',
                color: '#00D09C',
              },
              {
                icon: GraduationCap,
                title: 'Exam Prep Matching',
                desc: 'Find study partners preparing for the same exams as you.',
                color: '#FB923C',
              },
              {
                icon: MessageSquare,
                title: 'Study Groups',
                desc: 'Create or join persistent study groups by subject or topic.',
                color: '#FF6B6B',
              },
              {
                icon: Zap,
                title: 'AI Study Assistant',
                desc: 'Get instant doubt resolution powered by AI during sessions.',
                color: '#00D09C',
              },
              {
                icon: Star,
                title: 'Priority Matching',
                desc: 'Skip the queue and get matched with top-rated peers first.',
                color: '#B794F6',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="relative group rounded-xl border-[2px] border-[#111] bg-white p-5 shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10" style={{ backgroundColor: item.color }} />
                <div
                  className="inline-flex p-2.5 rounded-lg border-[2px] border-[#111] mb-3"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <item.icon className="h-5 w-5" style={{ color: item.color }} />
                </div>
                <h3 className="font-black text-[#111] mb-1">{item.title}</h3>
                <p className="text-sm text-[#888] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
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
                  <th className="px-6 py-4 text-sm font-black text-[#00D09C]">Starter</th>
                  <th className="px-6 py-4 text-sm font-black text-[#888] relative">
                    Pro
                    <span className="absolute -top-1 right-2 text-[8px] bg-[#FB923C] text-white px-1.5 py-0.5 rounded-full font-bold">SOON</span>
                  </th>
                  <th className="px-6 py-4 text-sm font-black text-[#888] relative">
                    Premium
                    <span className="absolute -top-1 right-1 text-[8px] bg-[#FB923C] text-white px-1.5 py-0.5 rounded-full font-bold">SOON</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Text Chat', starter: true, pro: true, premium: true },
                  { feature: 'Video Chat', starter: true, pro: true, premium: true },
                  { feature: 'Daily Connects', starter: '20', pro: '50', premium: '∞' },
                  { feature: 'Subject-wise Courses', starter: false, pro: true, premium: true },
                  { feature: '1:1 Mentorship', starter: false, pro: true, premium: true },
                  { feature: 'Topic Filters', starter: false, pro: true, premium: true },
                  { feature: 'Priority Matching', starter: false, pro: false, premium: true },
                  { feature: 'AI Study Assistant', starter: false, pro: false, premium: true },
                  { feature: 'Report & Block', starter: true, pro: true, premium: true },
                  { feature: 'Verified Access', starter: true, pro: true, premium: true },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-[#eee] last:border-0">
                    <td className="px-6 py-3 text-sm text-[#555] font-medium">{row.feature}</td>
                    <td className="px-6 py-3 text-center"><FeatureCell value={row.starter} /></td>
                    <td className="px-6 py-3 text-center opacity-50"><FeatureCell value={row.pro} /></td>
                    <td className="px-6 py-3 text-center opacity-50"><FeatureCell value={row.premium} /></td>
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
