import React from 'react';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { LayoutDashboard, Flag, LifeBuoy, MessagesSquare, Users, Inbox } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAFAFA]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[#111]">Admin</h1>
          <p className="text-xs text-[#555] font-medium">
            Signed in as <span className="font-bold">{admin.email}</span>
          </p>
        </div>

        <nav className="mb-6 flex flex-wrap gap-2">
          <AdminNavLink href="/admin" label="Overview" icon={LayoutDashboard} />
          <AdminNavLink href="/admin/reports" label="Reports" icon={Flag} />
          <AdminNavLink href="/admin/tickets" label="Tickets" icon={LifeBuoy} />
          <AdminNavLink href="/admin/community" label="Community" icon={MessagesSquare} />
          <AdminNavLink href="/admin/community/requests" label="Room Requests" icon={Inbox } />
          <AdminNavLink href="/admin/users" label="Users" icon={Users} />
        </nav>

        {children}
      </div>
    </div>
  );
}

function AdminNavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="bb-card bg-white px-4 py-2 inline-flex items-center gap-2 text-xs font-bold text-[#111] hover:bg-[#FDEBD3] transition-colors"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
