import { Search, BarChart3, RefreshCw, Heart, LogIn } from 'lucide-react';
import { useState } from 'react';
import SearchOverlay from './SearchOverlay';
import UserDashboard from './UserDashboard';
import DonationModal from './DonationModal';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useRadioStations, clearAllCaches } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import type { RadioStation } from '../hooks/useQueries';
import { toast } from 'sonner';

interface TopToolbarProps {
    onStationSelect: (station: RadioStation) => void;
}

export default function TopToolbar({ onStationSelect }: TopToolbarProps) {
    const [showSearch, setShowSearch] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);
    const [showDonation, setShowDonation] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { identity, login, clear, isLoggingIn } = useInternetIdentity();
    const { data: stations, isLoading, refetch, isFetching } = useRadioStations();
    const queryClient = useQueryClient();

    const isAuthenticated = !!identity;
    const stationCount = stations?.length || 0;

    const handleRefresh = async () => {
        if (isRefreshing) return;
        
        try {
            setIsRefreshing(true);
            toast.loading('Refreshing stations (Christian channels first)...', { id: 'refresh' });
            
            // Clear all caches
            clearAllCaches();
            await queryClient.invalidateQueries({ queryKey: ['globalRadioStations'] });
            queryClient.removeQueries({ queryKey: ['globalRadioStations'] });
            
            // Fetch fresh data
            const result = await refetch();
            
            if (result.isSuccess) {
                toast.success(`✅ ${result.data?.length || 0} stations loaded (Christian channels prioritized)!`, { id: 'refresh' });
            } else {
                toast.error('❌ Failed to refresh stations', { id: 'refresh' });
            }
        } catch (error) {
            console.error('❌ Refresh error:', error);
            toast.error('❌ Failed to refresh stations', { id: 'refresh' });
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleStationSelect = (station: RadioStation) => {
        onStationSelect(station);
        setShowSearch(false);
        setShowDashboard(false);
    };

    const handleLoginClick = async () => {
        if (isAuthenticated) {
            try {
                await clear();
                queryClient.clear();
                toast.success('Successfully logged out!');
            } catch (error: any) {
                console.error('Logout error:', error);
                toast.error('Logout failed. Please try again.');
            }
        } else {
            try {
                await login();
                toast.success('Successfully logged in with Internet Identity!');
            } catch (error: any) {
                console.error('Login error:', error);
                
                if (error?.message?.includes('already authenticated')) {
                    toast.info('Clearing previous session...');
                    try {
                        await clear();
                        setTimeout(async () => {
                            try {
                                await login();
                                toast.success('Successfully logged in!');
                            } catch (retryError) {
                                toast.error('Login failed. Please try again.');
                            }
                        }, 500);
                    } catch (clearError) {
                        toast.error('Failed to clear session. Please refresh the page.');
                    }
                } else {
                    toast.error('Login failed. Please try again.');
                }
            }
        }
    };

    const handleDashboardClick = () => {
        if (isAuthenticated) {
            setShowDashboard(true);
        } else {
            toast.info('Please login first to access the dashboard');
        }
    };

    const displayStatus = isRefreshing ? 'refreshing' : isLoading ? 'loading' : isFetching ? 'updating' : 'stations';

    return (
        <>
            <div className="fixed top-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex-1" />

                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setShowSearch(true)}
                                className="p-2.5 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 transition-all duration-150 ease-out border border-blue-500/30 hover:border-blue-400/50 shadow-sm hover:shadow-glow-blue hover:scale-110 active:scale-95"
                                aria-label="Search stations"
                            >
                                <Search className="w-5 h-5 text-blue-400" />
                            </button>

                            <button
                                onClick={handleDashboardClick}
                                className="p-2.5 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 transition-all duration-150 ease-out border border-purple-500/30 hover:border-purple-400/50 shadow-sm hover:shadow-glow-purple hover:scale-110 active:scale-95"
                                aria-label="Dashboard"
                                title="Dashboard"
                            >
                                <BarChart3 className="w-5 h-5 text-purple-400" />
                            </button>

                            <button
                                onClick={handleLoginClick}
                                disabled={isLoggingIn}
                                className="p-2.5 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 transition-all duration-150 ease-out border border-green-500/30 hover:border-green-400/50 shadow-sm hover:shadow-glow-green disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
                                aria-label={isAuthenticated ? "Logout" : "Login with Internet Identity"}
                                title={isAuthenticated ? "Logout" : "Login with Internet Identity"}
                            >
                                {isLoggingIn ? (
                                    <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <LogIn className="w-5 h-5 text-green-400" />
                                )}
                            </button>

                            <button
                                onClick={() => setShowDonation(true)}
                                className="p-2.5 rounded-full bg-gradient-to-br from-pink-500/20 to-red-500/20 hover:from-pink-500/30 hover:to-red-500/30 transition-all duration-150 ease-out border border-pink-500/30 hover:border-pink-400/50 shadow-sm hover:shadow-glow-red hover:scale-110 active:scale-95"
                                aria-label="Donate"
                            >
                                <Heart className="w-5 h-5 text-pink-400" />
                            </button>

                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 shadow-sm hover:shadow-glow-blue transition-all duration-150 ease-out">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                    <span className="text-sm font-semibold text-blue-300">
                                        {isLoading ? '...' : stationCount.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-blue-400/80">
                                        {displayStatus}
                                    </span>
                                </div>
                                <button
                                    onClick={handleRefresh}
                                    disabled={isFetching || isRefreshing}
                                    className="p-1 rounded-full hover:bg-blue-500/20 transition-all duration-150 ease-out disabled:opacity-50 hover:scale-110 active:scale-95"
                                    aria-label="Refresh stations"
                                    title="Refresh station data (Christian channels first)"
                                >
                                    <RefreshCw className={`w-4 h-4 text-blue-400 transition-transform duration-500 ${(isFetching || isRefreshing) ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1" />
                    </div>
                </div>
            </div>

            <SearchOverlay 
                isOpen={showSearch}
                onClose={() => setShowSearch(false)}
                stations={stations || []}
                onStationSelect={handleStationSelect}
            />

            <UserDashboard 
                isOpen={showDashboard && isAuthenticated}
                onClose={() => setShowDashboard(false)}
                onStationSelect={handleStationSelect}
            />

            <DonationModal 
                isOpen={showDonation}
                onClose={() => setShowDonation(false)}
            />
        </>
    );
}
