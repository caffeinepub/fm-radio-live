import React, { useEffect, useRef, useCallback } from 'react';

interface AudioSpectrumAnalyzerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
}

const BAR_COUNT = 10; // 5 per side, mirrored

export default function AudioSpectrumAnalyzer({ audioElement, isPlaying }: AudioSpectrumAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);
  const smoothedRef = useRef<Float32Array>(new Float32Array(BAR_COUNT).fill(0));

  const setupAnalyser = useCallback(() => {
    if (!audioElement) return;
    if (sourceRef.current) return; // already set up

    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;

      const source = ctx.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      contextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch {
      // ignore
    }
  }, [audioElement]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (!analyser || !isPlaying) {
      // Draw idle bars
      const half = BAR_COUNT / 2;
      const totalSpacing = W * 0.04;
      const barW = (W - totalSpacing) / BAR_COUNT;
      const gap = totalSpacing / (BAR_COUNT + 1);

      for (let i = 0; i < BAR_COUNT; i++) {
        const x = gap + i * (barW + gap);
        const barH = H * 0.08;
        const y = (H - barH) / 2;
        ctx.fillStyle = 'rgba(200, 180, 170, 0.3)';
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, 3);
        ctx.fill();
      }
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const half = BAR_COUNT / 2;
    const totalSpacing = W * 0.04;
    const barW = (W - totalSpacing) / BAR_COUNT;
    const gap = totalSpacing / (BAR_COUNT + 1);

    for (let i = 0; i < BAR_COUNT; i++) {
      const dataIdx = Math.floor((i / BAR_COUNT) * bufferLength * 0.6);
      const raw = dataArray[dataIdx] / 255;
      smoothedRef.current[i] += (raw - smoothedRef.current[i]) * 0.25;
      const val = smoothedRef.current[i];

      // Mirror: left half mirrors right half
      const mirrorIdx = i < half ? half - 1 - i : i;
      const mirrorVal = smoothedRef.current[mirrorIdx];
      const displayVal = (val + mirrorVal) / 2;

      const barH = Math.max(H * 0.08, displayVal * H * 0.85);
      const x = gap + i * (barW + gap);
      const y = (H - barH) / 2;

      // Warm coral gradient
      const intensity = displayVal;
      const r = Math.round(220 + intensity * 35);
      const g = Math.round(120 - intensity * 40);
      const b = Math.round(100 - intensity * 40);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.6 + intensity * 0.4})`;

      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 4);
      ctx.fill();
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying && audioElement) {
      setupAnalyser();
      if (contextRef.current?.state === 'suspended') {
        contextRef.current.resume();
      }
    }
  }, [isPlaying, audioElement, setupAnalyser]);

  useEffect(() => {
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="spectrum-canvas h-12 w-full"
      style={{ display: 'block' }}
    />
  );
}
