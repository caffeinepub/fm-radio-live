import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Loader2 } from 'lucide-react';

interface AudioPlayerProps {
  station: any;
  stations: any[];
  onStationChange: (station: any) => void;
  onPlayingChange: (playing: boolean) => void;
  onAudioElement: (el: HTMLAudioElement | null) => void;
  autoPlay?: boolean;
}

export default function AudioPlayer({
  station,
  stations,
  onStationChange,
  onPlayingChange,
  onAudioElement,
  autoPlay = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stationRef = useRef(station);

  useEffect(() => {
    stationRef.current = station;
  }, [station]);

  // Initialize audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audio.volume = volume;
    audioRef.current = audio;
    onAudioElement(audio);

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
      onAudioElement(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Load and play station
  useEffect(() => {
    if (!station?.url_resolved && !station?.url) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }

    audio.pause();
    audio.src = station.url_resolved || station.url;
    audio.load();
    setIsLoading(true);

    if (autoPlay) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setIsLoading(false);
          setIsPlaying(false);
          onPlayingChange(false);
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [station?.stationuuid]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      onPlayingChange(true);
    };
    const handlePause = () => {
      setIsPlaying(false);
      onPlayingChange(false);
    };
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      onPlayingChange(false);
      // Auto-reconnect after 3s
      reconnectTimer.current = setTimeout(() => {
        const s = stationRef.current;
        if (s?.url_resolved || s?.url) {
          audio.src = s.url_resolved || s.url;
          audio.load();
          audio.play().catch(() => {});
        }
      }, 3000);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [onPlayingChange]);

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      setIsLoading(true);
      if (!audio.src && station) {
        audio.src = station.url_resolved || station.url;
        audio.load();
      }
      audio.play().catch(() => {
        setIsLoading(false);
      });
    }
  }, [isPlaying, station]);

  const handlePrev = useCallback(() => {
    if (!stations.length || !station) return;
    const idx = stations.findIndex((s: any) => s.stationuuid === station.stationuuid);
    const prevIdx = (idx - 1 + stations.length) % stations.length;
    onStationChange(stations[prevIdx]);
  }, [stations, station, onStationChange]);

  const handleNext = useCallback(() => {
    if (!stations.length || !station) return;
    const idx = stations.findIndex((s: any) => s.stationuuid === station.stationuuid);
    const nextIdx = (idx + 1) % stations.length;
    onStationChange(stations[nextIdx]);
  }, [stations, station, onStationChange]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => !m);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white/95 backdrop-blur-md border-t border-warm-100 shadow-medium">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {/* Station name mini display */}
          {station && (
            <div className="flex items-center gap-2 mb-2.5">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isPlaying ? 'bg-coral-500 animate-pulse' : 'bg-warm-200'}`} />
              <span className="text-xs font-medium text-muted-foreground truncate flex-1">
                {station.name}
              </span>
              {isLoading && (
                <Loader2 className="w-3.5 h-3.5 text-coral-400 animate-spin flex-shrink-0" />
              )}
            </div>
          )}

          {/* Controls row */}
          <div className="flex items-center gap-3">
            {/* Prev */}
            <button
              onClick={handlePrev}
              disabled={!station || stations.length < 2}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-warm-50 transition-colors disabled:opacity-30"
            >
              <SkipBack className="w-4.5 h-4.5" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              disabled={!station}
              className="w-12 h-12 rounded-2xl bg-coral-500 hover:bg-coral-600 text-white flex items-center justify-center shadow-warm transition-colors disabled:opacity-40 flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={handleNext}
              disabled={!station || stations.length < 2}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-warm-50 transition-colors disabled:opacity-30"
            >
              <SkipForward className="w-4.5 h-4.5" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 flex-1 ml-1">
              <button
                onClick={toggleMute}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-warm-50 transition-colors flex-shrink-0"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="flex-1 h-1.5 rounded-full accent-coral-500 cursor-pointer"
                style={{
                  background: `linear-gradient(to right, oklch(0.62 0.18 25) ${(isMuted ? 0 : volume) * 100}%, oklch(0.88 0.02 80) ${(isMuted ? 0 : volume) * 100}%)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
