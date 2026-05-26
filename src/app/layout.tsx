import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'GenZ IITian Connect — Anonymous Social Video & Text Chat',
  description:
    'Privacy-compliant anonymous social platform for safe video and text chat with real people.',
  keywords: [
    'IIT Madras',
    'BS Degree',
    'Student Connect',
    'Anonymous Chat',
    'Study Partner',
    'GenZ IITian',
  ],
  authors: [{ name: 'GenZ IITian' }],
  manifest: '/manifest.json',
  applicationName: 'GenZ IITian Connect',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GenZ Connect',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/icon-192.png',
  },
  openGraph: {
    title: 'GenZ IITian Connect',
    description: 'Anonymous social connect for safe video and text chat',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#00D09C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FDEBD3] text-[#111] antialiased font-sans">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
