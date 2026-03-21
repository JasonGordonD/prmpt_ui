'use client';

import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { useSessionContext } from '@livekit/components-react';
import { ConnectionState, Track } from 'livekit-client';
import { Loader, MessageSquareTextIcon, SendHorizontal } from 'lucide-react';

import { cn } from '@/lib/utils';
import { AgentDisconnectButton } from '@/components/agents-ui/agent-disconnect-button';
import { AgentTrackControl } from '@/components/agents-ui/agent-track-control';
import {
  AgentTrackToggle,
  agentTrackToggleVariants,
} from '@/components/agents-ui/agent-track-toggle';
import {
  ImageUploadButton,
  VideoInputButton,
} from '@/components/agents-ui/agent-media-message';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import {
  useInputControls,
  usePublishPermissions,
  type UseInputControlsProps,
} from '@/hooks/agents-ui/use-agent-control-bar';

const LK_TOGGLE_VARIANT_1 = [
  'data-[state=off]:bg-accent data-[state=off]:hover:bg-foreground/10',
  'data-[state=off]:[&_~_button]:bg-accent data-[state=off]:[&_~_button]:hover:bg-foreground/10',
  'data-[state=off]:border-border data-[state=off]:hover:border-foreground/12',
  'data-[state=off]:[&_~_button]:border-border data-[state=off]:[&_~_button]:hover:border-foreground/12',
  'data-[state=off]:text-destructive data-[state=off]:hover:text-destructive data-[state=off]:focus:text-destructive',
  'data-[state=off]:focus-visible:ring-foreground/12 data-[state=off]:focus-visible:border-ring',
  'dark:data-[state=off]:[&_~_button]:bg-accent dark:data-[state=off]:[&_~_button]:hover:bg-foreground/10',
];

const LK_TOGGLE_VARIANT_2 = [
  'data-[state=off]:bg-accent data-[state=off]:hover:bg-foreground/10',
  'data-[state=off]:border-border data-[state=off]:hover:border-foreground/12',
  'data-[state=off]:focus-visible:border-ring data-[state=off]:focus-visible:ring-foreground/12',
  'data-[state=off]:text-foreground data-[state=off]:hover:text-foreground data-[state=off]:focus:text-foreground',
  'data-[state=on]:bg-blue-500/20 data-[state=on]:hover:bg-blue-500/30',
  'data-[state=on]:border-blue-700/10 data-[state=on]:text-blue-700 data-[state=on]:ring-blue-700/30',
  'data-[state=on]:focus-visible:border-blue-700/50',
  'dark:data-[state=on]:bg-blue-500/20 dark:data-[state=on]:text-blue-300',
];

const ACCEPTED_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'];

function getUploadTopicsForFile(file: File): string[] {
  if (file.type.startsWith('image/')) {
    return ['images'];
  }
  return ['uploads', 'files'];
}

export type UploadTimelineItem = {
  id: string;
  name: string;
  mimeType: string;
  timestamp: number;
  status: 'uploading' | 'sent' | 'failed';
  previewUrl?: string;
  senderLabel?: string;
  errorMessage?: string;
};

interface AgentChatInputProps {
  disabled?: boolean;
  onSend?: (message: string) => void;
  className?: string;
}

function AgentChatInput({ disabled = false, onSend = async () => {}, className }: AgentChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string>('');
  const isDisabled = disabled || isSending || message.trim().length === 0;

  const handleSend = async () => {
    if (isDisabled) {
      return;
    }

    try {
      setIsSending(true);
      await onSend(message.trim());
      setMessage('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleButtonClick = async () => {
    if (isDisabled) return;
    await handleSend();
  };

  useEffect(() => {
    if (disabled) return;
    inputRef.current?.focus();
  }, [disabled]);

  return (
    <div className={cn('flex min-w-0 grow items-center gap-2 text-sm', className)}>
      <textarea
        autoFocus
        ref={inputRef}
        value={message}
        disabled={disabled || isSending}
        placeholder="Type something..."
        onKeyDown={handleKeyDown}
        onChange={(e) => setMessage(e.target.value)}
        className="field-sizing-content max-h-20 min-h-9 flex-1 resize-none rounded-md bg-transparent px-2 py-2 leading-tight [scrollbar-width:thin] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />
      <Button
        size="icon-sm"
        type="button"
        disabled={isDisabled}
        variant={isDisabled ? 'secondary' : 'default'}
        title={isSending ? 'Sending...' : 'Send'}
        onClick={handleButtonClick}
        className="shrink-0 rounded-full disabled:cursor-not-allowed"
      >
        {isSending ? <Loader className="animate-spin" /> : <SendHorizontal />}
      </Button>
    </div>
  );
}

/** Configuration for which controls to display in the AgentControlBar. */
export interface AgentControlBarControls {
  /**
   * Whether to show the leave/disconnect button.
   *
   * @defaultValue true
   */
  leave?: boolean;
  /**
   * Whether to show the camera toggle control.
   *
   * @defaultValue true (if camera publish permission is granted)
   */
  camera?: boolean;
  /**
   * Whether to show the microphone toggle control.
   *
   * @defaultValue true (if microphone publish permission is granted)
   */
  microphone?: boolean;
  /**
   * Whether to show the screen share toggle control.
   *
   * @defaultValue true (if screen share publish permission is granted)
   */
  screenShare?: boolean;
  /**
   * Whether to show the chat toggle control.
   *
   * @defaultValue true (if data publish permission is granted)
   */
  chat?: boolean;
  /**
   * Whether to show the image upload button.
   *
   * @defaultValue false
   */
  imageUpload?: boolean;
  /**
   * Whether to show the video input button.
   *
   * @defaultValue false
   */
  videoInput?: boolean;
}

export interface AgentControlBarProps extends UseInputControlsProps {
  /**
   * The visual style of the control bar.
   *
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'livekit';
  /**
   * This takes an object with the following keys: `leave`, `microphone`, `screenShare`, `camera`,
   * `chat`. Each key maps to a boolean value that determines whether the control is displayed.
   *
   * @default
   * {
   *   leave: true,
   *   microphone: true,
   *   screenShare: true,
   *   camera: true,
   *   chat: true,
   * }
   */
  controls?: AgentControlBarControls;
  /**
   * Whether to save user choices.
   *
   * @default true
   */
  saveUserChoices?: boolean;
  /**
   * Whether the agent is connected to a session.
   *
   * @default false
   */
  isConnected?: boolean;
  /**
   * Whether the chat input interface is open.
   *
   * @default false
   */
  isChatOpen?: boolean;
  /** The callback for when the user disconnects. */
  onDisconnect?: () => void;
  /** The callback for when the chat is opened or closed. */
  onIsChatOpenChange?: (open: boolean) => void;
  /** The callback for when a device error occurs. */
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
  /** The callback for when the user selects an image to upload. */
  onImageUpload?: (file: File) => void;
  /** The callback for when the user provides a video URL. */
  onVideoUrl?: (url: string) => void;
  /** The callback for when the user uploads a video file. */
  onVideoFile?: (file: File) => void;
}

/**
 * A control bar specifically designed for voice assistant interfaces. Provides controls for
 * microphone, camera, screen share, chat, and disconnect. Includes an expandable chat input for
 * text-based interaction with the agent.
 *
 * @example
 *
 * ```tsx
 * <AgentControlBar
 *   variant="livekit"
 *   isConnected={true}
 *   onDisconnect={() => handleDisconnect()}
 *   controls={{
 *     microphone: true,
 *     camera: true,
 *     screenShare: false,
 *     chat: true,
 *     leave: true,
 *   }}
 * />;
 * ```
 *
 * @extends ComponentProps<'div'>
 */
export function AgentControlBar({
  variant = 'default',
  controls,
  isChatOpen = false,
  isConnected = false,
  saveUserChoices = true,
  onDisconnect,
  onDeviceError,
  onIsChatOpenChange,
  onImageUpload,
  onVideoUrl,
  onVideoFile,
  className,
  ...props
}: AgentControlBarProps & ComponentProps<'div'>) {
  const session = useSessionContext();
  const publishPermissions = usePublishPermissions();
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'sent' | 'failed'>('idle');
  const [isChatOpenUncontrolled, setIsChatOpenUncontrolled] = useState(isChatOpen);
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

  const handleSendMessage = async (message: string) => {
    if (!session.room || session.room.state !== ConnectionState.Connected) {
      throw new Error('Room is not connected');
    }

    const destinationIdentities = Array.from(session.room.remoteParticipants.values())
      .map((participant) => participant.identity)
      .filter(
        (identity): identity is string =>
          Boolean(identity) && identity !== session.room?.localParticipant.identity,
      );

    if (destinationIdentities.length === 0) {
      throw new Error('No remote participant is connected to receive chat');
    }

    await session.room.localParticipant.sendText(message, {
      topic: 'lk.chat',
      destinationIdentities,
    });

    // Compatibility fallback for stacks still listening on the legacy chat topic.
    const legacyMessage = {
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      timestamp: Date.now(),
      message,
      ignoreLegacy: false,
    };
    const payload = new TextEncoder().encode(JSON.stringify(legacyMessage));

    await session.room.localParticipant.publishData(payload, {
      reliable: true,
      topic: 'lk-chat-topic',
      destinationIdentities,
    });
  };

  const visibleControls = {
    leave: controls?.leave ?? true,
    microphone: controls?.microphone ?? publishPermissions.microphone,
    screenShare: controls?.screenShare ?? publishPermissions.screenShare,
    camera: controls?.camera ?? publishPermissions.camera,
    chat: controls?.chat ?? publishPermissions.data,
    imageUpload: controls?.imageUpload ?? false,
    videoInput: controls?.videoInput ?? false,
  };

  const isEmpty = Object.values(visibleControls).every((value) => !value);

  if (isEmpty) {
    console.warn('AgentControlBar: `visibleControls` contains only false values.');
    return null;
  }

  const handleFileUpload = async (file: File) => {
    if (!ACCEPTED_UPLOAD_TYPES.includes(file.type) || !session.room || !isConnected) {
      return;
    }

    const remoteDestinationIdentities = Array.from(session.room.remoteParticipants.values())
      .map((participant) => participant.identity)
      .filter(
        (identity): identity is string =>
          Boolean(identity) && identity !== session.room.localParticipant.identity,
      );

    setUploadStatus('uploading');

    try {
      if (session.room.state !== ConnectionState.Connected) {
        throw new Error('Room is not connected');
      }
      if (remoteDestinationIdentities.length === 0) {
        throw new Error('No remote participant is connected to receive uploads');
      }

      const topics = getUploadTopicsForFile(file);
      const deliveryResults = await Promise.allSettled(
        topics.map((topic) =>
          session.room.localParticipant.sendFile(file, {
            mimeType: file.type,
            topic,
            destinationIdentities: remoteDestinationIdentities,
          }),
        ),
      );

      const delivered = deliveryResults.some((result) => result.status === 'fulfilled');
      if (!delivered) {
        throw new Error('File delivery failed for all topics');
      }

      setUploadStatus('sent');
    } catch {
      setUploadStatus('failed');
    } finally {
      window.setTimeout(() => setUploadStatus('idle'), 1800);
      if (uploadInputRef.current) {
        uploadInputRef.current.value = '';
      }
    }
  };

  const handleUploadInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleFileUpload(file);
  };

  return (
    <div
      aria-label="Voice assistant controls"
      className={cn(
        'bg-background border-border/70 dark:border-muted flex items-center gap-2 border p-2 drop-shadow-md/3',
        variant === 'livekit' ? 'rounded-[31px]' : 'rounded-lg',
        className,
      )}
      {...props}
    >
      <input
        ref={uploadInputRef}
        type="file"
        accept={ACCEPTED_UPLOAD_TYPES.join(',')}
        onChange={(event) => {
          void handleUploadInputChange(event);
        }}
        className="hidden"
      />

      <div className="flex shrink-0 items-center gap-1">
        {/* Toggle Microphone */}
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
            className={cn(
              variant === 'livekit' && [
                LK_TOGGLE_VARIANT_1,
                'rounded-full [&_button:first-child]:rounded-l-full [&_button:last-child]:rounded-r-full',
              ],
            )}
          />
        )}

        {/* Toggle Camera */}
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
            className={cn(
              variant === 'livekit' && [
                LK_TOGGLE_VARIANT_1,
                'rounded-full [&_button:first-child]:rounded-l-full [&_button:last-child]:rounded-r-full',
              ],
            )}
          />
        )}

        {/* Toggle Screen Share */}
        {visibleControls.screenShare && (
          <AgentTrackToggle
            variant={variant === 'outline' ? 'outline' : 'default'}
            aria-label="Toggle screen share"
            source={Track.Source.ScreenShare}
            pressed={screenShareToggle.enabled}
            disabled={screenShareToggle.pending}
            onPressedChange={screenShareToggle.toggle}
            className={cn(variant === 'livekit' && [LK_TOGGLE_VARIANT_2, 'rounded-full'])}
          />
        )}

        {/* Toggle Transcript */}
        {visibleControls.chat && (
          <Toggle
            variant={variant === 'outline' ? 'outline' : 'default'}
            pressed={isChatOpen || isChatOpenUncontrolled}
            aria-label="Toggle transcript"
            onPressedChange={(state) => {
              if (!onIsChatOpenChange) setIsChatOpenUncontrolled(state);
              else onIsChatOpenChange(state);
            }}
            className={agentTrackToggleVariants({
              variant: variant === 'outline' ? 'outline' : 'default',
              className: cn(variant === 'livekit' && [LK_TOGGLE_VARIANT_2, 'rounded-full']),
            })}
          >
            <MessageSquareTextIcon />
          </Toggle>
        )}

        {/* Image Upload */}
        {visibleControls.imageUpload && onImageUpload && (
          <ImageUploadButton
            variant={variant === 'livekit' ? 'livekit' : 'default'}
            onFileSelected={onImageUpload}
            disabled={!isConnected}
          />
        )}

        {/* Video Input */}
        {visibleControls.videoInput && onVideoUrl && onVideoFile && (
          <VideoInputButton
            variant={variant === 'livekit' ? 'livekit' : 'default'}
            onVideoUrl={onVideoUrl}
            onVideoFile={onVideoFile}
            disabled={!isConnected}
          />
        )}
      </div>

      {visibleControls.chat ? (
        <div className="border-border/70 min-w-0 grow rounded-full border bg-background/80 px-1">
          <AgentChatInput
            disabled={!isConnected}
            onSend={handleSendMessage}
            className={cn(variant === 'livekit' && '[&_button]:rounded-full')}
          />
        </div>
      ) : (
        <div className="grow" />
      )}

      {/* Disconnect */}
      {visibleControls.leave && (
        <AgentDisconnectButton
          onClick={onDisconnect}
          disabled={!isConnected}
          size="sm"
          className={cn(
            'shrink-0 rounded-full px-3 text-xs font-medium tracking-wider whitespace-nowrap',
            variant === 'livekit' &&
              'bg-destructive/10 dark:bg-destructive/10 text-destructive hover:bg-destructive/20 dark:hover:bg-destructive/20 focus:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/4',
          )}
        >
          <span className="hidden lg:inline">END CALL</span>
          <span className="inline lg:hidden">END</span>
        </AgentDisconnectButton>
      )}
    </div>
  );
}
