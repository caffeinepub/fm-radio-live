import React, { useState } from 'react';
import { X, Copy, Check, Heart } from 'lucide-react';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ADDRESSES = [
  {
    label: 'USDT (TRC-20)',
    address: 'TYASr5UV6HEj2VpNamuQhgQmHYjGK7Xjhz',
    icon: '💵',
  },
  {
    label: 'ICP',
    address: 'b5c3e-...',
    icon: '∞',
  },
  {
    label: 'Bitcoin',
    address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf Na',
    icon: '₿',
  },
];

export default function DonationModal({ isOpen, onClose }: DonationModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(address);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-medium border border-warm-100 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-warm-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-coral-50 flex items-center justify-center">
              <Heart className="w-4 h-4 text-coral-500" />
            </div>
            <h2 className="font-bold text-sm font-display text-foreground">Support Global FM</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-warm-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-3 modal-scroll max-h-[60vh]">
          <p className="text-sm text-muted-foreground">
            If you enjoy Global FM, consider supporting the project with a small donation. Every contribution helps keep the service running!
          </p>

          {ADDRESSES.map(({ label, address, icon }) => (
            <div key={label} className="bg-warm-50 border border-warm-100 rounded-2xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{icon}</span>
                <span className="text-xs font-semibold text-foreground">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-muted-foreground bg-white border border-warm-100 rounded-xl px-3 py-2 truncate font-mono">
                  {address}
                </code>
                <button
                  onClick={() => handleCopy(address)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-white border border-warm-100 text-muted-foreground hover:text-coral-500 hover:border-coral-200 transition-colors flex-shrink-0"
                >
                  {copied === address ? (
                    <Check className="w-3.5 h-3.5 text-coral-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
