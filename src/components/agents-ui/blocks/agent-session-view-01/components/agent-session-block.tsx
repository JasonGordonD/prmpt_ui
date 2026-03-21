'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, type MotionProps, motion } from 'motion/react';
import { useAgent, useSessionContext, useSessionMessages, useTracks } from '@livekit/components-react';
import { type DataPacket_Kind, type RemoteParticipant, RoomEvent, Track } from 'livekit-client';
import {
  AgentChatTranscript,
  type GeneratedImageTimelineItem,
  type IngressVideoTrackItem,
} from '@/components/agents-ui/agent-chat-transcript';
import {
  AgentControlBar,
  type AgentControlBarControls,
  type UploadTimelineItem,
} from '@/components/agents-ui/agent-control-bar';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { cn } from '@/lib/utils';
import { TileLayout } from './tile-view';

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

const GENERATED_IMAGE_DEDUP_WINDOW_MS = 7000;

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
  /**
   * Message shown above the controls before the first chat message is sent.
   *
   * @default 'Agent is listening, ask it a question'
   */
  preConnectMessage?: string;
  /**
   * Enables or disables the chat toggle and transcript input controls.
   *
   * @default true
   */
  supportsChatInput?: boolean;
  /**
   * Enables or disables camera controls in the bottom control bar.
   *
   * @default true
   */
  supportsVideoInput?: boolean;
  /**
   * Enables or disables screen sharing controls in the bottom control bar.
   *
   * @default true
   */
  supportsScreenShare?: boolean;
  /**
   * Shows a pre-connect buffer state with a shimmer message before messages appear.
   *
   * @default true
   */
  isPreConnectBufferEnabled?: boolean;

  /** Selects the visualizer style rendered in the main tile area. */
  audioVisualizerType?: 'bar' | 'wave' | 'grid' | 'radial' | 'aura';
  /** Primary hex color used by supported audio visualizer variants. */
  audioVisualizerColor?: `#${string}`;
  /** Hue shift intensity used by certain visualizers. */
  audioVisualizerColorShift?: number;
  /** Number of bars to render when `audioVisualizerType` is `bar`. */
  audioVisualizerBarCount?: number;
  /** Number of rows in the visualizer when `audioVisualizerType` is `grid`. */
  audioVisualizerGridRowCount?: number;
  /** Number of columns in the visualizer when `audioVisualizerType` is `grid`. */
  audioVisualizerGridColumnCount?: number;
  /** Number of radial bars when `audioVisualizerType` is `radial`. */
  audioVisualizerRadialBarCount?: number;
  /** Base radius of the radial visualizer when `audioVisualizerType` is `radial`. */
  audioVisualizerRadialRadius?: number;
  /** Stroke width of the wave path when `audioVisualizerType` is `wave`. */
  audioVisualizerWaveLineWidth?: number;
  /** Optional class name merged onto the outer `<section>` container. */
  className?: string;
  /** Optional disconnect handler overriding session.end */
  onDisconnect?: () => void;
}

export function AgentSessionView_01({
  preConnectMessage = 'Agent is listening, ask it a question',
  supportsChatInput = true,
  supportsVideoInput = true,
  supportsScreenShare = true,
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
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const messagesRef = useRef(messages);
  const generatedImageObjectUrlsRef = useRef<Set<string>>(new Set());
  const [chatOpen, setChatOpen] = useState(false);
  const [uploadedItems, setUploadedItems] = useState<UploadTimelineItem[]>([]);
  const [receivedImages, setReceivedImages] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageTimelineItem[]>([]);
  const cameraAndUnknownTracks = useTracks([Track.Source.Camera, Track.Source.Unknown]);
  const { state: agentState } = useAgent();

  const controls: AgentControlBarControls = {
    leave: true,
    microphone: true,
    chat: supportsChatInput,
    camera: supportsVideoInput,
    screenShare: supportsScreenShare,
    upload: true,
  };

  const handleUploadItemChange = (nextItem: UploadTimelineItem) => {
    setUploadedItems((current) => {
      const existing = current.find((item) => item.id === nextItem.id);
      if (existing) {
        return current.map((item) => (item.id === nextItem.id ? { ...item, ...nextItem } : item));
      }
      return [...current, nextItem];
    });
  };

  const ingressVideoTracks = useMemo<IngressVideoTrackItem[]>(() => {
    const parseTitle = (metadata?: string): string | undefined => {
      if (!metadata) return undefined;
      try {
        const parsed = JSON.parse(metadata) as { title?: unknown };
        if (typeof parsed.title === 'string' && parsed.title.trim()) {
          return parsed.title.trim();
        }
      } catch {
        // Metadata can be plain text; ignore parse failures.
      }
      return undefined;
    };

    return cameraAndUnknownTracks
      .filter((trackRef) => {
        const identity = trackRef.participant.identity ?? '';
        return identity.startsWith('video-') && !trackRef.participant.isLocal;
      })
      .map((trackRef) => {
        const sid = trackRef.publication.trackSid || trackRef.publication.track?.sid || trackRef.source;
        return {
          id: `${trackRef.participant.identity}:${sid}`,
          trackRef,
          title: parseTitle(trackRef.participant.metadata),
        };
      });
  }, [cameraAndUnknownTracks]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const room = session.room;
    if (!room) return;

    const isBlobUrl = (url: string) => url.startsWith('blob:');

    const revokeTrackedGeneratedImageObjectUrl = (url: string) => {
      if (!generatedImageObjectUrlsRef.current.delete(url)) {
        return;
      }
      URL.revokeObjectURL(url);
    };

    const appendGeneratedImage = (incomingUrl: string, source: 'byte-stream' | 'url-payload') => {
      const url = incomingUrl.trim();
      if (!url) {
        return;
      }

      if (source === 'url-payload') {
        setReceivedImages((prev) => (prev.includes(url) ? prev : [...prev, url]));
      }

      const latestAgentMessage = [...messagesRef.current]
        .reverse()
        .find((message) => !message.from?.isLocal);
      const triggerMessageId = latestAgentMessage?.id ?? null;
      const timestamp = Date.now();
      let blobUrlToRevoke: string | null = null;

      setGeneratedImages((prev) => {
        const existingExactUrl = prev.find((item) => item.url === url);
        if (existingExactUrl) {
          return prev;
        }

        let candidateIndex = -1;
        for (let index = prev.length - 1; index >= 0; index -= 1) {
          if (source !== 'url-payload') {
            break;
          }

          const item = prev[index];
          if (item.triggerMessageId !== triggerMessageId) {
            continue;
          }
          if (timestamp - item.timestamp > GENERATED_IMAGE_DEDUP_WINDOW_MS) {
            continue;
          }

          if (isBlobUrl(item.url)) {
            candidateIndex = index;
            break;
          }
        }

        if (candidateIndex >= 0) {
          const existingBlob = prev[candidateIndex];
          blobUrlToRevoke = existingBlob.url;
          const replaced = [...prev];
          replaced[candidateIndex] = {
            ...existingBlob,
            url,
            timestamp,
          };
          return replaced;
        }

        return [
          ...prev,
          {
            id:
              typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : `generated-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            url,
            timestamp,
            triggerMessageId,
          },
        ];
      });

      if (blobUrlToRevoke) {
        revokeTrackedGeneratedImageObjectUrl(blobUrlToRevoke);
      }
    };

    const revokeGeneratedImageObjectUrls = () => {
      for (const objectUrl of generatedImageObjectUrlsRef.current) {
        URL.revokeObjectURL(objectUrl);
      }
      generatedImageObjectUrlsRef.current.clear();
    };

    const processImageByteStream = async (
      reader: {
        info: { id: string; name: string; topic: string; mimeType?: string; size?: number };
        readAll: () => Promise<Uint8Array[]>;
      },
    ) => {
      try {
        const chunks = await reader.readAll();
        const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
        const merged = new Uint8Array(totalSize);
        let offset = 0;
        for (const chunk of chunks) {
          merged.set(chunk, offset);
          offset += chunk.byteLength;
        }

        const blob = new Blob([merged], {
          type: reader.info.mimeType || 'application/octet-stream',
        });
        const objectUrl = URL.createObjectURL(blob);
        generatedImageObjectUrlsRef.current.add(objectUrl);
        appendGeneratedImage(objectUrl, 'byte-stream');
      } catch (error) {
        console.warn('Ignoring malformed image byte stream payload', error);
      }
    };

    const handleDataReceived = (
      payload: Uint8Array,
      _participant?: RemoteParticipant,
      _kind?: DataPacket_Kind,
      topic?: string,
    ) => {
      if (topic !== 'image_egress') {
        return;
      }

      try {
        const decoded = new TextDecoder().decode(payload);
        const parsed = JSON.parse(decoded) as { type?: string; url?: string };
        if (parsed.type !== 'image_url' || typeof parsed.url !== 'string') {
          return;
        }

        const url = parsed.url.trim();
        if (!url) {
          return;
        }

        appendGeneratedImage(url, 'url-payload');
      } catch (error) {
        console.warn('Ignoring malformed image_egress payload', error);
      }
    };

    const handleDisconnected = () => {
      revokeGeneratedImageObjectUrls();
      setReceivedImages([]);
      setGeneratedImages([]);
    };

    room.registerByteStreamHandler('agent-images', processImageByteStream);
    room.registerByteStreamHandler('images', processImageByteStream);
    room.on(RoomEvent.DataReceived, handleDataReceived);
    room.on(RoomEvent.Disconnected, handleDisconnected);

    return () => {
      room.unregisterByteStreamHandler('agent-images');
      room.unregisterByteStreamHandler('images');
      room.off(RoomEvent.DataReceived, handleDataReceived);
      room.off(RoomEvent.Disconnected, handleDisconnected);
      revokeGeneratedImageObjectUrls();
    };
  }, [session.room]);

  return (
    <section
      ref={ref}
      className={cn('bg-background relative z-10 h-full w-full overflow-hidden', className)}
      {...props}
    >
      <Fade top className="absolute inset-x-4 top-0 z-20 h-40" />
      {/* transcript */}

      <div className="pointer-events-auto absolute top-0 bottom-[102px] z-30 flex w-full flex-col md:bottom-[118px]">
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              {...CHAT_MOTION_PROPS}
              className="flex h-full w-full flex-col gap-4 space-y-3 transition-opacity duration-300 ease-out"
            >
              <AgentChatTranscript
                agentState={agentState}
                messages={messages}
                uploadedItems={uploadedItems}
                receivedImages={receivedImages}
                generatedImages={generatedImages}
                ingressVideoTracks={ingressVideoTracks}
                className="mx-auto h-full w-full max-w-2xl [&_.is-user>div]:rounded-[22px] [&>div>div]:px-4 [&>div>div]:pt-20 md:[&>div>div]:px-6"
              />
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
          <AgentControlBar
            variant="livekit"
            controls={controls}
            isChatOpen={chatOpen}
            isConnected={session.isConnected}
            onDisconnect={onDisconnect ?? session.end}
            onIsChatOpenChange={setChatOpen}
            onUploadItemChange={handleUploadItemChange}
          />
        </div>
      </motion.div>
    </section>
  );
}
