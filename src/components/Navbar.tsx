'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  Menu,
  X,
  User,
  LogOut,
  Shield,
  CreditCard,
  ChevronDown,
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FDEBD3]/90 backdrop-blur-md border-b-[3px] border-[#111]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-0.5">
            <span className="text-xl font-black text-[#111]">Gen-Z</span>
            <span className="text-xl font-black text-[#FF3B3B]">IITian</span>
            <span className="text-xs font-bold text-[#00D09C] ml-1.5 hidden sm:block">
              Connect
            </span>
          </Link>

          {/* ── Desktop Links ── */}
          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <NavLink href="/dashboard">Dashboard</NavLink>
                <Link
                  href="/connect"
                  className="text-sm font-semibold text-[#111] hover:text-[#00D09C] transition-colors flex items-center gap-1.5"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  Connect
                </Link>
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

          {/* ── Right Side ── */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border-[3px] border-[#111] bg-white shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-sm font-bold"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:block max-w-[120px] truncate">
                    {user?.displayName || user?.email}
                  </span>
                  <span className="rounded-full bg-[#00D09C] px-2 py-0.5 text-xs text-white font-bold uppercase">
                    {user?.planType}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border-[3px] border-[#111] bg-white shadow-[4px_4px_0px_#111] p-2 animate-slide-down">
                    <DropdownLink
                      href="/dashboard"
                      icon={<User className="h-4 w-4" />}
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Dashboard
                    </DropdownLink>
                    <DropdownLink
                      href="/plans"
                      icon={<CreditCard className="h-4 w-4" />}
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Manage Plan
                    </DropdownLink>
                    <DropdownLink
                      href="/legal/privacy"
                      icon={<Shield className="h-4 w-4" />}
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Privacy
                    </DropdownLink>
                    <hr className="my-1 border-[#eee]" />
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#FF3B3B] hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="px-6 py-2 rounded-xl border-[3px] border-[#111] bg-[#B794F6] font-bold text-sm shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Explore
              </Link>
            )}

            {/* Mobile toggle */}
            <button
              className="md:hidden rounded-xl border-[3px] border-[#111] p-2 bg-white shadow-[2px_2px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
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

      {/* ── Mobile Menu ── */}
      {isMobileOpen && (
        <div className="md:hidden border-t-[3px] border-[#111] bg-white p-4 space-y-1 animate-slide-down">
          {isAuthenticated ? (
            <>
              <MobileLink
                href="/dashboard"
                onClick={() => setIsMobileOpen(false)}
              >
                Dashboard
              </MobileLink>
              <MobileLink
                href="/connect"
                onClick={() => setIsMobileOpen(false)}
              >
                🟢 Connect Now
              </MobileLink>
              <MobileLink
                href="/plans"
                onClick={() => setIsMobileOpen(false)}
              >
                Plans
              </MobileLink>
            </>
          ) : (
            <>
              <MobileLink
                href="/#features"
                onClick={() => setIsMobileOpen(false)}
              >
                Features
              </MobileLink>
              <MobileLink
                href="/plans"
                onClick={() => setIsMobileOpen(false)}
              >
                Pricing
              </MobileLink>
              <MobileLink
                href="/auth/login"
                onClick={() => setIsMobileOpen(false)}
              >
                Login
              </MobileLink>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

/* ── Sub-components ── */

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm font-semibold text-[#111] hover:text-[#00D09C] transition-colors"
    >
      {children}
    </Link>
  );
}

function DropdownLink({
  href,
  icon,
  onClick,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-[#FDEBD3] transition-colors"
      onClick={onClick}
    >
      {icon} {children}
    </Link>
  );
}

function MobileLink({
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
      className="block rounded-lg px-4 py-3 text-sm font-semibold hover:bg-[#FDEBD3] transition-colors"
    >
      {children}
    </Link>
  );
}
