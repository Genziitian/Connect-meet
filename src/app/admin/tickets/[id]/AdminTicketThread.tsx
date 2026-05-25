'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Send, Loader2, AlertCircle, Shield, User } from 'lucide-react';

interface Message {
  id: string;
  body: string;
  sender_id: string;
  sender_role: 'user' | 'admin';
  created_at: string;
}

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'];

export default function AdminTicketThread({
  ticketId,
  currentStatus,
}: {
  ticketId: string;
  currentStatus: string;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState(currentStatus);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('ticket_messages')
      .select('id, body, sender_id, sender_role, created_at')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (err) setError(err.message);
    else setMessages((data || []) as Message[]);
  }, [ticketId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const channel = supabase
      .channel(`admin-ticket-${ticketId}`)
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
      sender_role: 'admin',
      body: reply.trim(),
    });
    if (err) setError(err.message);
    else setReply('');
    setSending(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    const updates: Record<string, string | null> = { status: newStatus };
    if (newStatus === 'resolved' || newStatus === 'closed') {
      updates.resolved_at = new Date().toISOString();
    }
    const { error: err } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId);
    if (err) setError(err.message);
  };

  return (
    <>
      {/* Status switcher */}
      <div className="bb-card bg-white p-3 flex items-center gap-3">
        <label className="text-xs font-bold text-[#111]">Status:</label>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="rounded-lg border-[2px] border-[#111] px-3 py-1.5 text-xs font-bold bg-white"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ').toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="bb-card bg-white p-4 h-[50vh] overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-[#888] py-8">No messages yet.</p>
        ) : (
          messages.map((m) => {
            const fromAdmin = m.sender_role === 'admin';
            return (
              <div key={m.id} className={`flex ${fromAdmin ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${fromAdmin ? 'order-2' : ''}`}>
                  <div className={`flex items-center gap-1.5 mb-1 ${fromAdmin ? 'justify-end' : ''}`}>
                    {fromAdmin ? (
                      <Shield className="h-3 w-3 text-[#FF3B3B]" />
                    ) : (
                      <User className="h-3 w-3 text-[#00D09C]" />
                    )}
                    <span className="text-[10px] font-bold text-[#555]">
                      {fromAdmin ? 'You (Support)' : 'Student'}
                    </span>
                    <span className="text-[9px] text-[#888]">{formatTime(m.created_at)}</span>
                  </div>
                  <div
                    className={`rounded-xl border-[2px] border-[#111] px-3 py-2 text-sm shadow-[3px_3px_0px_#111] ${
                      fromAdmin ? 'bg-[#FF3B3B]/10' : 'bg-[#FDEBD3]'
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
        <div className="flex items-center gap-2 rounded-xl bg-[#FF3B3B]/10 border-[2px] border-[#FF3B3B]/30 px-3 py-2 text-xs text-[#FF3B3B] font-medium">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {status === 'closed' ? (
        <div className="bb-card bg-[#888]/10 p-4 text-center text-xs text-[#555] font-medium">
          Ticket is closed. Reopen via status dropdown above.
        </div>
      ) : (
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Reply as support..."
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
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
}
