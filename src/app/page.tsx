// ============================================================
// Landing Page — GenZ IITian Connect
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
  ArrowRight,
  CheckCircle2,
  Star,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { PLANS } from '@/lib/constants';
import { formatINR } from '@/lib/utils';

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* ═══════════════════════════════════════════
          HERO — Split: Copy left + SVG Animation right
         ═══════════════════════════════════════════ */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left — Copy */}
          <div className="max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-accent/10 px-4 py-1.5 text-sm text-brand-accent mb-6 animate-fade-in">
              <Shield className="h-4 w-4" />
              Verified &bull; Anonymous &bull; Safe
            </div>

            {/* Pain point heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-5">
              <span className="text-white">Online Degree</span>
              <br />
              <span className="text-white">feels </span>
              <span className="text-brand-text-muted line-through decoration-brand-danger/60 decoration-[3px]">lonely?</span>
              <br />
              <span className="gradient-text">We fixed that.</span>
            </h1>

            {/* Short, punchy subtitle */}
            <p className="text-base sm:text-lg text-brand-text-secondary leading-relaxed mb-8 max-w-md">
              As an IIT Madras BS student, your campus is your screen.
              No corridors, no canteen hangouts.
              <span className="text-white font-semibold"> We built the campus you never had</span> &mdash; connect
              with verified peers anonymously, right now.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-start gap-3 mb-10">
              <Link
                href="/auth/login"
                className="glow-btn group flex items-center gap-2 rounded-full bg-brand-accent px-7 py-3.5 text-base font-bold text-white hover:bg-brand-accent-hover transition-all"
              >
                Start Connecting
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/plans"
                className="flex items-center gap-2 rounded-full border-2 border-white/15 bg-white/5 px-7 py-3.5 text-base font-bold text-white hover:border-white/30 transition-colors"
              >
                View Plans
              </Link>
            </div>

            {/* Micro trust markers */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-brand-text-muted">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-accent" />
                DPDP Act 2023
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-brand-accent" />
                Zero data stored
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-brand-accent" />
                Verified students only
              </span>
            </div>
          </div>

          {/* Right — SVG Connection Animation */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-lg">
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-full bg-brand-accent/5 blur-3xl scale-110" />

              <svg
                viewBox="0 0 500 500"
                className="w-full h-auto relative z-10"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Background circle */}
                <circle cx="250" cy="250" r="200" fill="none" stroke="#1C2A3A" strokeWidth="1" opacity="0.5" />
                <circle cx="250" cy="250" r="150" fill="none" stroke="#1C2A3A" strokeWidth="1" opacity="0.3" />
                <circle cx="250" cy="250" r="100" fill="none" stroke="#1C2A3A" strokeWidth="1" opacity="0.2" />

                {/* Center node — You */}
                <circle cx="250" cy="250" r="36" fill="#0F1629" stroke="#00D09C" strokeWidth="2.5">
                  <animate attributeName="r" values="36;38;36" dur="3s" repeatCount="indefinite" />
                </circle>
                <text x="250" y="255" textAnchor="middle" fill="#00D09C" fontSize="13" fontWeight="800" fontFamily="Inter, sans-serif">YOU</text>

                {/* Peer 1 — Top */}
                <circle cx="250" cy="80" r="24" fill="#0F1629" stroke="#8B9DC3" strokeWidth="1.5" opacity="0.9">
                  <animate attributeName="opacity" values="0.5;1;0.5" dur="4s" repeatCount="indefinite" />
                </circle>
                <text x="250" y="84" textAnchor="middle" fill="#8B9DC3" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">Peer</text>

                {/* Peer 2 — Top Right */}
                <circle cx="400" cy="150" r="24" fill="#0F1629" stroke="#8B9DC3" strokeWidth="1.5">
                  <animate attributeName="opacity" values="0.7;1;0.7" dur="3.5s" repeatCount="indefinite" />
                </circle>
                <text x="400" y="154" textAnchor="middle" fill="#8B9DC3" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">Peer</text>

                {/* Peer 3 — Right */}
                <circle cx="420" cy="300" r="24" fill="#0F1629" stroke="#8B9DC3" strokeWidth="1.5">
                  <animate attributeName="opacity" values="0.6;1;0.6" dur="5s" repeatCount="indefinite" />
                </circle>
                <text x="420" y="304" textAnchor="middle" fill="#8B9DC3" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">Peer</text>

                {/* Peer 4 — Bottom */}
                <circle cx="300" cy="420" r="24" fill="#0F1629" stroke="#8B9DC3" strokeWidth="1.5">
                  <animate attributeName="opacity" values="0.8;1;0.8" dur="4.2s" repeatCount="indefinite" />
                </circle>
                <text x="300" y="424" textAnchor="middle" fill="#8B9DC3" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">Peer</text>

                {/* Peer 5 — Bottom Left */}
                <circle cx="120" cy="380" r="24" fill="#0F1629" stroke="#8B9DC3" strokeWidth="1.5">
                  <animate attributeName="opacity" values="0.5;1;0.5" dur="3.8s" repeatCount="indefinite" />
                </circle>
                <text x="120" y="384" textAnchor="middle" fill="#8B9DC3" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">Peer</text>

                {/* Peer 6 — Left */}
                <circle cx="80" cy="210" r="24" fill="#0F1629" stroke="#8B9DC3" strokeWidth="1.5">
                  <animate attributeName="opacity" values="0.7;1;0.7" dur="4.5s" repeatCount="indefinite" />
                </circle>
                <text x="80" y="214" textAnchor="middle" fill="#8B9DC3" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">Peer</text>

                {/* Connection lines — animated dashes */}
                {/* Active connection (green) */}
                <line x1="250" y1="214" x2="250" y2="104" stroke="#00D09C" strokeWidth="2" strokeDasharray="6 4" opacity="0.8">
                  <animate attributeName="strokeDashoffset" values="0;-20" dur="1.5s" repeatCount="indefinite" />
                </line>

                {/* Active connection 2 */}
                <line x1="276" y1="232" x2="380" y2="157" stroke="#00D09C" strokeWidth="2" strokeDasharray="6 4" opacity="0.6">
                  <animate attributeName="strokeDashoffset" values="0;-20" dur="2s" repeatCount="indefinite" />
                </line>

                {/* Searching connections (dim) */}
                <line x1="278" y1="262" x2="398" y2="293" stroke="#1C2A3A" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.5">
                  <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3s" repeatCount="indefinite" />
                </line>
                <line x1="264" y1="282" x2="290" y2="400" stroke="#1C2A3A" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.4">
                  <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2.5s" repeatCount="indefinite" />
                </line>
                <line x1="228" y1="272" x2="132" y2="364" stroke="#1C2A3A" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.3">
                  <animate attributeName="opacity" values="0.2;0.5;0.2" dur="4s" repeatCount="indefinite" />
                </line>
                <line x1="218" y1="242" x2="102" y2="216" stroke="#1C2A3A" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.4">
                  <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3.5s" repeatCount="indefinite" />
                </line>

                {/* Data packet dots traveling on active lines */}
                <circle r="3" fill="#00D09C">
                  <animateMotion dur="2s" repeatCount="indefinite" path="M250,214 L250,104" />
                </circle>
                <circle r="3" fill="#00D09C" opacity="0.7">
                  <animateMotion dur="2.5s" repeatCount="indefinite" path="M276,232 L380,157" />
                </circle>

                {/* Pulse rings on center */}
                <circle cx="250" cy="250" r="36" fill="none" stroke="#00D09C" strokeWidth="1" opacity="0">
                  <animate attributeName="r" values="36;70" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0" dur="2.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="250" cy="250" r="36" fill="none" stroke="#00D09C" strokeWidth="1" opacity="0">
                  <animate attributeName="r" values="36;70" dur="2.5s" begin="1.25s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0" dur="2.5s" begin="1.25s" repeatCount="indefinite" />
                </circle>

                {/* Labels */}
                <text x="250" y="290" textAnchor="middle" fill="#4A5F80" fontSize="9" fontFamily="Inter, sans-serif">MATCHING...</text>

                {/* "Connected" badge near active line */}
                <rect x="218" y="140" width="65" height="20" rx="10" fill="#00D09C" opacity="0.15" />
                <text x="250" y="153" textAnchor="middle" fill="#00D09C" fontSize="8" fontWeight="700" fontFamily="Inter, sans-serif">
                  CONNECTED
                </text>
              </svg>

              {/* Floating status cards around the SVG */}
              <div className="absolute top-6 left-0 rounded-xl border border-brand-border bg-brand-card/90 backdrop-blur px-3 py-2 animate-fade-in hidden sm:block">
                <p className="text-[11px] text-brand-text-muted">Students Online</p>
                <p className="text-lg font-black text-brand-accent">127</p>
              </div>

              <div className="absolute bottom-10 right-0 rounded-xl border border-brand-border bg-brand-card/90 backdrop-blur px-3 py-2 animate-fade-in hidden sm:block" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-brand-accent animate-pulse" />
                  <p className="text-[11px] text-brand-accent font-semibold">Live matching</p>
                </div>
              </div>

              <div className="absolute bottom-4 left-8 rounded-xl border border-brand-border bg-brand-card/90 backdrop-blur px-3 py-2 animate-fade-in hidden sm:block" style={{ animationDelay: '0.6s' }}>
                <p className="text-[11px] text-brand-text-muted">Avg match time</p>
                <p className="text-sm font-black text-white">~4 sec</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
          <div className="rounded-2xl border-2 border-brand-border bg-brand-card p-6 text-center hover:border-brand-accent/30 transition-colors">
            <p className="text-4xl sm:text-5xl font-black text-white mb-1">500+</p>
            <p className="text-sm font-medium text-brand-text-secondary">Verified Students</p>
          </div>
          <div className="rounded-2xl bg-brand-accent p-6 text-center">
            <p className="text-4xl sm:text-5xl font-black text-white mb-1">10K+</p>
            <p className="text-sm font-medium text-white/80">Study Sessions</p>
          </div>
          <div className="rounded-2xl border-2 border-brand-border bg-brand-card p-6 text-center hover:border-brand-accent/30 transition-colors">
            <p className="text-4xl sm:text-5xl font-black text-white mb-1">50+</p>
            <p className="text-sm font-medium text-brand-text-secondary">Course Topics</p>
          </div>
        </div>
      </section>

      {/* Feature Bento — Two cards side by side like website */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Green accent card */}
          <div className="accent-card rounded-3xl p-8 sm:p-10">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
              Experience the Powerful<br />and Best Ecosystem
            </h2>
            <p className="text-white/80 text-base mb-8 max-w-md">
              See how our platform simplifies anonymous study connections and
              helps you ace your exams with ease.
            </p>
            <div className="flex flex-wrap gap-3">
              {['Text Chat', 'Video Connect', 'Topic Matching', 'Safe & Private'].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border-2 border-white/30 bg-white px-4 py-2 text-sm font-semibold text-brand-accent-dim"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Dark grid card */}
          <div className="dark-grid-card rounded-3xl p-8 sm:p-10 flex flex-col justify-center">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
              Personally connecting<br />India&apos;s next top engineers
            </h2>
            <p className="text-brand-text-secondary text-base max-w-md">
              Taking you from basics to advanced through peer learning,
              collaborative study sessions, and real-world problem solving.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative border-t border-brand-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-white">
              How <span className="gradient-text">Study Connect</span> Works
            </h2>
            <p className="text-brand-text-secondary max-w-xl mx-auto">
              Safe, verified, and anonymous. Built for focused learning.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                step: '01',
                icon: GraduationCap,
                title: 'Verify Identity',
                desc: 'Login with your IIT Madras BS email. OTP verified.',
              },
              {
                step: '02',
                icon: Shield,
                title: 'Accept Rules',
                desc: 'Agree to community guidelines & privacy consent.',
              },
              {
                step: '03',
                icon: Users,
                title: 'Get Matched',
                desc: 'Our engine pairs you with another verified student.',
              },
              {
                step: '04',
                icon: MessageSquare,
                title: 'Study Together',
                desc: 'Chat via text or video. Discuss, learn, grow.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border-2 border-brand-border bg-brand-card p-6 hover:border-brand-accent/40 transition-all group"
              >
                <div className="text-xs font-mono text-brand-accent mb-4 font-bold">
                  STEP {item.step}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-accent/10 mb-4 group-hover:bg-brand-accent/20 transition-colors">
                  <item.icon className="h-6 w-6 text-brand-accent" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-brand-text-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative border-t border-brand-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-white">
              Not Just Random Chat. <span className="gradient-text">Smart Study Connect.</span>
            </h2>
            <p className="text-brand-text-secondary max-w-xl mx-auto">
              Unlike Omegle, we built this for education &mdash; with safety as the core.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: BookOpen,
                title: 'Topic-Based Matching',
                desc: 'Match with students studying the same subject, assignment, or exam.',
                badge: 'Pro',
              },
              {
                icon: Video,
                title: 'Secure Video Chat',
                desc: 'WebRTC video with background blur. No recording allowed.',
                badge: 'Pro',
              },
              {
                icon: Shield,
                title: 'AI Moderation',
                desc: 'Real-time toxicity detection and automatic content filtering.',
                badge: 'Built-in',
              },
              {
                icon: Lock,
                title: 'Zero Data Storage',
                desc: 'Chat content is never stored. Only session metadata for safety.',
                badge: 'Privacy',
              },
              {
                icon: Users,
                title: 'Verified Students Only',
                desc: 'Email OTP verification ensures only real IIT Madras BS students.',
                badge: 'Safety',
              },
              {
                icon: Sparkles,
                title: 'Smart Queue',
                desc: 'Priority matching for paid users. Course & level filters.',
                badge: 'Premium',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border-2 border-brand-border bg-brand-card p-6 hover:border-brand-accent/40 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent/10 group-hover:bg-brand-accent/20 transition-colors">
                    <feature.icon className="h-5 w-5 text-brand-accent" />
                  </div>
                  <span className="rounded-full border border-brand-accent/30 bg-brand-accent/10 px-3 py-0.5 text-xs font-semibold text-brand-accent">
                    {feature.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-brand-text-muted leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="relative border-t border-brand-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-white">
              Simple, <span className="gradient-text">Student-Friendly</span> Pricing
            </h2>
            <p className="text-brand-text-secondary">
              Start free. Upgrade when you&apos;re ready.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl border-2 p-6 transition-all ${
                  plan.highlighted
                    ? 'border-brand-accent bg-brand-accent/5 ring-1 ring-brand-accent/20 scale-[1.02]'
                    : 'border-brand-border bg-brand-card hover:border-brand-accent/30'
                }`}
              >
                {plan.highlighted && (
                  <div className="flex items-center gap-1 text-brand-accent text-xs font-bold mb-3">
                    <Star className="h-3.5 w-3.5 fill-brand-accent" />
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-black text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black text-white">
                    {formatINR(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-brand-text-muted text-sm">
                      /{plan.period}
                    </span>
                  )}
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-brand-text-secondary"
                    >
                      <CheckCircle2 className="h-4 w-4 text-brand-accent mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/login"
                  className={`block text-center rounded-full py-2.5 text-sm font-bold transition-colors ${
                    plan.highlighted
                      ? 'bg-brand-accent text-white hover:bg-brand-accent-hover'
                      : 'border-2 border-brand-border text-brand-text-secondary hover:text-white hover:border-brand-accent/50'
                  }`}
                >
                  {plan.price === 0 ? 'Get Started Free' : 'Choose Plan'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Banner */}
      <section className="relative border-t border-brand-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="rounded-3xl border-2 border-brand-border dark-grid-card p-8 sm:p-12">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">
                  Built for <span className="gradient-text">Indian Compliance</span>
                </h2>
                <p className="text-brand-text-secondary leading-relaxed mb-6">
                  Unlike platforms that failed in India, GenZ IITian Connect is
                  designed from the ground up to comply with Indian data protection
                  and intermediary guidelines.
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
                      className="flex items-center gap-2 text-sm text-brand-text-secondary"
                    >
                      <CheckCircle2 className="h-4 w-4 text-brand-accent flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-2xl border-2 border-brand-accent/30 bg-brand-accent/10 p-8 text-center">
                  <Shield className="h-16 w-16 text-brand-accent mx-auto mb-4" />
                  <p className="text-lg font-black gradient-text">
                    Privacy First
                  </p>
                  <p className="text-sm text-brand-text-muted mt-1">
                    Your data, your control
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-brand-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Ready to <span className="gradient-text">Connect &amp; Learn?</span>
          </h2>
          <p className="text-brand-text-secondary max-w-xl mx-auto mb-8">
            Join verified IIT Madras BS students. Study smarter, connect safely.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/login"
              className="glow-btn inline-flex items-center gap-2 rounded-full bg-brand-accent px-10 py-4 text-lg font-black text-white hover:bg-brand-accent-hover transition-all"
            >
              Get Started for Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="https://youtube.com"
              target="_blank"
              className="glow-btn-red inline-flex items-center gap-2 rounded-full bg-brand-red px-8 py-4 text-base font-bold text-white hover:bg-brand-red-hover transition-all"
            >
              YouTube
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
