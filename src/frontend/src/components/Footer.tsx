export default function Footer() {
    return (
        <footer className="fixed bottom-0 left-0 right-0 z-5 py-3 pointer-events-none">
            <div className="text-center">
                <p 
                    className="text-sm font-bold"
                    style={{
                        background: 'linear-gradient(135deg, #a3e635 0%, #d9f99d 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    🛠️ App Developed by Bhawan Bisht
                </p>
            </div>
        </footer>
    );
}
