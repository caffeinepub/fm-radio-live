import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Volume1, X } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import type { RadioStation } from '../hooks/useQueries';

interface AudioPlayerProps {
    station: RadioStation | null;
    onClose?: () => void;
    onNext?: () => void;
    onPrevious?: () => void;
    onAudioElementReady?: (audio: HTMLAudioElement) => void;
    onPlayingStateChange?: (isPlaying: boolean) => void;
}

export default function AudioPlayer({ 
    station, 
    onClose, 
    onNext, 
    onPrevious,
    onAudioElementReady,
    onPlayingStateChange
}: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [volume, setVolume] = useState(70);
    const [isMuted, setIsMuted] = useState(false);
    const [previousVolume, setPreviousVolume] = useState(70);
    
    // Retry mechanism state
    const retryCountRef = useRef(0);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const maxRetries = 10;
    const baseRetryDelay = 2000;
    const playbackStartedRef = useRef(false);
    const isReconnectingRef = useRef(false);
    const currentStationRef = useRef<RadioStation | null>(null);

    // Update parent component when playing state changes
    useEffect(() => {
        if (onPlayingStateChange) {
            onPlayingStateChange(isPlaying);
        }
    }, [isPlaying, onPlayingStateChange]);

    // Initialize audio element
    useEffect(() => {
        const audio = document.createElement('audio');
        audio.id = 'radio';
        audio.volume = volume / 100;
        audio.preload = 'none';
        audio.crossOrigin = 'anonymous';
        audioRef.current = audio;

        // Notify parent that audio element is ready
        if (onAudioElementReady) {
            onAudioElementReady(audio);
        }

        const handleCanPlay = () => {
            console.log('✅ Stream ready - starting playback');
            retryCountRef.current = 0;
            isReconnectingRef.current = false;
            
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setIsPlaying(true);
                        playbackStartedRef.current = true;
                        setError(null);
                        console.log('▶️ Playback started successfully');
                    })
                    .catch((err) => {
                        console.error('Playback failed:', err);
                        attemptReconnect();
                    });
            }
        };

        const handleError = (e: Event) => {
            const audioError = audio.error;
            console.error('❌ Audio error occurred:', audioError?.code, audioError?.message);
            
            if (!isReconnectingRef.current) {
                attemptReconnect();
            }
        };

        const handleStalled = () => {
            console.log('⏸️ Stream stalled - attempting recovery');
            if (!isReconnectingRef.current && playbackStartedRef.current) {
                attemptReconnect();
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
            playbackStartedRef.current = false;
        };

        const handlePlaying = () => {
            console.log('▶️ Playback active');
            setIsPlaying(true);
            playbackStartedRef.current = true;
            setError(null);
            retryCountRef.current = 0;
            isReconnectingRef.current = false;
        };

        const handlePause = () => {
            console.log('⏸️ Playback paused');
            setIsPlaying(false);
        };

        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);
        audio.addEventListener('stalled', handleStalled);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('playing', handlePlaying);
        audio.addEventListener('pause', handlePause);

        return () => {
            audio.pause();
            audio.src = '';
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('stalled', handleStalled);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('playing', handlePlaying);
            audio.removeEventListener('pause', handlePause);
            
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, [onAudioElementReady]);

    // Reconnection logic
    const attemptReconnect = () => {
        if (!audioRef.current || !currentStationRef.current) return;
        
        if (retryCountRef.current >= maxRetries) {
            console.log('❌ Max retries reached, giving up');
            setError('Unable to connect to stream');
            setIsPlaying(false);
            return;
        }

        isReconnectingRef.current = true;
        retryCountRef.current += 1;
        
        const delay = Math.min(baseRetryDelay * Math.pow(2, retryCountRef.current - 1), 30000);
        
        console.log(`🔄 Reconnection attempt ${retryCountRef.current}/${maxRetries} in ${delay}ms`);
        
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
        }
        
        retryTimeoutRef.current = setTimeout(() => {
            if (!audioRef.current || !currentStationRef.current) return;
            
            const streamUrl = currentStationRef.current.url_resolved || currentStationRef.current.url;
            console.log(`🔄 Reconnecting to: ${currentStationRef.current.name}`);
            
            audioRef.current.pause();
            audioRef.current.src = '';
            
            setTimeout(() => {
                if (!audioRef.current || !currentStationRef.current) return;
                audioRef.current.src = streamUrl;
                audioRef.current.load();
            }, 100);
        }, delay);
    };

    // Update volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume / 100;
        }
    }, [volume, isMuted]);

    // Handle station change
    useEffect(() => {
        if (audioRef.current && station) {
            const streamUrl = station.url_resolved || station.url;
            
            console.log(`🔄 Loading station: ${station.name}`);
            console.log(`🔗 Stream URL: ${streamUrl}`);
            
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
            }
            
            retryCountRef.current = 0;
            playbackStartedRef.current = false;
            isReconnectingRef.current = false;
            currentStationRef.current = station;
            
            audioRef.current.pause();
            audioRef.current.src = streamUrl;
            
            setError(null);
            audioRef.current.load();
        }
    }, [station]);

    const togglePlay = async () => {
        if (!audioRef.current || !station) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            setError(null);
            try {
                await audioRef.current.play();
                setIsPlaying(true);
                playbackStartedRef.current = true;
            } catch (err) {
                console.error('Manual play failed:', err);
                attemptReconnect();
            }
        }
    };

    const toggleMute = () => {
        if (isMuted) {
            setIsMuted(false);
            setVolume(previousVolume > 0 ? previousVolume : 70);
        } else {
            setPreviousVolume(volume);
            setIsMuted(true);
        }
    };

    const handleVolumeChange = (value: number[]) => {
        const newVolume = value[0];
        setVolume(newVolume);
        if (newVolume > 0 && isMuted) {
            setIsMuted(false);
        }
        if (newVolume === 0) {
            setIsMuted(true);
        }
    };

    const getVolumeIcon = () => {
        if (isMuted || volume === 0) return <VolumeX className="w-5 h-5" />;
        if (volume < 50) return <Volume1 className="w-5 h-5" />;
        return <Volume2 className="w-5 h-5" />;
    };

    const handleClose = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
        }
        currentStationRef.current = null;
        if (onClose) {
            onClose();
        }
    };

    const handlePrevious = () => {
        if (onPrevious) {
            onPrevious();
        }
    };

    const handleNext = () => {
        if (onNext) {
            onNext();
        }
    };

    if (!station) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-3xl px-4">
            <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl px-5 py-4 shadow-2xl border border-slate-700/50 transition-all duration-200">
                <div className="flex items-center gap-3">
                    {/* Previous Button */}
                    <Button
                        onClick={handlePrevious}
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 rounded-full bg-slate-700/50 hover:bg-slate-600/50 transition-all duration-200 flex-shrink-0 hover:scale-105 active:scale-95"
                        disabled={!onPrevious}
                    >
                        <SkipBack className="w-4 h-4" />
                    </Button>

                    {/* Play/Pause Button */}
                    <Button
                        onClick={togglePlay}
                        size="icon"
                        className="h-12 w-12 rounded-full shadow-lg bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-50 flex-shrink-0"
                    >
                        <div className="transition-all duration-100">
                            {isPlaying ? (
                                <Pause className="w-5 h-5" fill="currentColor" />
                            ) : (
                                <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                            )}
                        </div>
                    </Button>

                    {/* Next Button */}
                    <Button
                        onClick={handleNext}
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 rounded-full bg-slate-700/50 hover:bg-slate-600/50 transition-all duration-200 flex-shrink-0 hover:scale-105 active:scale-95"
                        disabled={!onNext}
                    >
                        <SkipForward className="w-4 h-4" />
                    </Button>

                    {/* Volume Control */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Button
                            onClick={toggleMute}
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-full hover:bg-slate-700/50 transition-all duration-200 flex-shrink-0"
                        >
                            {getVolumeIcon()}
                        </Button>
                        <Slider
                            value={[isMuted ? 0 : volume]}
                            onValueChange={handleVolumeChange}
                            max={100}
                            step={1}
                            className="flex-1 min-w-0"
                        />
                    </div>

                    {/* Close Button */}
                    <Button
                        onClick={handleClose}
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 flex-shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {error && (
                    <div className="mt-2 text-xs text-red-400 text-center">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
