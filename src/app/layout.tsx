import type { Metadata } from 'next';
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
  openGraph: {
    title: 'GenZ IITian Connect',
    description: 'Anonymous social connect for safe video and text chat',
    type: 'website',
  },
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
