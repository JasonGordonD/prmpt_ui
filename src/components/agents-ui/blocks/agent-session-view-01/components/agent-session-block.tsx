'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, type MotionProps, motion } from 'motion/react';
import { useAgent, useLocalParticipant, useRoomContext, useSessionContext, useSessionMessages } from '@livekit/components-react';
import { type DataPacket_Kind, type RemoteParticipant, RoomEvent } from 'livekit-client';
import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';
import {
  AgentControlBar,
  type AgentControlBarControls,
} from '@/components/agents-ui/agent-control-bar';
import {
  UploadingImage,
  VideoPlayer,
  type MediaItem,
} from '@/components/agents-ui/agent-media-message';
import { SessionExport } from '@/components/agents-ui/session-export';
import { useRealtimeMediaData } from '@/hooks/agents-ui/use-realtime-media-data';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { cn } from '@/lib/utils';
import { TileLayout } from './tile-view';

function parseImageEgressPayload(rawPayload: Uint8Array): string | null {
  let decoded = '';
  try {
    decoded = new TextDecoder().decode(rawPayload).trim();
  } catch {
    return null;
  }

  if (!decoded) {
    return null;
  }

  try {
    const parsed = JSON.parse(decoded) as {
      type?: unknown;
      url?: unknown;
      image_url?: unknown;
      mimeType?: unknown;
    };

    const directUrl = typeof parsed.url === 'string' ? parsed.url.trim() : '';
    const alternateUrl = typeof parsed.image_url === 'string' ? parsed.image_url.trim() : '';
    const url = directUrl || alternateUrl;
    if (!url) {
      return null;
    }

    const payloadType = typeof parsed.type === 'string' ? parsed.type : '';
    const mimeType = typeof parsed.mimeType === 'string' ? parsed.mimeType : '';
    if (
      payloadType === '' ||
      payloadType === 'image_url' ||
      payloadType === 'image' ||
      mimeType.startsWith('image/')
    ) {
      return url;
    }

    return null;
  } catch {
    if (/^https?:\/\//i.test(decoded)) {
      return decoded;
    }
    return null;
  }
}

const MotionMessage = motion.create(Shimmer);

const BOTTOM_VIEW_MOTION_PROPS: MotionProps = {
  variants: {
    visible: {
      opacity: 1,
      translateY: '0%',
    },
    hidden: {
      opacity: 0,
      translateY: '100%',
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.3,
    delay: 0.5,
    ease: 'easeOut',
  },
};

const CHAT_MOTION_PROPS: MotionProps = {
  variants: {
    hidden: {
      opacity: 0,
      transition: {
        ease: 'easeOut',
        duration: 0.3,
      },
    },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.2,
        ease: 'easeOut',
        duration: 0.3,
      },
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
};

const SHIMMER_MOTION_PROPS: MotionProps = {
  variants: {
    visible: {
      opacity: 1,
      transition: {
        ease: 'easeIn',
        duration: 0.5,
        delay: 0.8,
      },
    },
    hidden: {
      opacity: 0,
      transition: {
        ease: 'easeIn',
        duration: 0.5,
        delay: 0,
      },
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
};

interface FadeProps {
  top?: boolean;
  bottom?: boolean;
  className?: string;
}

export function Fade({ top = false, bottom = false, className }: FadeProps) {
  return (
    <div
      className={cn(
        'from-background pointer-events-none h-4 bg-linear-to-b to-transparent',
        top && 'bg-linear-to-b',
        bottom && 'bg-linear-to-t',
        className,
      )}
    />
  );
}

export interface AgentSessionView_01Props {
  preConnectMessage?: string;
  supportsChatInput?: boolean;
  supportsVideoInput?: boolean;
  supportsScreenShare?: boolean;
  supportsImageUpload?: boolean;
  supportsVideoPlayer?: boolean;
  isPreConnectBufferEnabled?: boolean;

  audioVisualizerType?: 'bar' | 'wave' | 'grid' | 'radial' | 'aura';
  audioVisualizerColor?: `#${string}`;
  audioVisualizerColorShift?: number;
  audioVisualizerBarCount?: number;
  audioVisualizerGridRowCount?: number;
  audioVisualizerGridColumnCount?: number;
  audioVisualizerRadialBarCount?: number;
  audioVisualizerRadialRadius?: number;
  audioVisualizerWaveLineWidth?: number;
  className?: string;
  onDisconnect?: () => void;
}

export function AgentSessionView_01({
  preConnectMessage = 'Agent is listening, ask it a question',
  supportsChatInput = true,
  supportsVideoInput = true,
  supportsScreenShare = true,
  supportsImageUpload = false,
  supportsVideoPlayer = false,
  isPreConnectBufferEnabled = true,

  audioVisualizerType,
  audioVisualizerColor,
  audioVisualizerColorShift,
  audioVisualizerBarCount,
  audioVisualizerGridRowCount,
  audioVisualizerGridColumnCount,
  audioVisualizerRadialBarCount,
  audioVisualizerRadialRadius,
  audioVisualizerWaveLineWidth,
  onDisconnect,
  ref,
  className,
  ...props
}: React.ComponentProps<'section'> & AgentSessionView_01Props) {
  const room = useRoomContext();
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const [chatOpen, setChatOpen] = useState(false);
  const { state: agentState } = useAgent();
  const { localParticipant } = useLocalParticipant();

  // Media data from byte streams
  const { incomingByteStreams } = useRealtimeMediaData({ chatOpen });
  const [egressMediaItems, setEgressMediaItems] = useState<MediaItem[]>([]);

  // Uploading image state (optimistic thumbnail)
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);

  // Video player state
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoMimeType, setVideoMimeType] = useState<string | undefined>();
  const videoObjectUrlRef = useRef<string | null>(null);

  // Convert incoming byte streams to MediaItem[]
  const mediaItems = useMemo<MediaItem[]>(() => {
    const byteStreamMediaItems = incomingByteStreams
      .filter((s) => s.mimeType.startsWith('image/') || s.mimeType.startsWith('video/'))
      .map((s) => ({
        ...s,
        from: s.fromIdentity === localParticipant.identity ? ('user' as const) : ('assistant' as const),
        receivedAt: s.receivedAt,
      }));

    return [...byteStreamMediaItems, ...egressMediaItems].sort((a, b) => a.receivedAt - b.receivedAt);
  }, [incomingByteStreams, egressMediaItems, localParticipant.identity]);

  // Image upload handler
  const handleImageUpload = useCallback(
    async (file: File) => {
      setUploadingFile(file);
      // Auto-open chat to show the image
      if (!chatOpen) setChatOpen(true);

      try {
        await room.localParticipant.sendFile(file, {
          mimeType: file.type,
          topic: 'images',
        });
      } catch (err) {
        console.error('[session-view] image upload failed:', err);
      } finally {
        setUploadingFile(null);
      }
    },
    [room, chatOpen],
  );

  // Video URL handler
  const handleVideoUrl = useCallback((url: string) => {
    // Clean up previous object URL
    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = null;
    }
    setVideoMimeType(undefined);
    setVideoSrc(url);
  }, []);

  // Video file handler
  const handleVideoFile = useCallback((file: File) => {
    // Clean up previous object URL
    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    videoObjectUrlRef.current = url;
    setVideoMimeType(file.type);
    setVideoSrc(url);
  }, []);

  // Cleanup video object URL on unmount
  useEffect(() => {
    return () => {
      if (videoObjectUrlRef.current) {
        URL.revokeObjectURL(videoObjectUrlRef.current);
      }
    };
  }, []);

  const controls: AgentControlBarControls = {
    leave: true,
    microphone: true,
    chat: supportsChatInput,
    camera: supportsVideoInput,
    screenShare: supportsScreenShare,
    imageUpload: supportsImageUpload,
    videoInput: supportsVideoPlayer,
  };

  useEffect(() => {
    if (!room) {
      return;
    }

    const handleDataReceived = (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      _kind?: DataPacket_Kind,
      topic?: string,
    ) => {
      if (topic !== 'image_egress') {
        return;
      }

      const imageUrl = parseImageEgressPayload(payload);
      if (!imageUrl) {
        return;
      }

      const fromIdentity = participant?.identity ?? 'agent';
      const streamId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `egress-image-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      setEgressMediaItems((previousItems) => {
        const alreadyExists = previousItems.some(
          (item) =>
            item.url === imageUrl &&
            item.mimeType.startsWith('image/') &&
            item.from === (fromIdentity === localParticipant.identity ? 'user' : 'assistant'),
        );
        if (alreadyExists) {
          return previousItems;
        }

        return [
          ...previousItems,
          {
            id: streamId,
            name: 'Agent image',
            topic: 'image_egress',
            mimeType: 'image/*',
            fromIdentity,
            from: fromIdentity === localParticipant.identity ? 'user' : 'assistant',
            url: imageUrl,
            receivedAt: Date.now(),
          },
        ];
      });
    };

    const resetEgressMediaItems = () => {
      setEgressMediaItems([]);
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    room.on(RoomEvent.Disconnected, resetEgressMediaItems);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
      room.off(RoomEvent.Disconnected, resetEgressMediaItems);
    };
  }, [localParticipant.identity, room]);

  return (
    <section
      ref={ref}
      className={cn('bg-background relative z-10 h-full w-full overflow-hidden', className)}
      {...props}
    >
      <Fade top className="absolute inset-x-4 top-0 z-10 h-40" />

      {/* Video player panel (above transcript, below top fade) */}
      {videoSrc && (
        <div className="absolute inset-x-0 top-4 z-20 mx-auto max-w-2xl px-4 md:px-0">
          <div className="relative">
            <VideoPlayer src={videoSrc} mimeType={videoMimeType} className="w-full" />
            <button
              type="button"
              onClick={() => {
                setVideoSrc(null);
                if (videoObjectUrlRef.current) {
                  URL.revokeObjectURL(videoObjectUrlRef.current);
                  videoObjectUrlRef.current = null;
                }
              }}
              className="absolute -top-2 -right-2 z-30 rounded-full bg-background border border-border p-1 text-muted-foreground shadow-md transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Close video player"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* transcript */}
      <div
        className={cn(
          'pointer-events-auto absolute top-0 bottom-[102px] z-30 flex w-full flex-col md:bottom-[118px]',
          videoSrc && 'top-[340px]',
        )}
      >
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              {...CHAT_MOTION_PROPS}
              className="flex h-full w-full flex-col gap-4 space-y-3 transition-opacity duration-300 ease-out"
            >
              <AgentChatTranscript
                agentState={agentState}
                messages={messages}
                mediaItems={mediaItems}
                className="mx-auto w-full max-w-2xl [&_.is-user>div]:rounded-[22px] [&>div>div]:px-4 [&>div>div]:pt-40 md:[&>div>div]:px-6"
              />
              {/* Optimistic uploading thumbnail */}
              {uploadingFile && (
                <div className="mx-auto w-full max-w-2xl px-4 md:px-6">
                  <UploadingImage file={uploadingFile} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tile layout */}
      <TileLayout
        chatOpen={chatOpen}
        audioVisualizerType={audioVisualizerType}
        audioVisualizerColor={audioVisualizerColor}
        audioVisualizerColorShift={audioVisualizerColorShift}
        audioVisualizerBarCount={audioVisualizerBarCount}
        audioVisualizerRadialBarCount={audioVisualizerRadialBarCount}
        audioVisualizerRadialRadius={audioVisualizerRadialRadius}
        audioVisualizerGridRowCount={audioVisualizerGridRowCount}
        audioVisualizerGridColumnCount={audioVisualizerGridColumnCount}
        audioVisualizerWaveLineWidth={audioVisualizerWaveLineWidth}
      />

      {/* Bottom */}
      <motion.div
        {...BOTTOM_VIEW_MOTION_PROPS}
        className="absolute inset-x-3 bottom-0 z-50 md:inset-x-12"
      >
        {/* Pre-connect message */}
        {isPreConnectBufferEnabled && (
          <AnimatePresence>
            {messages.length === 0 && (
              <MotionMessage
                key="pre-connect-message"
                duration={2}
                aria-hidden={messages.length > 0}
                {...SHIMMER_MOTION_PROPS}
                className="pointer-events-none mx-auto block w-full max-w-2xl pb-4 text-center text-sm font-semibold"
              >
                {preConnectMessage}
              </MotionMessage>
            )}
          </AnimatePresence>
        )}
        <div className="bg-background relative mx-auto max-w-2xl pb-2 md:pb-4">
          <Fade bottom className="absolute inset-x-0 top-0 h-4 -translate-y-full" />
          <div className="flex items-end gap-2">
            <AgentControlBar
              variant="livekit"
              controls={controls}
              isChatOpen={chatOpen}
              isConnected={session.isConnected}
              onDisconnect={onDisconnect ?? session.end}
              onIsChatOpenChange={setChatOpen}
              onImageUpload={supportsImageUpload ? handleImageUpload : undefined}
              onVideoUrl={supportsVideoPlayer ? handleVideoUrl : undefined}
              onVideoFile={supportsVideoPlayer ? handleVideoFile : undefined}
              className="flex-1"
            />
            <SessionExport
              messages={messages}
              mediaStreams={incomingByteStreams}
              agentName={undefined}
              variant="control-bar"
              className="mb-[3px]"
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
