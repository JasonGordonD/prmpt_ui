'use client';

import { useState } from 'react';
import { Mic, MicOff, Camera, CameraOff, MessageSquare, Settings, Send } from 'lucide-react';
import { AgentTrackToggle } from '@/components/agents-ui/agent-track-toggle';
import { AgentDisconnectButton } from '@/components/agents-ui/agent-disconnect-button';

type ControlType = 'microphone' | 'camera' | 'chat' | 'leave' | 'device-select';

type ControlBarProps = {
  controls: ControlType[];
  onDisconnect?: () => void;
  onSendMessage?: (message: string) => void;
  className?: string;
};

export function ControlBar({
  controls,
  onDisconnect,
  onSendMessage,
  className = '',
}: ControlBarProps) {
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  const handleSendChat = () => {
    if (chatMessage.trim() && onSendMessage) {
      onSendMessage(chatMessage.trim());
      setChatMessage('');
    }
  };

  return (
    <div className={className}>
      {chatOpen && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border-t border-[var(--border)]">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-1.5 bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] rounded text-sm outline-none placeholder-[var(--text-muted)]"
          />
          <button
            onClick={handleSendChat}
            className="p-1.5 text-[var(--primary)] hover:opacity-80"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 px-4 py-3 bg-[var(--surface)] border-t border-[var(--border)]">
        <div className="flex items-center gap-3 flex-1 justify-center">
          {controls.includes('microphone') && (
            <AgentTrackToggle
              trackSource="microphone"
              enabled={micEnabled}
              onToggle={() => setMicEnabled(!micEnabled)}
            >
              {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </AgentTrackToggle>
          )}

          {controls.includes('camera') && (
            <AgentTrackToggle
              trackSource="camera"
              enabled={camEnabled}
              onToggle={() => setCamEnabled(!camEnabled)}
            >
              {camEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
            </AgentTrackToggle>
          )}

          {controls.includes('chat') && (
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                chatOpen
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--border)] border border-[var(--border)]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}

          {controls.includes('device-select') && (
            <div className="flex items-center gap-1">
              <button className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--border)] border border-[var(--border)]">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {controls.includes('leave') && (
          <AgentDisconnectButton onDisconnect={onDisconnect} />
        )}
      </div>
    </div>
  );
}
