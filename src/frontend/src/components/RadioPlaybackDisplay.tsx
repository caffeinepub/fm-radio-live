import { Share2, Bookmark, BookmarkCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { RadioStation } from '../hooks/useQueries';
import { useBookmarks } from '../hooks/useBookmarks';

interface RadioPlaybackDisplayProps {
    station: RadioStation | null;
}

export default function RadioPlaybackDisplay({ station }: RadioPlaybackDisplayProps) {
    const { isBookmarked, toggleBookmark } = useBookmarks();

    if (!station) {
        return null;
    }

    const isStationBookmarked = isBookmarked(station.stationuuid);

    // Get country flag emoji from country code or name
    const getCountryFlag = (countryCode: string | undefined, countryName: string) => {
        // Try to get flag from country code if available
        if (countryCode && countryCode.length === 2) {
            const codePoints = countryCode
                .toUpperCase()
                .split('')
                .map(char => 127397 + char.charCodeAt(0));
            return String.fromCodePoint(...codePoints);
        }
        
        // Fallback to common country flags based on name
        const flagMap: Record<string, string> = {
            'USA': '🇺🇸',
            'United States': '🇺🇸',
            'UK': '🇬🇧',
            'United Kingdom': '🇬🇧',
            'France': '🇫🇷',
            'Germany': '🇩🇪',
            'Spain': '🇪🇸',
            'Italy': '🇮🇹',
            'Canada': '🇨🇦',
            'Australia': '🇦🇺',
            'Japan': '🇯🇵',
            'Brazil': '🇧🇷',
            'Mexico': '🇲🇽',
            'Netherlands': '🇳🇱',
            'Sweden': '🇸🇪',
            'Norway': '🇳🇴',
            'Denmark': '🇩🇰',
            'Finland': '🇫🇮',
            'Poland': '🇵🇱',
            'Russia': '🇷🇺',
            'China': '🇨🇳',
            'India': '🇮🇳',
            'South Korea': '🇰🇷',
            'Argentina': '🇦🇷',
            'Chile': '🇨🇱',
            'Colombia': '🇨🇴',
            'Peru': '🇵🇪',
            'Venezuela': '🇻🇪',
            'Portugal': '🇵🇹',
            'Greece': '🇬🇷',
            'Turkey': '🇹🇷',
            'Egypt': '🇪🇬',
            'South Africa': '🇿🇦',
            'Nigeria': '🇳🇬',
            'Kenya': '🇰🇪',
            'Morocco': '🇲🇦',
            'Algeria': '🇩🇿',
            'Tunisia': '🇹🇳',
            'Israel': '🇮🇱',
            'Saudi Arabia': '🇸🇦',
            'UAE': '🇦🇪',
            'United Arab Emirates': '🇦🇪',
            'Thailand': '🇹🇭',
            'Vietnam': '🇻🇳',
            'Philippines': '🇵🇭',
            'Indonesia': '🇮🇩',
            'Malaysia': '🇲🇾',
            'Singapore': '🇸🇬',
            'New Zealand': '🇳🇿',
            'Ireland': '🇮🇪',
            'Belgium': '🇧🇪',
            'Switzerland': '🇨🇭',
            'Austria': '🇦🇹',
            'Czech Republic': '🇨🇿',
            'Hungary': '🇭🇺',
            'Romania': '🇷🇴',
            'Bulgaria': '🇧🇬',
            'Croatia': '🇭🇷',
            'Serbia': '🇷🇸',
            'Ukraine': '🇺🇦',
            'Iceland': '🇮🇸',
            'Luxembourg': '🇱🇺',
            'French Polynesia': '🇵🇫',
        };
        
        return flagMap[countryName] || '🌍';
    };

    const flag = getCountryFlag(station.countrycode, station.country);
    const locationText = station.state ? `${station.country}, ${station.state}` : station.country;

    // Handle share button click
    const handleShare = async () => {
        const shareText = `🎵 ${station.name} - ${locationText}`;
        const shareUrl = station.homepage || station.url_resolved || station.url;

        // Try native share API first (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: station.name,
                    text: shareText,
                    url: shareUrl,
                });
                toast.success('Shared successfully!');
            } catch (error) {
                // User cancelled or error occurred
                if ((error as Error).name !== 'AbortError') {
                    // Fallback to clipboard
                    copyToClipboard(shareText, shareUrl);
                }
            }
        } else {
            // Fallback to clipboard for desktop
            copyToClipboard(shareText, shareUrl);
        }
    };

    // Copy to clipboard helper
    const copyToClipboard = async (text: string, url: string) => {
        const fullText = `${text}\n${url}`;
        try {
            await navigator.clipboard.writeText(fullText);
            toast.success('Copied to clipboard!', {
                description: 'Station link copied',
            });
        } catch {
            toast.error('Failed to copy', {
                description: 'Please try again',
            });
        }
    };

    // Handle bookmark button click
    const handleBookmark = () => {
        const nowBookmarked = toggleBookmark(station.stationuuid);
        
        if (nowBookmarked) {
            toast.success('Station bookmarked!', {
                description: station.name,
            });
        } else {
            toast.info('Bookmark removed', {
                description: station.name,
            });
        }
    };

    return (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-10 w-full max-w-xl px-4">
            <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-3xl px-6 py-5 shadow-2xl border border-slate-700/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                    {/* Radio Station Info Container */}
                    <div className="flex-1 min-w-0">
                        <div className="radio-station inline-block">
                            <div className="flex items-center gap-3 mb-2">
                                {/* Country Flag Image */}
                                <span className="text-3xl leading-none flex-shrink-0">{flag}</span>
                            </div>
                            
                            {/* Station Name */}
                            <h2 className="text-xl font-bold text-white mb-1 truncate">
                                {station.name}
                            </h2>
                            
                            {/* Country Name */}
                            <div className="flex items-center gap-2 text-slate-400">
                                <span className="text-sm font-medium truncate">{locationText}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3 ml-4 flex-shrink-0">
                        <div className="flex gap-2">
                            {/* Share Button */}
                            <button 
                                onClick={handleShare}
                                className="w-11 h-11 rounded-full bg-slate-700/50 hover:bg-slate-600/50 transition-all duration-200 flex items-center justify-center group hover:scale-105 active:scale-95"
                                aria-label="Share station"
                            >
                                <Share2 className="w-4 h-4 text-white transition-transform group-hover:rotate-12" />
                            </button>
                            
                            {/* Bookmark Button */}
                            <button 
                                onClick={handleBookmark}
                                className={`w-11 h-11 rounded-full transition-all duration-200 flex items-center justify-center group hover:scale-105 active:scale-95 ${
                                    isStationBookmarked 
                                        ? 'bg-yellow-600/70 hover:bg-yellow-500/70' 
                                        : 'bg-slate-700/50 hover:bg-slate-600/50'
                                }`}
                                aria-label={isStationBookmarked ? "Remove bookmark" : "Bookmark station"}
                            >
                                {isStationBookmarked ? (
                                    <BookmarkCheck className="w-4 h-4 text-white" />
                                ) : (
                                    <Bookmark className="w-4 h-4 text-white" />
                                )}
                            </button>
                        </div>
                        
                        {/* Attribution Text */}
                        <div className="text-[10px] text-slate-500 text-right leading-tight">
                            Powered by<br />Radio Browser API
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
