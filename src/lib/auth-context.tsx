// ============================================================
// GenZ IITian Connect — Auth Context (Supabase Google Sign-In)
// ============================================================
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, PlanType, UserRole } from '@/types';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { displayName: string; collegeName: string; gender: string }) => Promise<void>;
  updatePlan: (plan: PlanType) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface UserRow {
  id: string;
  email: string;
  display_name: string | null;
  anon_name: string | null;
  avatar_url: string | null;
  college_name: string | null;
  gender: string | null;
  profile_complete: boolean;
  plan_type: PlanType;
  role: UserRole | null;
  is_verified: boolean;
  is_banned: boolean;
  age_verified: boolean;
  consent_given: boolean;
  matches_used_today: number;
  max_matches_per_day: number;
  created_at: string;
}

function mapRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name || '',
    anonName: row.anon_name || '',
    avatarUrl: row.avatar_url || '',
    collegeName: row.college_name || '',
    gender: (row.gender || '') as User['gender'],
    profileComplete: row.profile_complete,
    planType: row.plan_type,
    role: (row.role || 'user') as UserRole,
    isVerified: row.is_verified,
    isBanned: row.is_banned,
    ageVerified: row.age_verified,
    consentGiven: row.consent_given,
    matchesUsedToday: row.matches_used_today,
    maxMatchesPerDay: row.max_matches_per_day,
    createdAt: row.created_at,
    lastActiveAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle<UserRow>();

    if (error) {
      console.error('Failed to load user profile:', error);
      setUser(null);
      setIsLoading(false);
      return;
    }

    if (data) {
      setUser(mapRow(data));
    } else {
      // Profile row will be auto-created by the on_auth_user_created trigger,
      // but fall back to an in-memory shape until it appears.
      const meta = session.user.user_metadata || {};
      setUser({
        id: session.user.id,
        email: session.user.email || '',
        displayName: meta.full_name || meta.name || '',
        avatarUrl: meta.avatar_url || meta.picture || '',
        collegeName: '',
        gender: '' as User['gender'],
        profileComplete: false,
        planType: 'free',
        role: 'user',
        isVerified: true,
        isBanned: false,
        ageVerified: false,
        consentGiven: false,
        matchesUsedToday: 0,
        maxMatchesPerDay: 50,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => loadProfile(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  const signupWithEmail = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setIsLoading(false);
      throw error;
    }
    const needsConfirmation = !data.session;
    if (needsConfirmation) setIsLoading(false);
    return { needsConfirmation };
  }, []);

  const sendOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  }, []);

  const verifyOtp = useCallback(async (email: string, code: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    if (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (data: { displayName: string; collegeName: string; gender: string }) => {
      if (!user) return;
      const { error } = await supabase
        .from('users')
        .update({
          display_name: data.displayName,
          college_name: data.collegeName,
          gender: data.gender,
          profile_complete: true,
          last_active_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setUser({
        ...user,
        displayName: data.displayName,
        collegeName: data.collegeName,
        gender: data.gender as User['gender'],
        profileComplete: true,
      });
    },
    [user]
  );

  const updatePlan = useCallback(
    async (plan: PlanType) => {
      if (!user) return;
      const maxMatches = plan === 'free' ? 5 : plan === 'pro' ? 50 : -1;
      const { error } = await supabase
        .from('users')
        .update({ plan_type: plan, max_matches_per_day: maxMatches })
        .eq('id', user.id);

      if (error) throw error;
      setUser({ ...user, planType: plan, maxMatchesPerDay: maxMatches });
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        sendOtp,
        verifyOtp,
        logout,
        updateProfile,
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
