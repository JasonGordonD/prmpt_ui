'use client';

import { useRef, useEffect, useMemo } from 'react';

type Props = {
  color?: string;
  state?: string;
  className?: string;
};

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [128, 128, 128];
}

export function AgentAudioVisualizerWave({ color = '#888', state = 'idle', className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const rgb = useMemo(() => hexToRgb(color), [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = 300, h = 150;
    canvas.width = w;
    canvas.height = h;
    let t = 0;
    const intensity = state === 'speaking' ? 1.0 : state === 'thinking' ? 0.5 : 0.2;

    const draw = () => {
      t += 0.03;
      ctx.clearRect(0, 0, w, h);
      for (let layer = 0; layer < 3; layer++) {
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        for (let x = 0; x < w; x++) {
          const y = h / 2 + Math.sin(x * 0.02 + t + layer) * (20 + layer * 10) * intensity;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${0.6 - layer * 0.15})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [rgb, state]);

  return <canvas ref={canvasRef} className={`w-full max-w-[300px] h-[150px] ${className}`} />;
}
