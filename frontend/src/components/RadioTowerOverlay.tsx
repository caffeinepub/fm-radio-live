import React from 'react';
import { Radio } from 'lucide-react';

interface RadioTowerOverlayProps {
  isPlaying?: boolean;
}

export default function RadioTowerOverlay({ isPlaying = false }: RadioTowerOverlayProps) {
  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      {/* Signal rings — only show when playing */}
      {isPlaying && (
        <>
          <div
            className="absolute inset-0 rounded-full border-2 border-coral-300 animate-signal-wave"
            style={{ animationDelay: '0s' }}
          />
          <div
            className="absolute inset-0 rounded-full border-2 border-coral-200 animate-signal-wave"
            style={{ animationDelay: '0.7s' }}
          />
          <div
            className="absolute inset-0 rounded-full border-2 border-warm-200 animate-signal-wave"
            style={{ animationDelay: '1.4s' }}
          />
        </>
      )}

      {/* Center icon */}
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-warm transition-all duration-500 ${
          isPlaying
            ? 'bg-coral-500 scale-105'
            : 'bg-warm-100 border-2 border-warm-200'
        }`}
      >
        <Radio
          className={`w-9 h-9 transition-colors duration-500 ${
            isPlaying ? 'text-white animate-tower-pulse' : 'text-warm-400'
          }`}
          strokeWidth={1.5}
        />
      </div>
    </div>
  );
}
