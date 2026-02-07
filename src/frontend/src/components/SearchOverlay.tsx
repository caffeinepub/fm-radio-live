import { useState, useEffect, useMemo } from 'react';
import { X, Search, Radio } from 'lucide-react';
import type { RadioStation } from '../hooks/useQueries';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    stations: RadioStation[];
    onStationSelect: (station: RadioStation) => void;
}

export default function SearchOverlay({ isOpen, onClose, stations, onStationSelect }: SearchOverlayProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter stations based on search query
    const filteredStations = useMemo(() => {
        if (!searchQuery.trim()) return stations.slice(0, 50); // Show top 50 by default
        
        const query = searchQuery.toLowerCase();
        const results = stations.filter(station => 
            station.name.toLowerCase().includes(query) ||
            station.country.toLowerCase().includes(query) ||
            station.state?.toLowerCase().includes(query) ||
            station.language?.toLowerCase().includes(query)
        );

        return results.slice(0, 100); // Limit to 100 results
    }, [searchQuery, stations]);

    // Reset search when overlay closes
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
        }
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm pt-20 px-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-2xl bg-card/95 backdrop-blur-xl border-2 border-primary/40 rounded-2xl shadow-glow-purple overflow-hidden animate-in slide-in-from-top-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-border/50 px-5 py-3.5">
                    <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Search global stations by name, country, state, or language..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
                        autoFocus
                    />
                    <button
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted/50 transition-all duration-150 flex-shrink-0"
                        aria-label="Close search"
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto">
                    {filteredStations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground animate-in fade-in duration-300">
                            <Radio className="h-10 w-10 mb-3 opacity-50" />
                            <p className="text-base">No stations found</p>
                            <p className="text-xs mt-1">Try a different search term</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/20">
                            {filteredStations.map((station, index) => (
                                <button
                                    key={station.stationuuid}
                                    onClick={() => onStationSelect(station)}
                                    className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-muted/20 transition-all duration-150 text-left group animate-in fade-in slide-in-from-left-2"
                                    style={{ animationDelay: `${Math.min(index * 20, 500)}ms` }}
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15 group-hover:bg-blue-500/25 transition-all duration-150 flex-shrink-0">
                                        <Radio className="h-3.5 w-3.5 text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm text-foreground truncate group-hover:text-blue-400 transition-colors duration-150">
                                            {station.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                                            {station.country}
                                            {station.state && `, ${station.state}`}
                                            {station.bitrate > 0 && ` • ${station.bitrate}kbps`}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {filteredStations.length > 0 && (
                    <div className="border-t border-border/30 px-5 py-2.5 text-center text-xs text-muted-foreground">
                        Showing {filteredStations.length} global radio stations
                    </div>
                )}
            </div>
        </div>
    );
}
