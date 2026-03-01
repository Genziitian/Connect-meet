// ============================================================
// Footer Component — GenZ IITian Connect
// ============================================================
'use client';

import React from 'react';
import Link from 'next/link';
import { APP_NAME, GRIEVANCE_OFFICER } from '@/lib/constants';
import { Zap, Shield, Mail, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-brand-border bg-brand-card/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-1 mb-4">
              <span className="text-lg font-black text-white">Gen-Z</span>
              <span className="text-lg font-black text-brand-red">IITian</span>
            </div>
            <p className="text-sm text-brand-text-muted leading-relaxed">
              India&apos;s first privacy-compliant anonymous study connect platform
              for verified IIT Madras BS students.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-brand-text-muted">
              <Shield className="h-3.5 w-3.5 text-brand-success" />
              DPDP Act 2023 Compliant
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-brand-text-primary uppercase tracking-wider">
              Platform
            </h4>
            <ul className="space-y-2.5">
              <FooterLink href="/connect">Study Connect</FooterLink>
              <FooterLink href="/plans">Pricing</FooterLink>
              <FooterLink href="/dashboard">Dashboard</FooterLink>
              <FooterLink href="/auth/login">Login</FooterLink>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-brand-text-primary uppercase tracking-wider">
              Legal & Compliance
            </h4>
            <ul className="space-y-2.5">
              <FooterLink href="/legal/privacy">Privacy Policy</FooterLink>
              <FooterLink href="/legal/terms">Terms of Service</FooterLink>
              <FooterLink href="/legal/data-retention">Data Retention</FooterLink>
              <FooterLink href="/legal/data-deletion">Data Deletion</FooterLink>
              <FooterLink href="/legal/guidelines">Community Guidelines</FooterLink>
            </ul>
          </div>

          {/* Grievance Officer */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-brand-text-primary uppercase tracking-wider">
              Grievance Officer
            </h4>
            <div className="rounded-xl border border-brand-border bg-brand-card p-4 space-y-2">
              <p className="text-sm text-brand-text-secondary">
                As required under IT Rules 2021
              </p>
              <p className="text-sm text-brand-text-primary font-medium">
                {GRIEVANCE_OFFICER.name}
              </p>
              <a
                href={`mailto:${GRIEVANCE_OFFICER.email}`}
                className="flex items-center gap-1.5 text-sm text-brand-accent hover:text-brand-accent-hover transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                {GRIEVANCE_OFFICER.email}
              </a>
              <p className="text-xs text-brand-text-muted">
                Response within {GRIEVANCE_OFFICER.responseTime}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-brand-text-muted">
            © {new Date().getFullYear()} GenZ IITian. All rights reserved.
            Compliant with IT Act 2000, IT Rules 2021, DPDP Act 2023.
          </p>
          <div className="flex items-center gap-4 text-xs text-brand-text-muted">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-brand-success animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-brand-text-muted hover:text-brand-text-primary transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}
