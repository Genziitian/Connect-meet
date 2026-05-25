'use client';

import React, { useEffect, useRef } from 'react';

const EMOJI_GROUPS: Record<string, string[]> = {
  Smiles: [
    '😀', '😁', '😂', '🤣', '😅', '😊', '😍', '😘', '😜', '🤔',
    '😎', '🤗', '🙄', '😴', '🤤', '🤯', '😱', '🥺', '🥲', '😭',
    '😤', '😠', '🙃', '😏', '😬', '🤡', '🤓', '😇', '🤠', '🥳',
  ],
  Gestures: [
    '👍', '👎', '👏', '🙌', '🤝', '🙏', '👌', '✌️', '🤞', '🤟',
    '🤘', '🤙', '👋', '🫡', '💪', '🫶', '👐', '🤲', '✋', '🖐️',
  ],
  Hearts: [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💖', '💝',
    '💗', '💓', '💕', '💞', '💘', '💔', '❣️', '💟', '♥️', '💌',
  ],
  Objects: [
    '🔥', '✨', '⭐', '💯', '⚡', '🎉', '🎊', '🎁', '🏆', '🥇',
    '📚', '💻', '📱', '🎧', '🎮', '🎵', '☕', '🍕', '🌙', '🌟',
  ],
  Faces: [
    '🐶', '🐱', '🦊', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸',
    '🐵', '🐔', '🦄', '🦋', '🐢', '🐬', '🦖', '🐙', '🦈', '🐳',
  ],
  Symbols: [
    '✅', '❌', '⚠️', '🚀', '💡', '🎯', '📌', '🔒', '👀', '💭',
    '💬', '📣', '🛡️', '🤖', '🌈', '☀️', '🌧️', '❄️', '⏰', '📅',
  ],
};

interface Props {
  onPick: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onPick, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-12 left-0 z-50 w-72 max-h-72 overflow-y-auto rounded-xl border-[2px] border-[#111] bg-white shadow-[3px_3px_0_#111] p-2"
    >
      {Object.entries(EMOJI_GROUPS).map(([group, emojis]) => (
        <div key={group} className="mb-2 last:mb-0">
          <p className="text-[9px] font-black uppercase tracking-wider text-[#888] px-1 mb-1">
            {group}
          </p>
          <div className="grid grid-cols-10 gap-0.5">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onPick(emoji)}
                className="h-7 w-7 text-base hover:bg-[#FDEBD3] rounded transition-colors flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
