// ============================================================
// AppShell — Conditional Navbar/Footer visibility
// ============================================================
'use client';

import React, { ReactNode } from 'react';
import { useFullscreen } from '@/lib/fullscreen-context';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AppShell({ children }: { children: ReactNode }) {
  const { isFullscreen } = useFullscreen();

  return (
    <>
      {!isFullscreen && <Navbar />}
      <main className={isFullscreen ? '' : 'pt-16'}>{children}</main>
      {!isFullscreen && <Footer />}
    </>
  );
}
