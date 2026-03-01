// ============================================================
// Data Deletion Request — GenZ IITian Connect
// ============================================================
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Trash2, ArrowLeft, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export default function DataDeletionPage() {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !confirmed) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-brand-text-muted hover:text-brand-text-primary transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-danger/10">
          <Trash2 className="h-6 w-6 text-brand-danger" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Data Deletion Request</h1>
          <p className="text-brand-text-muted text-sm">
            Your right under DPDP Act 2023, Section 12
          </p>
        </div>
      </div>

      {submitted ? (
        <div className="rounded-2xl border border-brand-success/20 bg-brand-success/5 p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-brand-success mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Request Submitted</h2>
          <p className="text-sm text-brand-text-secondary mb-4">
            Your data deletion request has been received. We will process it within
            <strong className="text-brand-text-primary"> 30 days</strong> as required
            by the DPDP Act 2023.
          </p>
          <p className="text-xs text-brand-text-muted">
            Confirmation will be sent to: <strong>{email}</strong>
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-brand-border bg-brand-card p-6 space-y-6">
          <div className="rounded-lg bg-brand-warning/5 border border-brand-warning/20 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-brand-warning mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-brand-warning">
                This action is irreversible
              </p>
              <p className="text-xs text-brand-text-secondary mt-1">
                All your personal data will be permanently deleted. Your account
                will be deactivated and you will not be able to recover it.
              </p>
            </div>
          </div>

          {/* What will be deleted */}
          <div>
            <h3 className="text-sm font-semibold mb-3">What will be deleted:</h3>
            <div className="space-y-2">
              {[
                'Email and profile information',
                'Subscription and payment records',
                'Session metadata and logs',
                'Consent records',
                'Any pending reports (both filed and against)',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-sm text-brand-text-secondary"
                >
                  <Trash2 className="h-3.5 w-3.5 text-brand-danger flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                Registered Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@ds.study.iitm.ac.in"
                className="w-full rounded-lg border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                Reason (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Help us improve — why are you leaving?"
                rows={3}
                className="w-full rounded-lg border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent outline-none resize-none"
              />
            </div>

            <label className="flex items-start gap-3 p-3 rounded-lg bg-brand-danger/5 border border-brand-danger/20 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-brand-border"
              />
              <span className="text-sm text-brand-text-secondary">
                I understand that this action is <strong className="text-brand-danger">permanent and
                irreversible</strong>. All my data will be deleted within 30 days.
              </span>
            </label>

            <button
              onClick={handleSubmit}
              disabled={!email || !confirmed || loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-danger py-3 text-sm font-semibold text-white hover:bg-brand-danger/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Submit Deletion Request
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
