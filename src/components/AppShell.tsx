// ============================================================
// AppShell — Conditional Navbar/Footer visibility
// ============================================================
'use client';

import React, { ReactNode } from 'react';
import { useFullscreen } from '@/lib/fullscreen-context';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileTabBar from '@/components/MobileTabBar';

export default function AppShell({ children }: { children: ReactNode }) {
  const { isFullscreen } = useFullscreen();

  return (
    <>
      {!isFullscreen && <Navbar />}
      <main className={isFullscreen ? '' : 'pt-16 pb-20 lg:pb-0'}>{children}</main>
      {!isFullscreen && <Footer />}
      {!isFullscreen && <MobileTabBar />}
    </>
  );
}
