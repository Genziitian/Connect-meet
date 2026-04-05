// ============================================================
// GenZ IITian Connect — Auth Context (Firebase Google Sign-In)
// ============================================================
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, PlanType } from '@/types';
import { auth, db, googleProvider } from '@/lib/firebase';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  updateProfile: (data: { displayName: string; collegeName: string; gender: string }) => Promise<void>;
  updatePlan: (plan: PlanType) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: data.displayName || firebaseUser.displayName || '',
            avatarUrl: data.avatarUrl || firebaseUser.photoURL || '',
            collegeName: data.collegeName || '',
            gender: data.gender || '',
            profileComplete: data.profileComplete || false,
            planType: data.planType || 'free',
            isVerified: true,
            isBanned: data.isBanned || false,
            ageVerified: data.ageVerified || false,
            consentGiven: data.consentGiven || false,
            matchesUsedToday: data.matchesUsedToday || 0,
            maxMatchesPerDay: data.maxMatchesPerDay || 5,
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
          });
        } else {
          // First time user — create Firestore doc
          const newUser: Record<string, unknown> = {
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            avatarUrl: firebaseUser.photoURL || '',
            collegeName: '',
            profileComplete: false,
            planType: 'free',
            isVerified: true,
            isBanned: false,
            ageVerified: false,
            consentGiven: false,
            matchesUsedToday: 0,
            maxMatchesPerDay: 20,
            createdAt: serverTimestamp(),
            lastActiveAt: serverTimestamp(),
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            avatarUrl: firebaseUser.photoURL || '',
            collegeName: '',
            profileComplete: false,
            planType: 'free',
            isVerified: true,
            isBanned: false,
            ageVerified: false,
            consentGiven: false,
            matchesUsedToday: 0,
            maxMatchesPerDay: 20,
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle the rest
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: { displayName: string; collegeName: string; gender: string }) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.id);
    await updateDoc(userRef, {
      displayName: data.displayName,
      collegeName: data.collegeName,
      gender: data.gender,
      profileComplete: true,
      lastActiveAt: serverTimestamp(),
    });
    setUser({
      ...user,
      displayName: data.displayName,
      collegeName: data.collegeName,
      gender: data.gender as User['gender'],
      profileComplete: true,
    });
  }, [user]);

  const updatePlan = useCallback(
    async (plan: PlanType) => {
      if (!user) return;
      const maxMatches = plan === 'free' ? 5 : plan === 'pro' ? 50 : -1;
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { planType: plan, maxMatchesPerDay: maxMatches });
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
