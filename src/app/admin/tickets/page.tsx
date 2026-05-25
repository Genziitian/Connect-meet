import React from 'react';
import Link from 'next/link';
import { getAdminDb } from '@/lib/admin';
import { LifeBuoy } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface TicketRow {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  last_message_at: string;
  user_id: string;
}

export default async function TicketsListPage() {
  const db = getAdminDb();
  const { data } = await db
    .from('support_tickets')
    .select('id, subject, category, status, priority, created_at, last_message_at, user_id')
    .order('last_message_at', { ascending: false })
    .limit(100);

  const tickets = (data || []) as TicketRow[];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <LifeBuoy className="h-5 w-5 text-[#FB923C]" />
        <h2 className="text-lg font-black text-[#111]">Tickets ({tickets.length})</h2>
      </div>

      {tickets.length === 0 ? (
        <div className="bb-card bg-white p-6 text-center text-sm text-[#555]">
          No tickets yet.
        </div>
      ) : (
        <div className="bb-card bg-white overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#FDEBD3] border-b-[2px] border-[#111]">
              <tr>
                <th className="text-left text-[10px] font-bold uppercase tracking-wide px-3 py-2">Subject</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wide px-3 py-2">Category</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wide px-3 py-2">Priority</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wide px-3 py-2">Status</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wide px-3 py-2">User</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wide px-3 py-2">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-b border-[#eee] hover:bg-[#FAFAFA]">
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/tickets/${t.id}`}
                      className="text-xs font-bold text-[#111] hover:text-[#00D09C] hover:underline"
                    >
                      {t.subject}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{t.category}</td>
                  <td className="px-3 py-2 uppercase font-bold">{t.priority}</td>
                  <td className="px-3 py-2">{t.status.replace('_', ' ')}</td>
                  <td className="px-3 py-2 font-mono text-[10px]">{t.user_id.slice(0, 8)}…</td>
                  <td className="px-3 py-2 text-[10px] text-[#888]">
                    {new Date(t.last_message_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
