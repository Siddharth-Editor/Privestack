import React from 'react';
import { Image, Video, Music, FileText, ShieldAlert, ArrowRight, HardDrive, Lock, ShieldCheck, EyeOff, Sparkles } from 'lucide-react';
import { VaultData, VaultSettings } from '../types/vault';
import { formatFileSize } from '../utils/security';

interface VaultDashboardProps {
  vaultData: VaultData;
  settings: VaultSettings;
  onNavigate: (view: 'pictures' | 'videos' | 'music' | 'notes') => void;
  onOpenSettings: (initialTab?: 'intruder' | 'security' | 'general') => void;
  onDismissAlert: () => void;
  isFakeVault: boolean;
}

export const VaultDashboard: React.FC<VaultDashboardProps> = ({
  vaultData,
  settings,
  onNavigate,
  onOpenSettings,
  onDismissAlert,
  isFakeVault,
}) => {
  // Calculate total vault size
  const totalBytes =
    vaultData.photos.reduce((acc, p) => acc + (p.size || 0), 0) +
    vaultData.videos.reduce((acc, v) => acc + (v.size || 0), 0) +
    vaultData.music.reduce((acc, m) => acc + (m.size || 0), 0) +
    vaultData.notes.reduce((acc, n) => acc + (n.content?.length || 0) * 2, 0);

  const totalItems =
    vaultData.photos.length +
    vaultData.videos.length +
    vaultData.music.length +
    vaultData.notes.length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Security Alert Banner upon breach */}
      {settings.unseenBreachAlert && (
        <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-red-500/10">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-300">⚠️ Security Alert: Unauthorized Access Attempt</h4>
              <p className="text-xs text-red-300/80 mt-0.5">
                Privstack detected failed login attempts. An intruder log with snapshot was recorded.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => onOpenSettings('intruder')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition-all shadow"
            >
              View Intruder Logs
            </button>
            <button
              onClick={onDismissAlert}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/30 text-red-300 hover:bg-red-500/10 transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Vault Status Overview Banner */}
      <div
        className="p-5 sm:p-6 rounded-2xl border relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
              {isFakeVault ? 'Decoy Vault (Active)' : 'Master Vault Storage'}
            </h2>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            All files encrypted locally in client storage. Zero server uploads.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-medium">
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Client-Side AES Sandbox</span>
            </span>
            {settings.fakeVaultEnabled && (
              <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center space-x-1">
                <EyeOff className="w-3.5 h-3.5" />
                <span>Fake Vault Armed</span>
              </span>
            )}
            {settings.blockScreenshots && (
              <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Anti-Screenshot On
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-6 sm:border-l sm:pl-6 shrink-0" style={{ borderColor: 'var(--border-color)' }}>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">Total Stored</span>
            <div className="text-xl font-bold text-emerald-400">{totalItems} Files</div>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">Storage Used</span>
            <div className="text-xl font-bold text-zinc-200">{formatFileSize(totalBytes)}</div>
          </div>
        </div>
      </div>

      {/* 4 Main Visual Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. PICTURES & ALBUMS */}
        <div
          onClick={() => onNavigate('pictures')}
          className="group p-5 rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
          }}
          role="button"
          tabIndex={0}
          aria-label="Open Pictures and Albums"
          onKeyDown={e => e.key === 'Enter' && onNavigate('pictures')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Image className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300">
              {vaultData.albums.length} Albums
            </span>
          </div>

          <h3 className="text-lg font-bold group-hover:text-blue-400 transition-colors" style={{ color: 'var(--text-main)' }}>
            Pictures & Albums
          </h3>
          <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>
            Encrypted photo library with custom albums, full-screen lightbox, and EXIF detail inspection.
          </p>

          <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <span className="text-xs font-semibold text-zinc-400">
              {vaultData.photos.length} Photos Stored
            </span>
            <div className="flex items-center space-x-1 text-xs font-semibold text-blue-400 group-hover:translate-x-1 transition-transform">
              <span>Open Library</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 2. VIDEOS */}
        <div
          onClick={() => onNavigate('videos')}
          className="group p-5 rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
          }}
          role="button"
          tabIndex={0}
          aria-label="Open Videos Library"
          onKeyDown={e => e.key === 'Enter' && onNavigate('videos')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
              <Video className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300">
              {vaultData.videos.length} Videos
            </span>
          </div>

          <h3 className="text-lg font-bold group-hover:text-purple-400 transition-colors" style={{ color: 'var(--text-main)' }}>
            Private Videos
          </h3>
          <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>
            Protected video player with scrub controls, format details, and isolated browser playback.
          </p>

          <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <span className="text-xs font-semibold text-zinc-400">
              Playable Media
            </span>
            <div className="flex items-center space-x-1 text-xs font-semibold text-purple-400 group-hover:translate-x-1 transition-transform">
              <span>Watch Videos</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 3. MUSIC */}
        <div
          onClick={() => onNavigate('music')}
          className="group p-5 rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
          }}
          role="button"
          tabIndex={0}
          aria-label="Open Music and Audio"
          onKeyDown={e => e.key === 'Enter' && onNavigate('music')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 group-hover:scale-110 transition-transform">
              <Music className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300">
              {vaultData.music.length} Tracks
            </span>
          </div>

          <h3 className="text-lg font-bold group-hover:text-pink-400 transition-colors" style={{ color: 'var(--text-main)' }}>
            Audio & Recordings
          </h3>
          <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>
            Private voice memos, confidential songs, and audio tracks with interactive player bar.
          </p>

          <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <span className="text-xs font-semibold text-zinc-400">
              Audio Player Ready
            </span>
            <div className="flex items-center space-x-1 text-xs font-semibold text-pink-400 group-hover:translate-x-1 transition-transform">
              <span>Listen Now</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 4. SECRET NOTES */}
        <div
          onClick={() => onNavigate('notes')}
          className="group p-5 rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
          }}
          role="button"
          tabIndex={0}
          aria-label="Open Secret Notes"
          onKeyDown={e => e.key === 'Enter' && onNavigate('notes')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300">
              {vaultData.notes.length} Notes
            </span>
          </div>

          <h3 className="text-lg font-bold group-hover:text-emerald-400 transition-colors" style={{ color: 'var(--text-main)' }}>
            Secret Notes
          </h3>
          <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>
            Encrypted memos, recovery seeds, door codes, and passwords with pinning and categorization.
          </p>

          <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <span className="text-xs font-semibold text-zinc-400">
              {vaultData.notes.filter(n => n.pinned).length} Pinned Notes
            </span>
            <div className="flex items-center space-x-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>View Notes</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
