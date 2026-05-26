// ============================================================
// Admin — Pending student requests to enter approval-required rooms
// ============================================================
import React from 'react';
import Link from 'next/link';
import { getAdminDb } from '@/lib/admin';
import { Inbox, ArrowLeft } from 'lucide-react';
import JoinRequestActions from './JoinRequestActions';

export const dynamic = 'force-dynamic';

interface RequestRow {
  id: string;
  room_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string | null;
  reject_reason: string | null;
  requested_at: string;
  reviewed_at: string | null;
}

export default async function JoinRequestsPage() {
  const db = getAdminDb();

  const { data: reqs, error } = await db
    .from('community_join_requests')
    .select('id, room_id, user_id, status, message, reject_reason, requested_at, reviewed_at')
    .in('status', ['pending', 'approved', 'rejected'])
    .order('requested_at', { ascending: false })
    .limit(100);

  if (error) {
    return (
      <div className="bb-card bg-white p-6 text-sm text-[#FF3B3B]">
        Failed to load: {error.message}
      </div>
    );
  }

  const all = (reqs || []) as RequestRow[];
  const roomIds = Array.from(new Set(all.map((r) => r.room_id)));
  const userIds = Array.from(new Set(all.map((r) => r.user_id)));

  // Hydrate room + user info
  const roomsMap: Record<string, { name: string; slug: string; emoji: string | null; color: string | null }> = {};
  const usersMap: Record<string, { email: string; anon_name: string | null }> = {};
  if (roomIds.length) {
    const { data: rs } = await db
      .from('community_rooms')
      .select('id, name, slug, emoji, color')
      .in('id', roomIds);
    (rs || []).forEach((r) => {
      roomsMap[r.id] = { name: r.name, slug: r.slug, emoji: r.emoji, color: r.color };
    });
  }
  if (userIds.length) {
    const { data: us } = await db
      .from('users')
      .select('id, email, anon_name')
      .in('id', userIds);
    (us || []).forEach((u) => {
      usersMap[u.id] = { email: u.email, anon_name: u.anon_name };
    });
  }

  const pending = all.filter((r) => r.status === 'pending');
  const decided = all.filter((r) => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <Link href="/admin/community" className="inline-flex items-center gap-1 text-xs font-bold text-[#555] hover:text-[#111]">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to community admin
      </Link>

      <div className="flex items-center gap-2">
        <Inbox className="h-5 w-5 text-[#FBBF24]" />
        <h2 className="text-lg font-black text-[#111]">
          Pending join requests ({pending.length})
        </h2>
      </div>

      {pending.length === 0 ? (
        <div className="bb-card bg-white p-6 text-center text-sm text-[#555]">
          No pending join requests.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pending.map((r) => (
            <RequestCard
              key={r.id}
              req={r}
              room={roomsMap[r.room_id]}
              requester={usersMap[r.user_id]}
            />
          ))}
        </div>
      )}

      {decided.length > 0 && (
        <>
          <h3 className="text-sm font-black text-[#888] uppercase tracking-wider mt-8">
            Recent decisions · {decided.length}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {decided.map((r) => (
              <RequestCard
                key={r.id}
                req={r}
                room={roomsMap[r.room_id]}
                requester={usersMap[r.user_id]}
                compact
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RequestCard({
  req,
  room,
  requester,
  compact = false,
}: {
  req: RequestRow;
  room?: { name: string; slug: string; emoji: string | null; color: string | null };
  requester?: { email: string; anon_name: string | null };
  compact?: boolean;
}) {
  const statusColor =
    req.status === 'pending' ? 'bg-[#FBBF24]/15 text-[#FBBF24]' :
    req.status === 'approved' ? 'bg-[#00D09C]/15 text-[#00875A]' :
    'bg-[#FF3B3B]/15 text-[#FF3B3B]';

  return (
    <div className="bb-card bg-white p-4">
      <div className="flex items-start gap-3 mb-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg border-[2px] border-[#111] flex-shrink-0"
          style={{ backgroundColor: room?.color || '#888' }}
        >
          <span className="text-lg">{room?.emoji || '#'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-[#111] truncate">{room?.name || 'Unknown room'}</p>
          <p className="text-[10px] font-mono text-[#888]">/{room?.slug}</p>
        </div>
        <span className={`text-[9px] font-bold uppercase rounded px-2 py-0.5 ${statusColor}`}>
          {req.status}
        </span>
      </div>

      <div className="space-y-1 text-[11px] text-[#555] mb-3">
        <p>
          <span className="font-bold text-[#111]">Requester:</span>{' '}
          {requester ? `${requester.anon_name || '—'} (${requester.email})` : 'Unknown'}
        </p>
        {req.message && (
          <p>
            <span className="font-bold text-[#111]">Note:</span> {req.message}
          </p>
        )}
        <p className="text-[10px] text-[#888]">
          Requested {new Date(req.requested_at).toLocaleString()}
        </p>
        {req.reject_reason && (
          <p className="text-[#FF3B3B]">
            <span className="font-bold">Reject reason:</span> {req.reject_reason}
          </p>
        )}
      </div>

      {!compact && req.status === 'pending' && <JoinRequestActions requestId={req.id} />}
    </div>
  );
}
