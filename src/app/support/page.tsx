// ============================================================
// Support — student's ticket list + create new
// ============================================================
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { LifeBuoy, Plus, MessageSquare, Loader2, AlertCircle } from 'lucide-react';

interface TicketRow {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  last_message_at: string;
}

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'bug', label: 'Bug / Issue' },
  { value: 'abuse', label: 'Abuse / Safety' },
  { value: 'payment', label: 'Payment' },
  { value: 'feature', label: 'Feature request' },
  { value: 'other', label: 'Other' },
];

export default function SupportPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const loadTickets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from('support_tickets')
      .select('id, subject, category, status, priority, created_at, last_message_at')
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setTickets((data || []) as TicketRow[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    if (subject.trim().length < 5) {
      setError('Subject must be at least 5 characters.');
      return;
    }
    if (body.trim().length < 10) {
      setError('Please describe your issue (at least 10 characters).');
      return;
    }
    setSubmitting(true);

    const { data: ticket, error: tErr } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject: subject.trim(),
        category,
        priority: category === 'abuse' ? 'high' : 'normal',
      })
      .select('id')
      .single();

    if (tErr || !ticket) {
      setError(tErr?.message || 'Failed to create ticket.');
      setSubmitting(false);
      return;
    }

    const { error: mErr } = await supabase.from('ticket_messages').insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      sender_role: 'user',
      body: body.trim(),
    });

    if (mErr) {
      setError(mErr.message);
      setSubmitting(false);
      return;
    }

    setSubject('');
    setBody('');
    setCategory('general');
    setShowForm(false);
    setSubmitting(false);
    router.push(`/support/${ticket.id}`);
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bb-grid">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FB923C] border-[2px] border-[#111]">
              <LifeBuoy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#111]">Support</h1>
              <p className="text-xs text-[#555] font-medium">Raise an issue or chat with our team</p>
            </div>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bb-btn bb-btn-green px-4 py-2 text-sm"
            >
              <Plus className="h-4 w-4" /> New ticket
            </button>
          )}
        </div>

        {showForm && (
          <div className="bb-card bg-white p-5 mb-6">
            <h2 className="text-sm font-black text-[#111] mb-4">Raise a new ticket</h2>
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-[#FF3B3B]/10 border-[2px] border-[#FF3B3B]/30 px-4 py-3 mb-4 text-xs text-[#FF3B3B] font-medium">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#111] mb-1">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  className="w-full rounded-xl border-[2px] border-[#111] px-3 py-2.5 text-sm shadow-[3px_3px_0px_#111] focus:outline-none focus:bg-[#FDEBD3]"
                  maxLength={200}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111] mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border-[2px] border-[#111] px-3 py-2.5 text-sm shadow-[3px_3px_0px_#111] focus:outline-none bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111] mb-1">Describe your issue</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Tell us what's going on..."
                  rows={5}
                  className="w-full rounded-xl border-[2px] border-[#111] px-3 py-2.5 text-sm shadow-[3px_3px_0px_#111] focus:outline-none focus:bg-[#FDEBD3] resize-none"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bb-btn bb-btn-green px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit ticket'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError('');
                  }}
                  className="rounded-xl border-[2px] border-[#111] px-4 py-2.5 text-sm font-bold hover:bg-[#FDEBD3] shadow-[3px_3px_0px_#111]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tickets list */}
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#888]" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="bb-card bg-white p-8 text-center">
            <MessageSquare className="h-10 w-10 mx-auto text-[#888] mb-3" />
            <p className="text-sm font-bold text-[#111] mb-1">No tickets yet</p>
            <p className="text-xs text-[#555]">Have a question or issue? Raise your first ticket.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/support/${t.id}`}
                  className="block bb-card bg-white p-4 hover:bg-[#FDEBD3] transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-[#111]">{t.subject}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#888] uppercase tracking-wide">
                      {t.category} · {t.priority} priority
                    </span>
                    <span className="text-[10px] text-[#888]">{formatAgo(t.last_message_at)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
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
