// ============================================================
// Terms of Service — GenZ IITian Connect (Neo-Brutalist Light Theme)
// ============================================================
import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 bb-grid">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-[#888] hover:text-[#111] font-semibold transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#B794F6] border-[2px] border-[#111]">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-[#111]">Terms of Service</h1>
          <p className="text-[#888] text-sm">Last updated: March 1, 2026</p>
        </div>
      </div>

      <div className="space-y-6">
        {[
          {
            title: '1. Acceptance of Terms',
            content:
              'By accessing or using GenZ IITian Connect ("Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. These terms are governed by Indian law, including the IT Act 2000, IT Rules 2021, and DPDP Act 2023.',
          },
          {
            title: '2. Eligibility',
            content:
              'You must be 18 years or older to use this Service. Users under 18 may only use the Service with verified parental/guardian consent. You must be a verified student (preferably IIT Madras BS program) to access the Study Connect feature. You must provide a valid, verifiable email address.',
          },
          {
            title: '3. Account Registration',
            content:
              'You must provide accurate information during registration. You are responsible for maintaining the security of your account. You must not share your account credentials. One account per person — multiple accounts will result in ban.',
          },
          {
            title: '4. Acceptable Use',
            content:
              'You agree NOT to: share explicit, obscene, or pornographic content; harass, bully, threaten, or intimidate other users; share personal identifying information of others; record, screenshot, or store chat/video content; use automated tools, bots, or scripts; impersonate other individuals; engage in spam or unsolicited promotions; violate any applicable Indian law.',
          },
          {
            title: '5. Content and Conduct',
            content:
              'All communication on this platform is anonymous. We do not store chat messages or video content. However, session metadata is logged for safety as required by IT Rules 2021. You are solely responsible for your conduct during chat sessions. We reserve the right to terminate accounts that violate these terms.',
          },
          {
            title: '6. Subscription and Payments',
            content:
              'Free tier: Access to basic text chat with 5 connects per day. Paid tiers: Additional features as described on the Plans page. Payments are processed securely through authorized payment gateways. Refund policy: Refunds may be issued within 7 days of purchase if the service was not used. Subscriptions auto-renew unless cancelled before the billing date.',
          },
          {
            title: '7. Safety and Moderation',
            content:
              'We implement safety measures including: mandatory community rules acceptance, report and block functionality, session logging for abuse investigation, rate limiting and device fingerprinting, AI-based content moderation (future). Users who violate community guidelines will face immediate and permanent ban.',
          },
          {
            title: '8. Intellectual Property',
            content:
              'The Service, including its design, code, and branding, is the intellectual property of GenZ IITian. You may not copy, modify, distribute, or reverse-engineer any part of the Service.',
          },
          {
            title: '9. Limitation of Liability',
            content:
              'GenZ IITian Connect is provided "as is" without warranties. We are not liable for: content shared by other users, any damages arising from use of the Service, service interruptions or technical issues, actions of third parties on the platform. Our liability is limited to the amount paid by you in the 12 months preceding the claim.',
          },
          {
            title: '10. Intermediary Status (IT Rules 2021)',
            content:
              'GenZ IITian Connect operates as an intermediary under Section 2(1)(w) of the IT Act 2000. We comply with the Intermediary Guidelines under IT Rules 2021, including: appointment of a Grievance Officer, 72-hour compliance with government orders, periodic compliance reports, content removal upon valid legal request.',
          },
          {
            title: '11. Dispute Resolution',
            content:
              'Any disputes shall be resolved through: first, internal grievance mechanism (contact our Grievance Officer); second, mediation; third, arbitration under the Arbitration and Conciliation Act, 1996. The seat of arbitration shall be in India. These terms are governed by the laws of India.',
          },
          {
            title: '12. Termination',
            content:
              'We reserve the right to suspend or terminate your account for: violation of these terms, violation of community guidelines, illegal activity, suspected fraud or abuse. You may delete your account at any time through the Data Deletion Request page.',
          },
          {
            title: '13. Contact',
            content:
              'For any queries regarding these terms: Email: help@genziitian.in. Grievance Officer: help@genziitian.in (response within 48 hours).',
          },
        ].map((section) => (
          <div
            key={section.title}
            className="bb-card bg-white p-6"
          >
            <h2 className="text-lg font-black text-[#111] mb-3">{section.title}</h2>
            <p className="text-sm text-[#555] leading-relaxed whitespace-pre-line">
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
