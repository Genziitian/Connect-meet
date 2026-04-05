// ============================================================
// GenZ IITian Connect — Socket Manager (Client-side)
// ============================================================

import { io, Socket } from 'socket.io-client';
import { ChatMode, MatchFilter } from '@/types';

class SocketManager {
  private socket: Socket | null = null;
  private static instance: SocketManager;

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  connect(userId: string, token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      auth: { userId, token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    return this.socket;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Queue operations
  joinQueue(mode: ChatMode, filters: MatchFilter): void {
    this.socket?.emit('queue:join', { mode, filters });
  }

  leaveQueue(): void {
    this.socket?.emit('queue:leave');
  }

  // Chat operations
  sendMessage(sessionId: string, content: string): void {
    this.socket?.emit('chat:message', { sessionId, content });
  }

  endChat(sessionId: string): void {
    this.socket?.emit('chat:end', { sessionId });
  }

  // Report
  reportUser(sessionId: string, reason: string, description?: string): void {
    this.socket?.emit('chat:report', { sessionId, reason, description });
  }

  // Block
  blockUser(blockedUserId: string): void {
    this.socket?.emit('user:block', { blockedUserId });
  }

  // Typing indicator
  sendTyping(sessionId: string): void {
    this.socket?.emit('chat:typing', { sessionId });
  }

  stopTyping(sessionId: string): void {
    this.socket?.emit('chat:stop-typing', { sessionId });
  }
}

export const socketManager = SocketManager.getInstance();
export default SocketManager;
