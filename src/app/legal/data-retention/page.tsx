// ============================================================
// Data Retention Policy — GenZ IITian Connect (Neo-Brutalist Light Theme)
// ============================================================
import React from 'react';
import Link from 'next/link';
import { Database, ArrowLeft, Clock } from 'lucide-react';

export default function DataRetentionPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 bb-grid">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-[#888] hover:text-[#111] font-semibold transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FB923C] border-[2px] border-[#111]">
          <Database className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-[#111]">Data Retention Policy</h1>
          <p className="text-[#888] text-sm">
            How long we keep your data — DPDP Act 2023 compliant
          </p>
        </div>
      </div>

      <div className="bb-card bg-white overflow-hidden mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b-[2px] border-[#111] bg-[#FDEBD3]">
              <th className="text-left px-6 py-4 text-sm font-black text-[#111]">Data Type</th>
              <th className="text-left px-6 py-4 text-sm font-black text-[#111]">Retention Period</th>
              <th className="text-left px-6 py-4 text-sm font-black text-[#111]">Legal Basis</th>
            </tr>
          </thead>
          <tbody>
            {[
              { type: 'Account Data (email, profile)', period: 'Until account deletion + 30 days', basis: 'Consent (DPDP Act)' },
              { type: 'Chat Messages', period: 'NOT stored at all', basis: 'Data Minimization' },
              { type: 'Video Streams', period: 'NOT stored (peer-to-peer)', basis: 'Data Minimization' },
              { type: 'Session Metadata', period: '90 days', basis: 'IT Rules 2021 (Safety)' },
              { type: 'IP Address Hash', period: '90 days (one-way hash)', basis: 'IT Rules 2021' },
              { type: 'Reports', period: '180 days or until resolution', basis: 'Legal Obligation' },
              { type: 'Consent Records', period: 'Duration of relationship + 3 years', basis: 'DPDP Act compliance' },
              { type: 'Payment Data', period: 'As per RBI guidelines (7 years)', basis: 'Legal Obligation' },
              { type: 'Audit Logs', period: '1 year', basis: 'IT Act 2000' },
            ].map((row) => (
              <tr key={row.type} className="border-b border-[#eee] last:border-0">
                <td className="px-6 py-3.5 text-sm text-[#111] font-bold">{row.type}</td>
                <td className="px-6 py-3.5 text-sm text-[#555]">{row.period}</td>
                <td className="px-6 py-3.5 text-sm text-[#888]">{row.basis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bb-card bg-white p-6">
        <h2 className="text-lg font-black text-[#111] mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#00D09C]" />
          Automatic Deletion
        </h2>
        <p className="text-sm text-[#555] leading-relaxed">
          Data is automatically purged from our systems after the retention period
          expires. No manual action is required. If you wish to delete your data
          before the retention period, visit our{' '}
          <Link href="/legal/data-deletion" className="text-[#00D09C] underline font-semibold">
            Data Deletion Request
          </Link>{' '}
          page.
        </p>
      </div>
    </div>
  );
}
