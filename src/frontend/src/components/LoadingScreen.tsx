import { Radio } from 'lucide-react';

export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-6">
                {/* Radio Icon with Glow */}
                <div className="relative">
                    <div className="absolute inset-0 bg-green-500/30 blur-2xl rounded-full animate-pulse" />
                    <Radio className="w-16 h-16 text-green-500 relative z-10 animate-pulse" />
                </div>

                {/* Loading Text */}
                <div className="flex flex-col items-center gap-2">
                    <h2 className="text-2xl font-bold text-foreground">Global FM Radio</h2>
                    <p className="text-sm text-muted-foreground">Loading worldwide radio stations...</p>
                </div>

                {/* Spinner */}
                <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>

                {/* Info Text */}
                <p className="text-xs text-muted-foreground max-w-md text-center px-4">
                    Fetching 7,400+ radio stations from around the world with optimized caching for instant loading
                </p>

                {/* PWA Info */}
                <p className="text-xs text-green-500/70 max-w-md text-center px-4 mt-2">
                    ✨ Install as app for offline access and faster loading
                </p>
            </div>
        </div>
    );
}
