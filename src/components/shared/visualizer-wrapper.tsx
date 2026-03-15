'use client';

import { useState } from 'react';
import { AgentAudioVisualizerAura } from '@/components/agents-ui/agent-audio-visualizer-aura';
import { AgentAudioVisualizerWave } from '@/components/agents-ui/agent-audio-visualizer-wave';
import { AgentAudioVisualizerRadial } from '@/components/agents-ui/agent-audio-visualizer-radial';
import { AgentAudioVisualizerBar } from '@/components/agents-ui/agent-audio-visualizer-bar';
import { AgentAudioVisualizerGrid } from '@/components/agents-ui/agent-audio-visualizer-grid';

type VisualizerType = 'aura' | 'wave' | 'radial' | 'bar' | 'grid';

type VisualizerWrapperProps = {
  color?: string;
  colorShift?: number;
  state?: string;
  size?: 'icon' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  defaultVisualizer?: VisualizerType;
};

const visualizerLabels: Record<VisualizerType, string> = {
  aura: 'Aura',
  wave: 'Wave',
  radial: 'Radial',
  bar: 'Bar',
  grid: 'Grid',
};

export function VisualizerWrapper({
  color = '#888',
  colorShift = 0.2,
  state = 'idle',
  size = 'xl',
  className = '',
  defaultVisualizer = 'aura',
}: VisualizerWrapperProps) {
  const [active, setActive] = useState<VisualizerType>(defaultVisualizer);

  const renderVisualizer = () => {
    switch (active) {
      case 'aura':
        return <AgentAudioVisualizerAura color={color} colorShift={colorShift} state={state} size={size} />;
      case 'wave':
        return <AgentAudioVisualizerWave color={color} state={state} />;
      case 'radial':
        return <AgentAudioVisualizerRadial color={color} state={state} />;
      case 'bar':
        return <AgentAudioVisualizerBar color={color} state={state} />;
      case 'grid':
        return <AgentAudioVisualizerGrid color={color} state={state} />;
    }
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`} style={{ transition: 'all 0.5s ease' }}>
      <div className="flex items-center justify-center">
        {renderVisualizer()}
      </div>
      <div className="flex items-center gap-1">
        {(Object.keys(visualizerLabels) as VisualizerType[]).map((type) => (
          <button
            key={type}
            onClick={() => setActive(type)}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
              active === type
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {visualizerLabels[type]}
          </button>
        ))}
      </div>
    </div>
  );
}
