// ============================================================
// Navbar Component — GenZ IITian Connect
// ============================================================
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { APP_NAME } from '@/lib/constants';
import {
  Menu,
  X,
  Zap,
  LogOut,
  User,
  Shield,
  CreditCard,
  ChevronDown,
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-brand-border bg-brand-bg/95 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo — matches website: Gen-Z in white, IITian in red */}
          <Link href="/" className="flex items-center gap-1 group">
            <span className="text-xl font-black text-white tracking-tight">Gen-Z</span>
            <span className="text-xl font-black text-brand-red tracking-tight">IITian</span>
            <span className="text-xs font-medium text-brand-accent ml-1.5 hidden sm:block opacity-70">Connect</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <NavLink href="/dashboard">Dashboard</NavLink>
                <NavLink href="/connect">
                  <span className="flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                    </span>
                    Connect
                  </span>
                </NavLink>
                <NavLink href="/plans">Plans</NavLink>
              </>
            ) : (
              <>
                <NavLink href="/#features">Features</NavLink>
                <NavLink href="/plans">Pricing</NavLink>
                <NavLink href="/legal/privacy">Privacy</NavLink>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 rounded-lg border border-brand-border bg-brand-card px-3 py-2 text-sm hover:border-brand-accent/50 transition-colors"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-accent/20">
                    <User className="h-3.5 w-3.5 text-brand-success" />
                  </div>
                  <span className="hidden sm:block text-brand-text-secondary max-w-[120px] truncate">
                    {user?.displayName || user?.email}
                  </span>
                  <span className="rounded-full bg-brand-accent/15 px-2 py-0.5 text-xs text-brand-accent uppercase font-medium">
                    {user?.planType}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-brand-text-muted" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-brand-border bg-brand-card p-2 shadow-2xl animate-slide-down">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-text-secondary hover:bg-brand-bg hover:text-brand-text-primary transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="h-4 w-4" /> Dashboard
                    </Link>
                    <Link
                      href="/plans"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-text-secondary hover:bg-brand-bg hover:text-brand-text-primary transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <CreditCard className="h-4 w-4" /> Manage Plan
                    </Link>
                    <Link
                      href="/legal/privacy"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-text-secondary hover:bg-brand-bg hover:text-brand-text-primary transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Shield className="h-4 w-4" /> Privacy & Safety
                    </Link>
                    <hr className="my-1 border-brand-border" />
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-danger hover:bg-brand-danger/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="rounded-lg bg-black border-2 border-white/20 px-5 py-2 text-sm font-bold text-white hover:bg-brand-card transition-colors"
              >
                Log in
              </Link>
            )}

            {/* Mobile toggle */}
            <button
              className="md:hidden rounded-lg border border-brand-border p-2 hover:bg-brand-card transition-colors"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
              {isMobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileOpen && (
        <div className="md:hidden border-t border-brand-border bg-brand-card/95 backdrop-blur-xl animate-slide-down">
          <div className="px-4 py-4 space-y-1">
            {isAuthenticated ? (
              <>
                <MobileNavLink href="/dashboard" onClick={() => setIsMobileOpen(false)}>
                  Dashboard
                </MobileNavLink>
                <MobileNavLink href="/connect" onClick={() => setIsMobileOpen(false)}>
                  🟢 Connect Now
                </MobileNavLink>
                <MobileNavLink href="/plans" onClick={() => setIsMobileOpen(false)}>
                  Plans
                </MobileNavLink>
              </>
            ) : (
              <>
                <MobileNavLink href="/#features" onClick={() => setIsMobileOpen(false)}>
                  Features
                </MobileNavLink>
                <MobileNavLink href="/plans" onClick={() => setIsMobileOpen(false)}>
                  Pricing
                </MobileNavLink>
                <MobileNavLink href="/auth/login" onClick={() => setIsMobileOpen(false)}>
                  Login
                </MobileNavLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-sm font-medium text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-card/50 transition-colors"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block rounded-lg px-4 py-3 text-sm font-medium text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg transition-colors"
    >
      {children}
    </Link>
  );
}
