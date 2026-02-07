import { Canvas } from '@react-three/fiber';
import { Suspense, useState, lazy, useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { Radio } from 'lucide-react';
import { InternetIdentityProvider } from './hooks/useInternetIdentity';
import LoadingScreen from './components/LoadingScreen';
import AudioPlayer from './components/AudioPlayer';
import RadioPlaybackDisplay from './components/RadioPlaybackDisplay';
import TopToolbar from './components/TopToolbar';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { useRadioStations, type RadioStation } from './hooks/useQueries';

const SpaceScene = lazy(() => import('./components/SpaceScene'));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 30,
            gcTime: 1000 * 60 * 60,
            refetchOnWindowFocus: false,
            refetchOnMount: true,
            refetchOnReconnect: true,
            retry: 2,
            retryDelay: 1000,
        },
    },
});

function AppContent() {
    const [selectedStation, setSelectedStation] = useState<RadioStation | null>(null);
    const [userInteracted, setUserInteracted] = useState(false);
    const [autoPlayAttempted, setAutoPlayAttempted] = useState(false);
    const { data: stations = [], isLoading, refetch } = useRadioStations();

    // Lock screen orientation to portrait on mount
    useEffect(() => {
        const lockOrientation = async () => {
            try {
                // Type-safe check for screen orientation lock API
                if (screen.orientation && 'lock' in screen.orientation) {
                    const orientation = screen.orientation as any;
                    await orientation.lock('portrait').catch((err: Error) => {
                        console.log('Screen orientation lock not supported:', err);
                    });
                }
            } catch (error) {
                console.log('Orientation lock error:', error);
            }
        };

        lockOrientation();

        // Prevent orientation change events
        const handleOrientationChange = (e: Event) => {
            e.preventDefault();
            lockOrientation();
        };

        window.addEventListener('orientationchange', handleOrientationChange);
        
        return () => {
            window.removeEventListener('orientationchange', handleOrientationChange);
        };
    }, []);

    // Track user interaction
    useEffect(() => {
        const handleInteraction = () => {
            if (!userInteracted) {
                console.log('👆 User interaction detected');
                setUserInteracted(true);
            }
        };

        window.addEventListener('click', handleInteraction, { once: true });
        window.addEventListener('touchstart', handleInteraction, { once: true });
        window.addEventListener('keydown', handleInteraction, { once: true });

        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };
    }, [userInteracted]);

    // Auto-play first station after user interaction
    useEffect(() => {
        if (!userInteracted || autoPlayAttempted || !stations || stations.length === 0 || selectedStation) {
            return;
        }

        setAutoPlayAttempted(true);

        // Find first valid station
        const firstStation = stations.find(station => 
            station.url_resolved && 
            station.url_resolved.length > 0
        );

        if (firstStation) {
            console.log(`▶️ Auto-playing first station: ${firstStation.name}`);
            
            setTimeout(() => {
                setSelectedStation(firstStation);
                toast.success(`🎵 Now playing: ${firstStation.name}`, { duration: 3000 });
            }, 500);
        } else {
            console.warn('⚠️ No valid stations found for auto-play');
        }
    }, [userInteracted, autoPlayAttempted, stations, selectedStation]);

    const handleClosePlayer = () => {
        setSelectedStation(null);
    };

    const handleStationSelect = useCallback((station: RadioStation | null) => {
        setSelectedStation(station);
    }, []);

    const handleNextStation = useCallback(() => {
        if (!selectedStation || !stations || stations.length === 0) return;
        
        const currentIndex = stations.findIndex(s => s.stationuuid === selectedStation.stationuuid);
        const nextIndex = (currentIndex + 1) % stations.length;
        const nextStation = stations[nextIndex];
        
        setSelectedStation(nextStation);
        toast.success(`⏭️ Next: ${nextStation.name}`, { duration: 2000 });
    }, [selectedStation, stations]);

    const handlePreviousStation = useCallback(() => {
        if (!selectedStation || !stations || stations.length === 0) return;
        
        const currentIndex = stations.findIndex(s => s.stationuuid === selectedStation.stationuuid);
        const prevIndex = currentIndex === 0 ? stations.length - 1 : currentIndex - 1;
        const prevStation = stations[prevIndex];
        
        setSelectedStation(prevStation);
        toast.success(`⏮️ Previous: ${prevStation.name}`, { duration: 2000 });
    }, [selectedStation, stations]);

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-black">
            <TopToolbar onStationSelect={handleStationSelect} />
            
            {/* Centered Gracy FM Radio Text Logo with FM Radio Icon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center gap-3">
                <h1 className="gracy-fm-radio-title">Gracy FM Radio</h1>
                <Radio className="w-8 h-8 text-blue-300 opacity-80" strokeWidth={2} />
            </div>

            <Suspense fallback={<LoadingScreen />}>
                <Canvas
                    camera={{ position: [0, 0, 5], fov: 50 }}
                    gl={{ 
                        antialias: false,
                        alpha: false,
                        stencil: false,
                        depth: false,
                        powerPreference: 'low-power',
                    }}
                    dpr={[1, 1.5]}
                    performance={{ min: 0.5 }}
                    frameloop="demand"
                    style={{ background: '#000000' }}
                >
                    <SpaceScene />
                </Canvas>
            </Suspense>
            
            <RadioPlaybackDisplay station={selectedStation} />
            <AudioPlayer 
                station={selectedStation} 
                onClose={handleClosePlayer}
                onNext={handleNextStation}
                onPrevious={handlePreviousStation}
            />
            <PWAInstallPrompt />
            <Toaster />
        </div>
    );
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                <InternetIdentityProvider>
                    <AppContent />
                </InternetIdentityProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
