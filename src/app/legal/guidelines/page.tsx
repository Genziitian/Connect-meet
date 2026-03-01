// ============================================================
// Community Guidelines — GenZ IITian Connect
// ============================================================
import React from 'react';
import Link from 'next/link';
import { Users, ArrowLeft, AlertTriangle } from 'lucide-react';
import { COMMUNITY_RULES } from '@/lib/constants';

export default function GuidelinesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-brand-text-muted hover:text-brand-text-primary transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-accent/10">
          <Users className="h-6 w-6 text-brand-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Community Guidelines</h1>
          <p className="text-brand-text-muted text-sm">
            Rules for a safe and productive learning environment
          </p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="rounded-xl bg-brand-danger/5 border border-brand-danger/20 p-4 mb-8 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-brand-danger mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-brand-danger">
            Zero Tolerance Policy
          </p>
          <p className="text-sm text-brand-text-secondary mt-1">
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
            className="rounded-xl border-2 border-brand-border bg-brand-card p-6 flex items-start gap-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-bg text-2xl flex-shrink-0">
              {rule.icon}
            </div>
            <div>
              <h3 className="font-bold mb-1">
                {index + 1}. {rule.title}
              </h3>
              <p className="text-sm text-brand-text-secondary">{rule.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* What happens on violation */}
      <div className="rounded-xl border-2 border-brand-border bg-brand-card p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">What Happens When You Violate Rules?</h2>
        <div className="space-y-3">
          {[
            {
              level: 'First Offense (Minor)',
              action: 'Warning + 24-hour temporary suspension',
              color: 'text-brand-warning',
            },
            {
              level: 'Second Offense',
              action: '7-day suspension + mandatory rules review',
              color: 'text-brand-warning',
            },
            {
              level: 'Third Offense / Major Violation',
              action: 'Permanent ban + reported to authorities if illegal',
              color: 'text-brand-danger',
            },
            {
              level: 'Criminal Activity',
              action: 'Immediate ban + report to cybercrime authorities',
              color: 'text-brand-danger',
            },
          ].map((item) => (
            <div key={item.level} className="flex items-start gap-3 rounded-lg bg-brand-bg border border-brand-border p-3">
              <span className={`text-sm font-bold ${item.color} min-w-[180px]`}>
                {item.level}
              </span>
              <span className="text-sm text-brand-text-secondary">{item.action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reporting */}
      <div className="rounded-xl border-2 border-brand-border bg-brand-card p-6">
        <h2 className="text-xl font-bold mb-4">How to Report</h2>
        <div className="space-y-2 text-sm text-brand-text-secondary">
          <p>
            <strong className="text-brand-text-primary">During Chat:</strong> Click the 🚩 Report button in the chat header.
          </p>
          <p>
            <strong className="text-brand-text-primary">After Chat:</strong> Report via the end-of-chat feedback screen.
          </p>
          <p>
            <strong className="text-brand-text-primary">Email:</strong> Send detailed reports to{' '}
            <a href="mailto:grievance@genziitian.com" className="text-brand-accent underline">
              grievance@genziitian.com
            </a>
          </p>
          <p className="mt-3 text-xs text-brand-text-muted">
            All reports are reviewed within 48 hours. False reports may result in your own account suspension.
          </p>
        </div>
      </div>
    </div>
  );
}
