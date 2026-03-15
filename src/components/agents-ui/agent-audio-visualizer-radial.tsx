'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useTrackVolume } from '@livekit/components-react';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';

type Props = {
  color?: string;
  state?: string;
  audioTrack?: TrackReferenceOrPlaceholder;
  className?: string;
};

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [128, 128, 128];
}

export function AgentAudioVisualizerRadial({ color = '#888', state = 'idle', audioTrack, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const rgb = useMemo(() => hexToRgb(color), [color]);
  const volume = useTrackVolume(audioTrack);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dim = 200;
    canvas.width = dim;
    canvas.height = dim;
    let t = 0;
    const baseIntensity = state === 'speaking' ? 1.0 : state === 'thinking' ? 0.5 : 0.2;
    const segCount = 32;

    const draw = () => {
      t += 0.03;
      const intensity = volume > 0 ? Math.max(baseIntensity, volume * 2) : baseIntensity;
      ctx.clearRect(0, 0, dim, dim);
      const cx = dim / 2;
      const cy = dim / 2;
      const baseR = dim * 0.25;

      for (let i = 0; i < segCount; i++) {
        const angle = (i / segCount) * Math.PI * 2;
        const len = (Math.sin(t * 2 + i * 0.5) * 0.5 + 0.5) * dim * 0.15 * intensity + 4;
        const x1 = cx + Math.cos(angle) * baseR;
        const y1 = cy + Math.sin(angle) * baseR;
        const x2 = cx + Math.cos(angle) * (baseR + len);
        const y2 = cy + Math.sin(angle) * (baseR + len);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${0.6 + Math.sin(t + i) * 0.2})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [rgb, state, volume]);

  return <canvas ref={canvasRef} className={`rounded-full ${className}`} style={{ width: 200, height: 200 }} />;
}
