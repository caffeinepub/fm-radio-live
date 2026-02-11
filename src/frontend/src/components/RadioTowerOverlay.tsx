import { Radio } from 'lucide-react';

export default function RadioTowerOverlay() {
    return (
        <div className="relative flex flex-col items-center pointer-events-none">
            {/* Animated signal waves */}
            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Wave 1 - Outermost */}
                <div className="absolute inset-0 rounded-full border-2 border-blue-400/40 animate-signal-wave-1" />
                
                {/* Wave 2 - Middle */}
                <div className="absolute inset-0 rounded-full border-2 border-blue-400/50 animate-signal-wave-2" />
                
                {/* Wave 3 - Innermost */}
                <div className="absolute inset-0 rounded-full border-2 border-blue-400/60 animate-signal-wave-3" />
                
                {/* Radio tower icon */}
                <div className="relative z-10 animate-tower-pulse">
                    <Radio 
                        className="w-16 h-16 text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]" 
                        strokeWidth={2}
                    />
                </div>
            </div>
        </div>
    );
}
