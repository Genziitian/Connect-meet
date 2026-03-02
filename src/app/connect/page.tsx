// ============================================================
// Connect Page — GenZ IITian Connect (Main Feature)
// Real Socket.IO + WebRTC + Prefilled Messages
// ============================================================
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { COMMUNITY_RULES, STUDY_TOPICS, COURSE_LEVELS, DEGREE_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { ChatMode, ChatMessage, MatchFilter, ReportReason } from '@/types';
import { io as socketIO, Socket } from 'socket.io-client';
import {
  Shield,
  MessageSquare,
  Video,
  Send,
  X,
  SkipForward,
  Flag,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Settings,
  Zap,
  User,
  Clock,
  ChevronDown,
  Mic,
  MicOff,
  VideoIcon,
  VideoOff,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Camera,
  Sparkles,
} from 'lucide-react';

type ConnectPhase = 'rules' | 'lobby' | 'queue' | 'chat' | 'ended';

// ─── Prefilled / Icebreaker Messages ───
const ICEBREAKER_MESSAGES = [
  { emoji: '👋', text: 'Hey! Which course are you in?' },
  { emoji: '📚', text: 'Struggling with assignments too?' },
  { emoji: '🤝', text: 'Wanna form a study group?' },
  { emoji: '💡', text: 'Any tips for the upcoming quiz?' },
  { emoji: '😅', text: 'Online degree life hits different huh' },
  { emoji: '🎯', text: 'What term are you in right now?' },
];

const QUICK_REPLIES = [
  'Same here! 😄',
  'That\'s cool!',
  'Tell me more',
  'I feel you 😂',
  'Totally agree!',
  'No way! 😮',
];

// System messages shown at chat start
const SYSTEM_MESSAGES: ChatMessage[] = [
  {
    id: 'sys_1',
    sessionId: '',
    senderId: 'system',
    content: '🔒 This chat is anonymous and encrypted. No content is stored.',
    timestamp: new Date().toISOString(),
    type: 'system',
  },
  {
    id: 'sys_2',
    sessionId: '',
    senderId: 'system',
    content: '📋 Community rules apply. Report any violations.',
    timestamp: new Date().toISOString(),
    type: 'system',
  },
];

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export default function ConnectPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [phase, setPhase] = useState<ConnectPhase>('rules');
  const [mode, setMode] = useState<ChatMode>('text');
  const [rulesAccepted, setRulesAccepted] = useState(false);

  // Socket state
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  // Queue state
  const [queueTime, setQueueTime] = useState(0);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MatchFilter>({});

  // Chat state
  const [sessionId, setSessionId] = useState('');
  const [peerName, setPeerName] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [peerTyping, setPeerTyping] = useState(false);
  const [showIcebreakers, setShowIcebreakers] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Video / Camera state
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [remoteStreamActive, setRemoteStreamActive] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  // Report state
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('harassment');
  const [reportDescription, setReportDescription] = useState('');

  // Rating state
  const [rating, setRating] = useState<'good' | 'bad' | null>(null);

  // Typing timer ref
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Store sessionId in ref so callbacks always have latest
  const sessionIdRef = useRef('');
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  // ─── Camera / WebRTC Functions ───

  const startCamera = useCallback(async () => {
    try {
      setCameraError('');
      // Stop any existing stream first
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true,
      });
      localStreamRef.current = stream;
      // Attach to video element — use rAF to ensure DOM is painted
      const attachStream = () => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }
      };
      attachStream();
      // Also retry after a short delay in case the element wasn't ready
      requestAnimationFrame(attachStream);
      setTimeout(attachStream, 100);
      setCameraReady(true);
    } catch (err: any) {
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : err.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : err.name === 'NotReadableError'
          ? 'Camera is being used by another application.'
          : `Camera error: ${err.message}`
      );
      setCameraReady(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  const cleanupWebRTC = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    stopCamera();
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, [stopCamera]);

  const createPeerConnection = useCallback((sid: string, socket: Socket) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
        {
          urls: 'turn:openrelay.metered.ca:443?transport=tcp',
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
      ],
      iceCandidatePoolSize: 10,
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] ICE candidate:', event.candidate.type, event.candidate.protocol);
        socket.emit('webrtc:ice-candidate', {
          sessionId: sid,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        console.log('[WebRTC] ICE failed, attempting restart...');
        pc.restartIce();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC] Remote track received:', event.track.kind);
      if (event.streams[0]) {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setRemoteStreamActive(true);
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    peerConnectionRef.current = pc;
    return pc;
  }, []);

  // ─── Initialize Socket Connection ───
  useEffect(() => {
    const socket = socketIO(SOCKET_URL, {
      auth: { userId: user?.id || `anon_${Date.now()}` },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
    });

    // Stats updates
    socket.on('stats:update', (stats: { onlineUsers: number }) => {
      setOnlineCount(stats.onlineUsers || 0);
    });

    // Queue events
    socket.on('queue:joined', () => {
      // queued
    });

    // Matched!
    socket.on('queue:matched', async ({ sessionId: sid, mode: matchMode, peerName: name, isInitiator }: { sessionId: string; mode: string; peerName: string; isInitiator: boolean }) => {
      console.log('[Socket] Matched!', sid, name, 'initiator:', isInitiator);
      setSessionId(sid);
      setPeerName(name);
      setMessages(SYSTEM_MESSAGES.map((m) => ({ ...m, sessionId: sid })));
      setShowIcebreakers(true);
      setRemoteStreamActive(false);
      setPhase('chat');

      // If video mode and I'm the initiator, create the offer
      if (matchMode === 'video' && isInitiator) {
        // Wait a moment for peer to be ready
        await new Promise(r => setTimeout(r, 500));
        if (!localStreamRef.current) {
          await startCamera();
        }
        const pc = createPeerConnection(sid, socket);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc:offer', { sessionId: sid, offer });
          console.log('[WebRTC] Offer created and sent (initiator)');
        } catch (err) {
          console.error('[WebRTC] Error creating offer:', err);
        }
      }
    });

    // Incoming messages
    socket.on('chat:message', (msg: { id: string; sessionId: string; content: string; timestamp: string }) => {
      setMessages((prev) => [...prev, {
        id: msg.id,
        sessionId: msg.sessionId,
        senderId: 'peer',
        content: msg.content,
        timestamp: msg.timestamp,
        type: 'text',
      }]);
      setShowIcebreakers(false);
    });

    // Typing
    socket.on('chat:typing', () => setPeerTyping(true));
    socket.on('chat:stop-typing', () => setPeerTyping(false));

    // Chat ended by peer
    socket.on('chat:ended', ({ endedBy }: { endedBy: string }) => {
      if (endedBy === 'peer') {
        setMessages((prev) => [...prev, {
          id: `sys_end_${Date.now()}`,
          sessionId: '',
          senderId: 'system',
          content: '👋 The other person has left the chat.',
          timestamp: new Date().toISOString(),
          type: 'system',
        }]);
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      setRemoteStreamActive(false);
      setPhase('ended');
    });

    // WebRTC signaling — receive offer (I'm the non-initiator)
    socket.on('webrtc:offer', async ({ sessionId: sid, offer }: { sessionId: string; offer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] Received offer, creating answer...');
      if (!localStreamRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
            audio: true,
          });
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          setCameraReady(true);
        } catch (e) {
          console.error('[WebRTC] Camera failed on offer receive:', e);
        }
      }

      // Close any existing peer connection first
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      const pc = createPeerConnection(sid, socket);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        // Flush queued ICE candidates
        for (const c of pendingCandidatesRef.current) {
          try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
        }
        pendingCandidatesRef.current = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc:answer', { sessionId: sid, answer });
        console.log('[WebRTC] Answer created and sent');
      } catch (err) {
        console.error('[WebRTC] Error handling offer:', err);
      }
    });

    socket.on('webrtc:answer', async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] Received answer, setting remote description...');
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          // Flush queued ICE candidates
          for (const c of pendingCandidatesRef.current) {
            try { await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(c)); } catch {}
          }
          pendingCandidatesRef.current = [];
          console.log('[WebRTC] Remote description set — connection should establish');
        } catch (err) {
          console.error('[WebRTC] Error setting answer:', err);
        }
      }
    });

    socket.on('webrtc:ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (!candidate) return;
      const pc = peerConnectionRef.current;
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[WebRTC] Failed to add ICE candidate:', e);
        }
      } else {
        // Queue candidates until remote description is set
        console.log('[WebRTC] Queueing ICE candidate (no remote description yet)');
        pendingCandidatesRef.current.push(candidate);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, startCamera, createPeerConnection]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  // Queue timer
  useEffect(() => {
    if (phase !== 'queue') return;
    const interval = setInterval(() => {
      setQueueTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Re-attach local camera stream whenever the phase changes
  // (React unmounts the old <video> and mounts a new one on phase switch)
  useEffect(() => {
    if (localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [phase, cameraReady]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, peerTyping]);

  // ─── Toggle Camera Controls ───

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // ─── Chat Handlers ───

  const handleSendMessage = useCallback((text?: string) => {
    const messageText = text || inputMessage.trim();
    if (!messageText) return;

    const msg: ChatMessage = {
      id: `self_${Date.now()}`,
      sessionId: sessionIdRef.current,
      senderId: 'self',
      content: messageText,
      timestamp: new Date().toISOString(),
      type: 'text',
    };
    setMessages((prev) => [...prev, msg]);
    setInputMessage('');
    setShowIcebreakers(false);

    socketRef.current?.emit('chat:message', {
      sessionId: sessionIdRef.current,
      content: messageText,
    });
    socketRef.current?.emit('chat:stop-typing', { sessionId: sessionIdRef.current });
  }, [inputMessage]);

  const handleTyping = useCallback(() => {
    socketRef.current?.emit('chat:typing', { sessionId: sessionIdRef.current });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('chat:stop-typing', { sessionId: sessionIdRef.current });
    }, 2000);
  }, []);

  const handleEndChat = () => {
    socketRef.current?.emit('chat:end', { sessionId });
    cleanupWebRTC();
    setPhase('ended');
  };

  const handleSkip = () => {
    socketRef.current?.emit('chat:end', { sessionId });
    cleanupWebRTC();
    setMessages([]);
    setQueueTime(0);
    setPhase('queue');
    socketRef.current?.emit('queue:join', { mode, filters });
  };

  const handleReconnect = () => {
    setMessages([]);
    setQueueTime(0);
    setRating(null);
    setPhase('queue');
    socketRef.current?.emit('queue:join', { mode, filters });
  };

  const handleReport = () => {
    socketRef.current?.emit('chat:report', {
      sessionId,
      reason: reportReason,
      description: reportDescription,
    });
    setShowReport(false);
    setReportReason('harassment');
    setReportDescription('');
    cleanupWebRTC();
    setPhase('ended');
  };

  const handleStartQueue = async () => {
    if (mode === 'video') {
      await startCamera();
    }
    setPhase('queue');
    setQueueTime(0);
    socketRef.current?.emit('queue:join', { mode, filters });
  };

  const canUseFilters = user?.planType === 'pro' || user?.planType === 'premium';

  if (!isAuthenticated) return null;

  // ═══════════════════════════════════════════
  // PHASE: Rules Acceptance
  // ═══════════════════════════════════════════
  if (phase === 'rules') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-accent/10 mb-4">
              <Shield className="h-7 w-7 text-brand-accent" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">Community Safety Rules</h1>
            <p className="text-brand-text-secondary text-sm">
              You must agree to these rules before connecting. Violations result in permanent ban.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-brand-border bg-brand-card p-6">
            {/* Connection status */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className={cn(
                'h-2 w-2 rounded-full',
                isConnected ? 'bg-brand-success animate-pulse' : 'bg-brand-danger'
              )} />
              <span className="text-xs text-brand-text-muted">
                {isConnected ? `Server connected • ${onlineCount} online` : 'Connecting to server...'}
              </span>
            </div>

            <div className="space-y-3 mb-6">
              {COMMUNITY_RULES.map((rule) => (
                <div key={rule.title} className="flex items-start gap-3 rounded-lg bg-brand-bg border border-brand-border p-3">
                  <span className="text-lg mt-0.5">{rule.icon}</span>
                  <div>
                    <p className="text-sm font-semibold">{rule.title}</p>
                    <p className="text-xs text-brand-text-muted mt-0.5">{rule.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <label className="flex items-start gap-3 p-3 rounded-lg bg-brand-accent/5 border border-brand-accent/20 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={rulesAccepted}
                onChange={(e) => setRulesAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-brand-border bg-brand-bg text-brand-accent focus:ring-brand-accent"
              />
              <div>
                <p className="text-sm font-semibold">I Agree to All Rules</p>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  I understand that any violation will result in permanent ban and may be reported to authorities.
                </p>
              </div>
            </label>

            <button
              onClick={() => setPhase('lobby')}
              disabled={!rulesAccepted || !isConnected}
              className="w-full glow-btn flex items-center justify-center gap-2 rounded-lg bg-brand-accent py-3 text-sm font-semibold text-white hover:bg-brand-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {!isConnected ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Continue to Lobby
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // PHASE: Lobby (mode selection + filters)
  // ═══════════════════════════════════════════
  if (phase === 'lobby') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-white mb-2">Study Connect</h1>
            <p className="text-brand-text-secondary text-sm">
              Choose your mode and start connecting with verified students
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="flex items-center gap-1.5 rounded-full bg-brand-success/10 px-3 py-1 text-xs text-brand-success">
                <span className="h-2 w-2 rounded-full bg-brand-success animate-pulse" />
                {onlineCount > 0 ? `${onlineCount} students online` : 'Online students nearby'}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-brand-border bg-brand-card p-6 space-y-6">
            {/* Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-3">Chat Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode('text')}
                  className={cn(
                    'relative rounded-xl border p-4 text-center transition-all',
                    mode === 'text'
                      ? 'border-brand-accent bg-brand-accent/10 ring-1 ring-brand-accent/30'
                      : 'border-brand-border bg-brand-bg hover:border-brand-accent/30'
                  )}
                >
                  <MessageSquare className="h-8 w-8 text-brand-accent mx-auto mb-2" />
                  <p className="text-sm font-semibold">Text Chat</p>
                  <p className="text-xs text-brand-text-muted mt-1">Free for all</p>
                </button>
                <button
                  onClick={() => setMode('video')}
                  className={cn(
                    'relative rounded-xl border p-4 text-center transition-all',
                    mode === 'video'
                      ? 'border-brand-accent bg-brand-accent/10 ring-1 ring-brand-accent/30'
                      : 'border-brand-border bg-brand-bg hover:border-brand-accent/30'
                  )}
                >
                  <Video className="h-8 w-8 text-brand-accent mx-auto mb-2" />
                  <p className="text-sm font-semibold">Video Chat</p>
                  <p className="text-xs text-brand-text-muted mt-1">Camera + Text</p>
                </button>
              </div>
            </div>

            {/* Camera preview for video mode */}
            {mode === 'video' && (
              <div className="space-y-3">
                <div className="relative aspect-video rounded-xl bg-brand-bg border-2 border-brand-border overflow-hidden">
                  {cameraReady ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Camera className="h-10 w-10 text-brand-text-muted mb-3" />
                      <p className="text-sm text-brand-text-muted">Camera preview</p>
                    </div>
                  )}
                  {cameraReady && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                      <button
                        onClick={toggleMute}
                        className={cn(
                          'rounded-full p-2 backdrop-blur-sm transition-colors',
                          isMuted ? 'bg-red-500/80 text-white' : 'bg-black/50 text-white hover:bg-black/70'
                        )}
                      >
                        {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={toggleVideo}
                        className={cn(
                          'rounded-full p-2 backdrop-blur-sm transition-colors',
                          isVideoOff ? 'bg-red-500/80 text-white' : 'bg-black/50 text-white hover:bg-black/70'
                        )}
                      >
                        {isVideoOff ? <VideoOff className="h-4 w-4" /> : <VideoIcon className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                </div>
                {cameraError && (
                  <p className="text-xs text-brand-danger text-center">{cameraError}</p>
                )}
                <button
                  onClick={cameraReady ? stopCamera : startCamera}
                  className={cn(
                    'w-full rounded-lg border py-2.5 text-sm font-medium transition-colors',
                    cameraReady
                      ? 'border-brand-danger/30 text-brand-danger hover:bg-brand-danger/10'
                      : 'border-brand-accent/30 text-brand-accent hover:bg-brand-accent/10'
                  )}
                >
                  {cameraReady ? 'Stop Camera' : 'Test Camera'}
                </button>
              </div>
            )}

            {/* Filters Section */}
            <div>
              <button
                onClick={() => canUseFilters && setShowFilters(!showFilters)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors',
                  canUseFilters
                    ? 'border-brand-border hover:border-brand-accent/30 cursor-pointer'
                    : 'border-brand-border opacity-60 cursor-not-allowed',
                )}
              >
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-brand-accent" />
                  <span className="font-medium">Smart Matching Filters</span>
                  {!canUseFilters && (
                    <span className="rounded-full bg-brand-warning/10 px-2 py-0.5 text-xs text-brand-warning">Pro+</span>
                  )}
                </span>
                <ChevronDown className={cn('h-4 w-4 text-brand-text-muted transition-transform', showFilters && 'rotate-180')} />
              </button>

              {showFilters && canUseFilters && (
                <div className="mt-3 space-y-3 rounded-lg border border-brand-border bg-brand-bg p-4">
                  <FilterSelect label="Study Topic" value={filters.topic} onChange={(v) => setFilters({ ...filters, topic: v })} options={STUDY_TOPICS} />
                  <FilterSelect label="Course Level" value={filters.courseLevel} onChange={(v) => setFilters({ ...filters, courseLevel: v })} options={COURSE_LEVELS} />
                  <FilterSelect label="Degree Type" value={filters.degreeType} onChange={(v) => setFilters({ ...filters, degreeType: v })} options={DEGREE_TYPES} />
                </div>
              )}
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartQueue}
              disabled={!isConnected}
              className="w-full glow-btn flex items-center justify-center gap-2 rounded-full bg-brand-accent py-4 text-base font-black text-white hover:bg-brand-accent-hover disabled:opacity-50 transition-colors"
            >
              <Zap className="h-5 w-5" />
              {mode === 'video' ? 'Start Video Connect' : 'Start Random Connect'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // PHASE: Queue (searching for match)
  // ═══════════════════════════════════════════
  if (phase === 'queue') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          {/* Show camera preview while in queue for video mode */}
          {mode === 'video' && cameraReady && (
            <div className="relative aspect-video rounded-2xl bg-brand-bg border-2 border-brand-border overflow-hidden mb-6 mx-auto max-w-xs">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <div className="absolute top-2 left-2 rounded-full bg-brand-accent/20 backdrop-blur-sm px-2 py-1 text-[10px] text-brand-accent font-medium">
                You
              </div>
            </div>
          )}

          {/* Animated searching indicator */}
          <div className="relative mb-8">
            <div className="mx-auto h-32 w-32 rounded-full border-4 border-brand-accent/20 flex items-center justify-center">
              <div className="h-24 w-24 rounded-full border-4 border-brand-accent/40 flex items-center justify-center animate-pulse">
                <div className="h-16 w-16 rounded-full bg-brand-accent/20 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-brand-accent" />
                </div>
              </div>
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-brand-accent" />
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-brand-accent" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-white mb-2">Finding Your Study Partner</h2>
          <p className="text-brand-text-secondary text-sm mb-2">
            Matching you with a verified student
            <span className="inline-flex ml-1">
              <span className="dot-animate h-1 w-1 rounded-full bg-brand-accent mx-0.5" />
              <span className="dot-animate h-1 w-1 rounded-full bg-brand-accent mx-0.5" />
              <span className="dot-animate h-1 w-1 rounded-full bg-brand-accent mx-0.5" />
            </span>
          </p>
          <p className="text-xs text-brand-accent mb-6">
            💡 Open this page in another browser to test matching!
          </p>

          {/* Queue info */}
          <div className="rounded-2xl border-2 border-brand-border bg-brand-card p-6 space-y-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-text-muted flex items-center gap-2">
                <Clock className="h-4 w-4" /> Wait time
              </span>
              <span className="font-mono font-bold text-brand-text-primary">
                {Math.floor(queueTime / 60)}:{(queueTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-text-muted flex items-center gap-2">
                <User className="h-4 w-4" /> Online
              </span>
              <span className="font-mono font-bold text-brand-text-primary">{onlineCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-text-muted flex items-center gap-2">
                {mode === 'text' ? <MessageSquare className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                Mode
              </span>
              <span className="font-medium text-brand-accent capitalize">{mode} Chat</span>
            </div>
          </div>

          <button
            onClick={() => {
              socketRef.current?.emit('queue:leave');
              cleanupWebRTC();
              setPhase('lobby');
            }}
            className="rounded-lg border border-brand-border px-6 py-2.5 text-sm font-medium text-brand-text-secondary hover:text-brand-text-primary hover:border-brand-accent/50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // PHASE: Chat (active conversation)
  // ═══════════════════════════════════════════
  if (phase === 'chat') {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Chat header */}
        <div className="flex items-center justify-between border-b border-brand-border bg-brand-card px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-accent/20">
              <User className="h-4 w-4 text-brand-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold">{peerName}</p>
              <p className="text-xs text-brand-success flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-success" />
                {peerTyping ? 'Typing...' : 'Connected'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'video' && (
              <>
                <button
                  onClick={toggleMute}
                  className={cn(
                    'rounded-lg p-2 transition-colors',
                    isMuted ? 'bg-brand-danger/20 text-brand-danger' : 'bg-brand-bg text-brand-text-muted hover:text-brand-text-primary'
                  )}
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <button
                  onClick={toggleVideo}
                  className={cn(
                    'rounded-lg p-2 transition-colors',
                    isVideoOff ? 'bg-brand-danger/20 text-brand-danger' : 'bg-brand-bg text-brand-text-muted hover:text-brand-text-primary'
                  )}
                >
                  {isVideoOff ? <VideoOff className="h-4 w-4" /> : <VideoIcon className="h-4 w-4" />}
                </button>
              </>
            )}
            <button
              onClick={handleSkip}
              className="rounded-lg bg-brand-bg p-2 text-brand-text-muted hover:text-brand-warning transition-colors"
              title="Skip to next"
            >
              <SkipForward className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowReport(true)}
              className="rounded-lg bg-brand-bg p-2 text-brand-text-muted hover:text-brand-danger transition-colors"
              title="Report user"
            >
              <Flag className="h-4 w-4" />
            </button>
            <button
              onClick={handleEndChat}
              className="rounded-lg bg-brand-danger/10 px-3 py-2 text-sm font-medium text-brand-danger hover:bg-brand-danger/20 transition-colors"
            >
              End Chat
            </button>
          </div>
        </div>

        {/* Video section (if video mode) */}
        {mode === 'video' && (
          <div className="grid grid-cols-2 gap-2 p-2 bg-brand-bg border-b border-brand-border">
            <div className="relative aspect-video rounded-xl bg-brand-chat border border-brand-border overflow-hidden">
              {cameraReady && !isVideoOff ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  {isVideoOff ? (
                    <>
                      <VideoOff className="h-8 w-8 text-brand-text-muted mb-2" />
                      <p className="text-xs text-brand-text-muted">Camera Off</p>
                    </>
                  ) : (
                    <>
                      <User className="h-12 w-12 text-brand-accent/30 mb-2" />
                      <p className="text-xs text-brand-text-muted">Your Camera</p>
                    </>
                  )}
                </div>
              )}
              <div className="absolute top-2 left-2 rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5 text-[10px] text-white font-medium">
                You
              </div>
            </div>

            <div className="relative aspect-video rounded-xl bg-brand-chat border border-brand-border overflow-hidden">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={cn('w-full h-full object-cover', !remoteStreamActive && 'hidden')}
              />
              {!remoteStreamActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <User className="h-12 w-12 text-brand-accent/30 mb-2" />
                  <p className="text-xs text-brand-text-muted">{peerName}</p>
                  <p className="text-[10px] text-brand-text-muted mt-1 animate-pulse">Connecting video...</p>
                </div>
              )}
              <div className="absolute top-2 left-2 rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5 text-[10px] text-white font-medium">
                {peerName}
              </div>
            </div>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-brand-chat">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'max-w-[80%]',
                msg.type === 'system' && 'mx-auto max-w-none text-center',
                msg.senderId === 'self' && 'ml-auto',
                msg.senderId === 'peer' && 'mr-auto',
              )}
            >
              {msg.type === 'system' ? (
                <div className="rounded-lg bg-brand-bg/50 border border-brand-border px-4 py-2 text-xs text-brand-text-muted">
                  {msg.content}
                </div>
              ) : (
                <div
                  className={cn(
                    'rounded-2xl px-4 py-2.5',
                    msg.senderId === 'self'
                      ? 'bg-brand-accent text-white rounded-br-md'
                      : 'bg-brand-card border border-brand-border text-brand-text-primary rounded-bl-md'
                  )}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className={cn('text-[10px] mt-1', msg.senderId === 'self' ? 'text-white/60' : 'text-brand-text-muted')}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
            </div>
          ))}

          {peerTyping && (
            <div className="mr-auto max-w-[80%]">
              <div className="rounded-2xl bg-brand-card border border-brand-border px-4 py-3 rounded-bl-md inline-flex items-center gap-1">
                <span className="dot-animate h-2 w-2 rounded-full bg-brand-text-muted" />
                <span className="dot-animate h-2 w-2 rounded-full bg-brand-text-muted" />
                <span className="dot-animate h-2 w-2 rounded-full bg-brand-text-muted" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Icebreaker / Prefilled Messages */}
        {showIcebreakers && messages.filter(m => m.senderId === 'self').length === 0 && (
          <div className="border-t border-brand-border bg-brand-card/50 px-3 py-2">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-brand-accent" />
              <span className="text-xs text-brand-text-muted font-medium">Break the ice — tap to send</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ICEBREAKER_MESSAGES.map((ice, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(`${ice.emoji} ${ice.text}`)}
                  className="rounded-full border border-brand-border bg-brand-bg px-3 py-1.5 text-xs text-brand-text-secondary hover:border-brand-accent/50 hover:text-brand-accent transition-colors"
                >
                  {ice.emoji} {ice.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick replies (after receiving a peer message) */}
        {!showIcebreakers && messages.length > 0 && messages[messages.length - 1]?.senderId === 'peer' && (
          <div className="border-t border-brand-border bg-brand-card/50 px-3 py-2">
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(reply)}
                  className="rounded-full border border-brand-border bg-brand-bg px-3 py-1.5 text-xs text-brand-text-secondary hover:border-brand-accent/50 hover:text-brand-accent transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message input */}
        <div className="border-t border-brand-border bg-brand-card p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none transition-colors"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent text-white hover:bg-brand-accent-hover disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-brand-text-muted mt-2 text-center">
            🔒 Messages are not stored • Monitored for safety • Report violations
          </p>
        </div>

        {/* Report Modal */}
        {showReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Flag className="h-5 w-5 text-brand-danger" />
                  Report User
                </h3>
                <button onClick={() => setShowReport(false)}>
                  <X className="h-5 w-5 text-brand-text-muted hover:text-brand-text-primary" />
                </button>
              </div>

              <p className="text-sm text-brand-text-secondary mb-4">
                Reports are logged and reviewed. False reports may result in your own account suspension.
              </p>

              <div className="space-y-3 mb-4">
                <label className="block text-sm font-medium text-brand-text-secondary">Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as ReportReason)}
                  className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text-primary outline-none focus:border-brand-accent"
                >
                  <option value="harassment">Harassment or Bullying</option>
                  <option value="nudity">Nudity or Sexual Content</option>
                  <option value="hate_speech">Hate Speech</option>
                  <option value="spam">Spam</option>
                  <option value="impersonation">Impersonation</option>
                  <option value="underage">Suspected Underage User</option>
                  <option value="other">Other</option>
                </select>

                <label className="block text-sm font-medium text-brand-text-secondary">Description (optional)</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Provide additional details..."
                  rows={3}
                  className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text-primary placeholder:text-brand-text-muted outline-none focus:border-brand-accent resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowReport(false)}
                  className="flex-1 rounded-lg border border-brand-border py-2.5 text-sm font-medium text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReport}
                  className="flex-1 rounded-lg bg-brand-danger py-2.5 text-sm font-semibold text-white hover:bg-brand-danger/90 transition-colors"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // PHASE: Chat Ended
  // ═══════════════════════════════════════════
  if (phase === 'ended') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-card border border-brand-border mb-4">
            <CheckCircle2 className="h-7 w-7 text-brand-success" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Chat Ended</h2>
          <p className="text-brand-text-secondary text-sm mb-8">
            How was your study connect experience?
          </p>

          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setRating('good')}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-medium transition-all',
                rating === 'good'
                  ? 'border-brand-success bg-brand-success/10 text-brand-success'
                  : 'border-brand-border text-brand-text-secondary hover:border-brand-success/50'
              )}
            >
              <ThumbsUp className="h-5 w-5" />
              Great Chat
            </button>
            <button
              onClick={() => setRating('bad')}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-medium transition-all',
                rating === 'bad'
                  ? 'border-brand-danger bg-brand-danger/10 text-brand-danger'
                  : 'border-brand-border text-brand-text-secondary hover:border-brand-danger/50'
              )}
            >
              <ThumbsDown className="h-5 w-5" />
              Not Good
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleReconnect}
              className="glow-btn flex items-center justify-center gap-2 rounded-xl bg-brand-accent py-3 text-sm font-semibold text-white hover:bg-brand-accent-hover transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Connect Again
            </button>
            <Link
              href="/dashboard"
              className="rounded-xl border border-brand-border py-3 text-sm font-medium text-brand-text-secondary hover:text-brand-text-primary hover:border-brand-accent/50 transition-colors text-center"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ═══════════════════════════════════════════
// Filter select component
// ═══════════════════════════════════════════
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-brand-text-muted mb-1">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-brand-border bg-brand-card px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-accent"
      >
        <option value="">Any</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
