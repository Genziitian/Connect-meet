'use client';

import React from 'react';
import Link from 'next/link';
import { GRIEVANCE_OFFICER } from '@/lib/constants';
import { Shield, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative mt-8">
      {/* ── Curved SVG top ── */}
      <div className="relative h-20 sm:h-28 -mb-1">
        <svg
          viewBox="0 0 1440 100"
          fill="none"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          <path
            d="M0,100 C480,0 960,0 1440,100 L1440,100 L0,100 Z"
            fill="#B794F6"
          />
        </svg>
      </div>

      {/* ── Main footer ── */}
      <div className="bg-[#B794F6] pb-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-0.5 mb-4">
                <span className="text-2xl font-black text-[#111]">Gen-Z</span>
                <span className="text-2xl font-black text-[#FF3B3B]">
                  IITian
                </span>
              </div>
              <p className="text-sm text-[#111]/70 leading-relaxed">
                Privacy-compliant anonymous social platform for safe video and
                text chat.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-[#111]/60">
                <Shield className="h-3.5 w-3.5" />
                DPDP Act 2023 Compliant
              </div>
            </div>

            {/* Platform */}
            <div>
              <h4 className="mb-4 text-sm font-black text-[#111] uppercase tracking-wider">
                Platform
              </h4>
              <ul className="space-y-2.5">
                <FooterLink href="/connect">Social Connect</FooterLink>
                <FooterLink href="/dashboard">Dashboard</FooterLink>
                <FooterLink href="/auth/login">Login</FooterLink>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="mb-4 text-sm font-black text-[#111] uppercase tracking-wider">
                Legal &amp; Compliance
              </h4>
              <ul className="space-y-2.5">
                <FooterLink href="/legal/privacy">Privacy Policy</FooterLink>
                <FooterLink href="/legal/terms">Terms of Service</FooterLink>
                <FooterLink href="/legal/data-retention">
                  Data Retention
                </FooterLink>
                <FooterLink href="/legal/data-deletion">
                  Data Deletion
                </FooterLink>
                <FooterLink href="/legal/guidelines">
                  Community Guidelines
                </FooterLink>
              </ul>
            </div>

            {/* Grievance Officer */}
            <div>
              <h4 className="mb-4 text-sm font-black text-[#111] uppercase tracking-wider">
                Grievance Officer
              </h4>
              <div className="rounded-xl border-[3px] border-[#111] bg-white/30 p-4 space-y-2">
                <p className="text-sm text-[#111]/80">
                  As required under IT Rules 2021
                </p>
                <p className="text-sm text-[#111] font-bold">
                  {GRIEVANCE_OFFICER.name}
                </p>
                <a
                  href={`mailto:${GRIEVANCE_OFFICER.email}`}
                  className="flex items-center gap-1.5 text-sm text-[#111] font-medium hover:underline"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {GRIEVANCE_OFFICER.email}
                </a>
                <p className="text-xs text-[#111]/60">
                  Response within {GRIEVANCE_OFFICER.responseTime}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t-[2px] border-[#111]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#111]/60">
              © {new Date().getFullYear()} GenZ IITian. All rights reserved.
              Compliant with IT Act 2000, IT Rules 2021, DPDP Act 2023.
            </p>
            <div className="flex items-center gap-4 text-xs text-[#111]/60">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#00D09C] animate-pulse" />
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-[#111]/70 hover:text-[#111] font-medium transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}
