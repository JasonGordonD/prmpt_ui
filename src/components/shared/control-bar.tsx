'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Track } from 'livekit-client';
import {
  useTrackToggle,
  useChat,
  useSessionContext,
} from '@livekit/components-react';
import { Mic, MicOff, MessageSquare, Paperclip, Send, LogOut, X, Check, FileText, AlertCircle } from 'lucide-react';

type ControlBarProps = {
  onLeave: () => void;
  className?: string;
};

/* ─── File Upload Inline ─── */

const ACCEPTED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf', 'text/plain',
];

function getUploadTopic(file: File) {
  if (file.type.startsWith('image/')) {
    return 'images';
  }
  return 'files';
}

function FileUploadButton() {
  const session = useSessionContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
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
        topic: getUploadTopic(file),
      });
      setStatus('sent');
      setTimeout(() => {
        setStatus('idle');
        setFileName('');
      }, 3000);
    } catch (err) {
      console.error('File send failed:', err);
      setStatus('failed');
      setTimeout(() => {
        setStatus('idle');
        setFileName('');
      }, 3000);
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
            : status === 'failed'
              ? 'bg-red-600/20 text-red-400'
            : 'bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--border)]'
        }`}
        title={
          status === 'sent'
            ? `Sent: ${fileName}`
            : status === 'failed'
              ? `Failed: ${fileName}`
              : 'Upload file'
        }
      >
        {status === 'sending' ? (
          <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin-slow" />
        ) : status === 'sent' ? (
          <Check className="w-4 h-4" />
        ) : status === 'failed' ? (
          <AlertCircle className="w-4 h-4" />
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
      {status === 'failed' && fileName && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-red-400 animate-fade-in flex items-center gap-1.5">
          <FileText className="w-3 h-3" />
          {fileName} failed
        </div>
      )}
    </div>
  );
}

/* ─── Chat Message Timestamp ─── */

function formatChatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ─── Main Control Bar ─── */

export function ControlBar({ onLeave, className = '' }: ControlBarProps) {
  const { send, isSending, chatMessages } = useChat();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

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
      {/* Chat panel — message list + input */}
      {chatOpen && (
        <div className="flex flex-col bg-[var(--surface)] border-t border-[var(--border)] animate-fade-in">
          {/* Message list */}
          {chatMessages.length > 0 && (
            <div
              ref={chatScrollRef}
              className="max-h-[200px] overflow-y-auto px-4 py-3 space-y-2"
            >
              {chatMessages.map((msg) => (
                <div key={msg.timestamp} className="flex items-start gap-2 text-sm">
                  <span className="text-[11px] text-[var(--text-muted)] tabular-nums shrink-0 mt-0.5">
                    {formatChatTime(msg.timestamp)}
                  </span>
                  <span className="text-xs font-medium text-[var(--primary)] shrink-0">
                    {msg.from?.name || msg.from?.identity || 'You'}:
                  </span>
                  <span className="text-sm text-[var(--text)]">{msg.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Send input row */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--border)]">
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
            className={`relative flex items-center justify-center w-11 h-11 rounded-lg btn-interactive border ${
              chatOpen
                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--border)]'
            }`}
            title={chatOpen ? 'Close chat' : 'Open chat'}
          >
            <MessageSquare className="w-4 h-4" />
            {/* Unread indicator when chat is closed and there are messages */}
            {!chatOpen && chatMessages.length > 0 && (
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--primary)] border-2 border-[var(--surface)]" />
            )}
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
