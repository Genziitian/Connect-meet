import React from 'react';
import { getAdminDb } from '@/lib/admin';
import { Flag } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ReportRow {
  report_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  reported_user_id: string;
  reporter_user_id: string;
  session_id: string | null;
}

export default async function ReportsPage() {
  const db = getAdminDb();
  const { data } = await db
    .from('reports')
    .select('report_id, reason, description, status, created_at, reported_user_id, reporter_user_id, session_id')
    .order('created_at', { ascending: false })
    .limit(100);

  const reports = (data || []) as ReportRow[];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Flag className="h-5 w-5 text-[#FF3B3B]" />
        <h2 className="text-lg font-black text-[#111]">Reports ({reports.length})</h2>
      </div>

      {reports.length === 0 ? (
        <div className="bb-card bg-white p-6 text-center text-sm text-[#555]">
          No reports yet.
        </div>
      ) : (
        <div className="bb-card bg-white overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#FDEBD3] border-b-[2px] border-[#111]">
              <tr>
                <Th>Reason</Th>
                <Th>Description</Th>
                <Th>Status</Th>
                <Th>Reporter</Th>
                <Th>Reported</Th>
                <Th>When</Th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.report_id} className="border-b border-[#eee] hover:bg-[#FAFAFA]">
                  <Td>
                    <span className="font-bold text-[#FF3B3B]">{r.reason}</span>
                  </Td>
                  <Td>
                    <span className="text-[#555]">{r.description || '—'}</span>
                  </Td>
                  <Td>{r.status}</Td>
                  <Td className="font-mono text-[10px]">{r.reporter_user_id.slice(0, 8)}…</Td>
                  <Td className="font-mono text-[10px]">{r.reported_user_id.slice(0, 8)}…</Td>
                  <Td className="text-[10px] text-[#888]">{new Date(r.created_at).toLocaleString()}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left text-[10px] font-bold uppercase text-[#111] tracking-wide px-3 py-2">
      {children}
    </th>
  );
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}
