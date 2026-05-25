// ============================================================
// Admin ticket thread — reply to a student
// ============================================================
import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAdminDb } from '@/lib/admin';
import { ArrowLeft } from 'lucide-react';
import AdminTicketThread from './AdminTicketThread';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function AdminTicketPage({ params }: PageProps) {
  const db = getAdminDb();

  const { data: ticket } = await db
    .from('support_tickets')
    .select('id, subject, category, status, priority, created_at, user_id')
    .eq('id', params.id)
    .maybeSingle();

  if (!ticket) notFound();

  const { data: userRow } = await db
    .from('users')
    .select('email, display_name')
    .eq('id', ticket.user_id)
    .maybeSingle();

  return (
    <div className="space-y-4">
      <Link href="/admin/tickets" className="inline-flex items-center gap-1 text-xs font-bold text-[#555] hover:text-[#111]">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to all tickets
      </Link>

      <div className="bb-card bg-white p-4">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-lg font-black text-[#111]">{ticket.subject}</h1>
          <StatusBadge status={ticket.status} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-[10px] font-bold text-[#888] uppercase">User</p>
            <p className="font-bold text-[#111]">{userRow?.display_name || '—'}</p>
            <p className="text-[#555]">{userRow?.email}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#888] uppercase">Details</p>
            <p className="text-[#555]">
              {ticket.category} · {ticket.priority} priority
            </p>
            <p className="text-[10px] text-[#888]">Opened {new Date(ticket.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <AdminTicketThread ticketId={ticket.id} currentStatus={ticket.status} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: 'bg-[#FB923C]/15 text-[#FB923C]',
    in_progress: 'bg-[#00D09C]/15 text-[#00875A]',
    resolved: 'bg-[#00D09C]/15 text-[#00875A]',
    closed: 'bg-[#888]/15 text-[#555]',
  };
  const cls = map[status] || 'bg-[#888]/15 text-[#555]';
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wide rounded px-2 py-0.5 ${cls}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
