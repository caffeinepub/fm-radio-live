import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from './ui/button';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if user has dismissed the prompt before
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed, 10);
            const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) {
                return; // Don't show again for 7 days
            }
        }

        const handler = (e: Event) => {
            e.preventDefault();
            const promptEvent = e as BeforeInstallPromptEvent;
            setDeferredPrompt(promptEvent);
            
            // Show prompt after 10 seconds to not interrupt initial experience
            setTimeout(() => {
                setShowPrompt(true);
            }, 10000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Listen for successful installation
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('PWA installed successfully');
            } else {
                console.log('PWA installation dismissed');
                localStorage.setItem('pwa-install-dismissed', Date.now().toString());
            }
        } catch (error) {
            console.error('Error installing PWA:', error);
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    if (isInstalled || !showPrompt || !deferredPrompt) {
        return null;
    }

    return (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5 duration-300">
            <div className="bg-card/95 backdrop-blur-md border-2 border-green-500/40 rounded-2xl shadow-glow-green p-6">
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-accent/20 transition-colors"
                    aria-label="Dismiss"
                >
                    <X className="w-4 h-4 text-muted-foreground" />
                </button>

                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <Download className="w-6 h-6 text-green-500" />
                    </div>
                    
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground mb-1">
                            Install Global FM
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Install our app for faster loading, offline access, and a better experience!
                        </p>
                        
                        <div className="flex gap-2">
                            <Button
                                onClick={handleInstallClick}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                            >
                                Install
                            </Button>
                            <Button
                                onClick={handleDismiss}
                                variant="outline"
                                className="flex-1"
                            >
                                Not now
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
