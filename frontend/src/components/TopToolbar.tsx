import React, { useState } from 'react';
import { Search, LayoutDashboard, LogIn, LogOut, Heart, RefreshCw, Radio } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';

interface TopToolbarProps {
  stations: any[];
  onStationSelect: (station: any) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isDashboardOpen: boolean;
  setIsDashboardOpen: (open: boolean) => void;
  isDonationOpen: boolean;
  setIsDonationOpen: (open: boolean) => void;
}

export default function TopToolbar({
  stations,
  onStationSelect,
  isSearchOpen,
  setIsSearchOpen,
  isDashboardOpen,
  setIsDashboardOpen,
  isDonationOpen,
  setIsDonationOpen,
}: TopToolbarProps) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ['stations'] });
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-white/90 backdrop-blur-md border-b border-warm-100 shadow-soft">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-coral-500 flex items-center justify-center shadow-warm">
              <Radio className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <span className="font-bold text-base font-display text-foreground tracking-tight">
              Global FM
            </span>
          </div>

          {/* Station count */}
          {stations.length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-warm-50 border border-warm-100 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-coral-400 inline-block" />
              {stations.length.toLocaleString()} stations
            </span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-warm-50 transition-colors"
              title="Search stations"
            >
              <Search className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={() => setIsDashboardOpen(!isDashboardOpen)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-warm-50 transition-colors"
              title="Dashboard"
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={() => setIsDonationOpen(!isDonationOpen)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-warm-50 transition-colors"
              title="Support us"
            >
              <Heart className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-warm-50 transition-colors disabled:opacity-50"
              title="Refresh stations"
            >
              <RefreshCw className={`w-4.5 h-4.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleAuth}
              disabled={isLoggingIn}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 ${
                isAuthenticated
                  ? 'text-coral-500 hover:bg-coral-50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-warm-50'
              }`}
              title={isAuthenticated ? 'Logout' : 'Login'}
            >
              {isAuthenticated ? (
                <LogOut className="w-4.5 h-4.5" />
              ) : (
                <LogIn className="w-4.5 h-4.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
