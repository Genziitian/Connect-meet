// ============================================================
// Plans Page — Frontend Placeholder (Free for Everyone)
// ============================================================
'use client';

import React from 'react';
import { Sparkles, CheckCircle2, Shield } from 'lucide-react';

export default function PlansPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bb-grid">
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border-[2px] border-[#111] bg-[#00D09C] px-4 py-1.5 text-sm text-white font-bold shadow-[2px_2px_0px_#111] mb-6">
            <Sparkles className="h-4 w-4" />
            Product Update
          </div>
          <h1 className="text-3xl sm:text-5xl font-black mb-4 text-[#111]">
            Free for Everyone
          </h1>
          <p className="text-[#555] text-lg">
            Pricing plans are currently removed. Everyone gets full access to text and video social connect features.
          </p>
        </div>

        <div className="bb-card bg-white p-6 sm:p-8 max-w-3xl mx-auto mb-12">
          <h2 className="text-xl font-black text-[#111] mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#00D09C]" />
            Included for all users
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#555]">
            {[
              'Anonymous text chat',
              'Anonymous video chat',
              'Topic filters',
              'Community rooms',
              'Report and block tools',
              'Verified access and safety controls',
            ].map((feature) => (
              <div
                key={feature}
                className="rounded-xl border-[2px] border-[#111] bg-[#FDEBD3] px-3 py-2.5 font-medium shadow-[2px_2px_0px_#111]"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-[#111] text-center mb-6">Feature Comparison</h2>
          <div className="relative bb-card bg-white overflow-hidden">
            <div className="pointer-events-none select-none blur-sm opacity-70 p-6">
              <div className="grid grid-cols-4 gap-4 border-b border-[#ddd] pb-3 mb-3 text-sm font-bold text-[#666]">
                <div>Feature</div>
                <div>Starter</div>
                <div>Pro</div>
                <div>Premium</div>
              </div>
              {['Text Chat', 'Video Chat', 'Daily Connects', 'Topic Filters', 'Priority Matching'].map((row) => (
                <div key={row} className="grid grid-cols-4 gap-4 py-3 border-b border-[#eee] text-sm text-[#777]">
                  <div>{row}</div>
                  <div>...</div>
                  <div>...</div>
                  <div>...</div>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full border-[2px] border-[#111] bg-[#111] px-5 py-2 text-sm font-black text-white shadow-[3px_3px_0px_#00D09C]">
                COMING SOON
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8 text-sm text-[#888]">
          <Shield className="h-4 w-4" />
          Full access enabled while pricing is unavailable
        </div>
      </section>
    </div>
  );
}
