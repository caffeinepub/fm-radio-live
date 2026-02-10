import { useEffect, useRef } from 'react';

interface AudioSpectrumAnalyzerProps {
    audioElement: HTMLAudioElement | null;
    isPlaying: boolean;
    userInteracted: boolean;
}

export default function AudioSpectrumAnalyzer({ audioElement, isPlaying, userInteracted }: AudioSpectrumAnalyzerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const dpr = window.devicePixelRatio || 1;
        const width = 320;
        const height = 180;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        // Initialize Web Audio API
        const initAudio = () => {
            if (!audioElement || audioContextRef.current || sourceNodeRef.current) return;

            try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 128; // 64 bars
                analyser.smoothingTimeConstant = 0.8;

                const source = audioContext.createMediaElementSource(audioElement);
                source.connect(analyser);
                analyser.connect(audioContext.destination);

                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                audioContextRef.current = audioContext;
                analyserRef.current = analyser;
                dataArrayRef.current = dataArray;
                sourceNodeRef.current = source;

                console.log('✅ Audio spectrum analyzer initialized');
            } catch (error) {
                console.error('Failed to initialize audio analyzer:', error);
            }
        };

        // Resume AudioContext after user interaction
        const resumeAudioContext = async () => {
            if (audioContextRef.current && audioContextRef.current.state === 'suspended' && userInteracted) {
                try {
                    await audioContextRef.current.resume();
                    console.log('✅ AudioContext resumed');
                } catch (error) {
                    console.error('Failed to resume AudioContext:', error);
                }
            }
        };

        // Vibrant color palette for bars
        const colors = [
            { r: 59, g: 130, b: 246 },   // Blue
            { r: 147, g: 51, b: 234 },   // Purple
            { r: 236, g: 72, b: 153 },   // Pink
            { r: 239, g: 68, b: 68 },    // Red
            { r: 249, g: 115, b: 22 },   // Orange
            { r: 234, g: 179, b: 8 },    // Yellow
            { r: 34, g: 197, b: 94 },    // Green
            { r: 20, g: 184, b: 166 },   // Teal
        ];

        const getBarColor = (index: number, total: number, intensity: number) => {
            const colorIndex = Math.floor((index / total) * colors.length);
            const color = colors[colorIndex % colors.length];
            const alpha = 0.6 + (intensity * 0.4);
            return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
        };

        // Draw function
        const draw = () => {
            if (!ctx || !canvas) return;

            ctx.clearRect(0, 0, width, height);

            if (!isPlaying || !analyserRef.current || !dataArrayRef.current) {
                // Idle state - draw minimal flat bars
                const barCount = 32;
                const barWidth = (width - (barCount - 1) * 2) / barCount;
                const minHeight = 4;

                for (let i = 0; i < barCount; i++) {
                    const x = i * (barWidth + 2);
                    const barHeight = minHeight;
                    const y = height - barHeight;

                    ctx.fillStyle = getBarColor(i, barCount, 0.3);
                    ctx.fillRect(x, y, barWidth, barHeight);
                }

                animationFrameRef.current = requestAnimationFrame(draw);
                return;
            }

            // Active state - draw spectrum
            const dataArray = dataArrayRef.current;
            analyserRef.current.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>);

            const barCount = 32;
            const barWidth = (width - (barCount - 1) * 2) / barCount;
            const maxBarHeight = height - 10;
            const minHeight = 4;

            for (let i = 0; i < barCount; i++) {
                const dataIndex = Math.floor((i / barCount) * dataArray.length);
                const value = dataArray[dataIndex];
                const intensity = value / 255;
                
                // Smooth bar height with minimum
                const barHeight = Math.max(minHeight, intensity * maxBarHeight);
                const x = i * (barWidth + 2);
                const y = height - barHeight;

                // Draw bar with gradient
                const gradient = ctx.createLinearGradient(x, y, x, height);
                const color = getBarColor(i, barCount, intensity);
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, color.replace(/[\d.]+\)$/, '0.2)'));

                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, barWidth, barHeight);

                // Add glow effect for high intensity
                if (intensity > 0.6) {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = color;
                    ctx.fillRect(x, y, barWidth, barHeight);
                    ctx.shadowBlur = 0;
                }
            }

            animationFrameRef.current = requestAnimationFrame(draw);
        };

        // Start animation
        const startAnimation = () => {
            if (audioElement && !audioContextRef.current) {
                initAudio();
            }
            if (userInteracted) {
                resumeAudioContext();
            }
            draw();
        };

        startAnimation();

        // Cleanup
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [audioElement, isPlaying, userInteracted]);

    return (
        <div className="flex flex-col items-center gap-2">
            <canvas
                ref={canvasRef}
                className="rounded-lg bg-black/30 backdrop-blur-sm border border-blue-500/20 shadow-lg"
            />
        </div>
    );
}
