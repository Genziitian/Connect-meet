import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'GenZ IITian Connect — Anonymous Study Connect for IIT Madras BS',
  description:
    'India\'s first privacy-compliant anonymous connect platform for verified IIT Madras BS students. Study together, discuss topics, and build connections safely.',
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
    description: 'Anonymous study connect for verified IIT Madras BS students',
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
