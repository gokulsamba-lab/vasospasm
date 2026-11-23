import React, { useEffect, useRef } from 'react';
import type { MlVasospasmClass } from '../types/telemetry';

interface PpgWaveformCanvasProps {
  perfusionIndex: number;
  highMotion: boolean;
  mlClass: MlVasospasmClass;
  theme: 'light' | 'dark';
}

/**
 * Generates a physiologically realistic arterial dicrotic-notch PPG pulse sample
 * for phase in [0, 1).
 */
function samplePpgPulse(phase: number, amplitude: number, highMotion: boolean, timeSec: number): number {
  const systolic = Math.exp(-Math.pow((phase - 0.22) / 0.085, 2));
  const dicrotic = 0.42 * Math.exp(-Math.pow((phase - 0.46) / 0.11, 2));
  let y = (systolic + dicrotic) * amplitude;
  if (highMotion) {
    y += Math.sin(timeSec * 29) * 0.32 + Math.cos(timeSec * 17) * 0.22;
  }
  return y;
}

export function PpgWaveformCanvas({
  perfusionIndex,
  highMotion,
  mlClass,
  theme,
}: PpgWaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ perfusionIndex, highMotion, mlClass, theme });

  useEffect(() => {
    stateRef.current = { perfusionIndex, highMotion, mlClass, theme };
  }, [perfusionIndex, highMotion, mlClass, theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLen = 240;
    const buffer = new Float32Array(bufferLen);
    let writeIdx = 0;
    let phase = 0;
    let lastTs = performance.now();
    let rafId = 0;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderFrame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.004, (now - lastTs) / 1000));
      lastTs = now;

      const { perfusionIndex: pi, highMotion: motion, mlClass: cls, theme: curTheme } = stateRef.current;

      // Heart rate ~72 bpm -> 1.2 Hz
      phase = (phase + dt * 1.2) % 1;
      const amp = Math.min(1.0, Math.max(0.12, pi / 3.0));
      buffer[writeIdx] = samplePpgPulse(phase, amp, motion, now / 1000);
      writeIdx = (writeIdx + 1) % bufferLen;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth || 280;
      const height = canvas.clientHeight || 68;
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Subtle oscilloscope gridlines
      ctx.strokeStyle = curTheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.06)';
      ctx.lineWidth = 1;
      for (let gx = 0.2; gx < 1; gx += 0.2) {
        ctx.beginPath();
        ctx.moveTo(width * gx, 0);
        ctx.lineTo(width * gx, height);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, height * 0.45);
      ctx.lineTo(width, height * 0.45);
      ctx.moveTo(0, height * 0.84);
      ctx.lineTo(width, height * 0.84);
      ctx.stroke();

      // Waveform color mapped to clinical state
      let stroke = curTheme === 'dark' ? '#38BDF8' : '#0284C7';
      let fillTop = curTheme === 'dark' ? 'rgba(56, 189, 248, 0.30)' : 'rgba(2, 132, 199, 0.22)';
      if (motion) {
        stroke = '#F59E0B';
        fillTop = 'rgba(245, 158, 11, 0.28)';
      } else if (cls === 2) {
        stroke = '#FB7185';
        fillTop = 'rgba(251, 113, 133, 0.28)';
      } else if (cls === 1) {
        stroke = '#F59E0B';
        fillTop = 'rgba(245, 158, 11, 0.25)';
      }

      const baselineY = height * 0.84;
      const coords: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < bufferLen; i += 1) {
        const idx = (writeIdx + i) % bufferLen;
        const x = (i / (bufferLen - 1)) * width;
        const val = buffer[idx];
        const y = baselineY - val * (height * 0.68);
        coords.push({ x, y });
      }

      // Soft gradient fill beneath the arterial trace
      const grad = ctx.createLinearGradient(0, 6, 0, baselineY);
      grad.addColorStop(0, fillTop);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.moveTo(coords[0].x, baselineY);
      for (let i = 0; i < coords.length; i += 1) {
        ctx.lineTo(coords[i].x, coords[i].y);
      }
      ctx.lineTo(coords[coords.length - 1].x, baselineY);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Phosphor trace line with subtle bloom
      ctx.save();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowColor = stroke;
      ctx.shadowBlur = curTheme === 'dark' ? 8 : 4;
      ctx.beginPath();
      for (let i = 0; i < coords.length; i += 1) {
        if (i === 0) ctx.moveTo(coords[i].x, coords[i].y);
        else ctx.lineTo(coords[i].x, coords[i].y);
      }
      ctx.stroke();
      ctx.restore();

      // Glowing live head tracer dot
      const head = coords[coords.length - 1];
      ctx.beginPath();
      ctx.arc(head.x - 2, head.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = fillTop;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(head.x - 2, head.y, 2.1, 0, Math.PI * 2);
      ctx.fillStyle = stroke;
      ctx.fill();

      ctx.restore();

      if (!reducedMotion) {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    // Pre-populate buffer so initial paint shows a full pulse trace immediately
    for (let i = 0; i < bufferLen; i += 1) {
      const p = (i * 0.02) % 1;
      buffer[i] = samplePpgPulse(p, Math.min(1.0, Math.max(0.15, stateRef.current.perfusionIndex / 3.0)), false, i * 0.016);
    }

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="ppg-waveform-canvas"
      aria-label="Live MAX30102 reflective PPG pulse waveform"
      className="glass-well w-full h-[68px] block rounded-xl"
    />
  );
}
