'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useTrackVolume } from '@livekit/components-react';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';

type Props = {
  color?: string;
  state?: string;
  audioTrack?: TrackReferenceOrPlaceholder;
  className?: string;
  barCount?: number;
};

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [128, 128, 128];
}

export function AgentAudioVisualizerBar({ color = '#888', state = 'idle', audioTrack, className = '', barCount = 24 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const rgb = useMemo(() => hexToRgb(color), [color]);
  const volume = useTrackVolume(audioTrack);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = 300, h = 150;
    canvas.width = w;
    canvas.height = h;
    let t = 0;
    const baseIntensity = state === 'speaking' ? 1.0 : state === 'thinking' ? 0.5 : 0.2;

    const draw = () => {
      t += 0.05;
      const intensity = volume > 0 ? Math.max(baseIntensity, volume * 2) : baseIntensity;
      ctx.clearRect(0, 0, w, h);
      const barW = (w / barCount) * 0.7;
      const gap = w / barCount;
      for (let i = 0; i < barCount; i++) {
        const barH = (Math.sin(t + i * 0.3) * 0.5 + 0.5) * h * 0.8 * intensity + 4;
        const alpha = 0.5 + (Math.sin(t + i * 0.2) * 0.3) * intensity;
        ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
        ctx.fillRect(i * gap + gap * 0.15, h - barH, barW, barH);
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [rgb, state, barCount, volume]);

  return <canvas ref={canvasRef} className={`w-full max-w-[300px] h-[150px] ${className}`} />;
}
