import React from 'react';
import { Radio } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 via-background to-peach-50 flex flex-col items-center justify-center px-6">
      {/* Decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-coral-100 opacity-40 blur-3xl" />
        <div className="absolute bottom-1/4 -left-24 w-72 h-72 rounded-full bg-warm-100 opacity-50 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        {/* Animated radio icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-coral-500 flex items-center justify-center shadow-warm animate-float">
            <Radio className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
          {/* Signal rings */}
          <div className="absolute inset-0 rounded-full border-2 border-coral-300 animate-signal-wave" />
          <div className="absolute inset-0 rounded-full border-2 border-coral-200 animate-signal-wave" style={{ animationDelay: '0.6s' }} />
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground tracking-tight">
            Global FM
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-sans">
            Your world of radio
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-coral-400 bounce-dot" />
          <div className="w-2.5 h-2.5 rounded-full bg-warm-400 bounce-dot" />
          <div className="w-2.5 h-2.5 rounded-full bg-peach-300 bounce-dot" />
        </div>

        <p className="text-xs text-muted-foreground max-w-xs">
          Tuning in to thousands of stations worldwide…
        </p>
      </div>
    </div>
  );
}
