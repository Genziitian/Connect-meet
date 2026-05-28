// ============================================================
// AppShell — Conditional Navbar/Footer visibility
// ============================================================
'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useFullscreen } from '@/lib/fullscreen-context';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileTabBar from '@/components/MobileTabBar';

export default function AppShell({ children }: { children: ReactNode }) {
  const { isFullscreen } = useFullscreen();
  const pathname = usePathname();

  // Pages where the mobile tab bar is hidden — main shouldn't reserve bottom padding for it
  const inActiveRoom =
    pathname.startsWith('/community/') && pathname.split('/').length > 2;
  const inDMThread =
    pathname.startsWith('/friends/') && pathname.split('/').length > 2;
  const hideTabBar =
    pathname === '/connect' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/admin') ||
    inActiveRoom ||
    inDMThread;
  // Hide the footer on immersive chat surfaces so the mobile keyboard can't scroll it into view
  const hideFooter = pathname === '/connect' || inActiveRoom;

  return (
    <>
      {!isFullscreen && <Navbar />}
      <main
        className={
          isFullscreen
            ? ''
            : `pt-16 ${hideTabBar ? '' : 'pb-20 lg:pb-0'}`
        }
      >
        {children}
      </main>
      {!isFullscreen && !hideFooter && <Footer />}
      {!isFullscreen && <MobileTabBar />}
    </>
  );
}
