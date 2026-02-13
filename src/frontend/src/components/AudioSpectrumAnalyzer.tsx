import { useEffect, useRef } from 'react';

interface AudioSpectrumAnalyzerProps {
    audioElement: HTMLAudioElement | null;
    isPlaying: boolean;
    userInteracted: boolean;
}

export default function AudioSpectrumAnalyzer({ audioElement, isPlaying, userInteracted }: AudioSpectrumAnalyzerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const previousHeightsRef = useRef<number[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Responsive canvas sizing
        const updateCanvasSize = () => {
            const dpr = window.devicePixelRatio || 1;
            const width = window.innerWidth;
            const height = 180;
            
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            
            // Reset transform before applying new scale to avoid cumulative scaling
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
        };

        updateCanvasSize();

        // Initialize Web Audio API
        const initAudio = () => {
            if (!audioElement || audioContextRef.current || sourceNodeRef.current) return;

            try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 128;
                analyser.smoothingTimeConstant = 0.75;

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

        // Smooth interpolation helper
        const lerp = (start: number, end: number, factor: number) => {
            return start + (end - start) * factor;
        };

        // Draw function with center-out mirrored bars (max 10 bars, edge-to-edge)
        const draw = () => {
            if (!ctx || !canvas) return;

            const width = canvas.width / (window.devicePixelRatio || 1);
            const height = canvas.height / (window.devicePixelRatio || 1);

            ctx.clearRect(0, 0, width, height);

            const barCount = 10; // Total bars (5 pairs mirrored)
            const halfBarCount = Math.floor(barCount / 2);
            
            // Dynamic bar width and spacing to span full width edge-to-edge
            const centerX = width / 2;
            const totalWidth = width; // Use 100% of screen width (edge-to-edge)
            const totalBarSpace = totalWidth / barCount; // Space per bar including gap
            const barWidth = totalBarSpace * 0.6; // 60% for bar (reduced from 70%)
            const barGap = totalBarSpace * 0.4; // 40% for gap
            
            const maxBarHeight = height - 10;
            const minHeight = 4;
            const smoothingFactor = 0.25; // Smooth but responsive

            // Initialize previous heights if needed
            if (previousHeightsRef.current.length !== halfBarCount) {
                previousHeightsRef.current = new Array(halfBarCount).fill(minHeight);
            }

            if (!isPlaying || !analyserRef.current || !dataArrayRef.current) {
                // Idle state - draw minimal flat mirrored bars
                for (let i = 0; i < halfBarCount; i++) {
                    const barHeight = minHeight;
                    const y = height - barHeight;

                    // Left side bar
                    const xLeft = centerX - (i + 1) * totalBarSpace + barGap / 2;
                    ctx.fillStyle = 'rgba(128, 128, 128, 0.4)';
                    ctx.fillRect(xLeft, y, barWidth, barHeight);

                    // Right side bar (mirrored)
                    const xRight = centerX + i * totalBarSpace + barGap / 2;
                    ctx.fillStyle = 'rgba(128, 128, 128, 0.4)';
                    ctx.fillRect(xRight, y, barWidth, barHeight);

                    // Update smoothing array
                    previousHeightsRef.current[i] = lerp(
                        previousHeightsRef.current[i],
                        minHeight,
                        smoothingFactor
                    );
                }

                animationFrameRef.current = requestAnimationFrame(draw);
                return;
            }

            // Active state - draw mirrored spectrum from center
            const dataArray = dataArrayRef.current;
            analyserRef.current.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>);

            for (let i = 0; i < halfBarCount; i++) {
                const dataIndex = Math.floor((i / halfBarCount) * dataArray.length);
                const value = dataArray[dataIndex];
                const intensity = value / 255;
                
                // Calculate target height
                const targetHeight = Math.max(minHeight, intensity * maxBarHeight);
                
                // Smooth interpolation
                const smoothedHeight = lerp(
                    previousHeightsRef.current[i],
                    targetHeight,
                    smoothingFactor
                );
                previousHeightsRef.current[i] = smoothedHeight;

                const barHeight = smoothedHeight;
                const y = height - barHeight;

                // Grayscale intensity mapping (black to white based on intensity)
                const grayValue = Math.floor(intensity * 200 + 55); // Range: 55-255
                const alpha = 0.7 + (intensity * 0.3);
                const fillStyle = `rgba(${grayValue}, ${grayValue}, ${grayValue}, ${alpha})`;

                // Left side bar
                const xLeft = centerX - (i + 1) * totalBarSpace + barGap / 2;
                ctx.fillStyle = fillStyle;
                ctx.fillRect(xLeft, y, barWidth, barHeight);

                // Right side bar (mirrored)
                const xRight = centerX + i * totalBarSpace + barGap / 2;
                ctx.fillStyle = fillStyle;
                ctx.fillRect(xRight, y, barWidth, barHeight);
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

        // Handle window resize
        const handleResize = () => {
            updateCanvasSize();
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            window.removeEventListener('resize', handleResize);
        };
    }, [audioElement, isPlaying, userInteracted]);

    return (
        <div ref={containerRef} className="flex flex-col items-center w-screen">
            <canvas
                ref={canvasRef}
                className="rounded-lg bg-black/30 backdrop-blur-sm shadow-lg"
            />
        </div>
    );
}
