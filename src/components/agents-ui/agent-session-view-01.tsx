'use client';

import { useSessionContext } from '@livekit/components-react';
import type { AgentConfig } from '@/lib/agents';
import { cn } from '@/lib/utils';
import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01';

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
  controlsVariant = 'livekit',
  className = '',
  onLeave,
}: AgentSessionViewProps) {
  const session = useSessionContext();
  const visualizerColor = audioVisualizerColor ?? (agentConfig.theme.auraColor as `#${string}`);
  const visualizerColorShift = audioVisualizerColorShift ?? agentConfig.theme.auraColorShift;

  const handleDisconnect = async () => {
    if (onLeave) {
      await onLeave();
      return;
    }
    await session.end();
  };

  return (
    <AgentSessionView_01
      preConnectMessage={preConnectMessage}
      isPreConnectBufferEnabled={isPreConnectBufferEnabled}
      supportsChatInput={supportsChatInput}
      supportsVideoInput={supportsVideoInput}
      supportsScreenShare={supportsScreenShare}
      audioVisualizerType={audioVisualizerType}
      audioVisualizerColor={visualizerColor}
      audioVisualizerColorShift={visualizerColorShift}
      audioVisualizerBarCount={audioVisualizerBarCount}
      audioVisualizerGridRowCount={audioVisualizerGridRowCount}
      audioVisualizerGridColumnCount={audioVisualizerGridColumnCount}
      audioVisualizerRadialBarCount={audioVisualizerRadialBarCount}
      audioVisualizerRadialRadius={audioVisualizerRadialRadius}
      audioVisualizerWaveLineWidth={audioVisualizerWaveLineWidth}
      onDisconnect={() => {
        void handleDisconnect();
      }}
      className={cn(
        'session-shell h-screen',
        controlsVariant === 'livekit' && '[&_button]:font-medium',
        className,
      )}
    />
  );
}
