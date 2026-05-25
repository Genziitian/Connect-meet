import React from 'react';
import { getAdminDb } from '@/lib/admin';
import { Users } from 'lucide-react';
import BanButton from './BanButton';

export const dynamic = 'force-dynamic';

interface UserRow {
  id: string;
  email: string;
  display_name: string | null;
  plan_type: string;
  role: string;
  is_banned: boolean;
  created_at: string;
  last_active_at: string;
}

export default async function AdminUsersPage() {
  const db = getAdminDb();
  const { data } = await db
    .from('users')
    .select('id, email, display_name, plan_type, role, is_banned, created_at, last_active_at')
    .order('created_at', { ascending: false })
    .limit(200);

  const users = (data || []) as UserRow[];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-[#00D09C]" />
        <h2 className="text-lg font-black text-[#111]">Users ({users.length})</h2>
      </div>

      <div className="bb-card bg-white overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#FDEBD3] border-b-[2px] border-[#111]">
            <tr>
              <th className="text-left text-[10px] font-bold uppercase tracking-wide px-3 py-2">Email</th>
              <th className="text-left text-[10px] font-bold uppercase tracking-wide px-3 py-2">Name</th>
              <th className="text-left text-[10px] font-bold uppercase tracking-wide px-3 py-2">Plan</th>
              <th className="text-left text-[10px] font-bold uppercase tracking-wide px-3 py-2">Role</th>
              <th className="text-left text-[10px] font-bold uppercase tracking-wide px-3 py-2">Status</th>
              <th className="text-left text-[10px] font-bold uppercase tracking-wide px-3 py-2">Joined</th>
              <th className="text-left text-[10px] font-bold uppercase tracking-wide px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[#eee] hover:bg-[#FAFAFA]">
                <td className="px-3 py-2 font-medium">{u.email}</td>
                <td className="px-3 py-2">{u.display_name || '—'}</td>
                <td className="px-3 py-2 uppercase font-bold">{u.plan_type}</td>
                <td className="px-3 py-2 uppercase font-bold">
                  {u.role === 'admin' ? <span className="text-[#FF3B3B]">{u.role}</span> : u.role}
                </td>
                <td className="px-3 py-2">
                  {u.is_banned ? (
                    <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-[#FF3B3B]/15 text-[#FF3B3B] text-[10px] font-bold">
                      BANNED
                    </span>
                  ) : (
                    <span className="text-[#888] text-[10px]">active</span>
                  )}
                </td>
                <td className="px-3 py-2 text-[10px] text-[#888]">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-3 py-2">
                  <BanButton userId={u.id} email={u.email} isBanned={u.is_banned} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
