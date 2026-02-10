export default function FmRadioCenterOverlay() {
    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <img 
                src="/assets/generated/fm-radio-official-logo-transparent.dim_400x200.png" 
                alt="FM Radio"
                className="w-64 h-32 object-contain opacity-40 dark:opacity-30"
            />
        </div>
    );
}
