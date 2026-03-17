'use client';

import { useMemo, useRef, useState } from 'react';
import { Track } from 'livekit-client';
import { Camera, CameraOff, LogOut, MessageSquare, Mic, MicOff, Monitor, MonitorOff, Paperclip } from 'lucide-react';
import { useSessionContext, useTrackToggle } from '@livekit/components-react';

export type AgentControlBarControls = {
  microphone?: boolean;
  camera?: boolean;
  screenShare?: boolean;
  chat?: boolean;
  leave?: boolean;
};

type AgentControlBarProps = {
  variant?: 'outline' | 'livekit';
  controls?: AgentControlBarControls;
  isChatOpen?: boolean;
  onIsChatOpenChange?: (open: boolean) => void;
  onDisconnect?: () => void | Promise<void>;
  onFileUpload?: (file: File) => void | Promise<void>;
  className?: string;
};

export function AgentControlBar({
  variant = 'outline',
  controls = {
    microphone: true,
    camera: false,
    screenShare: true,
    chat: true,
    leave: true,
  },
  isChatOpen = true,
  onIsChatOpenChange,
  onDisconnect,
  onFileUpload,
  className = '',
}: AgentControlBarProps) {
  const session = useSessionContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSendingFile, setIsSendingFile] = useState(false);

  const { toggle: toggleMic, enabled: micEnabled } = useTrackToggle({ source: Track.Source.Microphone });
  const { toggle: toggleCamera, enabled: cameraEnabled } = useTrackToggle({ source: Track.Source.Camera });
  const { toggle: toggleScreenShare, enabled: screenShareEnabled } = useTrackToggle({ source: Track.Source.ScreenShare });

  const baseButtonClasses = useMemo(() => {
    if (variant === 'livekit') {
      return 'h-11 w-11 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]';
    }
    return 'h-11 w-11 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]';
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

  return (
    <div className={`agent-control-bar flex items-center justify-center gap-3 px-4 py-2 ${className}`}>
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
  );
}
