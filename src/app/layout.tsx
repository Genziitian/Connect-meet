import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'GenZ IITian Connect — Social Media for BS Degree Students',
  description:
    'The social platform built exclusively for IIT Madras BS Degree students. Connect, chat, find study partners, join community rooms — all anonymous, all verified.',
  keywords: [
    'BS Degree Social',
    'IIT Madras BS',
    'IITM BS Students',
    'Online Degree Community',
    'Student Social Network',
    'Anonymous Student Chat',
    'Study Partner',
    'BS Degree Community',
    'GenZ IITian',
  ],
  authors: [{ name: 'GenZ IITian Connect' }],
  manifest: '/manifest.json',
  applicationName: 'GenZ IITian Connect',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GenZ Connect',
    startupImage: ['/icons/apple-icon-180x180.png'],
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icons/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/icons/apple-icon-57x57.png',   sizes: '57x57',   type: 'image/png' },
      { url: '/icons/apple-icon-60x60.png',   sizes: '60x60',   type: 'image/png' },
      { url: '/icons/apple-icon-72x72.png',   sizes: '72x72',   type: 'image/png' },
      { url: '/icons/apple-icon-76x76.png',   sizes: '76x76',   type: 'image/png' },
      { url: '/icons/apple-icon-114x114.png', sizes: '114x114', type: 'image/png' },
      { url: '/icons/apple-icon-120x120.png', sizes: '120x120', type: 'image/png' },
      { url: '/icons/apple-icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icons/apple-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/icons/favicon.svg', color: '#00D09C' },
    ],
  },
  other: {
    'msapplication-TileColor': '#00D09C',
    'msapplication-TileImage': '/icons/ms-icon-144x144.png',
    'msapplication-config': '/icons/browserconfig.xml',
  },
  openGraph: {
    title: 'GenZ IITian Connect — Social Media for BS Degree Students',
    description:
      'The social platform built exclusively for IIT Madras BS Degree students. Find your tribe online.',
    type: 'website',
    siteName: 'GenZ IITian Connect',
    url: 'https://genziitian.live',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'GenZ IITian Connect',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'GenZ IITian Connect — Social Media for BS Degree Students',
    description: 'Built for IITM BS Degree students. Anonymous, verified, made for online learners.',
    images: ['/icons/icon-512.png'],
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
