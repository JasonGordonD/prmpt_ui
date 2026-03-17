'use client';

import { useEffect, useMemo, useState } from 'react';
import { Track } from 'livekit-client';
import { VideoTrack, useLocalParticipant, useSessionContext, useSessionMessages, useTrackVolume, useTracks, useVoiceAssistant } from '@livekit/components-react';
import { useChat } from '@livekit/components-react';
import type { AgentConfig } from '@/lib/agents';
import { StatusBar } from '@/components/shared/status-bar';
import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';
import { AgentControlBar, type AgentControlBarControls } from '@/components/agents-ui/agent-control-bar';
import { ReactShaderToy } from '@/components/agents-ui/react-shader-toy';
import { Send } from 'lucide-react';

const NOIR_SHADER = `
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

  float amplitude = max(iAudioAmplitude, 0.04);
  float t = iTime * 0.22;
  vec2 p = uv * 1.35;

  float warp = sin((p.y + t) * 2.2) * 0.12 + cos((p.x - t * 0.8) * 2.6) * 0.08;
  p += vec2(warp, -warp * 0.55);

  float n = 0.0;
  for(int i = 1; i <= 6; i++) {
    float fi = float(i);
    n += sin(p.x * fi * 2.6 + t + amplitude * 2.0) * cos(p.y * fi * 2.1 - t * 0.6) / fi;
  }

  float flame = smoothstep(0.08, 0.92, n * (1.45 + amplitude * 2.0) + 0.42);
  vec3 col = vec3(0.012, 0.008, 0.012);
  col += vec3(0.23, 0.03, 0.028) * flame;
  col += vec3(0.78, 0.12, 0.09) * pow(flame, 1.85) * (0.45 + amplitude * 0.9);

  float innerGlow = exp(-3.0 * dot(p, p));
  col += vec3(0.24, 0.04, 0.03) * innerGlow * (0.55 + amplitude);

  float vignette = smoothstep(1.2, 0.18, dot(uv * 1.15, uv * 1.15));
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
  const { audioTrack: agentAudioTrack } = useVoiceAssistant();
  const { microphoneTrack } = useLocalParticipant();
  const [screenShareTrack] = useTracks([Track.Source.ScreenShare]);
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const { send, isSending } = useChat();
  const [chatOpen, setChatOpen] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
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

  const handleSendMessage = async () => {
    const trimmed = chatMessage.trim();
    if (!trimmed) return;
    try {
      await send(trimmed);
      setChatMessage('');
    } catch (error) {
      console.error('[AgentSessionView] Failed to send chat message', error);
    }
  };

  useEffect(() => {
    return () => {
      optimisticImages.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [optimisticImages]);

  return (
    <div className="session-shell relative flex h-screen flex-col overflow-hidden">
      <div className="session-shell-overlay pointer-events-none absolute inset-0" />
      <div className="relative z-10 flex h-full flex-col overflow-hidden">
        <StatusBar agentConfig={agentConfig} />

        <div className="session-visualizer flex h-[43vh] min-h-[250px] shrink-0 flex-col overflow-hidden border-b border-[var(--noir-border)]">
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
          <div className="session-transcript-pane min-h-0 flex-1 overflow-hidden">
            <AgentChatTranscript
              agentName={agentConfig.displayName}
              optimisticImages={optimisticImages}
            />
          </div>
        )}

        {supportsChatInput && chatOpen && (
          <div className="session-chat-composer shrink-0 border-t border-[var(--noir-border)] px-4 py-3">
            <div className="mx-auto flex w-full max-w-5xl items-center gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(event) => setChatMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void handleSendMessage();
                  }
                }}
                placeholder={`Message ${agentConfig.displayName}...`}
                className="session-chat-input flex-1 rounded-md px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  void handleSendMessage();
                }}
                disabled={!chatMessage.trim() || isSending}
                className="session-chat-send inline-flex h-9 w-9 items-center justify-center rounded-md disabled:opacity-50"
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {isPreConnectBufferEnabled && messages.length === 0 && (
          <div className="shrink-0 px-4 pb-2 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--noir-text-dim)]">
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
      </div>

      {uploadToast && (
        <div className="upload-toast">
          {uploadToast}
        </div>
      )}
    </div>
  );
}
