// ============================================================
// Plans Page — GenZ IITian Connect (Neo-Brutalist + Razorpay)
// ============================================================
'use client';

import React, { useState, useCallback } from 'react';
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
  BookOpen,
  Users,
  GraduationCap,
  Sparkles,
  Loader2,
  Shield,
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PlansPage() {
  const { user, isAuthenticated, updatePlan } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePayment = useCallback(
    async (planId: string) => {
      if (!user) return;

      // Free plan — just downgrade
      if (planId === 'free') {
        await updatePlan('free');
        return;
      }

      setLoading(planId);

      try {
        // Load Razorpay script
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          alert('Payment gateway failed to load. Please try again.');
          setLoading(null);
          return;
        }

        // Create order on backend
        const res = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId, userId: user.id }),
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.error || 'Failed to create order');
          setLoading(null);
          return;
        }

        const { orderId, amount, currency } = await res.json();

        // Open Razorpay checkout
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount,
          currency,
          name: 'GenZ IITian Connect',
          description: `${planId === 'pro' ? 'Pro' : 'Premium'} Plan — Monthly`,
          order_id: orderId,
          prefill: {
            email: user.email,
            name: user.displayName || '',
          },
          theme: { color: '#00D09C' },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            // Verify on backend
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId,
                userId: user.id,
              }),
            });

            if (verifyRes.ok) {
              await updatePlan(planId as 'pro' | 'premium');
              alert('Payment successful! Your plan has been upgraded.');
            } else {
              alert('Payment verification failed. Please contact support.');
            }
            setLoading(null);
          },
          modal: {
            ondismiss: () => setLoading(null),
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch {
        alert('Something went wrong. Please try again.');
        setLoading(null);
      }
    },
    [user, updatePlan]
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bb-grid">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border-[2px] border-[#111] bg-[#00D09C] px-4 py-1.5 text-sm text-white font-bold shadow-[2px_2px_0px_#111] mb-6">
            <Zap className="h-4 w-4" />
            Student-Friendly Pricing
          </div>
          <h1 className="text-3xl sm:text-5xl font-black mb-4 text-[#111]">
            Choose Your{' '}
            <span className="text-[#00D09C]">Study Connect</span> Plan
          </h1>
          <p className="text-[#555] text-lg">
            Start free, upgrade anytime. All plans include verified-only matching and safety features.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-start">
          {PLANS.map((plan) => {
            const isCurrent = isAuthenticated && user?.planType === plan.id;
            const isUpgrade = isAuthenticated && !isCurrent && plan.price > 0;
            const isDowngrade = isAuthenticated && !isCurrent && plan.price === 0 && user?.planType !== 'free';

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-[3px] border-[#111] p-8 transition-all ${
                  plan.highlighted
                    ? 'bg-[#00D09C] shadow-[6px_6px_0px_#111] scale-[1.03]'
                    : 'bg-white shadow-[4px_4px_0px_#111]'
                }`}
              >
                {/* Badge */}
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#111] px-4 py-1 text-xs font-black text-white shadow-lg">
                      <Star className="h-3 w-3" /> MOST POPULAR
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
                      <div className="p-2 rounded-lg bg-white/30 border-[2px] border-[#111]">
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

                  {/* Price */}
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-black ${plan.highlighted ? 'text-white' : 'text-[#111]'}`}>
                      {plan.price === 0 ? 'FREE' : formatINR(plan.price)}
                    </span>
                    {plan.price === 0 ? (
                      <span className={plan.highlighted ? 'text-white/70' : 'text-[#00D09C]'}>
                        forever
                      </span>
                    ) : (
                      <span className={plan.highlighted ? 'text-white/70' : 'text-[#888]'}>
                        /month
                      </span>
                    )}
                  </div>
                  {plan.price === 0 ? (
                    <p className="text-xs mt-1 text-[#888]">No credit card required</p>
                  ) : (
                    <p className={`text-xs mt-1 ${plan.highlighted ? 'text-white/60' : 'text-[#888]'}`}>
                      Cancel anytime &bull; No lock-in
                    </p>
                  )}
                </div>

                {/* Matches info */}
                <div className={`rounded-lg border-[2px] border-[#111] p-3 mb-6 ${
                  plan.highlighted ? 'bg-white/20' : 'bg-[#FDEBD3]'
                }`}>
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
                {isAuthenticated ? (
                  isCurrent ? (
                    <div className="w-full rounded-xl border-[2px] border-[#111] bg-[#00D09C]/10 py-3 text-center text-sm font-bold text-[#00D09C]">
                      ✓ Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePayment(plan.id)}
                      disabled={loading === plan.id}
                      className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold border-[2px] border-[#111] transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                        plan.highlighted
                          ? 'bg-white text-[#111] shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px]'
                          : 'bg-[#FDEBD3] text-[#111] shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px]'
                      }`}
                    >
                      {loading === plan.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : isDowngrade ? (
                        <>Downgrade</>
                      ) : isUpgrade ? (
                        <>
                          Upgrade Now
                          <ArrowRight className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Get Started
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  )
                ) : (
                  <Link
                    href="/auth/login"
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold border-[2px] border-[#111] transition-all ${
                      plan.highlighted
                        ? 'bg-white text-[#111] shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px]'
                        : plan.price === 0
                        ? 'bg-[#00D09C] text-white shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px]'
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

        {/* Secure payment badge */}
        <div className="flex items-center justify-center gap-2 mt-8 text-sm text-[#888]">
          <Shield className="h-4 w-4" />
          Payments secured by Razorpay &bull; 100% safe &amp; encrypted
        </div>

        {/* What's included section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 rounded-full border-[2px] border-[#111] bg-[#B794F6] px-4 py-1.5 text-sm text-white font-bold shadow-[2px_2px_0px_#111] mb-4">
              <Sparkles className="h-4 w-4" />
              Premium Features
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#111]">
              What You Unlock with Pro &amp; Premium
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
                  <th className="px-6 py-4 text-sm font-black text-[#888]">Starter</th>
                  <th className="px-6 py-4 text-sm font-black text-[#00D09C]">Pro</th>
                  <th className="px-6 py-4 text-sm font-black text-[#FB923C]">Premium</th>
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
