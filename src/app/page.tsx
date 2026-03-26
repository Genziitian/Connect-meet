// ============================================================
// Landing Page — GenZ IITian Connect
// BunkBuddies-inspired neo-brutalist UI
// ============================================================
'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  Video,
  MessageSquare,
  Users,
  BookOpen,
  Lock,
  CheckCircle2,
  Star,
  Sparkles,
} from 'lucide-react';
import { PLANS } from '@/lib/constants';
import { formatINR } from '@/lib/utils';

export default function HomePage() {
  return (
    <div className="min-h-screen bb-grid">
      {/* ══════════ HERO ══════════ */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-14 sm:pt-24 pb-6 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-6xl lg:text-[5.5rem] font-black leading-[1.05] tracking-tight">
            Online Degree feels{' '}
            <span className="relative inline-block">
              lonely?
              <svg
                className="absolute -bottom-1 left-0 w-full h-3"
                viewBox="0 0 200 12"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 8 Q50 2, 100 8 T200 4"
                  stroke="#FF6B6B"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <br />
            <span className="text-[#00D09C]">We fixed that.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-[#555] max-w-2xl mx-auto leading-relaxed">
            As an IIT Madras BS student, your campus is your screen. No
            corridors, no canteen hangouts. Find someone who fits your study
            life — not just the empty chat.
          </p>

          <div className="flex flex-wrap gap-4 mt-10 justify-center">
            <Link
              href="/auth/login"
              className="bb-btn bb-btn-green text-lg px-10 py-4"
            >
              Start Connecting
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-6 py-4 font-semibold text-lg underline underline-offset-4 decoration-2 hover:decoration-[#00D09C] transition-colors"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* ══════════ SCROLLING STUDENT AVATARS (BunkBuddies-style arches) ══════════ */}
      <section className="py-10 overflow-hidden">
        <div className="flex animate-scroll-x whitespace-nowrap items-end">
          {Array.from({ length: 14 }).map((_, i) => {
            const cards = [
              /* 0 — tall oval (purple) — girl with bun */
              {
                bg: '#B794F6',
                width: 'w-36 sm:w-44',
                height: 'h-52 sm:h-60',
                radius: 'rounded-[50%]',
                svg: (
                  <svg viewBox="0 0 100 140" className="w-24 sm:w-28 mt-6">
                    <circle cx="50" cy="35" r="16" fill="none" stroke="#111" strokeWidth="2.5" />
                    <circle cx="50" cy="20" r="7" fill="#111" />
                    <path d="M38 35 Q38 24 50 20 Q62 24 62 35" fill="none" stroke="#111" strokeWidth="2" />
                    <line x1="50" y1="51" x2="50" y2="95" stroke="#111" strokeWidth="2.5" />
                    <line x1="50" y1="62" x2="32" y2="80" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="50" y1="62" x2="68" y2="80" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="50" y1="95" x2="36" y2="125" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="50" y1="95" x2="64" y2="125" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M40 33 Q42 28 50 26" fill="none" stroke="#111" strokeWidth="1.5" />
                    <circle cx="44" cy="35" r="1.5" fill="#111" />
                    <circle cx="56" cy="35" r="1.5" fill="#111" />
                    <path d="M46 41 Q50 44 54 41" fill="none" stroke="#111" strokeWidth="1.5" />
                  </svg>
                ),
              },
              /* 1 — double arch (orange) — two friends */
              {
                bg: '#FB923C',
                width: 'w-48 sm:w-56',
                height: 'h-48 sm:h-56',
                radius: 'rounded-[50%_50%_50%_50%/60%_60%_40%_40%]',
                svg: (
                  <svg viewBox="0 0 140 120" className="w-32 sm:w-40 mt-4">
                    <circle cx="45" cy="35" r="14" fill="none" stroke="#111" strokeWidth="2.5" />
                    <circle cx="95" cy="35" r="14" fill="none" stroke="#111" strokeWidth="2.5" />
                    <path d="M35 30 Q35 22 45 19 Q55 22 55 30" fill="#111" />
                    <path d="M82 28 Q85 18 95 18 Q105 18 108 28" fill="#111" />
                    <circle cx="40" cy="35" r="1.5" fill="#111" />
                    <circle cx="50" cy="35" r="1.5" fill="#111" />
                    <path d="M42 40 Q45 43 48 40" fill="none" stroke="#111" strokeWidth="1.5" />
                    <circle cx="90" cy="35" r="1.5" fill="#111" />
                    <circle cx="100" cy="35" r="1.5" fill="#111" />
                    <path d="M92 40 Q95 43 98 40" fill="none" stroke="#111" strokeWidth="1.5" />
                    <line x1="45" y1="49" x2="45" y2="85" stroke="#111" strokeWidth="2.5" />
                    <line x1="95" y1="49" x2="95" y2="85" stroke="#111" strokeWidth="2.5" />
                    <line x1="45" y1="60" x2="30" y2="75" stroke="#111" strokeWidth="2" strokeLinecap="round" />
                    <line x1="45" y1="60" x2="60" y2="72" stroke="#111" strokeWidth="2" strokeLinecap="round" />
                    <line x1="95" y1="60" x2="80" y2="72" stroke="#111" strokeWidth="2" strokeLinecap="round" />
                    <line x1="95" y1="60" x2="110" y2="75" stroke="#111" strokeWidth="2" strokeLinecap="round" />
                    <line x1="45" y1="85" x2="36" y2="110" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="45" y1="85" x2="54" y2="110" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="95" y1="85" x2="86" y2="110" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="95" y1="85" x2="104" y2="110" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              /* 2 — squircle (coral) — person with laptop */
              {
                bg: '#FF6B6B',
                width: 'w-40 sm:w-48',
                height: 'h-48 sm:h-56',
                radius: 'rounded-[35%]',
                svg: (
                  <svg viewBox="0 0 110 130" className="w-28 sm:w-32 mt-4">
                    <circle cx="55" cy="32" r="15" fill="none" stroke="#111" strokeWidth="2.5" />
                    <path d="M42 28 Q45 20 55 18 Q65 20 68 28" fill="#111" />
                    <circle cx="49" cy="32" r="1.5" fill="#111" />
                    <circle cx="61" cy="32" r="1.5" fill="#111" />
                    <path d="M51 38 Q55 41 59 38" fill="none" stroke="#111" strokeWidth="1.5" />
                    <line x1="55" y1="47" x2="55" y2="88" stroke="#111" strokeWidth="2.5" />
                    <line x1="55" y1="60" x2="35" y2="75" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="55" y1="60" x2="75" y2="75" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <rect x="28" y="72" width="25" height="16" rx="2" fill="none" stroke="#111" strokeWidth="2" />
                    <line x1="28" y1="88" x2="53" y2="88" stroke="#111" strokeWidth="2" />
                    <line x1="55" y1="88" x2="42" y2="118" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="55" y1="88" x2="68" y2="118" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              /* 3 — tall arch/doorway (yellow) — person with glasses */
              {
                bg: '#FBBF24',
                width: 'w-36 sm:w-44',
                height: 'h-52 sm:h-60',
                radius: 'rounded-[50%_50%_12%_12%]',
                svg: (
                  <svg viewBox="0 0 100 140" className="w-24 sm:w-28 mt-6">
                    <circle cx="50" cy="35" r="16" fill="none" stroke="#111" strokeWidth="2.5" />
                    <path d="M36 30 Q40 18 50 16 Q60 18 64 30" fill="#111" />
                    <circle cx="43" cy="35" r="5" fill="none" stroke="#111" strokeWidth="1.5" />
                    <circle cx="57" cy="35" r="5" fill="none" stroke="#111" strokeWidth="1.5" />
                    <line x1="48" y1="35" x2="52" y2="35" stroke="#111" strokeWidth="1.5" />
                    <circle cx="43" cy="35" r="1.2" fill="#111" />
                    <circle cx="57" cy="35" r="1.2" fill="#111" />
                    <path d="M46 43 Q50 46 54 43" fill="none" stroke="#111" strokeWidth="1.5" />
                    <line x1="50" y1="51" x2="50" y2="95" stroke="#111" strokeWidth="2.5" />
                    <path d="M40 58 L50 65 L60 58" fill="none" stroke="#111" strokeWidth="2" />
                    <line x1="50" y1="62" x2="32" y2="80" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="50" y1="62" x2="68" y2="80" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="50" y1="95" x2="36" y2="125" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="50" y1="95" x2="64" y2="125" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              /* 4 — oval (purple) — person with phone */
              {
                bg: '#B794F6',
                width: 'w-36 sm:w-44',
                height: 'h-48 sm:h-56',
                radius: 'rounded-[50%]',
                svg: (
                  <svg viewBox="0 0 100 130" className="w-24 sm:w-28 mt-4">
                    <circle cx="50" cy="32" r="15" fill="none" stroke="#111" strokeWidth="2.5" />
                    <path d="M38 28 Q42 20 50 18 Q58 20 62 28" fill="#111" />
                    <circle cx="44" cy="32" r="1.5" fill="#111" />
                    <circle cx="56" cy="32" r="1.5" fill="#111" />
                    <path d="M46 38 Q50 41 54 38" fill="none" stroke="#111" strokeWidth="1.5" />
                    <line x1="50" y1="47" x2="50" y2="88" stroke="#111" strokeWidth="2.5" />
                    <line x1="50" y1="60" x2="32" y2="78" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="50" y1="60" x2="70" y2="72" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <rect x="65" y="64" width="10" height="18" rx="2" fill="none" stroke="#111" strokeWidth="1.5" />
                    <line x1="50" y1="88" x2="38" y2="118" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="50" y1="88" x2="62" y2="118" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              /* 5 — wide pill (coral) — person waving */
              {
                bg: '#FF6B6B',
                width: 'w-40 sm:w-48',
                height: 'h-44 sm:h-52',
                radius: 'rounded-[40%_40%_40%_40%/50%_50%_50%_50%]',
                svg: (
                  <svg viewBox="0 0 110 120" className="w-28 sm:w-32 mt-4">
                    <circle cx="55" cy="30" r="15" fill="none" stroke="#111" strokeWidth="2.5" />
                    <path d="M43 26 Q48 16 55 15 Q62 16 67 26" fill="#111" />
                    <circle cx="49" cy="30" r="1.5" fill="#111" />
                    <circle cx="61" cy="30" r="1.5" fill="#111" />
                    <path d="M51 36 Q55 39 59 36" fill="none" stroke="#111" strokeWidth="1.5" />
                    <line x1="55" y1="45" x2="55" y2="82" stroke="#111" strokeWidth="2.5" />
                    <line x1="55" y1="56" x2="35" y2="72" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="55" y1="56" x2="78" y2="48" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="78" y1="48" x2="82" y2="36" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="55" y1="82" x2="42" y2="108" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="55" y1="82" x2="68" y2="108" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              /* 6 — arch (orange) — studious person */
              {
                bg: '#FB923C',
                width: 'w-36 sm:w-44',
                height: 'h-52 sm:h-60',
                radius: 'rounded-[50%_50%_15%_15%]',
                svg: (
                  <svg viewBox="0 0 100 140" className="w-24 sm:w-28 mt-6">
                    <circle cx="50" cy="35" r="16" fill="none" stroke="#111" strokeWidth="2.5" />
                    <path d="M36 32 Q38 20 50 17 Q62 20 64 32" fill="#111" />
                    <path d="M34 35 L66 35" stroke="#111" strokeWidth="1" />
                    <circle cx="44" cy="36" r="1.5" fill="#111" />
                    <circle cx="56" cy="36" r="1.5" fill="#111" />
                    <path d="M46 42 Q50 45 54 42" fill="none" stroke="#111" strokeWidth="1.5" />
                    <line x1="50" y1="51" x2="50" y2="95" stroke="#111" strokeWidth="2.5" />
                    <line x1="50" y1="62" x2="30" y2="78" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="50" y1="62" x2="70" y2="78" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <rect x="25" y="76" width="20" height="14" rx="1.5" fill="none" stroke="#111" strokeWidth="1.5" />
                    <line x1="29" y1="80" x2="41" y2="80" stroke="#111" strokeWidth="1" />
                    <line x1="29" y1="83" x2="38" y2="83" stroke="#111" strokeWidth="1" />
                    <line x1="29" y1="86" x2="41" y2="86" stroke="#111" strokeWidth="1" />
                    <line x1="50" y1="95" x2="36" y2="125" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="50" y1="95" x2="64" y2="125" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                ),
              },
            ];
            const card = cards[i % 7];
            return (
              <div
                key={i}
                className={`flex-shrink-0 mx-3 ${card.width} ${card.height} ${card.radius} border-[3px] border-[#111] flex items-center justify-center overflow-hidden`}
                style={{ backgroundColor: card.bg, boxShadow: '3px 3px 0px #111' }}
              >
                {card.svg}
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════ CURVED DIVIDER ══════════ */}
      <div className="relative h-16 sm:h-24 -mb-1">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          <path
            d="M0,40 Q360,80 720,40 T1440,40 L1440,80 L0,80 Z"
            fill="#FF6B6B"
          />
        </svg>
      </div>
      <div className="h-6 bg-[#FF6B6B]" />

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section
        id="how-it-works"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FDEBD3]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="lg:sticky lg:top-32">
              <h2 className="text-5xl sm:text-6xl font-black leading-tight">
                How it
                <br />
                works ?
              </h2>
            </div>

            <div className="space-y-6">
              {[
                {
                  bg: 'bg-[#00D09C]',
                  title: 'Verify Your Identity',
                  desc: 'Login with your IIT Madras BS email. OTP verified. Takes 2 minutes. No drama.',
                },
                {
                  bg: 'bg-[#B794F6]',
                  title: 'Get Matched Instantly',
                  desc: 'Our matching engine pairs you with another verified student. See someone who matches your study vibe? Start chatting.',
                },
                {
                  bg: 'bg-[#FF6B6B]',
                  title: 'Study Together',
                  desc: 'Chat via text or video. Discuss assignments, prep for exams, share notes. The real study partner experience.',
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className={`${step.bg} rounded-2xl border-[3px] border-[#111] shadow-[5px_5px_0px_#111] p-8`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-white/30 rounded-full w-10 h-10 flex items-center justify-center text-lg font-black">
                      {i + 1}
                    </span>
                    <h3 className="text-2xl font-black">{step.title}</h3>
                  </div>
                  <p className="text-[#111]/80 text-base leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ STATS ══════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { value: '500+', label: 'Verified Students', bg: 'bg-white' },
            {
              value: '10K+',
              label: 'Study Sessions',
              bg: 'bg-[#00D09C]',
              light: true,
            },
            { value: '50+', label: 'Course Topics', bg: 'bg-white' },
          ].map((stat, i) => (
            <div
              key={i}
              className={`${stat.bg} rounded-2xl border-[3px] border-[#111] shadow-[4px_4px_0px_#111] p-8 text-center`}
            >
              <p
                className={`text-5xl font-black ${stat.light ? 'text-white' : ''}`}
              >
                {stat.value}
              </p>
              <p
                className={`text-sm font-semibold mt-1 ${stat.light ? 'text-white/80' : 'text-[#555]'}`}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              Not Just Random Chat.
              <br />
              <span className="text-[#00D09C]">Smart Study Connect.</span>
            </h2>
            <p className="text-[#555] text-lg max-w-xl mx-auto">
              Unlike Omegle, we built this for education — with safety as the
              core.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: BookOpen,
                title: 'Topic-Based Matching',
                desc: 'Match with students studying the same subject, assignment, or exam.',
                badge: 'Pro',
                color: 'bg-[#00D09C]',
              },
              {
                icon: Video,
                title: 'Secure Video Chat',
                desc: 'WebRTC video with background blur. No recording allowed.',
                badge: 'Pro',
                color: 'bg-[#B794F6]',
              },
              {
                icon: Shield,
                title: 'AI Moderation',
                desc: 'Real-time toxicity detection and automatic content filtering.',
                badge: 'Built-in',
                color: 'bg-[#FF6B6B]',
              },
              {
                icon: Lock,
                title: 'Zero Data Storage',
                desc: 'Chat content is never stored. Only session metadata for safety.',
                badge: 'Privacy',
                color: 'bg-[#FB923C]',
              },
              {
                icon: Users,
                title: 'Verified Students Only',
                desc: 'Email OTP verification ensures only real IIT Madras BS students.',
                badge: 'Safety',
                color: 'bg-[#00D09C]',
              },
              {
                icon: Sparkles,
                title: 'Smart Queue',
                desc: 'Priority matching for paid users. Course & level filters.',
                badge: 'Premium',
                color: 'bg-[#B794F6]',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border-[3px] border-[#111] shadow-[4px_4px_0px_#111] p-6 hover:shadow-[2px_2px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`${f.color} h-12 w-12 rounded-xl border-[2px] border-[#111] flex items-center justify-center`}
                  >
                    <f.icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="rounded-full border-[2px] border-[#111] bg-[#FDEBD3] px-3 py-0.5 text-xs font-bold">
                    {f.badge}
                  </span>
                </div>
                <h3 className="text-lg font-black mb-2">{f.title}</h3>
                <p className="text-sm text-[#555] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FREE FOR NOW ══════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              <span className="text-[#00D09C]">Free</span> For Everyone
            </h2>
            <p className="text-[#555] text-lg">
              For now, every feature is available to all users at no cost.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl border-[3px] border-[#111] bg-white shadow-[4px_4px_0px_#111] p-8 text-center">
              <p className="text-lg text-[#111] font-semibold">
                Pricing is currently disabled.
              </p>
              <p className="text-[#555] mt-2">
                Enjoy the full Gen-Z IITian Connect experience free for everyone for now.
              </p>
              <Link
                href="/auth/login"
                className="inline-block mt-6 rounded-xl py-2.5 px-6 text-sm font-bold border-[2px] border-[#111] bg-[#FDEBD3] shadow-[3px_3px_0px_#111] transition-all hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ CTA GREEN BAR ══════════ */}
      <section className="mx-4 sm:mx-6 lg:mx-8 mb-12">
        <div className="max-w-7xl mx-auto bg-[#00D09C] rounded-2xl border-[3px] border-[#111] shadow-[6px_6px_0px_#111] p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Let&apos;s connect you with
            <br className="hidden sm:block" /> your study partners
          </h2>
          <Link
            href="/auth/login"
            className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-4 bg-white text-[#111] text-lg font-bold rounded-xl border-[3px] border-[#111] shadow-[4px_4px_0px_#111] hover:shadow-[2px_2px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Start Connecting →
          </Link>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#FB923C] rounded-2xl border-[3px] border-[#111] shadow-[6px_6px_0px_#111] p-8 sm:p-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-5">
              {[
                {
                  q: 'Is my identity really anonymous?',
                  a: 'Yes. Your real name and email are never shown to other students. You get a random alias.',
                },
                {
                  q: 'Who can use this platform?',
                  a: 'Only verified IIT Madras BS students with a valid university email.',
                },
                {
                  q: 'Is video chat safe?',
                  a: 'Yes. WebRTC peer-to-peer encryption. No content is recorded or stored on our servers.',
                },
                {
                  q: 'Can I report someone?',
                  a: 'Absolutely. One-click reporting with our AI moderation system. Violations = permanent ban.',
                },
                {
                  q: 'Is this like Omegle?',
                  a: 'Built for education, not random chat. Verified users, topic matching, and Indian compliance built-in.',
                },
                {
                  q: 'What about my data privacy?',
                  a: 'Fully compliant with DPDP Act 2023, IT Act 2000, and IT Rules 2021. Your data, your control.',
                },
              ].map((item, i) => (
                <div key={i}>
                  <p className="font-black text-lg flex items-start gap-2">
                    <span className="bg-[#111] text-[#FB923C] rounded-full w-7 h-7 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{item.q}</span>
                  </p>
                  <p className="ml-9 mt-1 text-[#111]/80 leading-relaxed">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ COMPLIANCE ══════════ */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl border-[3px] border-[#111] shadow-[5px_5px_0px_#111] p-8 sm:p-12">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1">
                <h2 className="text-3xl font-black mb-4">
                  Built for{' '}
                  <span className="text-[#00D09C]">Indian Compliance</span>
                </h2>
                <p className="text-[#555] leading-relaxed mb-6">
                  Unlike platforms that failed in India, GenZ IITian Connect is
                  designed from the ground up to comply with Indian data
                  protection and intermediary guidelines.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'IT Act 2000',
                    'IT Rules 2021 (Intermediary Guidelines)',
                    'DPDP Act 2023',
                    'Grievance Officer Appointed',
                    'Data Minimization',
                    'Consent-Based Onboarding',
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 text-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 text-[#00D09C] flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="rounded-2xl border-[3px] border-[#111] bg-[#00D09C]/10 p-8 text-center shadow-[4px_4px_0px_#111]">
                  <Shield className="h-16 w-16 text-[#00D09C] mx-auto mb-4" />
                  <p className="text-xl font-black text-[#00D09C]">
                    Privacy First
                  </p>
                  <p className="text-sm text-[#555] mt-1">
                    Your data, your control
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
