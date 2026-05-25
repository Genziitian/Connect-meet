// ============================================================
// Admin — Pending community-room requests
// ============================================================
import React from 'react';
import Link from 'next/link';
import { getAdminDb } from '@/lib/admin';
import { Hash, ArrowLeft } from 'lucide-react';
import ApprovalActions from './ApprovalActions';

export const dynamic = 'force-dynamic';

interface RoomRequest {
  id: string;
  slug: string;
  name: string;
  description: string;
  emoji: string | null;
  color: string | null;
  tagline: string | null;
  host_alias: string | null;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string | null;
  created_by: string | null;
  reject_reason: string | null;
  created_user?: { email: string; anon_name: string | null } | null;
}

export default async function RoomRequestsPage() {
  const db = getAdminDb();

  const { data, error } = await db
    .from('community_rooms')
    .select(
      'id, slug, name, description, emoji, color, tagline, host_alias, status, requested_at, created_by, reject_reason'
    )
    .in('status', ['pending', 'rejected'])
    .order('requested_at', { ascending: false, nullsFirst: false });

  if (error) {
    return (
      <div className="bb-card bg-white p-6 text-sm text-[#FF3B3B]">
        Failed to load: {error.message}
      </div>
    );
  }

  const requests = (data || []) as RoomRequest[];

  // Fetch requester emails
  const ids = requests.map((r) => r.created_by).filter(Boolean) as string[];
  const usersMap: Record<string, { email: string; anon_name: string | null }> = {};
  if (ids.length) {
    const { data: users } = await db
      .from('users')
      .select('id, email, anon_name')
      .in('id', ids);
    (users || []).forEach((u) => {
      usersMap[u.id] = { email: u.email, anon_name: u.anon_name };
    });
  }

  const pending = requests.filter((r) => r.status === 'pending');
  const rejected = requests.filter((r) => r.status === 'rejected');

  return (
    <div className="space-y-6">
      <Link href="/admin/community" className="inline-flex items-center gap-1 text-xs font-bold text-[#555] hover:text-[#111]">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to community admin
      </Link>

      <div className="flex items-center gap-2">
        <Hash className="h-5 w-5 text-[#B794F6]" />
        <h2 className="text-lg font-black text-[#111]">
          Pending room requests ({pending.length})
        </h2>
      </div>

      {pending.length === 0 ? (
        <div className="bb-card bg-white p-6 text-center text-sm text-[#555]">
          No pending requests. Students can submit new rooms at <code>/community/new</code>.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pending.map((r) => (
            <RequestCard key={r.id} req={r} requester={r.created_by ? usersMap[r.created_by] : null} />
          ))}
        </div>
      )}

      {rejected.length > 0 && (
        <>
          <h3 className="text-sm font-black text-[#888] uppercase tracking-wider mt-8">
            Rejected · {rejected.length}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rejected.map((r) => (
              <RequestCard key={r.id} req={r} requester={r.created_by ? usersMap[r.created_by] : null} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RequestCard({
  req,
  requester,
}: {
  req: RoomRequest;
  requester: { email: string; anon_name: string | null } | null | undefined;
}) {
  return (
    <div className="bb-card bg-white overflow-hidden">
      <div
        className="flex items-end h-20 p-3 border-b-[2px] border-[#111]"
        style={{
          backgroundColor: req.color || '#888',
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(17,17,17,0.06) 0 4px, transparent 4px 12px)',
        }}
      >
        <span className="text-2xl drop-shadow-[2px_2px_0_#111]">{req.emoji || '#'}</span>
        <span className="ml-auto text-[10px] font-black uppercase rounded-full border-[2px] border-[#111] bg-white px-2 py-0.5">
          {req.status}
        </span>
      </div>
      <div className="p-4">
        <p className="text-sm font-black text-[#111]">{req.name}</p>
        <p className="text-[10px] font-mono text-[#888] mb-2">/community/{req.slug}</p>
        <p className="text-xs text-[#555] mb-2">{req.description}</p>
        {req.tagline && <p className="text-[10px] text-[#888] mb-2 font-bold">{req.tagline}</p>}
        <div className="text-[10px] text-[#888] mb-3 space-y-0.5">
          <p>
            <span className="font-bold">Host alias:</span> {req.host_alias || '—'}
          </p>
          <p>
            <span className="font-bold">Requested by:</span>{' '}
            {requester ? `${requester.anon_name || '—'} (${requester.email})` : '—'}
          </p>
          {req.requested_at && (
            <p>
              <span className="font-bold">When:</span>{' '}
              {new Date(req.requested_at).toLocaleString()}
            </p>
          )}
          {req.reject_reason && (
            <p className="text-[#FF3B3B] mt-1">
              <span className="font-bold">Reject reason:</span> {req.reject_reason}
            </p>
          )}
        </div>

        {req.status === 'pending' && <ApprovalActions roomId={req.id} />}
      </div>
    </div>
  );
}
