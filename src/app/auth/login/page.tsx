// ============================================================
// Login Page — GenZ IITian Connect
// ============================================================
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { isIITMEmail } from '@/lib/utils';
import {
  Mail,
  Lock,
  ArrowRight,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, sendOtp, isLoading } = useAuth();

  const [step, setStep] = useState<'email' | 'otp' | 'consent'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);

  const handleSendOtp = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setError('');
    try {
      await sendOtp(email);
      setOtpSent(true);
      setStep('otp');
    } catch {
      setError('Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      setError('Please enter a valid OTP');
      return;
    }
    setStep('consent');
    setError('');
  };

  const handleFinalLogin = async () => {
    if (!ageConfirmed) {
      setError('Age confirmation is required');
      return;
    }
    if (!consentGiven) {
      setError('Data processing consent is required under DPDP Act');
      return;
    }
    if (!rulesAccepted) {
      setError('You must accept community rules');
      return;
    }
    setError('');
    try {
      await login(email, otp);
      router.push('/dashboard');
    } catch {
      setError('Login failed. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      setStep('consent');
      setEmail('student@ds.study.iitm.ac.in');
    } catch {
      setError('Google login failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      {/* Background grid */}
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-30" />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-1 mb-4">
            <span className="text-2xl font-black text-white">Gen-Z</span>
            <span className="text-2xl font-black text-brand-red">IITian</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-2">
            {step === 'email' && 'Welcome Back'}
            {step === 'otp' && 'Verify Your Email'}
            {step === 'consent' && 'Almost There!'}
          </h1>
          <p className="text-brand-text-secondary text-sm">
            {step === 'email' && 'Login with your IIT Madras BS email'}
            {step === 'otp' && `Enter the OTP sent to ${email}`}
            {step === 'consent' && 'Complete these required steps to proceed'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border-2 border-brand-border bg-brand-card p-6 sm:p-8">
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {['email', 'otp', 'consent'].map((s, i) => (
              <React.Fragment key={s}>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    step === s
                      ? 'bg-brand-accent text-white'
                      : i < ['email', 'otp', 'consent'].indexOf(step)
                      ? 'bg-brand-success text-white'
                      : 'bg-brand-bg text-brand-text-muted border border-brand-border'
                  }`}
                >
                  {i < ['email', 'otp', 'consent'].indexOf(step) ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 2 && (
                  <div
                    className={`h-0.5 w-8 transition-colors ${
                      i < ['email', 'otp', 'consent'].indexOf(step)
                        ? 'bg-brand-success'
                        : 'bg-brand-border'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-brand-danger/10 border border-brand-danger/20 px-4 py-3 mb-6 text-sm text-brand-danger animate-slide-down">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Step 1: Email */}
          {step === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@ds.study.iitm.ac.in"
                    className="w-full rounded-lg border border-brand-border bg-brand-bg pl-10 pr-4 py-3 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none transition-colors"
                  />
                </div>
                {email && isIITMEmail(email) && (
                  <p className="mt-1.5 text-xs text-brand-success flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> IIT Madras email detected
                  </p>
                )}
              </div>

              <button
                onClick={handleSendOtp}
                disabled={isLoading || !email}
                className="w-full glow-btn flex items-center justify-center gap-2 rounded-lg bg-brand-accent py-3 text-sm font-semibold text-white hover:bg-brand-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-brand-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-brand-card px-3 text-xs text-brand-text-muted">
                    OR
                  </span>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-brand-border py-3 text-sm font-medium text-brand-text-secondary hover:text-brand-text-primary hover:border-brand-accent/50 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>
            </div>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                  One-Time Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-muted" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="w-full rounded-lg border border-brand-border bg-brand-bg pl-10 pr-4 py-3 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none transition-colors tracking-widest text-center text-lg font-mono"
                  />
                </div>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={isLoading || otp.length < 4}
                className="w-full glow-btn flex items-center justify-center gap-2 rounded-lg bg-brand-accent py-3 text-sm font-semibold text-white hover:bg-brand-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Verify OTP
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <button
                onClick={() => setStep('email')}
                className="w-full text-center text-sm text-brand-text-muted hover:text-brand-text-secondary transition-colors"
              >
                ← Back to email
              </button>
            </div>
          )}

          {/* Step 3: Consent (DPDP Compliance) */}
          {step === 'consent' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-brand-border bg-brand-bg p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-brand-accent" />
                  Required Consents (Indian Law)
                </h3>

                {/* Age Verification */}
                <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-brand-card/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={ageConfirmed}
                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-brand-border bg-brand-bg text-brand-accent focus:ring-brand-accent"
                  />
                  <div>
                    <p className="text-sm font-medium">Age Verification</p>
                    <p className="text-xs text-brand-text-muted mt-0.5">
                      I confirm that I am 18 years or older, or I have parental/guardian
                      consent to use this platform.
                    </p>
                  </div>
                </label>

                {/* DPDP Consent */}
                <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-brand-card/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-brand-border bg-brand-bg text-brand-accent focus:ring-brand-accent"
                  />
                  <div>
                    <p className="text-sm font-medium">Data Processing Consent</p>
                    <p className="text-xs text-brand-text-muted mt-0.5">
                      I consent to the processing of my personal data as described in
                      the{' '}
                      <Link
                        href="/legal/privacy"
                        className="text-brand-accent underline"
                      >
                        Privacy Policy
                      </Link>
                      , in compliance with the Digital Personal Data Protection Act
                      2023.
                    </p>
                  </div>
                </label>

                {/* Community Rules */}
                <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-brand-card/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={rulesAccepted}
                    onChange={(e) => setRulesAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-brand-border bg-brand-bg text-brand-accent focus:ring-brand-accent"
                  />
                  <div>
                    <p className="text-sm font-medium">Community Rules</p>
                    <p className="text-xs text-brand-text-muted mt-0.5">
                      I agree to the{' '}
                      <Link
                        href="/legal/terms"
                        className="text-brand-accent underline"
                      >
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link
                        href="/legal/guidelines"
                        className="text-brand-accent underline"
                      >
                        Community Guidelines
                      </Link>
                      . Violations will result in permanent ban.
                    </p>
                  </div>
                </label>
              </div>

              <button
                onClick={handleFinalLogin}
                disabled={isLoading || !ageConfirmed || !consentGiven || !rulesAccepted}
                className="w-full glow-btn flex items-center justify-center gap-2 rounded-lg bg-brand-accent py-3 text-sm font-semibold text-white hover:bg-brand-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Complete Setup & Enter
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Bottom note */}
        <p className="text-center text-xs text-brand-text-muted mt-6">
          Your data is protected under the DPDP Act 2023.
          <br />
          We never store chat content. Read our{' '}
          <Link href="/legal/privacy" className="text-brand-accent underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
