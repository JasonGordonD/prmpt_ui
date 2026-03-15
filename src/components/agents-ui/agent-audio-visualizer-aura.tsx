'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useTrackVolume } from '@livekit/components-react';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';

type AuraSize = 'icon' | 'sm' | 'md' | 'lg' | 'xl';

const sizeMap: Record<AuraSize, number> = {
  icon: 48,
  sm: 80,
  md: 140,
  lg: 200,
  xl: 280,
};

type AgentAudioVisualizerAuraProps = {
  size?: AuraSize;
  color?: string;
  colorShift?: number;
  state?: string;
  audioTrack?: TrackReferenceOrPlaceholder;
  className?: string;
};

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
    : [0.5, 0.2, 0.8];
}

export function AgentAudioVisualizerAura({
  size = 'md',
  color = '#c9302c',
  colorShift = 0.2,
  state = 'idle',
  audioTrack,
  className = '',
}: AgentAudioVisualizerAuraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const dim = sizeMap[size];
  const rgb = useMemo(() => hexToRgb(color), [color]);

  // Real audio volume from track (0-1 range)
  const volume = useTrackVolume(audioTrack);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let t = 0;
    const baseIntensity = state === 'speaking' ? 1.0 : state === 'thinking' ? 0.6 : 0.3;

    const draw = () => {
      t += 0.02;
      ctx.clearRect(0, 0, dim, dim);

      // Use real volume if available, otherwise fall back to state-based intensity
      const intensity = volume > 0 ? Math.max(baseIntensity, volume * 2) : baseIntensity;

      const cx = dim / 2;
      const cy = dim / 2;
      const baseRadius = dim * 0.2;

      for (let i = 3; i >= 0; i--) {
        const pulse = Math.sin(t + i * 0.5) * intensity * 10;
        const r = baseRadius + i * (dim * 0.06) + pulse;
        const alpha = (0.3 - i * 0.06) * intensity;

        const rC = Math.min(1, rgb[0] + colorShift * Math.sin(t + i));
        const gC = Math.min(1, rgb[1] + colorShift * Math.cos(t + i));
        const bC = Math.min(1, rgb[2] + colorShift * Math.sin(t * 0.5 + i));

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        gradient.addColorStop(0, `rgba(${Math.floor(rC * 255)}, ${Math.floor(gC * 255)}, ${Math.floor(bC * 255)}, ${alpha})`);
        gradient.addColorStop(1, `rgba(${Math.floor(rC * 255)}, ${Math.floor(gC * 255)}, ${Math.floor(bC * 255)}, 0)`);

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 0.6);
      coreGradient.addColorStop(0, `rgba(${Math.floor(rgb[0] * 255)}, ${Math.floor(rgb[1] * 255)}, ${Math.floor(rgb[2] * 255)}, ${0.8 * intensity})`);
      coreGradient.addColorStop(1, `rgba(${Math.floor(rgb[0] * 255)}, ${Math.floor(rgb[1] * 255)}, ${Math.floor(rgb[2] * 255)}, 0)`);
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [dim, rgb, colorShift, state, volume]);

  return (
    <canvas
      ref={canvasRef}
      width={dim}
      height={dim}
      className={`rounded-full ${className}`}
      style={{ width: dim, height: dim }}
    />
  );
}
