import { X, Copy, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface DonationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface AddressBlockProps {
    icon: string;
    title: string;
    address: string;
    type: string;
    copiedAddress: string | null;
    onCopy: (address: string, type: string) => void;
    colorScheme: 'yellow' | 'purple' | 'orange';
}

const colorSchemes = {
    yellow: {
        iconBg: 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20',
        iconBorder: 'border-yellow-500/30',
        buttonBg: 'bg-yellow-500/20 hover:bg-yellow-500/30',
        buttonBorder: 'border-yellow-500/30 hover:border-yellow-400/50',
        iconColor: 'text-yellow-400 group-hover:text-yellow-300',
    },
    purple: {
        iconBg: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
        iconBorder: 'border-purple-500/30',
        buttonBg: 'bg-purple-500/20 hover:bg-purple-500/30',
        buttonBorder: 'border-purple-500/30 hover:border-purple-400/50',
        iconColor: 'text-purple-400 group-hover:text-purple-300',
    },
    orange: {
        iconBg: 'bg-gradient-to-br from-orange-500/20 to-yellow-500/20',
        iconBorder: 'border-orange-500/30',
        buttonBg: 'bg-orange-500/20 hover:bg-orange-500/30',
        buttonBorder: 'border-orange-500/30 hover:border-orange-400/50',
        iconColor: 'text-orange-400 group-hover:text-orange-300',
    },
};

function AddressBlock({ icon, title, address, type, copiedAddress, onCopy, colorScheme }: AddressBlockProps) {
    const colors = colorSchemes[colorScheme];
    
    return (
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/30">
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full ${colors.iconBg} flex items-center justify-center border ${colors.iconBorder} flex-shrink-0`}>
                    <span className="text-xl">{icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-white">
                    {title}
                </h3>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 mb-2 font-medium">Address</p>
                        <p className="text-sm text-white font-mono break-all leading-relaxed">
                            {address}
                        </p>
                    </div>
                    <button
                        onClick={() => onCopy(address, type)}
                        className={`flex-shrink-0 p-2.5 rounded-lg ${colors.buttonBg} border ${colors.buttonBorder} transition-all duration-150 group`}
                        aria-label={`Copy ${type} address`}
                    >
                        {copiedAddress === address ? (
                            <Check className="w-5 h-5 text-green-400" />
                        ) : (
                            <Copy className={`w-5 h-5 ${colors.iconColor}`} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function DonationModal({ isOpen, onClose }: DonationModalProps) {
    const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

    const USDT_ADDRESS = '0x61154973156B9a4533F7eC6d1ddC53EB8DC7c189';
    const ICP_ADDRESS = '216bed7e79318d630f167e8ee439b00ff0a1006f0453d5a28363eba8629d5f0e';
    const BITCOIN_ADDRESS = 'bc1q0rqam0p5rhsaqk5yghg3k6exm6w4hufnzux9ju';

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const copyToClipboard = async (address: string, type: string) => {
        try {
            await navigator.clipboard.writeText(address);
            setCopiedAddress(address);
            toast.success(`${type} address copied to clipboard!`);
            
            setTimeout(() => {
                setCopiedAddress(null);
            }, 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            toast.error('Failed to copy address');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 flex flex-col max-h-[90vh]">
                {/* Fixed Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/50 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        💝 Support Global FM
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-700/50 transition-colors"
                        aria-label="Close donation modal"
                    >
                        <X className="h-6 w-6 text-slate-400" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto overflow-x-hidden modal-scroll-content flex-1">
                    <div className="p-6 space-y-6">
                        <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-xl p-5 border border-pink-500/20">
                            <p className="text-white text-center text-lg leading-relaxed">
                                👉 If you would like to donate, please send your contribution to the addresses below.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <AddressBlock
                                icon="💰"
                                title="USDT – BNB Smart Chain"
                                address={USDT_ADDRESS}
                                type="USDT"
                                copiedAddress={copiedAddress}
                                onCopy={copyToClipboard}
                                colorScheme="yellow"
                            />

                            <AddressBlock
                                icon="🪙"
                                title="ICP – ICP Coin Only"
                                address={ICP_ADDRESS}
                                type="ICP"
                                copiedAddress={copiedAddress}
                                onCopy={copyToClipboard}
                                colorScheme="purple"
                            />

                            <AddressBlock
                                icon="₿"
                                title="Bitcoin"
                                address={BITCOIN_ADDRESS}
                                type="Bitcoin"
                                copiedAddress={copiedAddress}
                                onCopy={copyToClipboard}
                                colorScheme="orange"
                            />
                        </div>

                        <div className="text-center pt-2">
                            <p className="text-slate-400 text-base leading-relaxed">
                                Thank you for supporting Global FM Radio! 🙏
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
