// ============================================================
// Sign in — OTP + Google (per mockup)
// ============================================================
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AlertCircle, Loader2, Lock, ArrowRight } from 'lucide-react';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 24;

export default function LoginPage() {
  const router = useRouter();
  const { sendOtp, verifyOtp, loginWithGoogle, isAuthenticated, user, isLoading } = useAuth();

  const [stage, setStage] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push(user.profileComplete ? '/dashboard' : '/auth/complete-profile');
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.includes('@')) {
      setError('Enter a valid email.');
      return;
    }
    setSending(true);
    try {
      await sendOtp(email.trim());
      setStage('otp');
      setResendIn(RESEND_SECONDS);
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code.');
    }
    setSending(false);
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setError('');
    try {
      await sendOtp(email.trim());
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend.');
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    setCode((prev) => {
      const next = [...prev];
      next[i] = digit;
      return next;
    });
    if (digit && i < OTP_LENGTH - 1) inputsRef.current[i + 1]?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputsRef.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setCode(next);
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const token = code.join('');
    if (token.length !== OTP_LENGTH) {
      setError(`Enter the full ${OTP_LENGTH}-digit code.`);
      return;
    }
    setVerifying(true);
    try {
      await verifyOtp(email.trim(), token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code.');
      setVerifying(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await loginWithGoogle();
    } catch {
      setError('Google sign-in failed.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10 bb-grid">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* LEFT — copy & illustration */}
        <div className="hidden lg:block">
          <h1 className="text-5xl font-black text-[#111] leading-tight mb-3">
            Welcome back,
            <br />
            <span className="text-[#00D09C]">anon.</span>
          </h1>
          <p className="text-[#555] text-sm font-medium mb-2 max-w-md">
            <span className="font-black text-[#111]">Social media built for BS Degree students.</span>
          </p>
          <p className="text-[#555] text-sm font-medium mb-8 max-w-md">
            Sign in with your student email. We&apos;ll send you a 6-digit code. We never see your real identity in chat.
          </p>
          <div className="flex gap-4">
            <Stick color="#B794F6" />
            <Stick color="#00D09C" />
            <Stick color="#FB923C" />
          </div>
        </div>

        {/* RIGHT — form card */}
        <div className="w-full max-w-md mx-auto">
          {/* mobile header */}
          <div className="lg:hidden text-center mb-6">
            <h1 className="text-3xl font-black text-[#111] leading-tight">
              Welcome back,
              <br />
              <span className="text-[#00D09C]">anon.</span>
            </h1>
            <p className="text-xs text-[#555] mt-2">Social media for BS Degree students. We&apos;ll send a code to your student email.</p>
          </div>

          <div className="bb-card bg-white p-6 sm:p-7">
            {/* Lock icon header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00D09C] border-[2px] border-[#111] shadow-[3px_3px_0px_#111]">
                <Lock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#111]">Sign in to Connect</h2>
                <p className="text-[10px] text-[#888] font-bold">Anonymous by default. Always.</p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-[#FF3B3B]/10 border-[2px] border-[#FF3B3B]/30 px-3 py-2 mb-4 text-xs text-[#FF3B3B] font-medium">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {stage === 'email' ? (
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-[#111] mb-1.5 uppercase tracking-wide">
                    Student email
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="arjun.k@ds.study.iitm.ac.in"
                    className="w-full rounded-xl border-[2px] border-[#111] px-3 py-3 text-sm font-medium focus:outline-none focus:bg-[#FDEBD3] shadow-[3px_3px_0px_#111]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border-[2px] border-[#111] bg-[#00D09C] py-3 text-sm font-bold text-white hover:bg-[#00B084] shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <>
                      Send 6-digit code <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <p className="text-[10px] font-bold text-[#888] uppercase tracking-wide">
                  OTP — sent to <span className="text-[#111]">{email}</span>
                </p>
                <div className="flex gap-1.5 sm:gap-2 justify-between">
                  {code.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputsRef.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKey(i, e)}
                      onPaste={handleOtpPaste}
                      className={`w-10 h-12 sm:w-12 sm:h-14 rounded-xl border-[2px] border-[#111] text-center text-xl font-black focus:outline-none shadow-[3px_3px_0px_#111] ${
                        d ? 'bg-[#00D09C] text-white' : 'bg-white text-[#111] focus:bg-[#FDEBD3]'
                      }`}
                    />
                  ))}
                </div>

                <div className="text-center text-[10px] font-bold">
                  {resendIn > 0 ? (
                    <span className="text-[#888]">
                      Didn&apos;t get it? <span className="text-[#00D09C]">Resend in {resendIn}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-[#00D09C] underline"
                    >
                      Resend code
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border-[2px] border-[#111] bg-[#00D09C] py-3 text-sm font-bold text-white hover:bg-[#00B084] shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                >
                  {verifying || isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Verify & Continue <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStage('email');
                    setCode(Array(OTP_LENGTH).fill(''));
                    setError('');
                  }}
                  className="w-full text-center text-[10px] font-bold text-[#888] hover:text-[#111] underline"
                >
                  ← Use a different email
                </button>
              </form>
            )}

            {/* OR + Google */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#ddd]" />
              <span className="text-[9px] font-black text-[#888] tracking-widest">OR</span>
              <div className="h-px flex-1 bg-[#ddd]" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 rounded-xl border-[2px] border-[#111] py-3 text-sm font-bold text-[#111] hover:bg-[#FDEBD3] shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <p className="mt-5 text-center text-[10px] text-[#888] font-medium leading-relaxed">
              By continuing you agree to our{' '}
              <Link href="/legal/terms" className="text-[#00D09C] underline font-bold">
                Community Guidelines
              </Link>{' '}
              and{' '}
              <Link href="/legal/privacy" className="text-[#00D09C] underline font-bold">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stick({ color }: { color: string }) {
  return (
    <div
      className="h-32 w-28 rounded-3xl border-[3px] border-[#111] shadow-[4px_4px_0px_#111] flex items-center justify-center"
      style={{ backgroundColor: color }}
    >
      <svg viewBox="0 0 40 60" className="w-12 h-20">
        <circle cx="20" cy="12" r="6" fill="none" stroke="#111" strokeWidth="2" />
        <line x1="20" y1="18" x2="20" y2="40" stroke="#111" strokeWidth="2" />
        <line x1="20" y1="24" x2="10" y2="32" stroke="#111" strokeWidth="2" />
        <line x1="20" y1="24" x2="30" y2="32" stroke="#111" strokeWidth="2" />
        <line x1="20" y1="40" x2="12" y2="55" stroke="#111" strokeWidth="2" />
        <line x1="20" y1="40" x2="28" y2="55" stroke="#111" strokeWidth="2" />
      </svg>
    </div>
  );
}
