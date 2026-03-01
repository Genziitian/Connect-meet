// ============================================================
// GenZ IITian Connect — Socket.IO Server
// Real-time Matching, Chat & WebRTC Signaling
// ============================================================
// Run: node server.js
// ============================================================

const { createServer } = require('http');
const { Server } = require('socket.io');

const PORT = 3001;
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
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
  socket.on('queue:join', ({ mode, filters }) => {
    // Remove from existing queue if present
    const existingIndex = waitingQueue.findIndex(e => e.socketId === socket.id);
    if (existingIndex !== -1) waitingQueue.splice(existingIndex, 1);

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
function tryMatch(entry) {
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

  // Notify user1
  const socket1 = io.sockets.sockets.get(entry.socketId);
  const socket2 = io.sockets.sockets.get(match.socketId);

  socket1?.emit('queue:matched', {
    sessionId,
    mode: entry.mode,
    peerName: session.user2.anonName,
    startedAt: session.startedAt,
    isInitiator: true,
  });

  socket2?.emit('queue:matched', {
    sessionId,
    mode: entry.mode,
    peerName: session.user1.anonName,
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

  activeSessions.delete(sessionId);
  console.log(`[SESSION] Ended: ${sessionId} | Active sessions: ${activeSessions.size}`);
}

// ─── Periodic queue status broadcast ───
setInterval(() => {
  io.emit('stats:update', {
    onlineUsers: io.sockets.sockets.size,
    inQueue: waitingQueue.length,
    activeSessions: activeSessions.size,
  });
}, 5000);

// ─── Start Server ───
httpServer.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  GenZ IITian Connect — Socket.IO Server');
  console.log(`  Port: ${PORT}`);
  console.log('  CORS: http://localhost:3000');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('Waiting for connections...');
});
