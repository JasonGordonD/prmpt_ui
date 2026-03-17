'use client';

import { useMemo, useState } from 'react';
import { useAgent, useSessionContext, useSessionMessages } from '@livekit/components-react';
import type { AgentConfig } from '@/lib/agents';
import { StatusBar } from '@/components/shared/status-bar';
import { VisualizerWrapper } from '@/components/shared/visualizer-wrapper';
import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';
import { AgentControlBar, type AgentControlBarControls } from '@/components/agents-ui/agent-control-bar';

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
  audioVisualizerType = 'bar',
  controlsVariant = 'outline',
  onLeave,
}: AgentSessionViewProps) {
  const agent = useAgent();
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const [chatOpen, setChatOpen] = useState(true);

  const currentNode = agent.attributes?.current_node;
  const nodeMapping = currentNode ? agentConfig.nodeMap[currentNode] : null;
  const visualizerColor = nodeMapping?.auraColor ?? agentConfig.theme.auraColor;

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

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <StatusBar agentConfig={agentConfig} />

      <div className="flex h-[40vh] min-h-[220px] shrink-0 flex-col overflow-hidden border-b border-[var(--border)]">
        <VisualizerWrapper
          audioTrack={agent.microphoneTrack}
          state={agent.state}
          color={visualizerColor}
          colorShift={agentConfig.theme.auraColorShift}
          agentId={agentConfig.id}
          defaultVisualizer={audioVisualizerType}
          className="h-full w-full max-h-none"
        />
      </div>

      {supportsChatInput && chatOpen && (
        <div className="min-h-0 flex-1 overflow-hidden">
          <AgentChatTranscript
            messages={messages}
            agentState={agent.state}
            agentName={agentConfig.displayName}
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
      />
    </div>
  );
}
