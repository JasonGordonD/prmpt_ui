'use client';

import { useEffect, useMemo, useState } from 'react';
import { Track } from 'livekit-client';
import { VideoTrack, useAgent, useLocalParticipant, useSessionContext, useSessionMessages, useTrackVolume, useTracks, useVoiceAssistant } from '@livekit/components-react';
import type { AgentConfig } from '@/lib/agents';
import { StatusBar } from '@/components/shared/status-bar';
import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';
import { AgentControlBar, type AgentControlBarControls } from '@/components/agents-ui/agent-control-bar';
import { ReactShaderToy } from '@/components/agents-ui/react-shader-toy';

const NOIR_SHADER = `
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

  float amplitude = iAudioAmplitude * 2.0;
  float t = iTime * 0.3;

  float n = 0.0;
  for(int i = 1; i <= 4; i++) {
    float fi = float(i);
    n += sin(uv.x * fi * 3.0 + t + amplitude) * cos(uv.y * fi * 2.0 + t * 0.7) / fi;
  }

  vec3 col = vec3(0.04, 0.02, 0.03);
  col += vec3(0.35, 0.06, 0.06) * smoothstep(0.0, 0.6, n * amplitude + 0.1);
  col += vec3(0.75, 0.15, 0.12) * smoothstep(0.4, 0.8, n * amplitude);

  float vignette = 1.0 - dot(uv * 1.5, uv * 1.5);
  col *= vignette;

  fragColor = vec4(col, 1.0);
}
`;

type AgentSessionViewProps = {
  agentConfig: AgentConfig;
  isPreConnectBufferEnabled?: boolean;
  supportsScreenShare?: boolean;
  supportsChatInput?: boolean;
  supportsVideoInput?: boolean;
  audioVisualizerType?: 'bar' | 'wave' | 'grid' | 'radial' | 'aura';
  controlsVariant?: 'outline' | 'livekit';
  onLeave?: () => void | Promise<void>;
};

export function AgentSessionView({
  agentConfig,
  isPreConnectBufferEnabled = true,
  supportsScreenShare = true,
  supportsChatInput = true,
  supportsVideoInput = false,
  audioVisualizerType: _audioVisualizerType = 'bar',
  controlsVariant = 'outline',
  onLeave,
}: AgentSessionViewProps) {
  const agent = useAgent();
  const { audioTrack: agentAudioTrack } = useVoiceAssistant();
  const { microphoneTrack } = useLocalParticipant();
  const [screenShareTrack] = useTracks([Track.Source.ScreenShare]);
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const [chatOpen, setChatOpen] = useState(true);
  const [optimisticImages, setOptimisticImages] = useState<string[]>([]);
  const [uploadToast, setUploadToast] = useState('');

  const agentTrackVolume = useTrackVolume(agentAudioTrack);
  const userTrackVolume = useTrackVolume(microphoneTrack?.track as never);
  const shaderAmplitude = useMemo(() => {
    const louderTrack = Math.max(agentTrackVolume ?? 0, userTrackVolume ?? 0);
    return Math.max(0.05, Math.min(1.2, louderTrack));
  }, [agentTrackVolume, userTrackVolume]);

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

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <StatusBar agentConfig={agentConfig} />

      <div className="flex h-[40vh] min-h-[220px] shrink-0 flex-col overflow-hidden border-b border-[var(--border)]">
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
          <ReactShaderToy
            fs={NOIR_SHADER}
            uniforms={{ iAudioAmplitude: shaderAmplitude }}
            className="h-full w-full"
          />
        )}
      </div>

      {supportsChatInput && chatOpen && (
        <div className="min-h-0 flex-1 overflow-hidden">
          <AgentChatTranscript
            messages={messages}
            agentState={agent.state}
            agentName={agentConfig.displayName}
            optimisticImages={optimisticImages}
          />
        </div>
      )}

      {isPreConnectBufferEnabled && messages.length === 0 && (
        <div className="shrink-0 px-4 pb-2 text-center text-xs text-[var(--text-muted)]">
          Agent is listening, ask it a question
        </div>
      )}

      <AgentControlBar
        variant={controlsVariant}
        controls={controls}
        isChatOpen={chatOpen}
        onIsChatOpenChange={setChatOpen}
        onDisconnect={handleDisconnect}
        onFileUpload={handleFileUpload}
      />

      {uploadToast && (
        <div className="upload-toast">
          {uploadToast}
        </div>
      )}
    </div>
  );
}
