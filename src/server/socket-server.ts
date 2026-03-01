// ============================================================
// Socket.IO Server Configuration (for separate backend)
// GenZ IITian Connect — Real-time Matching & Chat Engine
// ============================================================
//
// This file is meant to run as a SEPARATE Node.js server
// alongside the Next.js frontend. Deploy separately.
//
// Usage: npx ts-node src/server/socket-server.ts
// Or:    node dist/server/socket-server.js
// ============================================================

/*
import { Server } from 'socket.io';
import { createServer } from 'http';
import { createClient } from 'redis';

// ─── Configuration ───
const PORT = process.env.SOCKET_PORT || 3001;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CORS_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── Redis Client ───
const redis = createClient({ url: REDIS_URL });

// ─── HTTP + Socket.IO Server ───
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// ─── Types ───
interface QueueEntry {
  userId: string;
  socketId: string;
  planType: 'free' | 'pro' | 'premium';
  mode: 'text' | 'video';
  filters: {
    topic?: string;
    courseLevel?: string;
    degreeType?: string;
  };
  joinedAt: number;
}

interface ActiveSession {
  sessionId: string;
  user1: { userId: string; socketId: string };
  user2: { userId: string; socketId: string };
  mode: 'text' | 'video';
  startedAt: number;
}

// ─── In-Memory Stores (use Redis in production) ───
const waitingQueue: QueueEntry[] = [];
const activeSessions: Map<string, ActiveSession> = new Map();
const userSocketMap: Map<string, string> = new Map();

// ─── Authentication Middleware ───
io.use(async (socket, next) => {
  const { userId, token } = socket.handshake.auth;

  if (!userId || !token) {
    return next(new Error('Authentication required'));
  }

  // In production: verify JWT token
  // const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // if (!decoded) return next(new Error('Invalid token'));

  // Check if user is banned
  // const user = await db.users.findUnique({ where: { id: userId } });
  // if (user?.isBanned) return next(new Error('Account suspended'));

  socket.data.userId = userId;
  next();
});

// ─── Connection Handler ───
io.on('connection', (socket) => {
  const userId = socket.data.userId;
  console.log(`[WS] Connected: ${userId} (${socket.id})`);

  userSocketMap.set(userId, socket.id);

  // ── Join Queue ──
  socket.on('queue:join', ({ mode, filters }) => {
    // Remove from existing queue if present
    const existingIndex = waitingQueue.findIndex(e => e.userId === userId);
    if (existingIndex !== -1) waitingQueue.splice(existingIndex, 1);

    // Check rate limits
    // const matchesUsed = await getMatchCount(userId);
    // const maxMatches = getMaxMatches(planType);
    // if (maxMatches !== -1 && matchesUsed >= maxMatches) {
    //   socket.emit('queue:error', { message: 'Daily connect limit reached' });
    //   return;
    // }

    const entry: QueueEntry = {
      userId,
      socketId: socket.id,
      planType: 'free', // fetch from DB in production
      mode: mode || 'text',
      filters: filters || {},
      joinedAt: Date.now(),
    };

    waitingQueue.push(entry);
    socket.emit('queue:joined', { position: waitingQueue.length });

    console.log(`[QUEUE] ${userId} joined (${mode}). Queue size: ${waitingQueue.length}`);

    // Try to match
    tryMatch(entry);
  });

  // ── Leave Queue ──
  socket.on('queue:leave', () => {
    const index = waitingQueue.findIndex(e => e.userId === userId);
    if (index !== -1) {
      waitingQueue.splice(index, 1);
      socket.emit('queue:left');
      console.log(`[QUEUE] ${userId} left. Queue size: ${waitingQueue.length}`);
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
    const peer = session.user1.userId === userId ? session.user2 : session.user1;
    const peerSocket = io.sockets.sockets.get(peer.socketId);

    if (peerSocket) {
      peerSocket.emit('chat:message', {
        sessionId,
        senderId: userId,
        content,
        timestamp: new Date().toISOString(),
      });
    }

    // NOTE: We do NOT store messages (privacy compliance)
  });

  // ── Typing Indicator ──
  socket.on('chat:typing', ({ sessionId }) => {
    const session = activeSessions.get(sessionId);
    if (!session) return;
    
    const peer = session.user1.userId === userId ? session.user2 : session.user1;
    const peerSocket = io.sockets.sockets.get(peer.socketId);
    peerSocket?.emit('chat:typing', { sessionId });
  });

  socket.on('chat:stop-typing', ({ sessionId }) => {
    const session = activeSessions.get(sessionId);
    if (!session) return;
    
    const peer = session.user1.userId === userId ? session.user2 : session.user1;
    const peerSocket = io.sockets.sockets.get(peer.socketId);
    peerSocket?.emit('chat:stop-typing', { sessionId });
  });

  // ── End Chat ──
  socket.on('chat:end', ({ sessionId }) => {
    endSession(sessionId, userId);
  });

  // ── Report User ──
  socket.on('chat:report', async ({ sessionId, reason, description }) => {
    const session = activeSessions.get(sessionId);
    if (!session) return;

    const reportedUserId = session.user1.userId === userId 
      ? session.user2.userId 
      : session.user1.userId;

    // Log report (IT Rules 2021 compliance)
    console.log(`[REPORT] ${userId} reported ${reportedUserId}: ${reason}`);

    // In production: save to database
    // await db.reports.create({...});

    // End the session
    endSession(sessionId, userId);
  });

  // ── Block User ──
  socket.on('user:block', ({ blockedUserId }) => {
    console.log(`[BLOCK] ${userId} blocked ${blockedUserId}`);
    // In production: save to database
    // await db.blockedUsers.create({ userId, blockedUserId });
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    console.log(`[WS] Disconnected: ${userId}`);

    // Remove from queue
    const queueIndex = waitingQueue.findIndex(e => e.userId === userId);
    if (queueIndex !== -1) waitingQueue.splice(queueIndex, 1);

    // End any active sessions
    activeSessions.forEach((session, sessionId) => {
      if (session.user1.userId === userId || session.user2.userId === userId) {
        endSession(sessionId, userId);
      }
    });

    userSocketMap.delete(userId);
  });
});

// ─── Matching Engine ───
function tryMatch(entry: QueueEntry) {
  // Find a compatible match in the queue
  const matchIndex = waitingQueue.findIndex((other) => {
    if (other.userId === entry.userId) return false;
    if (other.mode !== entry.mode) return false;

    // Check blocked users (in production: check DB)
    // if (isBlocked(entry.userId, other.userId)) return false;

    // Smart matching for paid users
    if (entry.planType !== 'free' && other.planType !== 'free') {
      // Match by topic if both have filters
      if (entry.filters.topic && other.filters.topic) {
        return entry.filters.topic === other.filters.topic;
      }
    }

    return true;
  });

  if (matchIndex === -1) return; // No match found, stay in queue

  const match = waitingQueue[matchIndex];

  // Remove both from queue
  waitingQueue.splice(matchIndex, 1);
  const entryIndex = waitingQueue.findIndex(e => e.userId === entry.userId);
  if (entryIndex !== -1) waitingQueue.splice(entryIndex, 1);

  // Create session
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const session: ActiveSession = {
    sessionId,
    user1: { userId: entry.userId, socketId: entry.socketId },
    user2: { userId: match.userId, socketId: match.socketId },
    mode: entry.mode,
    startedAt: Date.now(),
  };

  activeSessions.set(sessionId, session);

  // Log session metadata (IT Rules 2021)
  // await db.chatSessions.create({
  //   sessionId,
  //   user1Id: entry.userId,
  //   user2Id: match.userId,
  //   mode: entry.mode,
  //   ipHash1: await hashIP(entry.ip),
  //   ipHash2: await hashIP(match.ip),
  // });

  // Notify both users
  const socket1 = io.sockets.sockets.get(entry.socketId);
  const socket2 = io.sockets.sockets.get(match.socketId);

  const matchData = (peerId: string) => ({
    sessionId,
    mode: entry.mode,
    peerId,
    startedAt: session.startedAt,
  });

  socket1?.emit('queue:matched', matchData(match.userId));
  socket2?.emit('queue:matched', matchData(entry.userId));

  // Increment match counters
  // await db.users.update({ where: { id: entry.userId }, data: { matchesUsedToday: { increment: 1 } } });
  // await db.users.update({ where: { id: match.userId }, data: { matchesUsedToday: { increment: 1 } } });

  console.log(`[MATCH] ${entry.userId} <-> ${match.userId} (${entry.mode})`);
}

// ─── End Session ───
function endSession(sessionId: string, endedBy: string) {
  const session = activeSessions.get(sessionId);
  if (!session) return;

  // Log end time
  // await db.chatSessions.update({
  //   where: { sessionId },
  //   data: {
  //     endTime: new Date(),
  //     durationSeconds: Math.floor((Date.now() - session.startedAt) / 1000),
  //   },
  // });

  // Notify both users
  const peer = session.user1.userId === endedBy ? session.user2 : session.user1;
  const peerSocket = io.sockets.sockets.get(peer.socketId);
  peerSocket?.emit('chat:ended', { sessionId, endedBy });

  activeSessions.delete(sessionId);
  console.log(`[SESSION] Ended: ${sessionId}`);
}

// ─── Start Server ───
async function start() {
  try {
    await redis.connect();
    console.log('[Redis] Connected');
  } catch (err) {
    console.warn('[Redis] Not available, using in-memory fallback');
  }

  httpServer.listen(PORT, () => {
    console.log(`[Socket.IO] Server running on port ${PORT}`);
    console.log(`[Socket.IO] CORS origin: ${CORS_ORIGIN}`);
  });
}

start();
*/

// ============================================================
// EXPORT: Configuration for reference
// ============================================================
export const SOCKET_SERVER_CONFIG = {
  port: 3001,
  corsOrigin: 'http://localhost:3000',
  redisUrl: 'redis://localhost:6379',
  features: [
    'Queue-based matching',
    'Priority matching for paid users',
    'Topic-based smart matching',
    'Real-time text messaging',
    'Typing indicators',
    'Session metadata logging (IT Rules compliance)',
    'Report & block functionality',
    'Auto-disconnect cleanup',
    'Rate limiting per plan',
  ],
  compliance: {
    messageStorage: false, // Never store messages
    videoStorage: false,   // Videos are peer-to-peer
    sessionLogging: true,  // Required by IT Rules 2021
    ipHashing: true,       // Store only hashed IPs
    retentionDays: 90,     // Auto-purge after 90 days
  },
};
