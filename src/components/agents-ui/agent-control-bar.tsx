'use client';

import { useRef, useState, type ComponentProps } from 'react';
import { useChat } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Loader, MessageSquareTextIcon, Paperclip, SendHorizontal } from 'lucide-react';
import { motion, type MotionProps } from 'motion/react';
import { cn } from '@/lib/utils';
import { AgentDisconnectButton } from '@/components/agents-ui/agent-disconnect-button';
import { AgentTrackControl } from '@/components/agents-ui/agent-track-control';
import { AgentTrackToggle, agentTrackToggleVariants } from '@/components/agents-ui/agent-track-toggle';
import { Toggle } from '@/components/ui/toggle';
import {
  useInputControls,
  usePublishPermissions,
  type UseInputControlsProps,
} from '@/hooks/agents-ui/use-agent-control-bar';

const MOTION_PROPS: MotionProps = {
  variants: {
    hidden: { height: 0, opacity: 0, marginBottom: 0 },
    visible: { height: 'auto', opacity: 1, marginBottom: 12 },
  },
  initial: 'hidden',
  transition: { duration: 0.2, ease: 'easeOut' },
};

function AgentChatInput({
  chatOpen,
  onSend = async () => {},
}: {
  chatOpen: boolean;
  onSend?: (message: string) => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');
  const isDisabled = isSending || message.trim().length === 0;

  const handleSend = async () => {
    if (isDisabled) return;
    try {
      setIsSending(true);
      await onSend(message.trim());
      setMessage('');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mb-3 flex grow items-end gap-2 rounded-md pl-1 text-sm">
      <textarea
        autoFocus
        ref={inputRef}
        value={message}
        disabled={!chatOpen || isSending}
        placeholder="Type something..."
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleSend();
          }
        }}
        onChange={(e) => setMessage(e.target.value)}
        className="agent-control-chat-input field-sizing-content max-h-16 min-h-8 flex-1 resize-none py-2 [scrollbar-width:thin] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />
      <button
        type="button"
        disabled={isDisabled}
        title={isSending ? 'Sending...' : 'Send'}
        onClick={() => void handleSend()}
        className="agent-control-chat-send self-end disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSending ? <Loader className="animate-spin" /> : <SendHorizontal />}
      </button>
    </div>
  );
}

export interface AgentControlBarControls {
  leave?: boolean;
  camera?: boolean;
  microphone?: boolean;
  screenShare?: boolean;
  chat?: boolean;
}

export interface AgentControlBarProps extends UseInputControlsProps {
  variant?: 'default' | 'outline' | 'livekit';
  controls?: AgentControlBarControls;
  saveUserChoices?: boolean;
  isConnected?: boolean;
  isChatOpen?: boolean;
  onDisconnect?: () => void;
  onIsChatOpenChange?: (open: boolean) => void;
  onFileUpload?: (file: File) => void | Promise<void>;
}

export function AgentControlBar({
  variant = 'default',
  controls,
  isChatOpen = false,
  isConnected = false,
  saveUserChoices = true,
  onDisconnect,
  onDeviceError,
  onIsChatOpenChange,
  onFileUpload,
  className,
  ...props
}: AgentControlBarProps & ComponentProps<'div'>) {
  const { send } = useChat();
  const publishPermissions = usePublishPermissions();
  const [isChatOpenUncontrolled, setIsChatOpenUncontrolled] = useState(isChatOpen);
  const [isSendingFile, setIsSendingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    microphoneTrack,
    cameraToggle,
    microphoneToggle,
    screenShareToggle,
    handleAudioDeviceChange,
    handleVideoDeviceChange,
    handleMicrophoneDeviceSelectError,
    handleCameraDeviceSelectError,
  } = useInputControls({ onDeviceError, saveUserChoices });

  const visibleControls = {
    leave: controls?.leave ?? true,
    microphone: controls?.microphone ?? publishPermissions.microphone,
    screenShare: controls?.screenShare ?? publishPermissions.screenShare,
    camera: controls?.camera ?? publishPermissions.camera,
    chat: controls?.chat ?? publishPermissions.data,
  };

  if (Object.values(visibleControls).every((value) => !value) && !onFileUpload) {
    return null;
  }

  return (
    <div
      aria-label="Voice assistant controls"
      className={cn(
        'agent-control-bar bg-background border-input/50 dark:border-muted flex flex-col border p-3 drop-shadow-md/3',
        variant === 'livekit' ? 'rounded-[31px]' : 'rounded-lg',
        className,
      )}
      data-variant={variant}
      {...props}
    >
      <motion.div
        {...MOTION_PROPS}
        inert={!(isChatOpen || isChatOpenUncontrolled)}
        animate={isChatOpen || isChatOpenUncontrolled ? 'visible' : 'hidden'}
        className="border-input/50 flex w-full items-start overflow-hidden border-b"
      >
        <AgentChatInput
          chatOpen={isChatOpen || isChatOpenUncontrolled}
          onSend={async (message) => {
            await send(message);
          }}
        />
      </motion.div>

      <div className="flex gap-1">
        <div className="flex grow gap-1">
          {visibleControls.microphone && (
            <AgentTrackControl
              variant={variant === 'outline' ? 'outline' : 'default'}
              kind="audioinput"
              aria-label="Toggle microphone"
              source={Track.Source.Microphone}
              pressed={microphoneToggle.enabled}
              disabled={microphoneToggle.pending}
              audioTrack={microphoneTrack}
              onPressedChange={microphoneToggle.toggle}
              onActiveDeviceChange={handleAudioDeviceChange}
              onMediaDeviceError={handleMicrophoneDeviceSelectError}
            />
          )}

          {visibleControls.camera && (
            <AgentTrackControl
              variant={variant === 'outline' ? 'outline' : 'default'}
              kind="videoinput"
              aria-label="Toggle camera"
              source={Track.Source.Camera}
              pressed={cameraToggle.enabled}
              pending={cameraToggle.pending}
              disabled={cameraToggle.pending}
              onPressedChange={cameraToggle.toggle}
              onMediaDeviceError={handleCameraDeviceSelectError}
              onActiveDeviceChange={handleVideoDeviceChange}
            />
          )}

          {visibleControls.screenShare && (
            <AgentTrackToggle
              variant={variant === 'outline' ? 'outline' : 'default'}
              aria-label="Toggle screen share"
              source={Track.Source.ScreenShare}
              pressed={screenShareToggle.enabled}
              disabled={screenShareToggle.pending}
              onPressedChange={screenShareToggle.toggle}
              className={cn(variant === 'livekit' && 'rounded-full', agentTrackToggleVariants())}
            />
          )}

          {onFileUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,video/*,.pdf,.txt"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setIsSendingFile(true);
                  try {
                    await onFileUpload(file);
                  } finally {
                    setIsSendingFile(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }
                }}
              />
              <Toggle
                variant={variant === 'outline' ? 'outline' : 'default'}
                pressed={false}
                aria-label="Upload file"
                onPressedChange={() => fileInputRef.current?.click()}
                className={agentTrackToggleVariants({ variant: variant === 'outline' ? 'outline' : 'default' })}
              >
                {isSendingFile ? <Loader className="animate-spin" /> : <Paperclip />}
              </Toggle>
            </>
          )}

          {visibleControls.chat && (
            <Toggle
              variant={variant === 'outline' ? 'outline' : 'default'}
              pressed={isChatOpen || isChatOpenUncontrolled}
              aria-label="Toggle transcript"
              onPressedChange={(state) => {
                if (!onIsChatOpenChange) setIsChatOpenUncontrolled(state);
                else onIsChatOpenChange(state);
              }}
              className={agentTrackToggleVariants({ variant: variant === 'outline' ? 'outline' : 'default' })}
            >
              <MessageSquareTextIcon />
            </Toggle>
          )}
        </div>

        {visibleControls.leave && (
          <AgentDisconnectButton
            onClick={onDisconnect}
            disabled={!isConnected}
            className={cn(
              variant === 'livekit' &&
                'bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-full font-mono text-xs font-bold tracking-wider',
            )}
          >
            <span className="hidden md:inline">END CALL</span>
            <span className="inline md:hidden">END</span>
          </AgentDisconnectButton>
        )}
      </div>
    </div>
  );
}
