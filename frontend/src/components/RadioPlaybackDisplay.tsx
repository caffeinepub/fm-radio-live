import React from 'react';
import { Share2, Bookmark, BookmarkCheck, Zap } from 'lucide-react';
import { useBookmarks } from '../hooks/useBookmarks';

interface RadioPlaybackDisplayProps {
  station: any;
  isPlaying?: boolean;
  quickPlayActive?: boolean;
}

export default function RadioPlaybackDisplay({
  station,
  isPlaying = false,
  quickPlayActive = false,
}: RadioPlaybackDisplayProps) {
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const bookmarked = station ? isBookmarked(station.stationuuid) : false;

  const handleShare = async () => {
    if (!station) return;
    const text = `🎵 Listening to ${station.name} on Global FM`;
    if (navigator.share) {
      try {
        await navigator.share({ title: station.name, text });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard?.writeText(text).catch(() => {});
    }
  };

  const handleBookmark = () => {
    if (station) toggleBookmark(station);
  };

  if (!station) return null;

  const flagUrl = station.countrycode
    ? `https://flagcdn.com/w40/${station.countrycode.toLowerCase()}.png`
    : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Quick play indicator */}
      {quickPlayActive && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-coral-500">
          <Zap className="w-3.5 h-3.5" />
          <span>Quick Play</span>
          <span className="w-1.5 h-1.5 rounded-full bg-coral-400 animate-pulse inline-block" />
        </div>
      )}

      {/* Station info */}
      <div className="flex items-start gap-3">
        {/* Flag / avatar */}
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl overflow-hidden bg-warm-50 border border-warm-100 flex items-center justify-center">
          {flagUrl ? (
            <img
              src={flagUrl}
              alt={station.country || 'Flag'}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="text-2xl">📻</span>
          )}
        </div>

        {/* Name & country */}
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-base text-foreground font-display leading-tight truncate">
            {station.name || 'Unknown Station'}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            {[station.country, station.state, station.language]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {station.tags && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate opacity-70">
              {station.tags.split(',').slice(0, 3).join(', ')}
            </p>
          )}
        </div>

        {/* Playing indicator */}
        {isPlaying && (
          <div className="flex-shrink-0 flex items-center gap-0.5 mt-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 bg-coral-500 rounded-full animate-pulse"
                style={{
                  height: `${10 + i * 4}px`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-warm-50">
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-xl hover:bg-warm-50 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>

        <button
          onClick={handleBookmark}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-colors ${
            bookmarked
              ? 'text-coral-500 bg-coral-50 hover:bg-coral-100'
              : 'text-muted-foreground hover:text-foreground hover:bg-warm-50'
          }`}
        >
          {bookmarked ? (
            <BookmarkCheck className="w-3.5 h-3.5" />
          ) : (
            <Bookmark className="w-3.5 h-3.5" />
          )}
          {bookmarked ? 'Saved' : 'Save'}
        </button>

        <div className="ml-auto text-xs text-muted-foreground opacity-60">
          App by Bhawan Bisht
        </div>
      </div>
    </div>
  );
}
