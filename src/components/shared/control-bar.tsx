'use client';

import { useState, useCallback, useRef } from 'react';
import { Track } from 'livekit-client';
import {
  useTrackToggle,
  useSessionMessages,
  useSessionContext,
} from '@livekit/components-react';
import { Mic, MicOff, MessageSquare, Paperclip, Send, LogOut, X, Check, FileText } from 'lucide-react';

type ControlBarProps = {
  onLeave: () => void;
  className?: string;
};

/* ─── File Upload Inline ─── */

const ACCEPTED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf', 'text/plain',
];

function FileUploadButton() {
  const session = useSessionContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [fileName, setFileName] = useState('');

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.room) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      return;
    }

    setFileName(file.name);
    setStatus('sending');

    try {
      await session.room.localParticipant.sendFile(file, {
        mimeType: file.type,
        topic: 'files',
      });
      setStatus('sent');
      setTimeout(() => {
        setStatus('idle');
        setFileName('');
      }, 3000);
    } catch (err) {
      console.error('File send failed:', err);
      setStatus('idle');
      setFileName('');
    }

    if (inputRef.current) inputRef.current.value = '';
  }, [session]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        className={`flex items-center justify-center w-11 h-11 rounded-lg btn-interactive border border-[var(--border)] ${
          status === 'sent'
            ? 'bg-green-600/20 text-green-400'
            : 'bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--border)]'
        }`}
        title={status === 'sent' ? `Sent: ${fileName}` : 'Upload file'}
      >
        {status === 'sending' ? (
          <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin-slow" />
        ) : status === 'sent' ? (
          <Check className="w-4 h-4" />
        ) : (
          <Paperclip className="w-4 h-4" />
        )}
      </button>

      {/* File sent notification */}
      {status === 'sent' && fileName && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-green-400 animate-fade-in flex items-center gap-1.5">
          <FileText className="w-3 h-3" />
          {fileName} sent
        </div>
      )}
    </div>
  );
}

/* ─── Main Control Bar ─── */

export function ControlBar({ onLeave, className = '' }: ControlBarProps) {
  const session = useSessionContext();
  const { send, isSending } = useSessionMessages(session);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  // Mic toggle using real LiveKit track control
  const { toggle: toggleMic, enabled: micEnabled } = useTrackToggle({
    source: Track.Source.Microphone,
  });

  const handleSendChat = useCallback(async () => {
    if (!chatMessage.trim()) return;
    try {
      await send(chatMessage.trim());
      setChatMessage('');
    } catch (err) {
      console.error('Chat send failed:', err);
    }
  }, [chatMessage, send]);

  return (
    <div className={`shrink-0 ${className}`}>
      {/* Chat input panel */}
      {chatOpen && (
        <div className="flex items-center gap-2 px-4 py-3 bg-[var(--surface)] border-t border-[var(--border)] animate-fade-in">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] rounded-lg text-sm placeholder-[var(--text-muted)]"
            autoFocus
          />
          <button
            onClick={handleSendChat}
            disabled={isSending || !chatMessage.trim()}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--primary)] text-white btn-interactive disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChatOpen(false)}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] btn-interactive"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main control bar */}
      <div className="flex items-center px-4 py-3 bg-[var(--surface)] border-t border-[var(--border)]">
        {/* Left group: Mic + Chat */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleMic()}
            className={`flex items-center justify-center w-11 h-11 rounded-lg btn-interactive border ${
              micEnabled
                ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--border)]'
                : 'bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600/30'
            }`}
            title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`flex items-center justify-center w-11 h-11 rounded-lg btn-interactive border ${
              chatOpen
                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--border)]'
            }`}
            title={chatOpen ? 'Close chat' : 'Open chat'}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>

        {/* Center group: File upload */}
        <div className="flex-1 flex items-center justify-center">
          <FileUploadButton />
        </div>

        {/* Right group: Leave */}
        <div className="flex items-center gap-3">
          <button
            onClick={onLeave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium btn-interactive min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
