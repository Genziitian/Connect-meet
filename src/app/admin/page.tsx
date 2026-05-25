// ============================================================
// Admin Overview — live metrics, peak times, recent reports + tickets
// ============================================================
import React from 'react';
import Link from 'next/link';
import { getAdminDb } from '@/lib/admin';
import { Users, Flag, LifeBuoy, MessagesSquare, Activity, TrendingUp } from 'lucide-react';
import LiveStats from './LiveStats';

export const dynamic = 'force-dynamic';

async function loadOverview() {
  const db = getAdminDb();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString();

  const [
    totalUsersRes,
    newSignupsRes,
    sessionsTodayRes,
    reportsOpenRes,
    ticketsOpenRes,
    sessionsByHourRes,
    latestReportsRes,
    latestTicketsRes,
  ] = await Promise.all([
    db.from('users').select('id', { count: 'exact', head: true }),
    db.from('users').select('id', { count: 'exact', head: true }).gte('created_at', todayIso),
    db.from('chat_sessions').select('session_id', { count: 'exact', head: true }).gte('start_time', todayIso),
    db.from('reports').select('report_id', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']),
    db.from('support_tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
    db.from('chat_sessions').select('start_time').gte('start_time', sevenDaysAgoIso).limit(5000),
    db.from('reports').select('report_id, reason, status, description, created_at').order('created_at', { ascending: false }).limit(5),
    db.from('support_tickets').select('id, subject, status, priority, created_at, last_message_at').order('last_message_at', { ascending: false }).limit(5),
  ]);

  // Peak hour calc
  const hourBuckets = new Array(24).fill(0);
  (sessionsByHourRes.data || []).forEach((row: { start_time: string }) => {
    const h = new Date(row.start_time).getHours();
    hourBuckets[h]++;
  });
  const peakHour = hourBuckets.indexOf(Math.max(...hourBuckets));

  return {
    totalUsers: totalUsersRes.count ?? 0,
    newSignups: newSignupsRes.count ?? 0,
    sessionsToday: sessionsTodayRes.count ?? 0,
    reportsOpen: reportsOpenRes.count ?? 0,
    ticketsOpen: ticketsOpenRes.count ?? 0,
    peakHour,
    hourBuckets,
    latestReports: latestReportsRes.data || [],
    latestTickets: latestTicketsRes.data || [],
  };
}

export default async function AdminOverviewPage() {
  const data = await loadOverview();

  return (
    <div className="space-y-6">
      {/* Live realtime card */}
      <LiveStats />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi icon={Users} label="Total Users" value={data.totalUsers} />
        <Kpi icon={TrendingUp} label="New today" value={data.newSignups} />
        <Kpi icon={Activity} label="Sessions today" value={data.sessionsToday} />
        <Kpi icon={Flag} label="Open reports" value={data.reportsOpen} accent="red" />
        <Kpi icon={LifeBuoy} label="Open tickets" value={data.ticketsOpen} accent="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions by hour (last 7 days) */}
        <div className="bb-card bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-[#111]">Sessions by hour (last 7d)</h2>
            <span className="text-[10px] font-bold text-[#888]">
              Peak: {formatHour(data.peakHour)}
            </span>
          </div>
          <div className="flex items-end gap-1 h-32">
            {data.hourBuckets.map((count: number, hour: number) => {
              const max = Math.max(...data.hourBuckets, 1);
              const h = Math.max(4, Math.round((count / max) * 120));
              return (
                <div key={hour} className="flex-1 flex flex-col items-center justify-end gap-1">
                  <div
                    className={`w-full rounded-t ${hour === data.peakHour ? 'bg-[#FF3B3B]' : 'bg-[#00D09C]'}`}
                    style={{ height: `${h}px` }}
                    title={`${hour}:00 — ${count} sessions`}
                  />
                  {hour % 4 === 0 && (
                    <span className="text-[8px] font-bold text-[#888]">{hour}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Latest reports */}
        <div className="bb-card bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-[#111] flex items-center gap-2">
              <Flag className="h-4 w-4 text-[#FF3B3B]" /> Recent reports
            </h2>
            <Link href="/admin/reports" className="text-[10px] font-bold text-[#00D09C] underline">
              View all
            </Link>
          </div>
          {data.latestReports.length === 0 ? (
            <p className="text-xs text-[#888] font-medium">No reports yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.latestReports.map((r: {
                report_id: string;
                reason: string;
                status: string;
                description: string | null;
                created_at: string;
              }) => (
                <li key={r.report_id} className="rounded-lg border-[1.5px] border-[#eee] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#111]">{r.reason}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-[11px] text-[#555] line-clamp-2">{r.description || '—'}</p>
                  <p className="text-[9px] text-[#888] mt-1 font-medium">{formatAgo(r.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Latest tickets */}
        <div className="bb-card bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-[#111] flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-[#FB923C]" /> Recent tickets
            </h2>
            <Link href="/admin/tickets" className="text-[10px] font-bold text-[#00D09C] underline">
              View all
            </Link>
          </div>
          {data.latestTickets.length === 0 ? (
            <p className="text-xs text-[#888] font-medium">No tickets yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.latestTickets.map((t: {
                id: string;
                subject: string;
                status: string;
                priority: string;
                created_at: string;
                last_message_at: string;
              }) => (
                <li key={t.id} className="rounded-lg border-[1.5px] border-[#eee] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Link href={`/admin/tickets/${t.id}`} className="text-xs font-bold text-[#111] hover:underline">
                      {t.subject}
                    </Link>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#888] uppercase">{t.priority}</span>
                    <span className="text-[9px] text-[#888] font-medium">{formatAgo(t.last_message_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Community quick link */}
        <div className="bb-card bg-white p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-black text-[#111] flex items-center gap-2 mb-2">
              <MessagesSquare className="h-4 w-4 text-[#B794F6]" /> Community
            </h2>
            <p className="text-xs text-[#555] font-medium">
              Manage open community rooms and moderate messages.
            </p>
          </div>
          <Link
            href="/admin/community"
            className="mt-3 text-xs font-bold text-[#00D09C] underline"
          >
            Open community admin →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent?: 'red' | 'orange';
}) {
  const accentClass =
    accent === 'red' ? 'text-[#FF3B3B]' : accent === 'orange' ? 'text-[#FB923C]' : 'text-[#00D09C]';
  return (
    <div className="bb-card bg-white p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${accentClass}`} />
        <span className="text-[10px] font-bold text-[#555] uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-black text-[#111]">{value.toLocaleString()}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-[#FB923C]/15 text-[#FB923C]',
    reviewing: 'bg-[#B794F6]/15 text-[#9F7AEA]',
    open: 'bg-[#FB923C]/15 text-[#FB923C]',
    in_progress: 'bg-[#00D09C]/15 text-[#00875A]',
    resolved: 'bg-[#00D09C]/15 text-[#00875A]',
    closed: 'bg-[#888]/15 text-[#555]',
    action_taken: 'bg-[#00D09C]/15 text-[#00875A]',
    dismissed: 'bg-[#888]/15 text-[#555]',
  };
  const cls = map[status] || 'bg-[#888]/15 text-[#555]';
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wide rounded px-2 py-0.5 ${cls}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function formatHour(h: number) {
  return `${h.toString().padStart(2, '0')}:00`;
}

function formatAgo(iso: string) {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
