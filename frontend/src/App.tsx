import React, { useState, useEffect, useRef, useCallback } from 'react';
import TopToolbar from './components/TopToolbar';
import AudioPlayer from './components/AudioPlayer';
import RadioPlaybackDisplay from './components/RadioPlaybackDisplay';
import SearchOverlay from './components/SearchOverlay';
import UserDashboard from './components/UserDashboard';
import DonationModal from './components/DonationModal';
import LoadingScreen from './components/LoadingScreen';
import RadioTowerOverlay from './components/RadioTowerOverlay';
import AudioSpectrumAnalyzer from './components/AudioSpectrumAnalyzer';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { useRadioStations, type RadioStation } from './hooks/useQueries';

const LAST_STATION_KEY = 'gracy_fm_last_station_uuid';

function getLastStationUuid(): string | null {
  try {
    return localStorage.getItem(LAST_STATION_KEY);
  } catch {
    return null;
  }
}

function setLastStationUuid(uuid: string): void {
  try {
    localStorage.setItem(LAST_STATION_KEY, uuid);
  } catch {
    // ignore
  }
}

export default function App() {
  const { data: stations = [], isLoading } = useRadioStations();

  const [selectedStation, setSelectedStation] = useState<RadioStation | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [quickPlayActive, setQuickPlayActive] = useState(false);
  const hasAutoPlayed = useRef(false);

  // Quick Play: auto-select station on load
  useEffect(() => {
    if (hasAutoPlayed.current) return;
    if (isLoading || stations.length === 0) return;

    const lastUuid = getLastStationUuid();
    let stationToPlay: RadioStation | null = null;

    if (lastUuid) {
      stationToPlay = stations.find((s) => s.stationuuid === lastUuid) || null;
    }

    if (!stationToPlay) {
      stationToPlay = stations[0];
    }

    if (stationToPlay) {
      hasAutoPlayed.current = true;
      setSelectedStation(stationToPlay);
      setQuickPlayActive(true);
    }
  }, [stations, isLoading]);

  const handleStationSelect = useCallback((station: RadioStation) => {
    setSelectedStation(station);
    setQuickPlayActive(false);
    if (station?.stationuuid) {
      setLastStationUuid(station.stationuuid);
    }
  }, []);

  const handleStationChange = useCallback((station: RadioStation) => {
    setSelectedStation(station);
    if (station?.stationuuid) {
      setLastStationUuid(station.stationuuid);
    }
  }, []);

  const handlePlayingChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  const handleAudioElement = useCallback((el: HTMLAudioElement | null) => {
    setAudioElement(el);
  }, []);

  if (isLoading && !selectedStation) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 via-background to-peach-50 flex flex-col">
      {/* Decorative background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-coral-100 opacity-40 blur-3xl" />
        <div className="absolute top-1/3 -left-24 w-72 h-72 rounded-full bg-warm-100 opacity-50 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-peach-100 opacity-40 blur-3xl" />
        <div className="absolute -bottom-16 left-1/3 w-80 h-80 rounded-full bg-coral-50 opacity-60 blur-3xl" />
      </div>

      {/* Top Toolbar */}
      <TopToolbar
        stations={stations}
        onStationSelect={handleStationSelect}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        isDashboardOpen={isDashboardOpen}
        setIsDashboardOpen={setIsDashboardOpen}
        isDonationOpen={isDonationOpen}
        setIsDonationOpen={setIsDonationOpen}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-36 relative z-10">
        {/* Hero section */}
        <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 animate-fade-in">
          {/* Radio Tower with signal waves */}
          <div className="relative flex items-center justify-center">
            <RadioTowerOverlay isPlaying={isPlaying} />
          </div>

          {/* Quick Play badge */}
          {quickPlayActive && selectedStation && (
            <div className="flex items-center gap-2 bg-coral-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-warm quick-play-pulse">
              <span className="w-2 h-2 rounded-full bg-white inline-block" />
              Quick Play — Auto-started
            </div>
          )}

          {/* Playback display card */}
          {selectedStation ? (
            <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl shadow-card border border-warm-100 p-5">
              <RadioPlaybackDisplay
                station={selectedStation}
                isPlaying={isPlaying}
                quickPlayActive={quickPlayActive}
              />
            </div>
          ) : (
            <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl shadow-card border border-warm-100 p-8 text-center">
              <div className="text-4xl mb-3">📻</div>
              <p className="text-lg font-semibold text-foreground font-display">Welcome to Global FM</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isLoading ? 'Loading stations…' : 'Tap search to find a station'}
              </p>
            </div>
          )}

          {/* Spectrum Analyzer */}
          <div className="w-full rounded-2xl overflow-hidden bg-white/60 backdrop-blur-sm border border-warm-100 shadow-soft">
            <AudioSpectrumAnalyzer
              audioElement={audioElement}
              isPlaying={isPlaying}
            />
          </div>
        </div>
      </main>

      {/* Audio Player (fixed bottom) */}
      <AudioPlayer
        station={selectedStation}
        stations={stations}
        onStationChange={handleStationChange}
        onPlayingChange={handlePlayingChange}
        onAudioElement={handleAudioElement}
        autoPlay={!!selectedStation}
      />

      {/* Overlays & Modals */}
      {isSearchOpen && (
        <SearchOverlay
          stations={stations}
          onStationSelect={(s) => {
            handleStationSelect(s);
            setIsSearchOpen(false);
          }}
          onClose={() => setIsSearchOpen(false)}
        />
      )}

      {isDashboardOpen && (
        <UserDashboard
          isOpen={isDashboardOpen}
          onClose={() => setIsDashboardOpen(false)}
          stations={stations}
          selectedStation={selectedStation}
        />
      )}

      {isDonationOpen && (
        <DonationModal
          isOpen={isDonationOpen}
          onClose={() => setIsDonationOpen(false)}
        />
      )}

      <PWAInstallPrompt />
    </div>
  );
}
