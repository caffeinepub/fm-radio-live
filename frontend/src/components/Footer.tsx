import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  const hostname = typeof window !== 'undefined' ? encodeURIComponent(window.location.hostname) : 'global-fm';

  return (
    <footer className="w-full py-4 px-4 text-center border-t border-warm-100 bg-white/80 backdrop-blur-sm">
      <p className="text-xs text-muted-foreground">
        © {year} Global FM · App by Bhawan Bisht
      </p>
      <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
        Built with <Heart className="w-3 h-3 text-coral-400 inline" /> using{' '}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${hostname}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-coral-500 hover:text-coral-600 font-medium transition-colors"
        >
          caffeine.ai
        </a>
      </p>
    </footer>
  );
}
