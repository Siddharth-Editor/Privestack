import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Album, IntruderLog, MusicItem, NoteItem, PhotoItem, VideoItem,
  VaultData, VaultSettings, ThemeMode
} from './types/vault';
import {
  loadSettings, saveSettings, loadVaultData, saveVaultData,
  loadIntruderLogs, addIntruderLog, clearIntruderLogs, wipeAllData
} from './utils/storage';
import { hashPassword } from './utils/security';
import { Navbar } from './components/Navbar';
import { SetupWizard } from './components/SetupWizard';
import { LoginScreen } from './components/LoginScreen';
import { VaultDashboard } from './components/VaultDashboard';
import { PicturesModule } from './components/modules/PicturesModule';
import { VideosModule } from './components/modules/VideosModule';
import { MusicModule } from './components/modules/MusicModule';
import { NotesModule } from './components/modules/NotesModule';
import { SettingsModal } from './components/SettingsModal';
import { Shield, EyeOff, Lock } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<VaultSettings>(() => loadSettings());
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isFakeVault, setIsFakeVault] = useState<boolean>(false);
  const [vaultData, setVaultData] = useState<VaultData>(() => loadVaultData(false));
  const [intruderLogs, setIntruderLogs] = useState<IntruderLog[]>(() => loadIntruderLogs());
  const [currentView, setCurrentView] = useState<'dashboard' | 'pictures' | 'videos' | 'music' | 'notes'>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'general' | 'security' | 'intruder'>('general');
  const [isShieldActive, setIsShieldActive] = useState<boolean>(false);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-start query parameter support (?autostart=1)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autostart') === '1') {
      if (!settings.isSetupComplete) {
        const autoPass = 'pass1234';
        const updated: VaultSettings = {
          ...settings,
          isSetupComplete: true,
          passwordHash: hashPassword(autoPass),
          fakeVaultEnabled: true,
          fakePasswordHash: hashPassword('fake0000'),
        };
        saveSettings(updated);
        setSettings(updated);
      }
      setIsUnlocked(true);
      setIsFakeVault(false);
    }
  }, []);

  // Sync theme to root HTML document element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark', 'theme-oled');

    if (settings.theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(isDark ? 'theme-dark' : 'theme-light');
    } else {
      root.classList.add(`theme-${settings.theme}`);
    }
  }, [settings.theme]);

  // Anti-Screenshot & Screen Capture Protection
  useEffect(() => {
    if (!settings.blockScreenshots) {
      setIsShieldActive(false);
      return;
    }

    const handleBlur = () => setIsShieldActive(true);
    const handleFocus = () => setIsShieldActive(false);
    const handleVisibility = () => {
      if (document.hidden) setIsShieldActive(true);
      else setIsShieldActive(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key or Ctrl+P / Cmd+Shift+3 / 4
      if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'p') || (e.metaKey && e.key === 'p')) {
        setIsShieldActive(true);
        setTimeout(() => setIsShieldActive(false), 2000);
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [settings.blockScreenshots]);

  // Flip-to-lock Sensor (DeviceOrientation API)
  useEffect(() => {
    if (!settings.flipToLock || !isUnlocked) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta !== null) {
        // When device is turned completely face down, beta is near +/- 180
        if (Math.abs(e.beta) > 150) {
          handleLock();
        }
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [settings.flipToLock, isUnlocked]);

  // Inactivity Auto-Lock Timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (!isUnlocked || settings.autoLockDuration <= 0) return;

    inactivityTimerRef.current = setTimeout(() => {
      handleLock();
    }, settings.autoLockDuration * 1000);
  }, [isUnlocked, settings.autoLockDuration]);

  useEffect(() => {
    if (!isUnlocked || settings.autoLockDuration <= 0) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(evt => window.addEventListener(evt, resetInactivityTimer));
    resetInactivityTimer();

    return () => {
      events.forEach(evt => window.removeEventListener(evt, resetInactivityTimer));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [isUnlocked, settings.autoLockDuration, resetInactivityTimer]);

  // Save changes to settings
  const handleUpdateSettings = (updates: Partial<VaultSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    saveSettings(updated);
  };

  // Lock Vault
  const handleLock = () => {
    setIsUnlocked(false);
    setIsSettingsOpen(false);
    setCurrentView('dashboard');
  };

  // Login Success
  const handleLoginSuccess = (isFake: boolean) => {
    setIsFakeVault(isFake);
    const data = loadVaultData(isFake);
    setVaultData(data);
    setIsUnlocked(true);
    setCurrentView('dashboard');
  };

  // Add Intruder Log
  const handleAddIntruderLog = (log: IntruderLog) => {
    const updated = addIntruderLog(log);
    setIntruderLogs(updated);
  };

  // Clear Intruder Logs
  const handleClearLogs = () => {
    clearIntruderLogs();
    setIntruderLogs([]);
  };

  // Emergency Wipe All Data
  const handleEmergencyWipe = () => {
    wipeAllData();
    setSettings(loadSettings());
    setIsUnlocked(false);
    setIsFakeVault(false);
    setVaultData(loadVaultData(false));
    setIntruderLogs([]);
    setCurrentView('dashboard');
    setIsSettingsOpen(false);
  };

  // Save vault data changes to localStorage
  const updateVaultData = (updater: (prev: VaultData) => VaultData) => {
    setVaultData(prev => {
      const next = updater(prev);
      saveVaultData(next, isFakeVault);
      return next;
    });
  };

  // Photos & Albums actions
  const handleAddAlbum = (name: string) => {
    const newAlbum: Album = {
      id: `alb-${Date.now()}`,
      name,
      createdAt: Date.now(),
    };
    updateVaultData(prev => ({
      ...prev,
      albums: [...prev.albums, newAlbum],
    }));
  };

  const handleImportPhotos = (newPhotos: PhotoItem[]) => {
    updateVaultData(prev => ({
      ...prev,
      photos: [...newPhotos, ...prev.photos],
    }));
  };

  const handleUpdatePhoto = (photo: PhotoItem) => {
    updateVaultData(prev => ({
      ...prev,
      photos: prev.photos.map(p => (p.id === photo.id ? photo : p)),
    }));
  };

  const handleDeletePhoto = (photoId: string) => {
    updateVaultData(prev => ({
      ...prev,
      photos: prev.photos.filter(p => p.id !== photoId),
    }));
  };

  const handleDeleteAlbum = (albumId: string) => {
    updateVaultData(prev => ({
      ...prev,
      albums: prev.albums.filter(a => a.id !== albumId),
      photos: prev.photos.map(p => (p.albumId === albumId ? { ...p, albumId: prev.albums[0]?.id || 'alb-personal' } : p)),
    }));
  };

  // Videos actions
  const handleImportVideos = (newVideos: VideoItem[]) => {
    updateVaultData(prev => ({
      ...prev,
      videos: [...newVideos, ...prev.videos],
    }));
  };

  const handleDeleteVideo = (videoId: string) => {
    updateVaultData(prev => ({
      ...prev,
      videos: prev.videos.filter(v => v.id !== videoId),
    }));
  };

  // Music actions
  const handleImportMusic = (newItems: MusicItem[]) => {
    updateVaultData(prev => ({
      ...prev,
      music: [...newItems, ...prev.music],
    }));
  };

  const handleDeleteMusic = (musicId: string) => {
    updateVaultData(prev => ({
      ...prev,
      music: prev.music.filter(m => m.id !== musicId),
    }));
  };

  // Notes actions
  const handleSaveNote = (note: NoteItem) => {
    updateVaultData(prev => {
      const exists = prev.notes.some(n => n.id === note.id);
      if (exists) {
        return {
          ...prev,
          notes: prev.notes.map(n => (n.id === note.id ? note : n)),
        };
      }
      return {
        ...prev,
        notes: [note, ...prev.notes],
      };
    });
  };

  const handleDeleteNote = (noteId: string) => {
    updateVaultData(prev => ({
      ...prev,
      notes: prev.notes.filter(n => n.id !== noteId),
    }));
  };

  // If initial setup is not yet completed, show SetupWizard
  if (!settings.isSetupComplete) {
    return (
      <SetupWizard
        onComplete={updated => {
          handleUpdateSettings(updated);
          setIsUnlocked(true);
        }}
      />
    );
  }

  // If locked, show Login Screen
  if (!isUnlocked) {
    return (
      <LoginScreen
        settings={settings}
        onLoginSuccess={handleLoginSuccess}
        onUpdateSettings={handleUpdateSettings}
        onAddIntruderLog={handleAddIntruderLog}
      />
    );
  }

  // Unlocked Vault Interface
  return (
    <div
      className="min-h-screen flex flex-col relative transition-all"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Screen Shield Overlay when Anti-Screenshot is active */}
      {isShieldActive && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-100">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mb-4">
            <EyeOff className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Privstack Shield Active</h2>
          <p className="text-xs text-zinc-400 max-w-sm">
            Screen blurred to protect your vault from capture or prying eyes. Click anywhere to resume.
          </p>
          <button
            onClick={() => setIsShieldActive(false)}
            className="mt-6 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all"
          >
            Resume Vault Session
          </button>
        </div>
      )}

      {/* Main Top Header Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenSettings={() => {
          setSettingsInitialTab('general');
          setIsSettingsOpen(true);
        }}
        onLock={handleLock}
        isFakeVault={isFakeVault}
        unseenAlertCount={settings.unseenBreachAlert ? 1 : 0}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6">
        {currentView === 'dashboard' && (
          <VaultDashboard
            vaultData={vaultData}
            settings={settings}
            onNavigate={setCurrentView}
            onOpenSettings={tab => {
              setSettingsInitialTab(tab || 'general');
              setIsSettingsOpen(true);
            }}
            onDismissAlert={() => handleUpdateSettings({ unseenBreachAlert: false })}
            isFakeVault={isFakeVault}
          />
        )}

        {currentView === 'pictures' && (
          <PicturesModule
            albums={vaultData.albums}
            photos={vaultData.photos}
            onAddAlbum={handleAddAlbum}
            onImportPhotos={handleImportPhotos}
            onUpdatePhoto={handleUpdatePhoto}
            onDeletePhoto={handleDeletePhoto}
            onDeleteAlbum={handleDeleteAlbum}
          />
        )}

        {currentView === 'videos' && (
          <VideosModule
            videos={vaultData.videos}
            onImportVideos={handleImportVideos}
            onDeleteVideo={handleDeleteVideo}
          />
        )}

        {currentView === 'music' && (
          <MusicModule
            music={vaultData.music}
            onImportMusic={handleImportMusic}
            onDeleteMusic={handleDeleteMusic}
          />
        )}

        {currentView === 'notes' && (
          <NotesModule
            notes={vaultData.notes}
            onSaveNote={handleSaveNote}
            onDeleteNote={handleDeleteNote}
          />
        )}
      </main>

      {/* Comprehensive Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        vaultData={vaultData}
        intruderLogs={intruderLogs}
        onUpdateSettings={handleUpdateSettings}
        onRestoreBackup={restored => setVaultData(restored)}
        onClearLogs={handleClearLogs}
        onEmergencyWipe={handleEmergencyWipe}
        initialTab={settingsInitialTab}
      />
    </div>
  );
}
