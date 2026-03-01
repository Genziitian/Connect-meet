// ============================================================
// Data Retention Policy — GenZ IITian Connect
// ============================================================
import React from 'react';
import Link from 'next/link';
import { Database, ArrowLeft, Clock } from 'lucide-react';

export default function DataRetentionPage() {
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
          <Database className="h-6 w-6 text-brand-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Data Retention Policy</h1>
          <p className="text-brand-text-muted text-sm">
            How long we keep your data — DPDP Act 2023 compliant
          </p>
        </div>
      </div>

      <div className="rounded-xl border-2 border-brand-border bg-brand-card overflow-hidden mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-border bg-brand-bg">
              <th className="text-left px-6 py-4 text-sm font-semibold text-brand-text-primary">
                Data Type
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-brand-text-primary">
                Retention Period
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-brand-text-primary">
                Legal Basis
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                type: 'Account Data (email, profile)',
                period: 'Until account deletion + 30 days',
                basis: 'Consent (DPDP Act)',
              },
              {
                type: 'Chat Messages',
                period: 'NOT stored at all',
                basis: 'Data Minimization',
              },
              {
                type: 'Video Streams',
                period: 'NOT stored (peer-to-peer)',
                basis: 'Data Minimization',
              },
              {
                type: 'Session Metadata',
                period: '90 days',
                basis: 'IT Rules 2021 (Safety)',
              },
              {
                type: 'IP Address Hash',
                period: '90 days (one-way hash)',
                basis: 'IT Rules 2021',
              },
              {
                type: 'Reports',
                period: '180 days or until resolution',
                basis: 'Legal Obligation',
              },
              {
                type: 'Consent Records',
                period: 'Duration of relationship + 3 years',
                basis: 'DPDP Act compliance',
              },
              {
                type: 'Payment Data',
                period: 'As per RBI guidelines (7 years)',
                basis: 'Legal Obligation',
              },
              {
                type: 'Audit Logs',
                period: '1 year',
                basis: 'IT Act 2000',
              },
            ].map((row) => (
              <tr key={row.type} className="border-b border-brand-border last:border-0">
                <td className="px-6 py-3.5 text-sm text-brand-text-primary font-medium">
                  {row.type}
                </td>
                <td className="px-6 py-3.5 text-sm text-brand-text-secondary">
                  {row.period}
                </td>
                <td className="px-6 py-3.5 text-sm text-brand-text-muted">
                  {row.basis}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border-2 border-brand-border bg-brand-card p-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-brand-accent" />
          Automatic Deletion
        </h2>
        <p className="text-sm text-brand-text-secondary leading-relaxed">
          Data is automatically purged from our systems after the retention period
          expires. No manual action is required. If you wish to delete your data
          before the retention period, visit our{' '}
          <Link href="/legal/data-deletion" className="text-brand-accent underline">
            Data Deletion Request
          </Link>{' '}
          page.
        </p>
      </div>
    </div>
  );
}
