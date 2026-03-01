// ============================================================
// Providers Wrapper — GenZ IITian Connect
// ============================================================
'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth-context';

export default function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
