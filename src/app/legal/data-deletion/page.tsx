// ============================================================
// Data Deletion Request — GenZ IITian Connect (Neo-Brutalist Light Theme)
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
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12 bb-grid">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-[#888] hover:text-[#111] font-semibold transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF3B3B] border-[2px] border-[#111]">
          <Trash2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-[#111]">Data Deletion Request</h1>
          <p className="text-[#888] text-sm">Your right under DPDP Act 2023, Section 12</p>
        </div>
      </div>

      {submitted ? (
        <div className="bb-card bg-[#00D09C]/10 p-8 text-center border-[#00D09C]">
          <CheckCircle2 className="h-16 w-16 text-[#00D09C] mx-auto mb-4" />
          <h2 className="text-xl font-black text-[#111] mb-2">Request Submitted</h2>
          <p className="text-sm text-[#555] mb-4">
            Your data deletion request has been received. We will process it within
            <strong className="text-[#111]"> 30 days</strong> as required by the DPDP Act 2023.
          </p>
          <p className="text-xs text-[#888]">
            Confirmation will be sent to: <strong>{email}</strong>
          </p>
        </div>
      ) : (
        <div className="bb-card bg-white p-6 space-y-6">
          <div className="rounded-xl bg-[#FB923C]/10 border-[2px] border-[#FB923C] p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[#FB923C] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-black text-[#FB923C]">This action is irreversible</p>
              <p className="text-xs text-[#555] mt-1">
                All your personal data will be permanently deleted. Your account
                will be deactivated and you will not be able to recover it.
              </p>
            </div>
          </div>

          {/* What will be deleted */}
          <div>
            <h3 className="text-sm font-black text-[#111] mb-3">What will be deleted:</h3>
            <div className="space-y-2">
              {[
                'Email and profile information',
                'Subscription and payment records',
                'Session metadata and logs',
                'Consent records',
                'Any pending reports (both filed and against)',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-[#555]">
                  <Trash2 className="h-3.5 w-3.5 text-[#FF3B3B] flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#111] mb-2">Registered Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@ds.study.iitm.ac.in"
                className="w-full rounded-xl border-[2px] border-[#111] bg-[#FDEBD3] px-4 py-3 text-sm text-[#111] placeholder:text-[#999] focus:border-[#00D09C] outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#111] mb-2">Reason (optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Help us improve — why are you leaving?"
                rows={3}
                className="w-full rounded-xl border-[2px] border-[#111] bg-[#FDEBD3] px-4 py-3 text-sm text-[#111] placeholder:text-[#999] focus:border-[#00D09C] outline-none resize-none"
              />
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-[#FF3B3B]/5 border-[2px] border-[#FF3B3B]/30 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-[#FF3B3B]"
              />
              <span className="text-sm text-[#555]">
                I understand that this action is <strong className="text-[#FF3B3B]">permanent and
                irreversible</strong>. All my data will be deleted within 30 days.
              </span>
            </label>

            <button
              onClick={handleSubmit}
              disabled={!email || !confirmed || loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FF3B3B] border-[2px] border-[#111] py-3 text-sm font-bold text-white shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
