import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-brand-bg text-brand-text-primary antialiased">
        <Providers>
          <Navbar />
          <main className="pt-16">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
