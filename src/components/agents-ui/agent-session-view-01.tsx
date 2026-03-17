'use client';

import { useEffect, useMemo, useState } from 'react';
import { Track } from 'livekit-client';
import { VideoTrack, useSessionContext, useSessionMessages, useTracks, useVoiceAssistant } from '@livekit/components-react';
import type { AgentConfig } from '@/lib/agents';
import { StatusBar } from '@/components/shared/status-bar';
import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';
import { AgentControlBar, type AgentControlBarControls } from '@/components/agents-ui/agent-control-bar';
import { AgentAudioVisualizerAura } from '@/components/agents-ui/agent-audio-visualizer-aura';
import { AgentAudioVisualizerBar } from '@/components/agents-ui/agent-audio-visualizer-bar';
import { AgentAudioVisualizerGrid } from '@/components/agents-ui/agent-audio-visualizer-grid';
import { AgentAudioVisualizerRadial } from '@/components/agents-ui/agent-audio-visualizer-radial';
import { AgentAudioVisualizerWave } from '@/components/agents-ui/agent-audio-visualizer-wave';
import { useRealtimeMediaData } from '@/hooks/agents-ui/use-realtime-media-data';

type AgentSessionViewProps = {
  agentConfig: AgentConfig;
  isPreConnectBufferEnabled?: boolean;
  preConnectMessage?: string;
  supportsScreenShare?: boolean;
  supportsChatInput?: boolean;
  supportsVideoInput?: boolean;
  audioVisualizerType?: 'bar' | 'wave' | 'grid' | 'radial' | 'aura';
  audioVisualizerColor?: `#${string}`;
  audioVisualizerColorShift?: number;
  audioVisualizerBarCount?: number;
  audioVisualizerGridRowCount?: number;
  audioVisualizerGridColumnCount?: number;
  audioVisualizerRadialBarCount?: number;
  audioVisualizerRadialRadius?: number;
  audioVisualizerWaveLineWidth?: number;
  controlsVariant?: 'default' | 'outline' | 'livekit';
  className?: string;
  onLeave?: () => void | Promise<void>;
};

export function AgentSessionView({
  agentConfig,
  isPreConnectBufferEnabled = true,
  preConnectMessage = 'Agent is listening, ask it a question',
  supportsScreenShare = true,
  supportsChatInput = true,
  supportsVideoInput = false,
  audioVisualizerType = 'bar',
  audioVisualizerColor,
  audioVisualizerColorShift,
  audioVisualizerBarCount = 24,
  audioVisualizerGridRowCount = 6,
  audioVisualizerGridColumnCount = 12,
  audioVisualizerRadialBarCount = 32,
  audioVisualizerRadialRadius = 50,
  audioVisualizerWaveLineWidth = 2,
  controlsVariant = 'outline',
  className = '',
  onLeave,
}: AgentSessionViewProps) {
  const { audioTrack: agentAudioTrack, state: assistantState } = useVoiceAssistant();
  const [screenShareTrack] = useTracks([Track.Source.ScreenShare]);
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const [chatOpen, setChatOpen] = useState(true);
  const [optimisticImages, setOptimisticImages] = useState<string[]>([]);
  const [uploadToast, setUploadToast] = useState('');
  const visualizerColor = audioVisualizerColor ?? agentConfig.theme.auraColor;
  const visualizerColorShift = audioVisualizerColorShift ?? agentConfig.theme.auraColorShift;
  const { incomingByteStreams } = useRealtimeMediaData({ chatOpen });

  const controls = useMemo<AgentControlBarControls>(() => ({
    microphone: true,
    camera: supportsVideoInput,
    screenShare: supportsScreenShare,
    chat: supportsChatInput,
    leave: true,
  }), [supportsVideoInput, supportsScreenShare, supportsChatInput]);

  const handleDisconnect = async () => {
    if (onLeave) {
      await onLeave();
      return;
    }
    await session.end();
  };

  const handleFileUpload = async (file: File) => {
    const room = session.room;
    if (!room) return;
    await room.localParticipant.sendFile(file, { topic: 'images' });
    const objectUrl = URL.createObjectURL(file);
    setOptimisticImages((images) => [...images, objectUrl]);
    setUploadToast(`SENT TO ${agentConfig.displayName.toUpperCase()}`);
    window.setTimeout(() => {
      setUploadToast('');
    }, 2000);
  };

  useEffect(() => {
    return () => {
      optimisticImages.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [optimisticImages]);

  const renderAudioVisualizer = () => {
    if (audioVisualizerType === 'aura') {
      return (
        <AgentAudioVisualizerAura
          audioTrack={agentAudioTrack}
          state={assistantState}
          color={visualizerColor}
          colorShift={visualizerColorShift}
          size="xl"
          className="w-full h-full"
        />
      );
    }

    if (audioVisualizerType === 'wave') {
      return (
        <AgentAudioVisualizerWave
          audioTrack={agentAudioTrack}
          state={assistantState}
          color={visualizerColor}
          lineWidth={audioVisualizerWaveLineWidth}
          className="w-full h-full"
        />
      );
    }

    if (audioVisualizerType === 'grid') {
      return (
        <AgentAudioVisualizerGrid
          audioTrack={agentAudioTrack}
          state={assistantState}
          color={visualizerColor}
          rowCount={audioVisualizerGridRowCount}
          columnCount={audioVisualizerGridColumnCount}
          className="w-full h-full"
        />
      );
    }

    if (audioVisualizerType === 'radial') {
      return (
        <AgentAudioVisualizerRadial
          audioTrack={agentAudioTrack}
          state={assistantState}
          color={visualizerColor}
          barCount={audioVisualizerRadialBarCount}
          radius={audioVisualizerRadialRadius}
          className="w-full h-full"
        />
      );
    }

    return (
      <AgentAudioVisualizerBar
        audioTrack={agentAudioTrack}
        state={assistantState}
        color={visualizerColor}
        barCount={audioVisualizerBarCount}
        className="w-full h-full"
      />
    );
  };

  return (
    <div className={`session-shell relative flex h-screen flex-col overflow-hidden ${className}`}>
      <div className="session-shell-overlay pointer-events-none absolute inset-0" />
      <div className="relative z-10 flex h-full flex-col overflow-hidden">
        <StatusBar agentConfig={agentConfig} />

        <div className="session-visualizer flex h-[34vh] min-h-[180px] max-h-[300px] shrink-0 flex-col overflow-hidden border-b border-[var(--noir-border)]">
          {screenShareTrack ? (
            <div
              className="h-full w-full"
              style={{ border: '1px solid var(--noir-border-accent)' }}
            >
              <VideoTrack
                trackRef={screenShareTrack}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              {renderAudioVisualizer()}
            </div>
          )}
        </div>

        {supportsChatInput && chatOpen && (
          <div className="session-transcript-pane min-h-0 flex-1 overflow-hidden">
            <AgentChatTranscript
              agentName={agentConfig.displayName}
              optimisticImages={optimisticImages}
              incomingByteStreams={incomingByteStreams}
            />
          </div>
        )}

        {isPreConnectBufferEnabled && messages.length === 0 && (
          <div className="agent-preconnect-message shrink-0 px-4 pb-2 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--noir-text-dim)]">
            {preConnectMessage}
          </div>
        )}

        <AgentControlBar
          variant={controlsVariant}
          controls={controls}
          isChatOpen={chatOpen}
          isConnected={session.isConnected}
          onIsChatOpenChange={setChatOpen}
          onDisconnect={handleDisconnect}
          onFileUpload={handleFileUpload}
        />
      </div>

      {uploadToast && (
        <div className="upload-toast">
          {uploadToast}
        </div>
      )}
    </div>
  );
}
