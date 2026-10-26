import React from 'react';
import { Shield, ShieldAlert, Lock, Settings as SettingsIcon, ChevronLeft } from 'lucide-react';

interface NavbarProps {
  currentView: 'dashboard' | 'pictures' | 'videos' | 'music' | 'notes';
  onNavigate: (view: 'dashboard' | 'pictures' | 'videos' | 'music' | 'notes') => void;
  onOpenSettings: () => void;
  onLock: () => void;
  isFakeVault: boolean;
  unseenAlertCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenSettings,
  onLock,
  isFakeVault,
  unseenAlertCount
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b" style={{
      backgroundColor: 'rgba(var(--bg-secondary), 0.85)',
      borderColor: 'var(--border-color)'
    }}>
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Brand or Back Button */}
        <div className="flex items-center space-x-3">
          {currentView !== 'dashboard' ? (
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/10"
              style={{ color: 'var(--text-main)' }}
              aria-label="Back to Dashboard"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2.5">
              <div className="relative p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Shield className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
                    Privstack
                  </h1>
                  {isFakeVault ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      Decoy Safe
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Vault Secured
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Local Zero-Knowledge Storage
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Action Controls: Settings & Lock */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenSettings}
            className="relative p-2.5 rounded-xl transition-all border hover:scale-105 active:scale-95"
            style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)',
              backgroundColor: 'var(--bg-card)'
            }}
            aria-label="Vault Settings"
            title="Settings & Security"
          >
            <SettingsIcon className="w-5 h-5" />
            {unseenAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                !
              </span>
            )}
          </button>

          <button
            onClick={onLock}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm border hover:bg-red-500/10 border-red-500/30 text-red-400 active:scale-95"
            aria-label="Lock Vault Now"
            title="Lock Vault"
          >
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Lock</span>
          </button>
        </div>
      </div>
    </header>
  );
};
