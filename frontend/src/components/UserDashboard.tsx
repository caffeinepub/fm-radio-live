import React from 'react';
import { X, Bookmark, BookmarkCheck, Radio, Info, User, Wifi, WifiOff } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useBookmarks } from '../hooks/useBookmarks';

interface UserDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  stations: any[];
  selectedStation: any;
}

export default function UserDashboard({ isOpen, onClose, stations, selectedStation }: UserDashboardProps) {
  const { identity } = useInternetIdentity();
  const { bookmarks, toggleBookmark, isBookmarked } = useBookmarks();
  const isAuthenticated = !!identity;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-medium border border-warm-100 flex flex-col max-h-[85vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-warm-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-coral-50 flex items-center justify-center">
              <User className="w-4 h-4 text-coral-500" />
            </div>
            <div>
              <h2 className="font-bold text-sm font-display text-foreground">Dashboard</h2>
              <p className="text-xs text-muted-foreground">
                {isAuthenticated ? 'Logged in' : 'Guest mode'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-warm-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto modal-scroll px-5 py-4 space-y-5">
          {/* Guest mode notice */}
          {!isAuthenticated && (
            <div className="bg-warm-50 border border-warm-100 rounded-2xl p-4">
              <p className="text-sm font-medium text-foreground">Guest Mode</p>
              <p className="text-xs text-muted-foreground mt-1">
                Log in to sync your bookmarks and preferences across devices.
              </p>
            </div>
          )}

          {/* Currently playing */}
          {selectedStation && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Now Playing
              </h3>
              <div className="bg-coral-50 border border-coral-100 rounded-2xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-coral-500 flex items-center justify-center flex-shrink-0">
                  <Radio className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{selectedStation.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedStation.country}</p>
                </div>
              </div>
            </div>
          )}

          {/* Channel status */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Station Stats
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-warm-50 border border-warm-100 rounded-2xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Wifi className="w-3.5 h-3.5 text-coral-500" />
                  <span className="text-xs font-medium text-muted-foreground">Total</span>
                </div>
                <p className="text-lg font-bold text-foreground font-display">
                  {stations.length.toLocaleString()}
                </p>
              </div>
              <div className="bg-warm-50 border border-warm-100 rounded-2xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Bookmark className="w-3.5 h-3.5 text-coral-500" />
                  <span className="text-xs font-medium text-muted-foreground">Saved</span>
                </div>
                <p className="text-lg font-bold text-foreground font-display">
                  {bookmarks.length}
                </p>
              </div>
            </div>
          </div>

          {/* Bookmarks */}
          {bookmarks.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Saved Stations
              </h3>
              <ul className="space-y-1.5">
                {bookmarks.map((s: any) => (
                  <li key={s.stationuuid} className="flex items-center gap-3 bg-warm-50 border border-warm-100 rounded-xl px-3 py-2">
                    <Radio className="w-3.5 h-3.5 text-coral-400 flex-shrink-0" />
                    <span className="text-sm text-foreground truncate flex-1">{s.name}</span>
                    <button
                      onClick={() => toggleBookmark(s)}
                      className="text-coral-400 hover:text-coral-600 transition-colors flex-shrink-0"
                    >
                      <BookmarkCheck className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* About */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              About
            </h3>
            <div className="bg-warm-50 border border-warm-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-coral-400" />
                <span className="text-sm font-semibold text-foreground">Global FM</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A worldwide radio streaming app with thousands of stations from every corner of the globe.
                Developed by Bhawan Bisht.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
