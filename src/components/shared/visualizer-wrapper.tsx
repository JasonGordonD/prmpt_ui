'use client';

import { useState } from 'react';
import type { TrackReference } from '@livekit/components-core';
import type { AgentState } from '@livekit/components-react';
import { AgentAudioVisualizerAura } from '@/components/agents-ui/agent-audio-visualizer-aura';
import { AgentAudioVisualizerWave } from '@/components/agents-ui/agent-audio-visualizer-wave';
import { AgentAudioVisualizerRadial } from '@/components/agents-ui/agent-audio-visualizer-radial';
import { AgentAudioVisualizerBar } from '@/components/agents-ui/agent-audio-visualizer-bar';
import { AgentAudioVisualizerGrid } from '@/components/agents-ui/agent-audio-visualizer-grid';

type VisualizerType = 'aura' | 'wave' | 'radial' | 'bar' | 'grid';

type VisualizerWrapperProps = {
  audioTrack?: TrackReference;
  state?: AgentState;
  color?: `#${string}`;
  colorShift?: number;
  agentId?: string;
  className?: string;
  defaultVisualizer?: VisualizerType;
  compact?: boolean;
};

const visualizerLabels: Record<VisualizerType, string> = {
  aura: 'Aura',
  wave: 'Wave',
  radial: 'Radial',
  bar: 'Bar',
  grid: 'Grid',
};

export function VisualizerWrapper({
  audioTrack,
  state = 'idle',
  color = '#888',
  colorShift = 0.2,
  agentId,
  className = '',
  defaultVisualizer = 'aura',
  compact = false,
}: VisualizerWrapperProps) {
  const [active, setActive] = useState<VisualizerType>(defaultVisualizer);

  // Agent-specific adjustments
  const effectiveColorShift = agentId === 'minka' ? Math.max(colorShift, 0.3) : colorShift;
  const visualizerSize = compact ? 'md' : 'lg';

  const renderVisualizer = () => {
    const key = `${active}-${color}`;
    return (
      <div key={key} className="animate-crossfade flex items-center justify-center">
        {active === 'aura' && (
          <AgentAudioVisualizerAura
            color={color}
            colorShift={effectiveColorShift}
            state={state}
            size={visualizerSize}
            audioTrack={audioTrack}
          />
        )}
        {active === 'wave' && (
          <AgentAudioVisualizerWave color={color} state={state} audioTrack={audioTrack} />
        )}
        {active === 'radial' && (
          <AgentAudioVisualizerRadial color={color} state={state} audioTrack={audioTrack} />
        )}
        {active === 'bar' && (
          <AgentAudioVisualizerBar color={color} state={state} audioTrack={audioTrack} />
        )}
        {active === 'grid' && (
          <AgentAudioVisualizerGrid color={color} state={state} audioTrack={audioTrack} />
        )}
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col items-center gap-3 ${compact ? 'py-2 sm:py-3' : 'py-3 sm:py-4'} shrink-0 ${className}`}
      style={{ maxHeight: compact ? '130px' : '180px' }}
    >
      <div className="flex items-center justify-center flex-1 min-h-0">
        {renderVisualizer()}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {(Object.keys(visualizerLabels) as VisualizerType[]).map((type) => (
          <button
            key={type}
            onClick={() => setActive(type)}
            className={`px-2.5 py-1 text-[11px] rounded-lg btn-interactive transition-colors ${
              active === type
                ? 'bg-[var(--primary)] text-white font-medium'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'
            }`}
          >
            {visualizerLabels[type]}
          </button>
        ))}
      </div>
    </div>
  );
}
