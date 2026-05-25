import React from 'react';
import Link from 'next/link';
import { getAdminDb } from '@/lib/admin';
import { MessagesSquare, Inbox, ArrowRight, Plus } from 'lucide-react';
import RoomCardAdmin from './RoomCardAdmin';

export const dynamic = 'force-dynamic';

interface RoomRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  is_pinned: boolean;
  status: 'pending' | 'approved' | 'rejected';
}

export default async function AdminCommunityPage() {
  const db = getAdminDb();
  const [{ data: rooms }, { count: pendingCount }] = await Promise.all([
    db
      .from('community_rooms')
      .select('id, slug, name, description, is_active, is_pinned, status')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: true }),
    db
      .from('community_rooms')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);

  const list = (rooms || []) as RoomRow[];
  const approved = list.filter((r) => r.status === 'approved');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <MessagesSquare className="h-5 w-5 text-[#B794F6]" />
          <h2 className="text-lg font-black text-[#111]">Community Rooms ({approved.length})</h2>
        </div>
        <Link
          href="/community/new"
          prefetch
          className="bb-btn bb-btn-green text-xs px-3 py-1.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#111]"
        >
          <Plus className="h-3.5 w-3.5" /> Create room (auto-approved)
        </Link>
      </div>

      {/* Pending requests banner */}
      <Link
        href="/admin/community/requests"
        className="bb-card bg-[#FB923C]/15 border-[#FB923C] flex items-center justify-between p-4 hover:bg-[#FB923C]/25 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FB923C] border-[2px] border-[#111]">
            <Inbox className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-[#111]">
              {(pendingCount ?? 0) > 0 ? (
                <>{pendingCount} pending room {pendingCount === 1 ? 'request' : 'requests'}</>
              ) : (
                <>No pending requests</>
              )}
            </p>
            <p className="text-xs text-[#555]">Review student-submitted rooms</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-[#555]" />
      </Link>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {approved.map((r) => (
          <RoomCardAdmin
            key={r.id}
            id={r.id}
            slug={r.slug}
            name={r.name}
            description={r.description}
            isActive={r.is_active}
            isPinned={r.is_pinned}
          />
        ))}
      </div>
    </div>
  );
}
