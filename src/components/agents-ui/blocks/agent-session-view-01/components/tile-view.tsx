import React, { useMemo } from 'react';
import {
  useLocalParticipant,
  useTracks,
  useVoiceAssistant,
  VideoTrack,
  type TrackReference,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { AnimatePresence, motion, type MotionProps } from 'motion/react';

import { cn } from '@/lib/utils';
import { AudioVisualizer } from './audio-visualizer';

const ANIMATION_TRANSITION: MotionProps['transition'] = {
  type: 'spring',
  stiffness: 675,
  damping: 75,
  mass: 1,
};

const tileViewClassNames = {
  // GRID
  // 2 Columns x 3 Rows
  grid: [
    'h-full w-full',
    'grid gap-x-2 place-content-center',
    'grid-cols-[1fr_1fr] grid-rows-[90px_1fr_90px]',
  ],
  // Agent
  // chatOpen: false
  // layout: Column 1 / Row 1 / Column-Span 2 / Row-Span 3
  // align: x-center y-center
  agentChatClosed: ['col-start-1 row-start-1', 'col-span-2 row-span-3', 'place-content-center'],
  // Second tile
  // chatOpen: false,
  // hasSecondTile: false
  // layout: Column 2 / Row 2
  // align: x-end y-end
  secondTileChatClosed: ['col-start-2 row-start-3', 'place-content-end'],
};

export function useLocalTrackRef(source: Track.Source) {
  const { localParticipant } = useLocalParticipant();
  const publication = localParticipant.getTrackPublication(source);
  const trackRef = useMemo<TrackReference | undefined>(
    () => (publication ? { source, participant: localParticipant, publication } : undefined),
    [source, publication, localParticipant],
  );
  return trackRef;
}

interface TileLayoutProps {
  chatOpen: boolean;
  audioVisualizerType?: 'bar' | 'wave' | 'grid' | 'radial' | 'aura';
  audioVisualizerColor?: `#${string}`;
  audioVisualizerColorShift?: number;
  audioVisualizerWaveLineWidth?: number;
  audioVisualizerGridRowCount?: number;
  audioVisualizerGridColumnCount?: number;
  audioVisualizerRadialBarCount?: number;
  audioVisualizerRadialRadius?: number;
  audioVisualizerBarCount?: number;
}

export function TileLayout({
  chatOpen,
  audioVisualizerType,
  audioVisualizerColor,
  audioVisualizerColorShift,
  audioVisualizerBarCount,
  audioVisualizerRadialBarCount,
  audioVisualizerRadialRadius,
  audioVisualizerGridRowCount,
  audioVisualizerGridColumnCount,
  audioVisualizerWaveLineWidth,
}: TileLayoutProps) {
  const { videoTrack: agentVideoTrack } = useVoiceAssistant();
  const [screenShareTrack] = useTracks([Track.Source.ScreenShare]);
  const cameraTrack: TrackReference | undefined = useLocalTrackRef(Track.Source.Camera);

  const isCameraEnabled = cameraTrack && !cameraTrack.publication.isMuted;
  const isScreenShareEnabled = screenShareTrack && !screenShareTrack.publication.isMuted;

  const animationDelay = chatOpen ? 0 : 0.15;
  const isAvatar = agentVideoTrack !== undefined;
  const videoWidth = agentVideoTrack?.publication.dimensions?.width ?? 0;
  const videoHeight = agentVideoTrack?.publication.dimensions?.height ?? 0;

  if (chatOpen) {
    return (
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/5 to-black/30" />
        {!isAvatar && (
          <div className="relative opacity-20">
            <AudioVisualizer
              key="audio-visualizer-watermark"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1.1 }}
              transition={{
                ...ANIMATION_TRANSITION,
                delay: animationDelay,
              }}
              audioVisualizerType={audioVisualizerType}
              audioVisualizerColor={audioVisualizerColor}
              audioVisualizerColorShift={audioVisualizerColorShift}
              audioVisualizerBarCount={audioVisualizerBarCount}
              audioVisualizerRadialBarCount={audioVisualizerRadialBarCount}
              audioVisualizerRadialRadius={audioVisualizerRadialRadius}
              audioVisualizerGridRowCount={audioVisualizerGridRowCount}
              audioVisualizerGridColumnCount={audioVisualizerGridColumnCount}
              audioVisualizerWaveLineWidth={audioVisualizerWaveLineWidth}
              isChatOpen={false}
              className="h-[300px] w-[300px] rounded-full border border-transparent bg-transparent"
              style={{ color: audioVisualizerColor }}
            />
          </div>
        )}
        {isAvatar && (
          <div className="relative h-[55vh] w-[55vh] max-h-[420px] max-w-[420px] overflow-hidden rounded-full opacity-20 blur-[1px]">
            <VideoTrack
              width={videoWidth}
              height={videoHeight}
              trackRef={agentVideoTrack}
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-8 bottom-32 z-10 md:top-12 md:bottom-40">
      <div className="relative mx-auto h-full max-w-2xl px-4 md:px-0">
        <div className={cn(tileViewClassNames.grid)}>
          {/* Agent */}
          <div
            className={cn([
              'grid',
              tileViewClassNames.agentChatClosed,
            ])}
          >
            <AnimatePresence mode="popLayout">
              {!isAvatar && (
                // Audio Agent
                <motion.div
                  key="agent"
                  layoutId="agent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    ...ANIMATION_TRANSITION,
                    delay: animationDelay,
                  }}
                  className={cn('relative aspect-square h-[90px]')}
                >
                  <AudioVisualizer
                    key="audio-visualizer"
                    initial={{ scale: 1 }}
                    animate={{ scale: chatOpen ? 0.2 : 1 }}
                    transition={{
                      ...ANIMATION_TRANSITION,
                      delay: animationDelay,
                    }}
                    audioVisualizerType={audioVisualizerType}
                    audioVisualizerColor={audioVisualizerColor}
                    audioVisualizerColorShift={audioVisualizerColorShift}
                    audioVisualizerBarCount={audioVisualizerBarCount}
                    audioVisualizerRadialBarCount={audioVisualizerRadialBarCount}
                    audioVisualizerRadialRadius={audioVisualizerRadialRadius}
                    audioVisualizerGridRowCount={audioVisualizerGridRowCount}
                    audioVisualizerGridColumnCount={audioVisualizerGridColumnCount}
                    audioVisualizerWaveLineWidth={audioVisualizerWaveLineWidth}
                    isChatOpen={chatOpen}
                    className={cn(
                      'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                      'bg-background rounded-[50px] border border-transparent transition-[border,drop-shadow]',
                      chatOpen && 'border-input shadow-2xl/10 delay-200',
                    )}
                    style={{ color: audioVisualizerColor }}
                  />
                </motion.div>
              )}

              {isAvatar && (
                // Avatar Agent
                <motion.div
                  key="avatar"
                  layoutId="avatar"
                  initial={{
                    scale: 1,
                    opacity: 1,
                    maskImage:
                      'radial-gradient(circle, rgba(0, 0, 0, 1) 0, rgba(0, 0, 0, 1) 20px, transparent 20px)',
                    filter: 'blur(20px)',
                  }}
                  animate={{
                    maskImage:
                      'radial-gradient(circle, rgba(0, 0, 0, 1) 0, rgba(0, 0, 0, 1) 500px, transparent 500px)',
                    filter: 'blur(0px)',
                    borderRadius: 12,
                  }}
                  transition={{
                    ...ANIMATION_TRANSITION,
                    delay: animationDelay,
                    maskImage: {
                      duration: 1,
                    },
                    filter: {
                      duration: 1,
                    },
                  }}
                  className={cn(
                    'overflow-hidden bg-black drop-shadow-xl/80',
                    'h-auto w-full',
                  )}
                >
                  <VideoTrack
                    width={videoWidth}
                    height={videoHeight}
                    trackRef={agentVideoTrack}
                    className="h-auto w-full object-cover"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div
            className={cn([
              'grid',
              tileViewClassNames.secondTileChatClosed,
            ])}
          >
            {/* Camera & Screen Share */}
            <AnimatePresence>
              {((cameraTrack && isCameraEnabled) || (screenShareTrack && isScreenShareEnabled)) && (
                <motion.div
                  key="camera"
                  layout="position"
                  layoutId="camera"
                  initial={{
                    opacity: 0,
                    scale: 0,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{
                    ...ANIMATION_TRANSITION,
                    delay: animationDelay,
                  }}
                  className="aspect-square size-[90px] drop-shadow-lg/20"
                >
                  <VideoTrack
                    trackRef={cameraTrack || screenShareTrack}
                    width={(cameraTrack || screenShareTrack)?.publication.dimensions?.width ?? 0}
                    height={(cameraTrack || screenShareTrack)?.publication.dimensions?.height ?? 0}
                    className="bg-muted aspect-square size-[90px] rounded-md object-cover"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
