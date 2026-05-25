// ============================================================
// Ticket thread — user view (messages with admin)
// ============================================================
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Send, Loader2, AlertCircle, Shield, User } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
}

interface Message {
  id: string;
  body: string;
  sender_id: string;
  sender_role: 'user' | 'admin';
  created_at: string;
}

export default function TicketThreadPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: tData, error: tErr }, { data: mData, error: mErr }] = await Promise.all([
      supabase
        .from('support_tickets')
        .select('id, subject, category, status, priority, created_at')
        .eq('id', ticketId)
        .maybeSingle<Ticket>(),
      supabase
        .from('ticket_messages')
        .select('id, body, sender_id, sender_role, created_at')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true }),
    ]);

    if (tErr || !tData) {
      setError(tErr?.message || 'Ticket not found.');
      setLoading(false);
      return;
    }
    if (mErr) setError(mErr.message);

    setTicket(tData);
    setMessages((mData || []) as Message[]);
    setLoading(false);
  }, [ticketId, user]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Realtime subscription — new messages on this ticket
  useEffect(() => {
    if (!ticketId) return;
    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          setMessages((prev) => {
            const msg = payload.new as Message;
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reply.trim() || sending) return;
    setSending(true);
    setError('');

    const { error: err } = await supabase.from('ticket_messages').insert({
      ticket_id: ticketId,
      sender_id: user.id,
      sender_role: 'user',
      body: reply.trim(),
    });

    if (err) {
      setError(err.message);
    } else {
      setReply('');
    }
    setSending(false);
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bb-grid">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <Link href="/support" className="inline-flex items-center gap-1 text-xs font-bold text-[#555] hover:text-[#111] mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to tickets
        </Link>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#888]" />
          </div>
        ) : !ticket ? (
          <div className="bb-card bg-white p-6 text-sm text-[#555]">{error || 'Ticket not found.'}</div>
        ) : (
          <>
            <div className="bb-card bg-white p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-lg font-black text-[#111]">{ticket.subject}</h1>
                <StatusBadge status={ticket.status} />
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold text-[#888] uppercase">
                <span>{ticket.category}</span>
                <span>·</span>
                <span>{ticket.priority} priority</span>
                <span>·</span>
                <span>Opened {new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="bb-card bg-white p-4 mb-3 h-[55vh] overflow-y-auto space-y-3"
            >
              {messages.length === 0 ? (
                <p className="text-center text-xs text-[#888] py-8">No messages yet.</p>
              ) : (
                messages.map((m) => {
                  const mine = m.sender_role === 'user';
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] ${mine ? 'order-2' : ''}`}>
                        <div
                          className={`flex items-center gap-1.5 mb-1 ${mine ? 'justify-end' : ''}`}
                        >
                          {m.sender_role === 'admin' ? (
                            <Shield className="h-3 w-3 text-[#FF3B3B]" />
                          ) : (
                            <User className="h-3 w-3 text-[#00D09C]" />
                          )}
                          <span className="text-[10px] font-bold text-[#555]">
                            {m.sender_role === 'admin' ? 'Support' : 'You'}
                          </span>
                          <span className="text-[9px] text-[#888]">{formatTime(m.created_at)}</span>
                        </div>
                        <div
                          className={`rounded-xl border-[2px] border-[#111] px-3 py-2 text-sm shadow-[3px_3px_0px_#111] ${
                            mine ? 'bg-[#00D09C]/15' : 'bg-[#FDEBD3]'
                          }`}
                        >
                          <p className="text-[#111] whitespace-pre-wrap">{m.body}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-[#FF3B3B]/10 border-[2px] border-[#FF3B3B]/30 px-3 py-2 mb-3 text-xs text-[#FF3B3B] font-medium">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}

            {/* Reply input */}
            {ticket.status === 'closed' ? (
              <div className="bb-card bg-[#888]/10 p-4 text-center text-xs text-[#555] font-medium">
                This ticket is closed. Open a new ticket if you need further help.
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex-1 rounded-xl border-[2px] border-[#111] px-3 py-2.5 text-sm shadow-[3px_3px_0px_#111] focus:outline-none focus:bg-[#FDEBD3]"
                />
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="bb-btn bb-btn-green px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            )}
          </>
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

function formatTime(iso: string) {
  return new Date(iso).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
}
