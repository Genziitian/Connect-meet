'use client';

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Radio, Users, Activity } from 'lucide-react';

interface LiveData {
  onlineUsers: number;
  inQueue: number;
  activeSessions: number;
}

export default function LiveStats() {
  const [data, setData] = useState<LiveData>({ onlineUsers: 0, inQueue: 0, activeSessions: 0 });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const socket: Socket = io(url, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('stats:update', (payload: LiveData) => setData(payload));

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="bb-card bg-gradient-to-r from-[#00D09C]/10 to-[#B794F6]/10 p-5 border-[#00D09C]/30">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-black text-[#111] flex items-center gap-2">
          <Radio className={`h-4 w-4 ${connected ? 'text-[#00D09C] animate-pulse' : 'text-[#888]'}`} />
          Live ({connected ? 'connected' : 'disconnected'})
        </h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <LiveTile icon={Users} label="Online now" value={data.onlineUsers} />
        <LiveTile icon={Activity} label="In queue" value={data.inQueue} />
        <LiveTile icon={Activity} label="Active sessions" value={data.activeSessions} />
      </div>
    </div>
  );
}

function LiveTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white rounded-xl border-[2px] border-[#111] shadow-[3px_3px_0px_#111] p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 text-[#00D09C]" />
        <span className="text-[9px] font-bold text-[#555] uppercase">{label}</span>
      </div>
      <p className="text-2xl font-black text-[#111] tabular-nums">{value}</p>
    </div>
  );
}
