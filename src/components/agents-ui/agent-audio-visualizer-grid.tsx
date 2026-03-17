'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useTrackVolume } from '@livekit/components-react';
import type { TrackReference } from '@livekit/components-core';

type Props = {
  color?: string;
  state?: string;
  audioTrack?: TrackReference;
  className?: string;
  rowCount?: number;
  columnCount?: number;
};

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [128, 128, 128];
}

export function AgentAudioVisualizerGrid({
  color = '#888',
  state = 'idle',
  audioTrack,
  className = '',
  rowCount = 6,
  columnCount = 12,
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
    const cols = columnCount;
    const rows = rowCount;
    const cellW = w / cols, cellH = h / rows;

    const draw = () => {
      t += 0.04;
      const intensity = volume > 0 ? Math.max(baseIntensity, volume * 2) : baseIntensity;
      ctx.clearRect(0, 0, w, h);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = (Math.sin(t + c * 0.4 + r * 0.3) * 0.5 + 0.5) * intensity;
          ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${val * 0.8})`;
          const pad = 2;
          ctx.fillRect(c * cellW + pad, r * cellH + pad, cellW - pad * 2, cellH - pad * 2);
        }
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [rgb, state, volume, rowCount, columnCount]);

  return <canvas ref={canvasRef} className={`w-full max-w-[300px] h-[150px] ${className}`} />;
}
