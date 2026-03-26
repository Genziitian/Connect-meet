// ============================================================
// Privacy Policy — GenZ IITian Connect (Neo-Brutalist Light Theme)
// ============================================================
import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 bb-grid">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-[#888] hover:text-[#111] font-semibold transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00D09C] border-[2px] border-[#111]">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-[#111]">Privacy Policy</h1>
          <p className="text-[#888] text-sm">
            Last updated: March 1, 2026 • Effective immediately
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <LegalSection title="1. Introduction">
          <p>
            GenZ IITian Connect (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to
            protecting your personal data. This Privacy Policy explains how we collect, use,
            store, and protect your information in compliance with the Digital Personal Data
            Protection Act 2023 (DPDP Act), the Information Technology Act 2000 (IT Act),
            and the Information Technology (Intermediary Guidelines and Digital Media Ethics
            Code) Rules 2021 (IT Rules 2021).
          </p>
        </LegalSection>

        <LegalSection title="2. Data We Collect">
          <p>We practice <strong>data minimization</strong> as required by the DPDP Act:</p>
          <ul>
            <li><strong>Email address</strong> — For identity verification and communication</li>
            <li><strong>Age confirmation</strong> — Boolean flag only (not date of birth)</li>
            <li><strong>Consent records</strong> — Timestamp and version of consent given</li>
            <li><strong>Subscription data</strong> — Plan type and billing information</li>
            <li><strong>Session metadata</strong> — Session ID, timestamps, and IP hash for safety logging</li>
            <li><strong>Reports</strong> — User-submitted reports for moderation</li>
          </ul>
          <div className="rounded-xl bg-[#00D09C]/10 border-[2px] border-[#00D09C] p-4 mt-4">
            <p className="text-sm text-[#00D09C] font-bold">
              ✅ We do NOT collect or store: Chat messages, video content, screen
              recordings, location data, contact lists, or browsing history.
            </p>
          </div>
        </LegalSection>

        <LegalSection title="3. Purpose of Data Collection">
          <p>We process personal data only for the following specific purposes:</p>
          <ul>
            <li>User authentication and identity verification</li>
            <li>Subscription management and billing</li>
            <li>Safety monitoring and abuse prevention</li>
            <li>Compliance with legal obligations under Indian law</li>
            <li>Platform improvement and analytics (aggregated, non-identifying)</li>
          </ul>
        </LegalSection>

        <LegalSection title="4. Legal Basis for Processing (DPDP Act 2023)">
          <p>Under the DPDP Act 2023, we process your data based on:</p>
          <ul>
            <li><strong>Consent</strong> — Your explicit consent obtained during onboarding</li>
            <li><strong>Legitimate purpose</strong> — Safety and abuse prevention</li>
            <li><strong>Legal obligation</strong> — Compliance with IT Act and IT Rules</li>
          </ul>
        </LegalSection>

        <LegalSection title="5. Data Storage and Security">
          <ul>
            <li>Data is stored on secure, encrypted servers</li>
            <li>IP addresses are stored as one-way hashes (irreversible)</li>
            <li>Chat content is <strong>never stored</strong> — it exists only in real-time</li>
            <li>Video streams are peer-to-peer (WebRTC) — never routed through our servers</li>
            <li>All data transmission uses TLS 1.3 encryption</li>
          </ul>
        </LegalSection>

        <LegalSection title="6. Data Retention">
          <p>In compliance with the DPDP Act&apos;s data minimization principle:</p>
          <ul>
            <li><strong>Account data</strong> — Retained while account is active; deleted within 30 days of account deletion</li>
            <li><strong>Session metadata</strong> — Retained for 90 days for safety compliance</li>
            <li><strong>Reports</strong> — Retained for 180 days or until resolution</li>
            <li><strong>Consent records</strong> — Retained for the duration of the relationship + 3 years</li>
          </ul>
          <p>
            See our{' '}
            <Link href="/legal/data-retention" className="text-[#00D09C] underline font-semibold">
              Data Retention Policy
            </Link>{' '}
            for full details.
          </p>
        </LegalSection>

        <LegalSection title="7. Your Rights (DPDP Act 2023)">
          <p>As a Data Principal under the DPDP Act, you have the right to:</p>
          <ul>
            <li><strong>Access</strong> — Request a copy of your personal data</li>
            <li><strong>Correction</strong> — Request correction of inaccurate data</li>
            <li><strong>Erasure</strong> — Request deletion of your personal data</li>
            <li><strong>Withdraw consent</strong> — Withdraw your consent at any time</li>
            <li><strong>Grievance redressal</strong> — File a complaint with our Grievance Officer</li>
            <li><strong>Nominate</strong> — Nominate another person to exercise your rights</li>
          </ul>
          <p>
            To exercise these rights, visit{' '}
            <Link href="/legal/data-deletion" className="text-[#00D09C] underline font-semibold">
              Data Deletion Request
            </Link>{' '}
            or contact our Grievance Officer.
          </p>
        </LegalSection>

        <LegalSection title="8. Data Sharing">
          <p>We do NOT sell your data. We may share data only:</p>
          <ul>
            <li>With law enforcement when required by a valid legal order</li>
            <li>With service providers (payment processors) under strict DPAs</li>
            <li>In anonymized/aggregated form that cannot identify you</li>
          </ul>
        </LegalSection>

        <LegalSection title="9. Children's Privacy">
          <p>
            This platform is intended for users aged 18 and above. Users under 18
            may only use the platform with verified parental/guardian consent. We
            do not knowingly collect data from users under 18 without consent, in
            compliance with Section 9 of the DPDP Act 2023.
          </p>
        </LegalSection>

        <LegalSection title="10. Grievance Officer">
          <div className="rounded-xl border-[2px] border-[#111] bg-[#FDEBD3] p-4">
            <p className="text-sm font-bold text-[#111]">Grievance Officer (as required under IT Rules 2021)</p>
            <p className="text-sm text-[#555] mt-1">Name: Grievance Officer — GenZ IITian Connect</p>
            <p className="text-sm text-[#555]">Email: help@genziitian.in</p>
            <p className="text-sm text-[#555]">Response time: Within 48 hours of receipt</p>
            <p className="text-sm text-[#555]">Resolution: Within 15 days as per IT Rules 2021</p>
          </div>
        </LegalSection>

        <LegalSection title="11. Changes to This Policy">
          <p>
            We may update this Privacy Policy periodically. Material changes will
            be notified via email and in-app notification. Continued use after
            changes constitutes acceptance. You may withdraw consent and delete
            your account at any time.
          </p>
        </LegalSection>

        <LegalSection title="12. Contact Us">
          <p>For any privacy-related queries or to exercise your data rights:</p>
          <ul>
            <li>Email: help@genziitian.in</li>
            <li>Grievance Officer: help@genziitian.in</li>
          </ul>
        </LegalSection>
      </div>
    </div>
  );
}

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bb-card bg-white p-6">
      <h2 className="text-xl font-black mb-4 text-[#111]">{title}</h2>
      <div className="text-sm text-[#555] leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-[#555] [&_strong]:text-[#111]">
        {children}
      </div>
    </section>
  );
}
