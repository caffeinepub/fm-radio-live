import { X, Bookmark, TrendingUp, Activity, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRadioStations } from '../hooks/useQueries';
import { useBookmarks } from '../hooks/useBookmarks';
import type { RadioStation } from '../hooks/useQueries';

interface UserDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    onStationSelect?: (station: RadioStation) => void;
    isGuest: boolean;
}

export default function UserDashboard({ isOpen, onClose, onStationSelect, isGuest }: UserDashboardProps) {
    const [bookmarkedStations, setBookmarkedStations] = useState<RadioStation[]>([]);
    const { data: allStations } = useRadioStations();
    const { bookmarks } = useBookmarks();

    useEffect(() => {
        if (isOpen && allStations) {
            const bookmarked = allStations.filter(station => 
                bookmarks.includes(station.stationuuid)
            );
            setBookmarkedStations(bookmarked);
        }
    }, [isOpen, allStations, bookmarks]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Calculate live vs offline channels from loaded stations
    const liveChannels = allStations?.length || 0;
    const offlineChannels = 0; // We only show working stations

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dashboard Card */}
            <div className="relative w-full max-w-2xl bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/50">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Activity className="h-6 w-6 text-blue-400" />
                        User Dashboard
                        {isGuest && (
                            <span className="text-sm font-normal text-slate-400 ml-2">(Guest Mode)</span>
                        )}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-700/50 transition-colors"
                        aria-label="Close dashboard"
                    >
                        <X className="h-6 w-6 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
                    {isGuest && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                            <p className="text-sm text-blue-300">
                                You're viewing the dashboard as a guest. Your bookmarks are stored locally on this device. 
                                <span className="font-semibold"> Login to sync your data across devices.</span>
                            </p>
                        </div>
                    )}

                    {/* Channel Status */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-400" />
                            Channel Status
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                                <div className="text-sm text-slate-400 mb-1">Live Channels</div>
                                <div className="text-2xl font-bold text-green-400">
                                    {liveChannels.toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                                <div className="text-sm text-slate-400 mb-1">Offline Channels</div>
                                <div className="text-2xl font-bold text-slate-500">
                                    {offlineChannels.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bookmarked Channels */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Bookmark className="h-5 w-5 text-yellow-400" />
                            Bookmarked Channels ({bookmarkedStations.length})
                        </h3>
                        {bookmarkedStations.length === 0 ? (
                            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/30 text-center">
                                <Bookmark className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">No bookmarked channels yet</p>
                                <p className="text-sm text-slate-500 mt-1">
                                    Bookmark your favorite stations to see them here
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {bookmarkedStations.map((station) => (
                                    <button
                                        key={station.stationuuid}
                                        onClick={() => onStationSelect?.(station)}
                                        className="w-full bg-slate-800/50 hover:bg-slate-700/50 rounded-xl p-4 border border-slate-700/30 transition-all duration-200 text-left group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-medium truncate group-hover:text-blue-400 transition-colors">
                                                    {station.name}
                                                </div>
                                                <div className="text-sm text-slate-400 truncate">
                                                    {station.country}
                                                    {station.state && `, ${station.state}`}
                                                </div>
                                            </div>
                                            <div className="ml-4 text-xs text-slate-500">
                                                {station.bitrate ? `${station.bitrate}kbps` : ''}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* About Gracy FM */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Info className="h-5 w-5 text-blue-400" />
                            About Gracy FM
                        </h3>
                        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/30 space-y-3">
                            <p className="text-slate-300 leading-relaxed">
                                This application is developed by Bhawan Bisht and built on-chain, powered by the Internet Computer Protocol.
                            </p>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                    <span className="text-slate-400 font-medium min-w-[60px]">Email:</span>
                                    <a 
                                        href="mailto:bsbnpl@gmail.com" 
                                        className="text-blue-400 hover:text-blue-300 transition-colors break-all"
                                    >
                                        bsbnpl@gmail.com
                                    </a>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-slate-400 font-medium min-w-[60px]">Mobile:</span>
                                    <a 
                                        href="tel:+919521460319" 
                                        className="text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        +91 9521460319
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
