// ============================================================
// GenZ IITian Connect — Socket.IO Server
// Real-time Matching, Chat & WebRTC Signaling + DB tracking
// ============================================================
// Run: node server.js
// ============================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '.env.local') });

const { createServer } = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');

const PORT = process.env.PORT || 3001;

// ─── Supabase service-role client (server-side only, bypasses RLS) ───
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      // Node <22 has no native WebSocket; supply `ws` so Realtime init doesn't throw
      // (we don't actually use Realtime subscriptions on the server)
      realtime: { transport: require('ws') },
    })
  : null;

if (!supabase) {
  console.warn('[WARN] Supabase env vars missing — session tracking disabled.');
} else {
  console.log('[OK] Supabase service client ready — sessions will be tracked.');
}

// UUID v4 sanity check — only call DB ops when we have a real auth userId
function isValidUuid(s) {
  return typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: [
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
      'https://genziitian.live',
      'https://www.genziitian.live',
      process.env.FRONTEND_URL,
      /\.vercel\.app$/,
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// ─── In-Memory Stores ───
const waitingQueue = []; // { oderId, socketId, mode, filters, joinedAt }
const activeSessions = new Map(); // sessionId -> { sessionId, user1, user2, mode, startedAt }
const socketToUser = new Map(); // socketId -> oderId
const userToSocket = new Map(); // oderId -> socketId

// ─── Anonymous Name Generator ───
function generateAnonName() {
  const adjectives = [
    'Curious', 'Brilliant', 'Focused', 'Creative', 'Studious',
    'Determined', 'Insightful', 'Dedicated', 'Innovative', 'Methodical',
    'Analytical', 'Persistent', 'Resourceful', 'Ambitious', 'Diligent',
  ];
  const nouns = [
    'Scholar', 'Learner', 'Thinker', 'Coder', 'Explorer',
    'Researcher', 'Student', 'Analyst', 'Builder', 'Solver',
    'Engineer', 'Scientist', 'Innovator', 'Pioneer', 'Seeker',
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999) + 1;
  return `${adj}${noun}${num}`;
}

function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ─── Connection Handler ───
io.on('connection', (socket) => {
  const oderId = socket.handshake.auth?.userId || `anon_${socket.id}`;
  socketToUser.set(socket.id, oderId);
  userToSocket.set(oderId, socket.id);

  console.log(`[WS] Connected: ${oderId} (${socket.id})`);
  console.log(`[WS] Total connections: ${io.sockets.sockets.size}`);

  // ── Join Queue ──
  socket.on('queue:join', async ({ mode, filters }) => {
    // Remove from existing queue if present
    const existingIndex = waitingQueue.findIndex(e => e.socketId === socket.id);
    if (existingIndex !== -1) waitingQueue.splice(existingIndex, 1);

    // Enforce daily limit for authenticated users
    if (supabase && isValidUuid(oderId)) {
      const { data: u, error } = await supabase
        .from('users')
        .select('matches_used_today, max_matches_per_day, matches_reset_date, is_banned')
        .eq('id', oderId)
        .maybeSingle();
      if (!error && u) {
        if (u.is_banned) {
          socket.emit('queue:error', { message: 'Account banned.' });
          return;
        }
        const today = new Date().toISOString().split('T')[0];
        const usedToday = u.matches_reset_date && u.matches_reset_date.startsWith(today)
          ? u.matches_used_today : 0;
        const limit = u.max_matches_per_day ?? 50;
        if (limit !== -1 && usedToday >= limit) {
          socket.emit('queue:limit-reached', {
            message: `Daily limit of ${limit} connects reached. Try again tomorrow.`,
            usedToday,
            limit,
          });
          return;
        }
      }
    }

    const entry = {
      userId: oderId,
      socketId: socket.id,
      mode: mode || 'text',
      filters: filters || {},
      joinedAt: Date.now(),
    };

    waitingQueue.push(entry);
    socket.emit('queue:joined', { position: waitingQueue.length });

    console.log(`[QUEUE] ${oderId} joined queue (${mode}). Queue size: ${waitingQueue.length}`);

    // Try to match immediately
    tryMatch(entry);
  });

  // ── Leave Queue ──
  socket.on('queue:leave', () => {
    const index = waitingQueue.findIndex(e => e.socketId === socket.id);
    if (index !== -1) {
      waitingQueue.splice(index, 1);
      socket.emit('queue:left');
      console.log(`[QUEUE] ${oderId} left queue. Queue size: ${waitingQueue.length}`);
    }
  });

  // ── Send Message ──
  socket.on('chat:message', ({ sessionId, content }) => {
    const session = activeSessions.get(sessionId);
    if (!session) {
      socket.emit('chat:error', { message: 'Session not found' });
      return;
    }

    // Determine peer
    const peer = session.user1.socketId === socket.id ? session.user2 : session.user1;
    const peerSocket = io.sockets.sockets.get(peer.socketId);

    const messageData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      sessionId,
      senderId: 'peer',
      content,
      timestamp: new Date().toISOString(),
      type: 'text',
    };

    if (peerSocket) {
      peerSocket.emit('chat:message', messageData);
    }

    // Acknowledge to sender
    socket.emit('chat:message-ack', {
      id: messageData.id,
      timestamp: messageData.timestamp,
    });

    console.log(`[CHAT] ${sessionId}: message sent`);
  });

  // ── Typing Indicators ──
  socket.on('chat:typing', ({ sessionId }) => {
    const session = activeSessions.get(sessionId);
    if (!session) return;
    const peer = session.user1.socketId === socket.id ? session.user2 : session.user1;
    const peerSocket = io.sockets.sockets.get(peer.socketId);
    peerSocket?.emit('chat:typing', { sessionId });
  });

  socket.on('chat:stop-typing', ({ sessionId }) => {
    const session = activeSessions.get(sessionId);
    if (!session) return;
    const peer = session.user1.socketId === socket.id ? session.user2 : session.user1;
    const peerSocket = io.sockets.sockets.get(peer.socketId);
    peerSocket?.emit('chat:stop-typing', { sessionId });
  });

  // ── WebRTC Signaling ──
  socket.on('webrtc:offer', ({ sessionId, offer }) => {
    const session = activeSessions.get(sessionId);
    if (!session) return;
    const peer = session.user1.socketId === socket.id ? session.user2 : session.user1;
    const peerSocket = io.sockets.sockets.get(peer.socketId);
    peerSocket?.emit('webrtc:offer', { sessionId, offer });
    console.log(`[WebRTC] Offer relayed in session ${sessionId}`);
  });

  socket.on('webrtc:answer', ({ sessionId, answer }) => {
    const session = activeSessions.get(sessionId);
    if (!session) return;
    const peer = session.user1.socketId === socket.id ? session.user2 : session.user1;
    const peerSocket = io.sockets.sockets.get(peer.socketId);
    peerSocket?.emit('webrtc:answer', { sessionId, answer });
    console.log(`[WebRTC] Answer relayed in session ${sessionId}`);
  });

  socket.on('webrtc:ice-candidate', ({ sessionId, candidate }) => {
    const session = activeSessions.get(sessionId);
    if (!session) return;
    const peer = session.user1.socketId === socket.id ? session.user2 : session.user1;
    const peerSocket = io.sockets.sockets.get(peer.socketId);
    peerSocket?.emit('webrtc:ice-candidate', { sessionId, candidate });
  });

  // ── End Chat ──
  socket.on('chat:end', ({ sessionId }) => {
    endSession(sessionId, socket.id);
  });

  // ── Skip to Next ──
  socket.on('chat:skip', ({ sessionId }) => {
    endSession(sessionId, socket.id);
    // Auto re-queue the skipper
    const lastMode = activeSessions.get(sessionId)?.mode || 'text';
    setTimeout(() => {
      socket.emit('queue:auto-rejoin');
    }, 500);
  });

  // ── Report User ──
  socket.on('chat:report', ({ sessionId, reason, description }) => {
    const session = activeSessions.get(sessionId);
    if (!session) return;
    console.log(`[REPORT] Session ${sessionId}: ${reason} - ${description || 'no details'}`);
    endSession(sessionId, socket.id);
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    console.log(`[WS] Disconnected: ${oderId} (${socket.id})`);

    // Remove from queue
    const queueIndex = waitingQueue.findIndex(e => e.socketId === socket.id);
    if (queueIndex !== -1) waitingQueue.splice(queueIndex, 1);

    // End any active sessions
    activeSessions.forEach((session, sessionId) => {
      if (session.user1.socketId === socket.id || session.user2.socketId === socket.id) {
        endSession(sessionId, socket.id);
      }
    });

    socketToUser.delete(socket.id);
    userToSocket.delete(oderId);

    console.log(`[WS] Total connections: ${io.sockets.sockets.size}`);
  });
});

// ─── Matching Engine ───
async function tryMatch(entry) {
  const matchIndex = waitingQueue.findIndex((other) => {
    if (other.socketId === entry.socketId) return false; // Don't match with self
    if (other.mode !== entry.mode) return false; // Same mode only

    // Topic matching if both have filters
    if (entry.filters?.topic && other.filters?.topic) {
      return entry.filters.topic === other.filters.topic;
    }

    return true; // Match!
  });

  if (matchIndex === -1) {
    console.log(`[MATCH] No match found for ${entry.userId}, staying in queue`);
    return;
  }

  const match = waitingQueue[matchIndex];

  // Remove both from queue
  waitingQueue.splice(matchIndex, 1);
  const entryIndex = waitingQueue.findIndex(e => e.socketId === entry.socketId);
  if (entryIndex !== -1) waitingQueue.splice(entryIndex, 1);

  // Create session
  const sessionId = generateSessionId();
  const session = {
    sessionId,
    user1: {
      userId: entry.userId,
      socketId: entry.socketId,
      anonName: generateAnonName(),
    },
    user2: {
      userId: match.userId,
      socketId: match.socketId,
      anonName: generateAnonName(),
    },
    mode: entry.mode,
    startedAt: Date.now(),
  };

  activeSessions.set(sessionId, session);

  // ── DB: persist the session row + bump match counters (best-effort, non-blocking) ──
  if (supabase) {
    const u1Auth = isValidUuid(entry.userId);
    const u2Auth = isValidUuid(match.userId);

    if (u1Auth && u2Auth) {
      // Both authenticated — insert a real chat_sessions row
      supabase
        .from('chat_sessions')
        .insert({
          user1_id: entry.userId,
          user2_id: match.userId,
          mode: entry.mode,
          start_time: new Date(session.startedAt).toISOString(),
          matched_topic: entry.filters?.topic || null,
          match_type: entry.filters?.topic ? 'topic' : 'random',
        })
        .select('session_id')
        .single()
        .then(({ data, error }) => {
          if (error) console.warn('[DB] chat_sessions insert failed:', error.message);
          else if (data) {
            session.dbSessionId = data.session_id;
            console.log('[DB] chat_session saved:', data.session_id);
          }
        });
    }

    // Bump each authenticated user's matches_used_today
    if (u1Auth) {
      supabase.rpc('increment_match_count', { p_user_id: entry.userId })
        .then(({ error }) => error && console.warn('[DB] increment failed (u1):', error.message));
    }
    if (u2Auth) {
      supabase.rpc('increment_match_count', { p_user_id: match.userId })
        .then(({ error }) => error && console.warn('[DB] increment failed (u2):', error.message));
    }
  }

  // Notify user1
  const socket1 = io.sockets.sockets.get(entry.socketId);
  const socket2 = io.sockets.sockets.get(match.socketId);

  socket1?.emit('queue:matched', {
    sessionId,
    mode: entry.mode,
    peerName: session.user2.anonName,
    peerUserId: session.user2.userId,
    startedAt: session.startedAt,
    isInitiator: true,
  });

  socket2?.emit('queue:matched', {
    sessionId,
    mode: entry.mode,
    peerName: session.user1.anonName,
    peerUserId: session.user1.userId,
    startedAt: session.startedAt,
    isInitiator: false,
  });

  console.log(`[MATCH] ${entry.userId} <-> ${match.userId} | Session: ${sessionId} | Mode: ${entry.mode}`);
  console.log(`[MATCH] Active sessions: ${activeSessions.size}`);
}

// ─── End Session ───
function endSession(sessionId, endedBySocketId) {
  const session = activeSessions.get(sessionId);
  if (!session) return;

  // Notify the peer
  const peer = session.user1.socketId === endedBySocketId ? session.user2 : session.user1;
  const peerSocket = io.sockets.sockets.get(peer.socketId);
  peerSocket?.emit('chat:ended', { sessionId, endedBy: 'peer' });

  // Notify the ender too
  const enderSocket = io.sockets.sockets.get(endedBySocketId);
  enderSocket?.emit('chat:ended', { sessionId, endedBy: 'self' });

  // ── DB: close out the chat_sessions row with end_time + duration ──
  if (supabase && session.dbSessionId) {
    const duration = Math.round((Date.now() - session.startedAt) / 1000);
    supabase
      .from('chat_sessions')
      .update({
        end_time: new Date().toISOString(),
        duration_seconds: duration,
      })
      .eq('session_id', session.dbSessionId)
      .then(({ error }) => {
        if (error) console.warn('[DB] chat_session end update failed:', error.message);
        else console.log(`[DB] chat_session ${session.dbSessionId} closed (${duration}s)`);
      });
  }

  activeSessions.delete(sessionId);
  console.log(`[SESSION] Ended: ${sessionId} | Active sessions: ${activeSessions.size}`);
}

// ─── Periodic queue status broadcast ───
setInterval(() => {
  // Breakdown queue by mode
  let textCount = 0;
  let videoCount = 0;
  for (const entry of waitingQueue) {
    if (entry.mode === 'video') videoCount++;
    else textCount++;
  }
  // Active sessions broken down by mode
  let activeText = 0;
  let activeVideo = 0;
  for (const session of activeSessions.values()) {
    if (session.mode === 'video') activeVideo++;
    else activeText++;
  }
  io.emit('stats:update', {
    onlineUsers: io.sockets.sockets.size,
    inQueue: waitingQueue.length,
    activeSessions: activeSessions.size,
    breakdown: {
      textQueue: textCount,
      videoQueue: videoCount,
      activeText,
      activeVideo,
    },
  });
}, 5000);

// ─── Start Server ───
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  GenZ IITian Connect — Socket.IO Server');
  console.log(`  Port: ${PORT}`);
  console.log(`  CORS: localhost + connect.genziitian.in`);
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('Waiting for connections...');
});
