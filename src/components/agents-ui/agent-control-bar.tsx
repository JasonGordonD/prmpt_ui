'use client';

import { useMemo, useRef, useState } from 'react';
import { Track } from 'livekit-client';
import { Camera, CameraOff, Loader2, LogOut, MessageSquare, Mic, MicOff, Monitor, MonitorOff, Paperclip, Send } from 'lucide-react';
import { useChat, useSessionContext, useTrackToggle } from '@livekit/components-react';

export type AgentControlBarControls = {
  microphone?: boolean;
  camera?: boolean;
  screenShare?: boolean;
  chat?: boolean;
  leave?: boolean;
};

type AgentControlBarProps = {
  variant?: 'default' | 'outline' | 'livekit';
  controls?: AgentControlBarControls;
  saveUserChoices?: boolean;
  isConnected?: boolean;
  isChatOpen?: boolean;
  onIsChatOpenChange?: (open: boolean) => void;
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
  onDisconnect?: () => void | Promise<void>;
  onFileUpload?: (file: File) => void | Promise<void>;
  className?: string;
};

export function AgentControlBar({
  variant = 'default',
  controls = {
    microphone: true,
    camera: false,
    screenShare: true,
    chat: true,
    leave: true,
  },
  saveUserChoices: _saveUserChoices = true,
  isConnected,
  isChatOpen = true,
  onIsChatOpenChange,
  onDeviceError,
  onDisconnect,
  onFileUpload,
  className = '',
}: AgentControlBarProps) {
  const { send, isSending } = useChat();
  const session = useSessionContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSendingFile, setIsSendingFile] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  const resolvedIsConnected = isConnected ?? session.isConnected;

  const { toggle: toggleMic, enabled: micEnabled } = useTrackToggle({
    source: Track.Source.Microphone,
    onDeviceError: (error) => onDeviceError?.({ source: Track.Source.Microphone, error }),
  });
  const { toggle: toggleCamera, enabled: cameraEnabled } = useTrackToggle({
    source: Track.Source.Camera,
    onDeviceError: (error) => onDeviceError?.({ source: Track.Source.Camera, error }),
  });
  const { toggle: toggleScreenShare, enabled: screenShareEnabled } = useTrackToggle({
    source: Track.Source.ScreenShare,
    onDeviceError: (error) => onDeviceError?.({ source: Track.Source.ScreenShare, error }),
  });

  const baseButtonClasses = useMemo(() => {
    if (variant === 'livekit') {
      return 'agent-control-btn h-11 w-11 rounded-full';
    }
    return 'agent-control-btn h-11 w-11 rounded-lg';
  }, [variant]);

  const handleDisconnect = async () => {
    if (onDisconnect) {
      await onDisconnect();
      return;
    }
    await session.end();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session.room) {
      return;
    }

    setIsSendingFile(true);
    try {
      if (onFileUpload) {
        await onFileUpload(file);
      } else {
        await session.room.localParticipant.sendFile(file, { topic: 'images' });
      }
    } finally {
      setIsSendingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSendChatMessage = async () => {
    const message = chatMessage.trim();
    if (!message || !resolvedIsConnected || isSending) return;
    try {
      await send(message);
      setChatMessage('');
    } catch (error) {
      console.error('[AgentControlBar] Failed to send message', error);
    }
  };

  return (
    <div className={`agent-control-bar flex flex-col gap-2 px-6 py-2 ${variant === 'livekit' ? 'agent-control-bar-livekit' : ''} ${className}`} data-variant={variant}>
      {controls.chat && isChatOpen && (
        <div className="agent-control-chat-panel flex items-center gap-2">
          <input
            type="text"
            value={chatMessage}
            onChange={(event) => setChatMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void handleSendChatMessage();
              }
            }}
            placeholder="Type something..."
            className="agent-control-chat-input"
            disabled={!resolvedIsConnected || isSending}
          />
          <button
            type="button"
            onClick={() => {
              void handleSendChatMessage();
            }}
            className="agent-control-chat-send"
            disabled={!resolvedIsConnected || isSending || chatMessage.trim().length === 0}
            title={isSending ? 'Sending...' : 'Send'}
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      )}

      <div className="flex h-16 items-center justify-center gap-3">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,video/*,.pdf,.txt"
        onChange={handleFileChange}
      />

      {controls.microphone && (
        <button
          type="button"
          onClick={() => toggleMic()}
          data-control="microphone"
          data-active={micEnabled ? 'true' : 'false'}
          className={baseButtonClasses}
          title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          {micEnabled ? <Mic className="m-auto h-4 w-4" /> : <MicOff className="m-auto h-4 w-4" />}
        </button>
      )}

      {controls.camera && (
        <button
          type="button"
          onClick={() => toggleCamera()}
          data-control="camera"
          data-active={cameraEnabled ? 'true' : 'false'}
          className={baseButtonClasses}
          title={cameraEnabled ? 'Disable camera' : 'Enable camera'}
        >
          {cameraEnabled ? <Camera className="m-auto h-4 w-4" /> : <CameraOff className="m-auto h-4 w-4" />}
        </button>
      )}

      {controls.screenShare && (
        <button
          type="button"
          onClick={() => toggleScreenShare()}
          data-control="screenShare"
          data-active={screenShareEnabled ? 'true' : 'false'}
          className={baseButtonClasses}
          title={screenShareEnabled ? 'Stop screen share' : 'Start screen share'}
        >
          {screenShareEnabled ? <MonitorOff className="m-auto h-4 w-4" /> : <Monitor className="m-auto h-4 w-4" />}
        </button>
      )}

      <button
        type="button"
        data-control="upload"
        className={baseButtonClasses}
        onClick={handleUploadClick}
        title={isSendingFile ? 'Sending file...' : 'Send file'}
      >
        <Paperclip className="m-auto h-4 w-4" />
      </button>

      {controls.chat && (
        <button
          type="button"
          data-control="chat"
          data-active={isChatOpen ? 'true' : 'false'}
          className={baseButtonClasses}
          onClick={() => onIsChatOpenChange?.(!isChatOpen)}
          title={isChatOpen ? 'Hide chat' : 'Show chat'}
        >
          <MessageSquare className="m-auto h-4 w-4" />
        </button>
      )}

      {controls.leave && (
        <button
          type="button"
          data-control="leave"
          className={`${baseButtonClasses} w-auto px-4`}
          disabled={!resolvedIsConnected}
          onClick={() => {
            void handleDisconnect();
          }}
          title="Leave session"
        >
          <span className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            <span className="text-xs">Leave</span>
          </span>
        </button>
      )}
      </div>
    </div>
  );
}
