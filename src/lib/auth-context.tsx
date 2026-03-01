// ============================================================
// GenZ IITian Connect — Auth Context (Simulated)
// ============================================================
'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, PlanType } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, otp: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  sendOtp: (email: string) => Promise<void>;
  verifyAge: () => void;
  giveConsent: () => void;
  updatePlan: (plan: PlanType) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER: User = {
  id: 'usr_' + Math.random().toString(36).substr(2, 9),
  email: '',
  planType: 'free',
  isVerified: true,
  isBanned: false,
  ageVerified: false,
  consentGiven: false,
  matchesUsedToday: 0,
  maxMatchesPerDay: 5,
  createdAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, _otp: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setUser({
      ...MOCK_USER,
      email,
      displayName: email.split('@')[0],
    });
    setIsLoading(false);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setUser({
      ...MOCK_USER,
      email: 'student@ds.study.iitm.ac.in',
      displayName: 'IITian Student',
    });
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const sendOtp = useCallback(async (_email: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  const verifyAge = useCallback(() => {
    if (user) {
      setUser({ ...user, ageVerified: true });
    }
  }, [user]);

  const giveConsent = useCallback(() => {
    if (user) {
      setUser({ ...user, consentGiven: true });
    }
  }, [user]);

  const updatePlan = useCallback(
    (plan: PlanType) => {
      if (user) {
        const maxMatches = plan === 'free' ? 5 : plan === 'pro' ? 50 : -1;
        setUser({ ...user, planType: plan, maxMatchesPerDay: maxMatches });
      }
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        logout,
        sendOtp,
        verifyAge,
        giveConsent,
        updatePlan,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
