// ============================================================
// Community Room Detail — functional realtime group chat (screen 09)
// ============================================================
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import EmojiPicker from '@/components/EmojiPicker';
import {
  ArrowLeft, Send, Flag, Smile, ImageIcon, Loader2, Users, LogOut, Trash2,
  Pin, PinOff, UserX, Power, X as XIcon, Reply, Edit3, Check,
} from 'lucide-react';

const MAX_IMAGE_BYTES = 200 * 1024; // 200 KB

interface Room {
  id: string;
  slug: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  tagline: string;
  host_alias: string;
  is_active: boolean;
  requires_approval: boolean;
}

interface JoinRequest {
  id: string;
  room_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string | null;
  reject_reason: string | null;
  requested_at: string;
}

interface RoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  handle: string;
  body: string;
  image_url: string | null;
  is_deleted: boolean;
  is_pinned: boolean;
  reply_to_id: string | null;
  reply_to_handle: string | null;
  reply_to_excerpt: string | null;
  created_at: string;
}

interface RoomMember {
  user_id: string;
  handle: string;
}

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [myHandle, setMyHandle] = useState<string>('');
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMobileMembers, setShowMobileMembers] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<RoomMessage | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameBusy, setRenameBusy] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [joinRequest, setJoinRequest] = useState<JoinRequest | null>(null);
  const [joinNote, setJoinNote] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  // Load room + assign handle + load messages + members
  const init = useCallback(async () => {
    if (!user || !slug) return;
    setLoading(true);
    setError('');

    const { data: roomRow, error: roomErr } = await supabase
      .from('community_rooms')
      .select('id, slug, name, description, emoji, color, tagline, host_alias, is_active, requires_approval')
      .eq('slug', slug)
      .maybeSingle<Room>();

    if (roomErr || !roomRow) {
      setError('Room not found.');
      setLoading(false);
      return;
    }

    // Non-admins can't enter inactive rooms
    if (!roomRow.is_active && user.role !== 'admin') {
      setError('This room is currently deactivated.');
      setLoading(false);
      return;
    }
    setRoom(roomRow);

    // Assign / fetch my handle for this room via the SQL function
    const { data: handleData, error: hErr } = await supabase.rpc('assign_room_handle', {
      p_user_id: user.id,
      p_room_id: roomRow.id,
    });
    if (hErr) {
      // RPC raises 'APPROVAL_REQUIRED' when the room needs admin approval
      if (hErr.message && hErr.message.includes('APPROVAL_REQUIRED')) {
        setNeedsApproval(true);
        // Look up the user's existing request (if any)
        const { data: req } = await supabase
          .from('community_join_requests')
          .select('id, room_id, user_id, status, message, reject_reason, requested_at')
          .eq('room_id', roomRow.id)
          .eq('user_id', user.id)
          .maybeSingle<JoinRequest>();
        if (req) setJoinRequest(req);
        setLoading(false);
        return;
      }
      setError(hErr.message);
      setLoading(false);
      return;
    }
    setMyHandle(handleData as string);

    // Load last 100 messages
    const { data: msgs } = await supabase
      .from('community_messages')
      .select('id, room_id, user_id, handle, body, image_url, is_deleted, is_pinned, reply_to_id, reply_to_handle, reply_to_excerpt, created_at')
      .eq('room_id', roomRow.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(100);
    setMessages((msgs || []) as RoomMessage[]);

    // Load members (everyone with a handle in this room)
    const { data: m } = await supabase
      .from('community_handles')
      .select('user_id, handle')
      .eq('room_id', roomRow.id);
    setMembers((m || []) as RoomMember[]);

    setLoading(false);
  }, [user, slug]);

  useEffect(() => {
    init();
  }, [init]);

  // Realtime subscription to new messages
  useEffect(() => {
    if (!room) return;
    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          const msg = payload.new as RoomMessage;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_handles',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          const m = payload.new as RoomMember;
          setMembers((prev) => (prev.some((x) => x.user_id === m.user_id) ? prev : [...prev, m]));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [room]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !room || sending) return;
    // Must have either text or an image
    if (!input.trim() && !pendingImage) return;
    setSending(true);
    setError('');

    let imageUrl: string | null = null;
    if (pendingImage) {
      setUploading(true);
      const ext = pendingImage.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${room.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('community-images')
        .upload(path, pendingImage, {
          cacheControl: '31536000',
          upsert: false,
          contentType: pendingImage.type,
        });
      if (upErr) {
        setError('Image upload failed: ' + upErr.message);
        setUploading(false);
        setSending(false);
        return;
      }
      const { data: pub } = supabase.storage.from('community-images').getPublicUrl(path);
      imageUrl = pub.publicUrl;
      setUploading(false);
    }

    const { error: err } = await supabase.from('community_messages').insert({
      room_id: room.id,
      user_id: user.id,
      handle: myHandle,
      body: input.trim(),
      image_url: imageUrl,
      reply_to_id: replyingTo?.id || null,
      reply_to_handle: replyingTo?.handle || null,
      reply_to_excerpt: replyingTo ? replyingTo.body.slice(0, 200) : null,
    });

    if (err) {
      setError(err.message);
    } else {
      setInput('');
      clearPendingImage();
      setReplyingTo(null);
    }
    setSending(false);
  };

  const handleAdminRenameRoom = async () => {
    if (user?.role !== 'admin' || !room) return;
    const name = renameValue.trim();
    if (name.length < 2) {
      alert('Name must be at least 2 characters.');
      return;
    }
    setRenameBusy(true);
    // Optimistic
    setRoom({ ...room, name });
    const { error: err } = await supabase
      .from('community_rooms')
      .update({ name })
      .eq('id', room.id);
    if (err) {
      // Revert
      setRoom({ ...room, name: room.name });
      alert('Rename failed: ' + err.message);
    } else {
      supabase.from('moderation_actions').insert({
        actor_id: user.id,
        action: 'rename_room',
        target_room_id: room.id,
        metadata: { new_name: name },
      }).then(() => {});
      setRenaming(false);
    }
    setRenameBusy(false);
  };

  const handleRequestAccess = async () => {
    if (!user || !room) return;
    setSubmittingRequest(true);
    const { data, error: err } = await supabase
      .from('community_join_requests')
      .insert({
        room_id: room.id,
        user_id: user.id,
        message: joinNote.trim() || null,
      })
      .select('id, room_id, user_id, status, message, reject_reason, requested_at')
      .single();
    setSubmittingRequest(false);
    if (err) {
      alert('Failed to submit request: ' + err.message);
      return;
    }
    setJoinRequest(data as JoinRequest);
  };

  const handleReportRoom = async () => {
    if (!user || !room) return;
    const reason = window.prompt(
      `Report room "${room.name}"?\n\nReason (harassment / spam / hate_speech / nudity / other):`,
      'other'
    );
    if (!reason) return;
    const validReasons = ['harassment', 'spam', 'hate_speech', 'nudity', 'impersonation', 'other'];
    const cleaned = validReasons.includes(reason.trim()) ? reason.trim() : 'other';
    const note = window.prompt('Additional details (optional):') || '';

    // Store as a moderation_action so admins see it on the dashboard
    const { error: err } = await supabase.from('moderation_actions').insert({
      actor_id: user.id,
      action: 'report_room',
      target_room_id: room.id,
      reason: cleaned,
      metadata: { note, room_name: room.name, room_slug: room.slug },
    });
    if (err) {
      alert('Failed to submit report: ' + err.message);
    } else {
      alert('Report submitted. Our team will review the room.');
    }
  };

  const scrollToMessage = (id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('ring-2', 'ring-[#00D09C]');
    setTimeout(() => el.classList.remove('ring-2', 'ring-[#00D09C]'), 1500);
  };

  const clearPendingImage = () => {
    if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
    setPendingImage(null);
    setPendingImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(`Image is ${(file.size / 1024).toFixed(0)} KB. Max 200 KB per image.`);
      e.target.value = '';
      return;
    }
    setError('');
    if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
    setPendingImage(file);
    setPendingImagePreview(URL.createObjectURL(file));
  };

  const insertEmoji = (emoji: string) => {
    const el = inputRef.current;
    if (!el) {
      setInput((prev) => prev + emoji);
      return;
    }
    const start = el.selectionStart ?? input.length;
    const end = el.selectionEnd ?? input.length;
    const next = input.slice(0, start) + emoji + input.slice(end);
    setInput(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  const handleFlagMessage = async (msg: RoomMessage) => {
    if (!user) return;
    if (msg.user_id === user.id) return; // can't report yourself
    const reason = window.prompt(
      `Report message from ${msg.handle}?\n\n"${msg.body.slice(0, 100)}"\n\nReason (harassment / spam / hate_speech / nudity / other):`,
      'harassment'
    );
    if (!reason) return;
    const validReasons = ['harassment', 'spam', 'hate_speech', 'nudity', 'impersonation', 'underage', 'other'];
    const cleaned = validReasons.includes(reason.trim()) ? reason.trim() : 'other';
    const { error: err } = await supabase.from('reports').insert({
      reported_user_id: msg.user_id,
      reporter_user_id: user.id,
      reason: cleaned,
      description: `[community/${room?.slug}] message: "${msg.body.slice(0, 200)}"`,
    });
    if (err) {
      alert('Failed to submit report: ' + err.message);
    } else {
      alert('Report submitted. Our team will review it.');
    }
  };

  const handleAdminDeleteMessage = async (msg: RoomMessage) => {
    if (user?.role !== 'admin') return;
    if (!window.confirm(`Delete this message from ${msg.handle}?`)) return;

    // Optimistic remove
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));

    const { error: err } = await supabase
      .from('community_messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq('id', msg.id);
    if (err) {
      // Revert
      setMessages((prev) => [...prev, msg].sort((a, b) => a.created_at.localeCompare(b.created_at)));
      alert('Failed to delete: ' + err.message);
      return;
    }
    supabase.from('moderation_actions').insert({
      actor_id: user.id,
      action: 'delete_message',
      target_user_id: msg.user_id,
      target_room_id: room?.id,
      target_message_id: msg.id,
    }).then(() => {});
  };

  const handleAdminPinMessage = async (msg: RoomMessage) => {
    if (user?.role !== 'admin' || !room) return;
    const next = !msg.is_pinned;

    // Optimistic flip
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_pinned: next } : m)));

    const { error: err } = await supabase
      .from('community_messages')
      .update({
        is_pinned: next,
        pinned_at: next ? new Date().toISOString() : null,
        pinned_by: next ? user.id : null,
      })
      .eq('id', msg.id);
    if (err) {
      // Revert
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_pinned: !next } : m)));
      alert('Failed: ' + err.message);
      return;
    }
    supabase.from('moderation_actions').insert({
      actor_id: user.id,
      action: next ? 'pin_message' : 'unpin_message',
      target_user_id: msg.user_id,
      target_room_id: room.id,
      target_message_id: msg.id,
    }).then(() => {});
  };

  const handleAdminBanUser = async (targetUserId: string, targetHandle: string) => {
    if (user?.role !== 'admin') return;
    if (targetUserId === user.id) return;
    const reason = window.prompt(`Ban ${targetHandle}?\n\nThis blocks them from sending messages, joining rooms, and matching.\nReason (shown internally):`);
    if (reason === null) return;

    const { error: err } = await supabase
      .from('users')
      .update({
        is_banned: true,
        ban_reason: reason || 'Unspecified',
        ban_expires_at: null,
      })
      .eq('id', targetUserId);
    if (err) {
      alert('Failed to ban: ' + err.message);
      return;
    }
    await supabase.from('moderation_actions').insert({
      actor_id: user.id,
      action: 'ban_user',
      target_user_id: targetUserId,
      target_room_id: room?.id,
      reason: reason || 'Unspecified',
    });
    alert(`Banned ${targetHandle}.`);
  };

  const handleToggleRoomActive = async () => {
    if (user?.role !== 'admin' || !room) return;
    const next = !room.is_active;
    const action = next ? 'reactivate_room' : 'deactivate_room';
    if (!window.confirm(`${next ? 'Reactivate' : 'Deactivate'} room "${room.name}"?`)) return;

    // Optimistic flip
    setRoom({ ...room, is_active: next });

    const { error: err } = await supabase
      .from('community_rooms')
      .update({ is_active: next })
      .eq('id', room.id);
    if (err) {
      // Revert
      setRoom({ ...room, is_active: !next });
      alert('Failed: ' + err.message);
      return;
    }
    supabase.from('moderation_actions').insert({
      actor_id: user.id,
      action,
      target_room_id: room.id,
    }).then(() => {});
  };

  if (authLoading || !isAuthenticated) return null;
  if (user?.isBanned) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bb-grid flex items-center justify-center p-4">
        <div className="bb-card bg-white p-6 max-w-sm text-center">
          <p className="text-sm font-black text-[#FF3B3B] mb-2">Account suspended</p>
          <p className="text-xs text-[#555]">You can&apos;t access community rooms while banned.</p>
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bb-grid flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#888]" />
      </div>
    );
  }
  if (needsApproval && room) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bb-grid flex items-center justify-center p-4">
        <div className="bb-card bg-white p-6 max-w-md w-full">
          <Link href="/community" className="inline-flex items-center gap-1 text-xs font-bold text-[#555] hover:text-[#111] mb-4">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to community
          </Link>

          <div
            className="flex items-end h-20 -mx-6 px-6 mb-4 border-y-[2px] border-[#111]"
            style={{ backgroundColor: room.color, backgroundImage: 'repeating-linear-gradient(45deg, rgba(17,17,17,0.06) 0 4px, transparent 4px 12px)' }}
          >
            <span className="text-3xl drop-shadow-[2px_2px_0_#111]">{room.emoji}</span>
            <h1 className="text-base font-black text-white ml-2 mb-1">{room.name}</h1>
          </div>

          {joinRequest?.status === 'pending' && (
            <>
              <p className="text-sm font-black text-[#111] mb-1">⏳ Request pending</p>
              <p className="text-xs text-[#555] mb-3">
                Your request to join this room is awaiting admin approval.
                You&apos;ll be able to join once it&apos;s approved.
              </p>
              <p className="text-[10px] text-[#888]">
                Requested {new Date(joinRequest.requested_at).toLocaleString()}
              </p>
            </>
          )}

          {joinRequest?.status === 'rejected' && (
            <>
              <p className="text-sm font-black text-[#FF3B3B] mb-1">❌ Request rejected</p>
              {joinRequest.reject_reason && (
                <p className="text-xs text-[#555] mb-3">
                  <span className="font-bold">Reason:</span> {joinRequest.reject_reason}
                </p>
              )}
              <p className="text-[11px] text-[#888]">
                Contact the admin if you think this is a mistake.
              </p>
            </>
          )}

          {!joinRequest && (
            <>
              <p className="text-sm font-black text-[#111] mb-1">🔒 This room requires admin approval</p>
              <p className="text-xs text-[#555] mb-4">{room.description}</p>
              <label className="block text-[10px] font-black text-[#111] mb-1 uppercase tracking-wider">
                Why do you want to join? <span className="font-medium text-[#888]">(optional)</span>
              </label>
              <textarea
                value={joinNote}
                onChange={(e) => setJoinNote(e.target.value)}
                placeholder="Helps admins approve faster..."
                rows={3}
                maxLength={300}
                className="w-full rounded-xl border-[2px] border-[#111] px-3 py-2 text-xs shadow-[2px_2px_0_#111] focus:outline-none mb-3 resize-none"
              />
              <button
                onClick={handleRequestAccess}
                disabled={submittingRequest}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-[2px] border-[#111] bg-[#00D09C] py-2.5 text-sm font-black text-white shadow-[3px_3px_0_#111] hover:shadow-[1px_1px_0_#111] hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50 transition-all"
              >
                {submittingRequest ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Request access'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
  if (!room) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bb-grid flex flex-col items-center justify-center px-4">
        <p className="text-sm text-[#555] mb-3">{error || 'Room not found.'}</p>
        <Link href="/community" className="bb-btn bb-btn-green text-sm px-4 py-2">
          Back to rooms
        </Link>
      </div>
    );
  }

  const onlineMembers = members.slice(0, 8);
  const lurkingCount = Math.max(0, members.length - onlineMembers.length);

  return (
    <div className="h-[calc(100vh-4rem)] bb-grid flex flex-col lg:flex-row gap-0 lg:gap-4 lg:p-4 lg:max-w-7xl lg:mx-auto">
      {/* LEFT — Center chat */}
      <div className="flex-1 flex flex-col bg-white lg:rounded-2xl lg:border-[3px] lg:border-[#111] lg:shadow-[5px_5px_0_#111] overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 sm:px-4 py-3 border-b-[3px] border-[#111]"
          style={{ backgroundColor: room.color }}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/community"
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg border-[2px] border-[#111] bg-white shadow-[2px_2px_0_#111] flex-shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
            <span className="text-2xl sm:text-3xl drop-shadow-[2px_2px_0_#111]">{room.emoji}</span>
            <div className="min-w-0 flex-1">
              {renaming && user?.role === 'admin' ? (
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdminRenameRoom();
                      if (e.key === 'Escape') setRenaming(false);
                    }}
                    className="flex-1 rounded-lg border-[2px] border-[#111] bg-white px-2 py-1 text-sm sm:text-base font-black text-[#111] shadow-[2px_2px_0_#111] focus:outline-none"
                    maxLength={120}
                  />
                  <button
                    onClick={handleAdminRenameRoom}
                    disabled={renameBusy}
                    className="flex h-7 w-7 items-center justify-center rounded-md border-[2px] border-[#111] bg-[#00D09C] text-white shadow-[2px_2px_0_#111] disabled:opacity-50"
                  >
                    {renameBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => setRenaming(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border-[2px] border-[#111] bg-white shadow-[2px_2px_0_#111]"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm sm:text-lg font-black text-white truncate">{room.name}</h1>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        setRenameValue(room.name);
                        setRenaming(true);
                      }}
                      title="Rename room (admin)"
                      className="flex h-5 w-5 items-center justify-center rounded text-white/80 hover:bg-white/20 hover:text-white"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
              <p className="text-[10px] sm:text-xs text-white/90 font-bold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF3B3B] animate-pulse" />
                LIVE · {members.length} online · {room.tagline}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleReportRoom}
              className="flex items-center gap-1 rounded-lg border-[2px] border-[#111] bg-[#FBBF24] px-2 py-1 text-[10px] font-black shadow-[2px_2px_0_#111] hover:shadow-[1px_1px_0_#111] active:translate-x-[1px] active:translate-y-[1px] transition-all"
              title="Report this room"
            >
              <Flag className="h-3 w-3" /> Report
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={handleToggleRoomActive}
                title={room.is_active ? 'Deactivate room' : 'Reactivate room'}
                className={`flex items-center gap-1 rounded-lg border-[2px] border-[#111] px-2 py-1 text-[10px] font-black shadow-[2px_2px_0_#111] ${
                  room.is_active ? 'bg-[#FF3B3B] text-white' : 'bg-[#00D09C] text-white'
                }`}
              >
                <Power className="h-3 w-3" />
                <span className="hidden sm:inline">{room.is_active ? 'Deactivate' : 'Activate'}</span>
              </button>
            )}
            <button
              onClick={() => setShowMobileMembers(!showMobileMembers)}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg border-[2px] border-[#111] bg-white shadow-[2px_2px_0_#111]"
            >
              <Users className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Pinned banner */}
        <div className="m-3 rounded-xl border-[2px] border-[#111] bg-[#FBBF24] px-3 py-2 shadow-[2px_2px_0_#111] flex items-center gap-2">
          <span className="text-base">📌</span>
          <p className="text-[11px] sm:text-xs font-bold text-[#111]">
            Hosted by <span className="font-black">{room.host_alias}</span> · Anon by default. Be kind. No DMs in chat — use 1-on-1 if you click with someone.
          </p>
        </div>

        {/* Pinned messages */}
        {messages.some((m) => m.is_pinned) && (
          <div className="mx-3 mb-2 rounded-xl border-[2px] border-[#00D09C] bg-[#00D09C]/10 p-2.5 shadow-[2px_2px_0_#111]">
            <p className="text-[10px] font-black text-[#00875A] uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Pin className="h-3 w-3" /> Pinned
            </p>
            <div className="space-y-1">
              {messages.filter((m) => m.is_pinned).map((m) => (
                <div key={`pin-${m.id}`} className="flex items-start gap-2 text-[11px]">
                  <span className="font-black text-[#111] flex-shrink-0">{m.handle}:</span>
                  <span className="text-[#111] break-words">{m.body}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-4 pb-3 bg-[#FDEBD3]">
          {messages.length === 0 ? (
            <p className="text-center text-xs text-[#888] py-8">No messages yet — be the first to say hi 👋</p>
          ) : (
            renderMessagesWithDateSeparators(messages, user?.id, user?.role, room.host_alias, {
              onReply: (m) => {
                setReplyingTo(m);
                requestAnimationFrame(() => inputRef.current?.focus());
              },
              onFlag: handleFlagMessage,
              onPin: handleAdminPinMessage,
              onDelete: handleAdminDeleteMessage,
              onBan: handleAdminBanUser,
              onScrollToParent: scrollToMessage,
            })
          )}
        </div>

        {error && (
          <div className="mx-3 mb-2 rounded-lg border-[2px] border-[#FF3B3B]/30 bg-[#FF3B3B]/10 px-3 py-2 text-xs text-[#FF3B3B] font-medium">
            {error}
          </div>
        )}

        {/* Composer */}
        <div className="bg-white border-t-[2px] border-[#111]">
          {/* Reply banner */}
          {replyingTo && (
            <div className="px-3 pt-2 pb-1 flex items-center gap-2 border-b border-[#eee] bg-[#00D09C]/10">
              <Reply className="h-3.5 w-3.5 text-[#00875A] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-[#00875A]">
                  Replying to <span className="text-[#111]">{replyingTo.handle}</span>
                </p>
                <p className="text-[11px] text-[#555] truncate">
                  {replyingTo.body || (replyingTo.image_url ? '📷 Image' : '...')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border-[2px] border-[#111] bg-white text-[#888] shadow-[2px_2px_0_#111]"
                title="Cancel reply"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Pending image preview */}
          {pendingImagePreview && (
            <div className="px-3 pt-2 pb-1 border-b border-[#eee] flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingImagePreview}
                alt=""
                className="h-16 w-16 rounded-lg border-[2px] border-[#111] shadow-[2px_2px_0_#111] object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#111] truncate">{pendingImage?.name}</p>
                <p className="text-[10px] text-[#888]">{((pendingImage?.size || 0) / 1024).toFixed(1)} KB · max 200 KB</p>
              </div>
              <button
                type="button"
                onClick={clearPendingImage}
                className="flex h-7 w-7 items-center justify-center rounded-lg border-[2px] border-[#111] bg-white text-[#FF3B3B] shadow-[2px_2px_0_#111]"
                title="Remove image"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="p-2 sm:p-3 flex items-center gap-1.5 sm:gap-2 relative">
            {/* Emoji button + popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmoji((v) => !v)}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border-[2px] border-[#111] shadow-[2px_2px_0_#111] transition-colors ${
                  showEmoji ? 'bg-[#FDEBD3]' : 'bg-white hover:bg-[#FDEBD3]'
                }`}
                title="Emoji"
              >
                <Smile className="h-4 w-4 text-[#888]" />
              </button>
              {showEmoji && (
                <EmojiPicker
                  onPick={(emoji) => insertEmoji(emoji)}
                  onClose={() => setShowEmoji(false)}
                />
              )}
            </div>

            {/* Image button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelected}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-9 w-9 items-center justify-center rounded-xl border-[2px] border-[#111] bg-white hover:bg-[#FDEBD3] shadow-[2px_2px_0_#111] transition-colors"
              title="Attach image (max 200KB)"
            >
              <ImageIcon className="h-4 w-4 text-[#888]" />
            </button>

            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message #${room.slug}…`}
              className="flex-1 min-w-0 rounded-xl border-[2px] border-[#111] bg-[#FDEBD3] px-3 py-2 text-sm shadow-[2px_2px_0_#111] focus:outline-none focus:bg-white"
            />
            <button
              type="submit"
              disabled={sending || uploading || (!input.trim() && !pendingImage)}
              className="flex items-center gap-1 h-9 px-3 sm:px-4 rounded-xl bg-[#00D09C] border-[2px] border-[#111] text-white text-xs font-black shadow-[2px_2px_0_#111] hover:shadow-[1px_1px_0_#111] hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50 transition-all"
            >
              {sending || uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{uploading ? 'Uploading…' : 'Send'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT — Members sidebar (desktop) */}
      <aside className="hidden lg:flex w-72 flex-col bg-white rounded-2xl border-[3px] border-[#111] shadow-[5px_5px_0_#111] overflow-hidden">
        <div className="px-4 py-3 border-b-[2px] border-[#111] bg-white">
          <p className="text-[10px] font-black text-[#888] tracking-wider uppercase">In this room</p>
          <p className="text-lg font-black text-[#111] mt-0.5">{members.length} student{members.length === 1 ? '' : 's'}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <MemberSection
            label="Active now"
            members={onlineMembers}
            currentUserId={user?.id || ''}
            hostAlias={room.host_alias}
          />
          {lurkingCount > 0 && (
            <p className="text-[10px] font-black text-[#888] tracking-wider uppercase mt-4 mb-2">
              Lurking · {lurkingCount}
            </p>
          )}
        </div>

        <div className="border-t-[2px] border-[#111] p-3">
          <Link
            href="/community"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FF3B3B] border-[2px] border-[#111] py-2 text-xs font-black text-white shadow-[2px_2px_0_#111] hover:shadow-[1px_1px_0_#111] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            <LogOut className="h-3.5 w-3.5" /> Leave room
          </Link>
        </div>
      </aside>

      {/* Mobile members drawer */}
      {showMobileMembers && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40 flex justify-end"
          onClick={() => setShowMobileMembers(false)}
        >
          <div
            className="w-72 bg-white border-l-[3px] border-[#111] h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b-[2px] border-[#111]">
              <p className="text-[10px] font-black text-[#888] tracking-wider uppercase">In this room</p>
              <p className="text-lg font-black text-[#111]">{members.length} students</p>
            </div>
            <div className="p-3">
              <MemberSection
                label="Active now"
                members={onlineMembers}
                currentUserId={user?.id || ''}
                hostAlias={room.host_alias}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MemberSection({
  label,
  members,
  currentUserId,
  hostAlias,
}: {
  label: string;
  members: RoomMember[];
  currentUserId: string;
  hostAlias: string;
}) {
  return (
    <>
      <p className="text-[10px] font-black text-[#888] tracking-wider uppercase mb-2">
        {label} · {members.length}
      </p>
      {members.map((m) => (
        <div key={m.user_id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#FDEBD3]">
          <Avatar handle={m.handle} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#111] truncate">
              {m.handle}
              {m.user_id === currentUserId && <span className="text-[#888] font-medium"> (you)</span>}
            </p>
            <p className="text-[9px] text-[#888]">
              {m.handle === hostAlias ? <span className="text-[#FF6B6B] font-black">HOST</span> : 'active'}
            </p>
          </div>
        </div>
      ))}
    </>
  );
}

const COLORS = ['#B794F6', '#FB923C', '#00D09C', '#FF6B6B', '#FBBF24'];

function Avatar({ handle }: { handle: string }) {
  const color = COLORS[hashStr(handle) % COLORS.length];
  const initial = (handle || '?').charAt(0).toUpperCase();
  return (
    <div
      className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full border-[2px] border-[#111] flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      <span className="text-[11px] sm:text-sm font-black text-white">{initial}</span>
    </div>
  );
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(d: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return target.toLocaleDateString([], { weekday: 'long' });
  }
  return target.toLocaleDateString([], { month: 'short', day: 'numeric', year: target.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
}

interface MessageHandlers {
  onReply: (m: RoomMessage) => void;
  onFlag: (m: RoomMessage) => void;
  onPin: (m: RoomMessage) => void;
  onDelete: (m: RoomMessage) => void;
  onBan: (userId: string, handle: string) => void;
  onScrollToParent: (id: string) => void;
}

function renderMessagesWithDateSeparators(
  messages: RoomMessage[],
  currentUserId: string | undefined,
  currentRole: string | undefined,
  hostAlias: string,
  handlers: MessageHandlers
) {
  const nodes: React.ReactNode[] = [];
  let lastDateKey = '';

  for (const m of messages) {
    const d = new Date(m.created_at);
    const key = d.toDateString();
    if (key !== lastDateKey) {
      nodes.push(
        <div key={`sep-${key}`} className="flex items-center gap-2 my-4">
          <div className="h-px flex-1 bg-[#111]/15" />
          <span className="rounded-full border-[2px] border-[#111] bg-white px-3 py-0.5 text-[10px] font-black text-[#111] shadow-[2px_2px_0_#111]">
            {formatDateLabel(d)}
          </span>
          <div className="h-px flex-1 bg-[#111]/15" />
        </div>
      );
      lastDateKey = key;
    }

    const fromMe = m.user_id === currentUserId;
    const isHost = m.handle === hostAlias;
    const isAdmin = currentRole === 'admin';

    nodes.push(
      <div
        key={m.id}
        id={`msg-${m.id}`}
        className={`group flex w-full mt-3 ${fromMe ? 'justify-end' : 'justify-start'}`}
      >
        <div className={`flex items-start gap-2 sm:gap-3 max-w-[85%] sm:max-w-[75%] ${fromMe ? 'flex-row-reverse' : 'flex-row'}`}>
          <Avatar handle={m.handle} />
          <div className={`min-w-0 ${fromMe ? 'text-right' : 'text-left'}`}>
            <p className={`text-[11px] font-bold mb-0.5 flex items-center gap-1.5 flex-wrap ${fromMe ? 'justify-end' : 'justify-start'}`}>
              <span className="text-[#111]">{fromMe ? `${m.handle} (you)` : m.handle}</span>
              {isHost && (
                <span className="rounded-full bg-[#FF6B6B] border border-[#111] px-1.5 py-px text-[8px] font-black uppercase text-white">
                  Host
                </span>
              )}
              <span className="text-[#888] font-medium">{formatTime(m.created_at)}</span>
            </p>

            {/* Reply context */}
            {m.reply_to_id && (
              <button
                type="button"
                onClick={() => handlers.onScrollToParent(m.reply_to_id!)}
                className={`block w-full mb-1 rounded-lg ${fromMe ? 'border-r-[3px] text-right' : 'border-l-[3px] text-left'} border-[#00D09C] bg-white/70 px-2 py-1 hover:bg-white`}
              >
                <p className={`text-[10px] font-black text-[#00875A] flex items-center gap-1 ${fromMe ? 'justify-end' : 'justify-start'}`}>
                  <Reply className="h-2.5 w-2.5" />
                  Replying to {m.reply_to_handle}
                </p>
                <p className="text-[11px] text-[#555] truncate">{m.reply_to_excerpt}</p>
              </button>
            )}

            {/* Message bubble */}
            {m.body && (
              <div
                className={`inline-block max-w-full rounded-2xl border-[2px] border-[#111] px-3 py-2 shadow-[2px_2px_0_#111] ${
                  fromMe
                    ? 'bg-[#00D09C] text-white rounded-tr-md'
                    : 'bg-white text-[#111] rounded-tl-md'
                }`}
              >
                <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-snug">
                  {m.body}
                </p>
              </div>
            )}
            {m.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.image_url}
                alt=""
                className={`mt-1 max-h-60 max-w-[260px] rounded-xl border-[2px] border-[#111] shadow-[2px_2px_0_#111] object-contain bg-white ${fromMe ? 'ml-auto' : ''}`}
                loading="lazy"
              />
            )}
          </div>

          {/* Action buttons — always on the outer side (away from screen edge) */}
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Reply — anyone can reply to any message */}
            <button
              onClick={() => handlers.onReply(m)}
              title="Reply"
              className="flex h-6 w-6 items-center justify-center rounded-md bg-[#00D09C]/40 hover:bg-[#00D09C] hover:text-white border border-[#111]"
            >
              <Reply className="h-3 w-3" />
            </button>
            {!fromMe && (
              <button
                onClick={() => handlers.onFlag(m)}
                title="Report this message"
                className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FBBF24]/40 hover:bg-[#FBBF24] border border-[#111]"
              >
                <Flag className="h-3 w-3" />
              </button>
            )}
            {isAdmin && (
              <>
                <button
                  onClick={() => handlers.onPin(m)}
                  title={m.is_pinned ? 'Unpin' : 'Pin to top'}
                  className={`flex h-6 w-6 items-center justify-center rounded-md border border-[#111] ${m.is_pinned ? 'bg-[#00D09C] text-white' : 'bg-[#00D09C]/40 hover:bg-[#00D09C] hover:text-white'}`}
                >
                  {m.is_pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                </button>
                {!fromMe && (
                  <>
                    <button
                      onClick={() => handlers.onBan(m.user_id, m.handle)}
                      title="Ban user (admin)"
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-[#B794F6]/40 hover:bg-[#B794F6] hover:text-white border border-[#111]"
                    >
                      <UserX className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handlers.onDelete(m)}
                      title="Delete (admin)"
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FF3B3B]/40 hover:bg-[#FF3B3B] hover:text-white border border-[#111]"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  return nodes;
}
