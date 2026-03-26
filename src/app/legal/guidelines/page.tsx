// ============================================================
// Community Guidelines — GenZ IITian Connect (Neo-Brutalist Light Theme)
// ============================================================
import React from 'react';
import Link from 'next/link';
import { Users, ArrowLeft, AlertTriangle } from 'lucide-react';
import { COMMUNITY_RULES } from '@/lib/constants';

export default function GuidelinesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 bb-grid">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-[#888] hover:text-[#111] font-semibold transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B6B] border-[2px] border-[#111]">
          <Users className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-[#111]">Community Guidelines</h1>
          <p className="text-[#888] text-sm">
            Rules for a safe and productive learning environment
          </p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="rounded-xl bg-[#FF3B3B]/10 border-[2px] border-[#FF3B3B] p-4 mb-8 flex items-start gap-3 shadow-[3px_3px_0px_#FF3B3B30]">
        <AlertTriangle className="h-5 w-5 text-[#FF3B3B] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-black text-[#FF3B3B]">Zero Tolerance Policy</p>
          <p className="text-sm text-[#555] mt-1">
            Any violation of these guidelines will result in immediate and permanent
            ban. Severe violations will be reported to law enforcement authorities
            under the IT Act 2000.
          </p>
        </div>
      </div>

      {/* Rules */}
      <div className="space-y-4 mb-12">
        {COMMUNITY_RULES.map((rule, index) => (
          <div
            key={rule.title}
            className="bb-card bg-white p-6 flex items-start gap-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDEBD3] border-[2px] border-[#111] text-2xl flex-shrink-0">
              {rule.icon}
            </div>
            <div>
              <h3 className="font-black text-[#111] mb-1">
                {index + 1}. {rule.title}
              </h3>
              <p className="text-sm text-[#555]">{rule.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* What happens on violation */}
      <div className="bb-card bg-white p-6 mb-8">
        <h2 className="text-xl font-black text-[#111] mb-4">What Happens When You Violate Rules?</h2>
        <div className="space-y-3">
          {[
            { level: 'First Offense (Minor)', action: 'Warning + 24-hour temporary suspension', color: 'text-[#FB923C]' },
            { level: 'Second Offense', action: '7-day suspension + mandatory rules review', color: 'text-[#FB923C]' },
            { level: 'Third Offense / Major Violation', action: 'Permanent ban + reported to authorities if illegal', color: 'text-[#FF3B3B]' },
            { level: 'Criminal Activity', action: 'Immediate ban + report to cybercrime authorities', color: 'text-[#FF3B3B]' },
          ].map((item) => (
            <div key={item.level} className="flex items-start gap-3 rounded-xl bg-[#FDEBD3] border-[2px] border-[#111] p-3 shadow-[2px_2px_0px_#111]">
              <span className={`text-sm font-black ${item.color} min-w-[180px]`}>{item.level}</span>
              <span className="text-sm text-[#555]">{item.action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reporting */}
      <div className="bb-card bg-white p-6">
        <h2 className="text-xl font-black text-[#111] mb-4">How to Report</h2>
        <div className="space-y-2 text-sm text-[#555]">
          <p><strong className="text-[#111]">During Chat:</strong> Click the 🚩 Report button in the chat header.</p>
          <p><strong className="text-[#111]">After Chat:</strong> Report via the end-of-chat feedback screen.</p>
          <p>
            <strong className="text-[#111]">Email:</strong> Send detailed reports to{' '}
            <a href="mailto:help@genziitian.in" className="text-[#00D09C] underline font-semibold">
              help@genziitian.in
            </a>
          </p>
          <p className="mt-3 text-xs text-[#888]">
            All reports are reviewed within 48 hours. False reports may result in your own account suspension.
          </p>
        </div>
      </div>
    </div>
  );
}
