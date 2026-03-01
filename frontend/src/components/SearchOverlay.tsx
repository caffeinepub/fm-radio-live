import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Radio } from 'lucide-react';

interface SearchOverlayProps {
  stations: any[];
  onStationSelect: (station: any) => void;
  onClose: () => void;
}

export default function SearchOverlay({ stations, onStationSelect, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = query.trim()
    ? stations.filter((s: any) => {
        const q = query.toLowerCase();
        return (
          s.name?.toLowerCase().includes(q) ||
          s.country?.toLowerCase().includes(q) ||
          s.state?.toLowerCase().includes(q) ||
          s.language?.toLowerCase().includes(q) ||
          s.tags?.toLowerCase().includes(q)
        );
      }).slice(0, 60)
    : stations.slice(0, 40);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 mt-14 mx-3 bg-white rounded-3xl shadow-medium border border-warm-100 flex flex-col max-h-[80vh] overflow-hidden animate-fade-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-warm-50">
          <Search className="w-4.5 h-4.5 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stations, country, language…"
            className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-warm-50 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto modal-scroll">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <Radio className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No stations found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try a different search term</p>
            </div>
          ) : (
            <ul className="py-2">
              {filtered.map((s: any) => {
                const flagUrl = s.countrycode
                  ? `https://flagcdn.com/w20/${s.countrycode.toLowerCase()}.png`
                  : null;
                return (
                  <li key={s.stationuuid}>
                    <button
                      onClick={() => onStationSelect(s)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-warm-50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-xl overflow-hidden bg-warm-50 border border-warm-100 flex items-center justify-center flex-shrink-0">
                        {flagUrl ? (
                          <img
                            src={flagUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Radio className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {[s.country, s.language].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
