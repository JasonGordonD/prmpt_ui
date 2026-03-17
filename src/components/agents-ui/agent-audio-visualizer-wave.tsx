'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useTrackVolume } from '@livekit/components-react';
import type { TrackReference } from '@livekit/components-core';

type Props = {
  color?: string;
  state?: string;
  audioTrack?: TrackReference;
  className?: string;
  lineWidth?: number;
};

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [128, 128, 128];
}

export function AgentAudioVisualizerWave({
  color = '#888',
  state = 'idle',
  audioTrack,
  className = '',
  lineWidth = 2,
}: Props) {
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
      t += 0.03;
      const intensity = volume > 0 ? Math.max(baseIntensity, volume * 2) : baseIntensity;
      ctx.clearRect(0, 0, w, h);
      for (let layer = 0; layer < 3; layer++) {
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        for (let x = 0; x < w; x++) {
          const y = h / 2 + Math.sin(x * 0.02 + t + layer) * (20 + layer * 10) * intensity;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${0.6 - layer * 0.15})`;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [rgb, state, volume, lineWidth]);

  return <canvas ref={canvasRef} className={`w-full max-w-[300px] h-[150px] ${className}`} />;
}
