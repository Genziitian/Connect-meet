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
  Maximize,
  Minimize,
  MessageCircle,
  ChevronUp,
} from 'lucide-react';
import { useFullscreen } from '@/lib/fullscreen-context';

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
  const { isFullscreen, enterFullscreen, exitFullscreen, toggleFullscreen } = useFullscreen();

  const [phase, setPhase] = useState<ConnectPhase>('rules');
  const [mode, setMode] = useState<ChatMode>('text');
  const [rulesAccepted, setRulesAccepted] = useState(false);

  // Mobile chat panel toggle (video mode)
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

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
    // Reliable free STUN servers + configurable TURN for production
    const iceServers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ];

    // Add TURN server if configured via env (required for users behind symmetric NAT)
    const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
    if (turnUrl) {
      iceServers.push({
        urls: turnUrl,
        username: process.env.NEXT_PUBLIC_TURN_USERNAME || '',
        credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || '',
      });
    }

    const pc = new RTCPeerConnection({
      iceServers,
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
        const stream = event.streams[0];
        const attachRemote = () => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
            remoteVideoRef.current.play().catch(() => {});
          }
        };
        attachRemote();
        // Retry after a short delay in case the element wasn't ready
        requestAnimationFrame(attachRemote);
        setTimeout(attachRemote, 300);
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
      setMobileChatOpen(false);
      enterFullscreen();
      setPhase('chat');

      // If video mode and I'm the initiator, create the offer
      if (matchMode === 'video' && isInitiator) {
        // Wait for peer to be ready
        await new Promise(r => setTimeout(r, 800));
        if (!localStreamRef.current) {
          await startCamera();
        }
        // Ensure we have media tracks before creating offer
        if (!localStreamRef.current) {
          console.error('[WebRTC] Cannot create offer: no local stream');
          return;
        }
        const pc = createPeerConnection(sid, socket);
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
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
        // Re-attach stream to video element when re-enabling
        if (videoTrack.enabled && localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
          localVideoRef.current.play().catch(() => {});
        }
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
    exitFullscreen();
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
    exitFullscreen();
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
      <div className="min-h-[calc(100vh-4rem)] bb-grid flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00D09C] border-[3px] border-[#111] shadow-[3px_3px_0px_#111] mb-4">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-[#111] mb-2">Community Safety Rules</h1>
            <p className="text-[#555] text-sm">
              You must agree to these rules before connecting. Violations result in permanent ban.
            </p>
          </div>

          <div className="bb-card bg-white p-6">
            {/* Connection status */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className={cn(
                'h-2 w-2 rounded-full',
                isConnected ? 'bg-[#00D09C] animate-pulse' : 'bg-[#FF4757]'
              )} />
              <span className="text-xs text-[#888]">
                {isConnected ? `Server connected • ${onlineCount} online` : 'Connecting to server...'}
              </span>
            </div>

            <div className="space-y-3 mb-6">
              {COMMUNITY_RULES.map((rule) => (
                <div key={rule.title} className="flex items-start gap-3 rounded-xl bg-[#FDEBD3] border-[2px] border-[#111] p-3 shadow-[2px_2px_0px_#111]">
                  <span className="text-lg mt-0.5">{rule.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-[#111]">{rule.title}</p>
                    <p className="text-xs text-[#888] mt-0.5">{rule.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-[#00D09C]/10 border-[2px] border-[#00D09C] cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={rulesAccepted}
                onChange={(e) => setRulesAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#111] bg-white text-[#00D09C] focus:ring-[#00D09C]"
              />
              <div>
                <p className="text-sm font-bold text-[#111]">I Agree to All Rules</p>
                <p className="text-xs text-[#888] mt-0.5">
                  I understand that any violation will result in permanent ban and may be reported to authorities.
                </p>
              </div>
            </label>

            <button
              onClick={() => setPhase('lobby')}
              disabled={!rulesAccepted || !isConnected}
              className="w-full bb-btn bb-btn-green flex items-center justify-center gap-2 py-3 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="min-h-[calc(100vh-4rem)] bb-grid flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-[#111] mb-2">Study Connect</h1>
            <p className="text-[#555] text-sm">
              Choose your mode and start connecting with verified students
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="flex items-center gap-1.5 rounded-full border-[2px] border-[#111] bg-[#00D09C] px-3 py-1 text-xs text-white font-bold shadow-[2px_2px_0px_#111]">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                {onlineCount > 0 ? `${onlineCount} students online` : 'Online students nearby'}
              </span>
            </div>
          </div>

          <div className="bb-card bg-white p-6 space-y-6">
            {/* Mode Selection */}
            <div>
              <label className="block text-sm font-bold text-[#555] mb-3">Chat Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode('text')}
                  className={cn(
                    'relative rounded-xl border-[2px] p-4 text-center transition-all',
                    mode === 'text'
                      ? 'border-[#111] bg-[#00D09C]/10 shadow-[3px_3px_0px_#111]'
                      : 'border-[#ddd] bg-[#FDEBD3] hover:border-[#111]'
                  )}
                >
                  <MessageSquare className="h-8 w-8 text-[#00D09C] mx-auto mb-2" />
                  <p className="text-sm font-black text-[#111]">Text Chat</p>
                  <p className="text-xs text-[#888] mt-1">Free for all</p>
                </button>
                <button
                  onClick={() => setMode('video')}
                  className={cn(
                    'relative rounded-xl border-[2px] p-4 text-center transition-all',
                    mode === 'video'
                      ? 'border-[#111] bg-[#B794F6]/10 shadow-[3px_3px_0px_#111]'
                      : 'border-[#ddd] bg-[#FDEBD3] hover:border-[#111]'
                  )}
                >
                  <Video className="h-8 w-8 text-[#B794F6] mx-auto mb-2" />
                  <p className="text-sm font-black text-[#111]">Video Chat</p>
                  <p className="text-xs text-[#888] mt-1">Camera + Text</p>
                </button>
              </div>
            </div>

            {/* Camera preview for video mode */}
            {mode === 'video' && (
              <div className="space-y-3">
                <div className="relative aspect-video rounded-xl bg-[#111] border-[3px] border-[#111] overflow-hidden">
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
                      <Camera className="h-10 w-10 text-white/50 mb-3" />
                      <p className="text-sm text-white/50">Camera preview</p>
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
                  <p className="text-xs text-[#FF4757] text-center">{cameraError}</p>
                )}
                <button
                  onClick={cameraReady ? stopCamera : startCamera}
                  className={cn(
                    'w-full rounded-xl border-[2px] border-[#111] py-2.5 text-sm font-bold transition-all shadow-[2px_2px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[1px] hover:translate-y-[1px]',
                    cameraReady
                      ? 'bg-[#FF6B6B] text-white'
                      : 'bg-[#B794F6] text-white'
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
                  'flex w-full items-center justify-between rounded-xl border-[2px] px-4 py-3 text-sm transition-all',
                  canUseFilters
                    ? 'border-[#111] bg-[#FDEBD3] shadow-[2px_2px_0px_#111] hover:shadow-[1px_1px_0px_#111] cursor-pointer'
                    : 'border-[#ddd] bg-gray-100 opacity-60 cursor-not-allowed',
                )}
              >
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-[#00D09C]" />
                  <span className="font-bold text-[#111]">Smart Matching Filters</span>
                  {!canUseFilters && (
                    <span className="rounded-full bg-[#FB923C] border-[2px] border-[#111] px-2 py-0.5 text-xs text-white font-bold">Pro+</span>
                  )}
                </span>
                <ChevronDown className={cn('h-4 w-4 text-[#888] transition-transform', showFilters && 'rotate-180')} />
              </button>

              {showFilters && canUseFilters && (
                <div className="mt-3 space-y-3 rounded-xl border-[2px] border-[#111] bg-[#FDEBD3] p-4">
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
              className="w-full bb-btn bb-btn-green flex items-center justify-center gap-2 rounded-full py-4 text-base font-black disabled:opacity-50"
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
      <div className="min-h-[calc(100vh-4rem)] bb-grid flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          {/* Show camera preview while in queue for video mode */}
          {mode === 'video' && cameraReady && (
            <div className="relative aspect-video rounded-2xl bg-[#111] border-[3px] border-[#111] overflow-hidden mb-6 mx-auto max-w-xs shadow-[4px_4px_0px_#111]">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <div className="absolute top-2 left-2 rounded-full bg-[#00D09C] px-2 py-1 text-[10px] text-white font-bold border-[2px] border-[#111]">
                You
              </div>
            </div>
          )}

          {/* Animated searching indicator */}
          <div className="relative mb-8">
            <div className="mx-auto h-32 w-32 rounded-full border-[3px] border-[#00D09C]/30 flex items-center justify-center">
              <div className="h-24 w-24 rounded-full border-[3px] border-[#00D09C]/50 flex items-center justify-center animate-pulse">
                <div className="h-16 w-16 rounded-full bg-[#00D09C] border-[3px] border-[#111] flex items-center justify-center shadow-[3px_3px_0px_#111]">
                  <Zap className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-[#00D09C] border-[2px] border-[#111]" />
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-[#00D09C]" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-[#111] mb-2">Finding Your Study Partner</h2>
          <p className="text-[#555] text-sm mb-2">
            Matching you with a verified student
            <span className="inline-flex ml-1">
              <span className="dot-animate h-1 w-1 rounded-full bg-[#00D09C] mx-0.5" />
              <span className="dot-animate h-1 w-1 rounded-full bg-[#00D09C] mx-0.5" />
              <span className="dot-animate h-1 w-1 rounded-full bg-[#00D09C] mx-0.5" />
            </span>
          </p>
          <p className="text-xs text-[#00D09C] font-bold mb-6">
            💡 Open this page in another browser to test matching!
          </p>

          {/* Queue info */}
          <div className="bb-card bg-white p-6 space-y-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#888] flex items-center gap-2">
                <Clock className="h-4 w-4" /> Wait time
              </span>
              <span className="font-mono font-black text-[#111]">
                {Math.floor(queueTime / 60)}:{(queueTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#888] flex items-center gap-2">
                <User className="h-4 w-4" /> Online
              </span>
              <span className="font-mono font-black text-[#111]">{onlineCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#888] flex items-center gap-2">
                {mode === 'text' ? <MessageSquare className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                Mode
              </span>
              <span className="font-bold text-[#00D09C] capitalize">{mode} Chat</span>
            </div>
          </div>

          <button
            onClick={() => {
              socketRef.current?.emit('queue:leave');
              cleanupWebRTC();
              setPhase('lobby');
            }}
            className="rounded-xl border-[2px] border-[#111] bg-white px-6 py-2.5 text-sm font-bold text-[#111] shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
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
      <div className={cn(
        'flex flex-col',
        isFullscreen ? 'h-screen' : 'h-[calc(100vh-4rem)]'
      )}>
        {/* Chat header */}
        <div className="flex items-center justify-between border-b-[3px] border-[#111] bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00D09C] border-[2px] border-[#111]">
              <User className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-[#111]">{peerName}</p>
              <p className="text-xs text-[#00D09C] flex items-center gap-1 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00D09C]" />
                {peerTyping ? 'Typing...' : 'Connected'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="rounded-xl bg-[#FDEBD3] border-[2px] border-[#111] p-2 text-[#888] hover:text-[#B794F6] shadow-[2px_2px_0px_#111] hover:shadow-[1px_1px_0px_#111] transition-all"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
            <button
              onClick={handleSkip}
              className="rounded-xl bg-[#FDEBD3] border-[2px] border-[#111] p-2 text-[#888] hover:text-[#FB923C] shadow-[2px_2px_0px_#111] hover:shadow-[1px_1px_0px_#111] transition-all"
              title="Skip to next"
            >
              <SkipForward className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowReport(true)}
              className="rounded-xl bg-[#FDEBD3] border-[2px] border-[#111] p-2 text-[#888] hover:text-[#FF4757] shadow-[2px_2px_0px_#111] hover:shadow-[1px_1px_0px_#111] transition-all"
              title="Report user"
            >
              <Flag className="h-4 w-4" />
            </button>
            {mode === 'text' && (
              <button
                onClick={handleEndChat}
                className="rounded-xl bg-[#FF6B6B] border-[2px] border-[#111] px-3 py-2 text-sm font-bold text-white shadow-[2px_2px_0px_#111] hover:shadow-[1px_1px_0px_#111] transition-all"
              >
                End Chat
              </button>
            )}
          </div>
        </div>

        {/* Main content: video + chat side-by-side on desktop, stacked on mobile */}
        <div className={cn(
          'flex-1 flex overflow-hidden',
          mode === 'video' ? 'flex-col md:flex-row' : 'flex-col'
        )}>
          {/* Video section (if video mode) */}
          {mode === 'video' && (
            <div className="flex flex-col md:flex-1 bg-[#111] md:border-r-[3px] border-[#111]">
              {/* Videos: vertical stack on mobile, side-by-side on sm+ */}
              <div className="flex flex-col sm:flex-row gap-2 p-2 flex-1 min-h-0">
                {/* Remote video (peer) */}
                <div className="relative flex-1 rounded-xl bg-[#1a1a2e] border-[2px] border-[#333] overflow-hidden min-h-[140px] sm:min-h-[180px]">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={cn('w-full h-full object-cover', !remoteStreamActive && 'hidden')}
                  />
                  {!remoteStreamActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <User className="h-10 w-10 sm:h-12 sm:w-12 text-white/20 mb-2" />
                      <p className="text-xs text-white/50">{peerName}</p>
                      <p className="text-[10px] text-white/30 mt-1 animate-pulse">Connecting video...</p>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 rounded-full bg-[#00D09C] px-2 py-0.5 text-[10px] text-white font-bold border-[2px] border-[#111]">
                    {peerName}
                  </div>
                </div>

                {/* Local video (you) */}
                <div className="relative flex-1 rounded-xl bg-[#1a1a2e] border-[2px] border-[#333] overflow-hidden min-h-[140px] sm:min-h-[180px]">
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
                          <VideoOff className="h-8 w-8 text-white/30 mb-2" />
                          <p className="text-xs text-white/50">Camera Off</p>
                        </>
                      ) : (
                        <>
                          <User className="h-10 w-10 sm:h-12 sm:w-12 text-white/20 mb-2" />
                          <p className="text-xs text-white/50">Your Camera</p>
                        </>
                      )}
                    </div>
                  )}
                  <div className="absolute top-2 left-2 rounded-full bg-[#00D09C] px-2 py-0.5 text-[10px] text-white font-bold border-[2px] border-[#111]">
                    You
                  </div>
                </div>
              </div>

              {/* Video controls bar */}
              <div className="flex items-center justify-center gap-3 px-3 py-2 border-t border-[#333] bg-[#0a0a15]">
                <button
                  onClick={toggleMute}
                  className={cn(
                    'rounded-full p-2.5 border-[2px] transition-colors',
                    isMuted ? 'bg-[#FF4757] border-[#FF4757] text-white' : 'bg-transparent border-[#555] text-white/70 hover:text-white'
                  )}
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <button
                  onClick={toggleVideo}
                  className={cn(
                    'rounded-full p-2.5 border-[2px] transition-colors',
                    isVideoOff ? 'bg-[#FF4757] border-[#FF4757] text-white' : 'bg-transparent border-[#555] text-white/70 hover:text-white'
                  )}
                >
                  {isVideoOff ? <VideoOff className="h-4 w-4" /> : <VideoIcon className="h-4 w-4" />}
                </button>
                {/* Mobile chat toggle */}
                <button
                  onClick={() => setMobileChatOpen(!mobileChatOpen)}
                  className={cn(
                    'rounded-full p-2.5 border-[2px] transition-colors md:hidden',
                    mobileChatOpen ? 'bg-[#00D09C] border-[#00D09C] text-white' : 'bg-transparent border-[#555] text-white/70 hover:text-white'
                  )}
                  title="Toggle chat"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={handleEndChat}
                  className="rounded-full bg-[#FF6B6B] border-[2px] border-[#111] px-4 py-2.5 text-xs font-bold text-white shadow-[2px_2px_0px_#111] hover:shadow-[1px_1px_0px_#111] transition-all"
                >
                  End
                </button>
              </div>
            </div>
          )}

          {/* Chat panel */}
          <div className={cn(
            'flex flex-col min-h-0 border-[#111]',
            mode === 'video'
              ? cn(
                  // Mobile: absolute overlay that slides up/down
                  'md:relative md:h-auto md:w-80 lg:w-96 md:flex-none md:border-t-0',
                  'max-md:absolute max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:z-30 max-md:transition-transform max-md:duration-300 max-md:ease-in-out',
                  mobileChatOpen
                    ? 'max-md:translate-y-0 max-md:h-[65%] border-t-[3px]'
                    : 'max-md:translate-y-full max-md:h-0 max-md:overflow-hidden'
                )
              : 'flex-1 border-t-[3px]'
          )}>
            {/* Mobile chat header - close button (video mode only) */}
            {mode === 'video' && mobileChatOpen && (
              <div className="flex items-center justify-between px-3 py-2 bg-white border-b-[2px] border-[#111] md:hidden">
                <span className="text-xs font-black text-[#111]">Chat</span>
                <button
                  onClick={() => setMobileChatOpen(false)}
                  className="rounded-lg bg-[#FDEBD3] border-[2px] border-[#111] p-1 text-[#888] hover:text-[#111]"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#FDEBD3]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'max-w-[85%]',
                    msg.type === 'system' && 'mx-auto max-w-none text-center',
                    msg.senderId === 'self' && 'ml-auto',
                    msg.senderId === 'peer' && 'mr-auto',
                  )}
                >
                  {msg.type === 'system' ? (
                    <div className="rounded-xl bg-white/70 border-[2px] border-[#ddd] px-3 py-1.5 text-[11px] text-[#888]">
                      {msg.content}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'rounded-2xl px-3 py-2 border-[2px]',
                        msg.senderId === 'self'
                          ? 'bg-[#00D09C] border-[#111] text-white rounded-br-md shadow-[2px_2px_0px_#111]'
                          : 'bg-white border-[#111] text-[#111] rounded-bl-md shadow-[2px_2px_0px_#111]'
                      )}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={cn('text-[10px] mt-0.5', msg.senderId === 'self' ? 'text-white/60' : 'text-[#888]')}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {peerTyping && (
                <div className="mr-auto max-w-[85%]">
                  <div className="rounded-2xl bg-white border-[2px] border-[#111] px-3 py-2.5 rounded-bl-md inline-flex items-center gap-1 shadow-[2px_2px_0px_#111]">
                    <span className="dot-animate h-1.5 w-1.5 rounded-full bg-[#888]" />
                    <span className="dot-animate h-1.5 w-1.5 rounded-full bg-[#888]" />
                    <span className="dot-animate h-1.5 w-1.5 rounded-full bg-[#888]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Icebreaker / Prefilled Messages */}
            {showIcebreakers && messages.filter(m => m.senderId === 'self').length === 0 && (
              <div className="border-t-[2px] border-[#111] bg-white px-2 py-1.5">
                <div className="flex items-center gap-1 mb-1">
                  <Sparkles className="h-3 w-3 text-[#00D09C]" />
                  <span className="text-[10px] text-[#888] font-bold">Break the ice</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {ICEBREAKER_MESSAGES.map((ice, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(`${ice.emoji} ${ice.text}`)}
                      className="rounded-full border-[2px] border-[#111] bg-[#FDEBD3] px-2 py-1 text-[11px] text-[#555] hover:bg-[#00D09C] hover:text-white transition-colors font-medium"
                    >
                      {ice.emoji} {ice.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick replies */}
            {!showIcebreakers && messages.length > 0 && messages[messages.length - 1]?.senderId === 'peer' && (
              <div className="border-t-[2px] border-[#111] bg-white px-2 py-1.5">
                <div className="flex flex-wrap gap-1">
                  {QUICK_REPLIES.map((reply, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(reply)}
                      className="rounded-full border-[2px] border-[#111] bg-[#FDEBD3] px-2 py-1 text-[11px] text-[#555] hover:bg-[#00D09C] hover:text-white transition-colors font-medium"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message input */}
            <div className="border-t-[3px] border-[#111] bg-white p-2">
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
                  className="flex-1 rounded-xl border-[2px] border-[#111] bg-[#FDEBD3] px-3 py-2 text-sm text-[#111] placeholder:text-[#aaa] focus:border-[#00D09C] focus:ring-1 focus:ring-[#00D09C] outline-none transition-colors"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00D09C] border-[2px] border-[#111] text-white shadow-[2px_2px_0px_#111] hover:shadow-[1px_1px_0px_#111] disabled:opacity-50 transition-all"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Report Modal */}
        {showReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md bb-card bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-[#111] flex items-center gap-2">
                  <Flag className="h-5 w-5 text-[#FF4757]" />
                  Report User
                </h3>
                <button onClick={() => setShowReport(false)}>
                  <X className="h-5 w-5 text-[#888] hover:text-[#111]" />
                </button>
              </div>

              <p className="text-sm text-[#555] mb-4">
                Reports are logged and reviewed. False reports may result in your own account suspension.
              </p>

              <div className="space-y-3 mb-4">
                <label className="block text-sm font-bold text-[#555]">Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as ReportReason)}
                  className="w-full rounded-xl border-[2px] border-[#111] bg-[#FDEBD3] px-3 py-2.5 text-sm text-[#111] outline-none focus:border-[#00D09C]"
                >
                  <option value="harassment">Harassment or Bullying</option>
                  <option value="nudity">Nudity or Sexual Content</option>
                  <option value="hate_speech">Hate Speech</option>
                  <option value="spam">Spam</option>
                  <option value="impersonation">Impersonation</option>
                  <option value="underage">Suspected Underage User</option>
                  <option value="other">Other</option>
                </select>

                <label className="block text-sm font-bold text-[#555]">Description (optional)</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Provide additional details..."
                  rows={3}
                  className="w-full rounded-xl border-[2px] border-[#111] bg-[#FDEBD3] px-3 py-2.5 text-sm text-[#111] placeholder:text-[#aaa] outline-none focus:border-[#00D09C] resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowReport(false)}
                  className="flex-1 rounded-xl border-[2px] border-[#111] bg-white py-2.5 text-sm font-bold text-[#111] shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReport}
                  className="flex-1 rounded-xl border-[2px] border-[#111] bg-[#FF6B6B] py-2.5 text-sm font-bold text-white shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
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
      <div className="min-h-[calc(100vh-4rem)] bb-grid flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00D09C] border-[3px] border-[#111] shadow-[3px_3px_0px_#111] mb-4">
            <CheckCircle2 className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-black text-[#111] mb-2">Chat Ended</h2>
          <p className="text-[#555] text-sm mb-8">
            How was your study connect experience?
          </p>

          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setRating('good')}
              className={cn(
                'flex items-center gap-2 rounded-xl border-[2px] px-6 py-3 text-sm font-bold transition-all',
                rating === 'good'
                  ? 'border-[#111] bg-[#00D09C] text-white shadow-[3px_3px_0px_#111]'
                  : 'border-[#ddd] bg-white text-[#555] hover:border-[#00D09C]'
              )}
            >
              <ThumbsUp className="h-5 w-5" />
              Great Chat
            </button>
            <button
              onClick={() => setRating('bad')}
              className={cn(
                'flex items-center gap-2 rounded-xl border-[2px] px-6 py-3 text-sm font-bold transition-all',
                rating === 'bad'
                  ? 'border-[#111] bg-[#FF6B6B] text-white shadow-[3px_3px_0px_#111]'
                  : 'border-[#ddd] bg-white text-[#555] hover:border-[#FF6B6B]'
              )}
            >
              <ThumbsDown className="h-5 w-5" />
              Not Good
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleReconnect}
              className="bb-btn bb-btn-green flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold"
            >
              <RefreshCw className="h-4 w-4" />
              Connect Again
            </button>
            <Link
              href="/dashboard"
              className="rounded-xl border-[2px] border-[#111] bg-white py-3 text-sm font-bold text-[#111] shadow-[3px_3px_0px_#111] hover:shadow-[1px_1px_0px_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-center block"
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
      <label className="block text-xs font-bold text-[#888] mb-1">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border-[2px] border-[#111] bg-white px-3 py-2 text-sm text-[#111] outline-none focus:border-[#00D09C]"
      >
        <option value="">Any</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
