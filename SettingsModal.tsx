import React, { useState } from 'react';
import {
  X, Shield, Moon, Sun, Smartphone, EyeOff, Lock, Clock, HardDrive,
  Download, Upload, AlertTriangle, KeyRound, Camera, Trash2, Check,
  Info, MessageSquare, ShieldAlert, Sparkles, RefreshCw
} from 'lucide-react';
import { IntruderLog, ThemeMode, VaultData, VaultSettings } from '../types/vault';
import { exportVaultBackup, clearIntruderLogs } from '../utils/storage';
import { hashPassword, validateRecoveryKey, validateRecoveryWords } from '../utils/security';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VaultSettings;
  vaultData: VaultData;
  intruderLogs: IntruderLog[];
  onUpdateSettings: (newSettings: Partial<VaultSettings>) => void;
  onRestoreBackup: (restoredData: VaultData) => void;
  onClearLogs: () => void;
  onEmergencyWipe: () => void;
  initialTab?: 'general' | 'security' | 'intruder';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  vaultData,
  intruderLogs,
  onUpdateSettings,
  onRestoreBackup,
  onClearLogs,
  onEmergencyWipe,
  initialTab = 'general',
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'intruder' | 'about'>(initialTab);

  // Forms state
  const [currentPasswordInput, setCurrentPasswordInput] = useState<string>('');
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState<string>('');
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Fake vault password state
  const [fakePassInput, setFakePassInput] = useState<string>('');
  const [fakePassStatus, setFakePassStatus] = useState<string>('');

  // Modals state
  const [showCredentialsModal, setShowCredentialsModal] = useState<boolean>(false);
  const [showWipeConfirmModal, setShowWipeConfirmModal] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [copiedCreds, setCopiedCreds] = useState<boolean>(false);

  if (!isOpen) return null;

  // Change master password handler
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeStatus(null);

    const hashedCurrent = hashPassword(currentPasswordInput);
    if (hashedCurrent !== settings.passwordHash) {
      setPasswordChangeStatus({ type: 'error', message: 'Current master password does not match.' });
      return;
    }

    if (newPasswordInput.length < 4) {
      setPasswordChangeStatus({ type: 'error', message: 'New password must be at least 4 characters.' });
      return;
    }

    if (newPasswordInput !== confirmNewPasswordInput) {
      setPasswordChangeStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    const hashedNew = hashPassword(newPasswordInput);
    onUpdateSettings({ passwordHash: hashedNew });
    setPasswordChangeStatus({ type: 'success', message: 'Master password updated successfully!' });
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmNewPasswordInput('');
  };

  // Configure fake vault password handler
  const handleSaveFakePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fakePassInput || fakePassInput.length < 4) {
      setFakePassStatus('Fake password must be at least 4 characters.');
      return;
    }
    const hashed = hashPassword(fakePassInput);
    onUpdateSettings({
      fakeVaultEnabled: true,
      fakePasswordHash: hashed,
    });
    setFakePassStatus('Fake vault password set & active!');
    setTimeout(() => setFakePassStatus(''), 3000);
  };

  // Export full backup
  const handleDownloadBackup = () => {
    const jsonStr = exportVaultBackup(vaultData, settings);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privstack-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Restore backup
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (parsed.data && parsed.data.photos) {
          onRestoreBackup(parsed.data);
          alert('Vault data restored successfully from backup!');
        } else {
          alert('Invalid Privstack backup file format.');
        }
      } catch {
        alert('Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div
        className="w-full max-w-2xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-200"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-main)',
        }}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Privstack Settings</h2>
              <p className="text-xs text-zinc-400">Security preferences, themes, & intruder defense</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b px-6 bg-black/10 shrink-0 overflow-x-auto text-xs font-semibold" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'general' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            General & Theme
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'security' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Security & Decoy Vault
          </button>
          <button
            onClick={() => setActiveTab('intruder')}
            className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'intruder' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Intruder Defense</span>
            {intruderLogs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold">
                {intruderLogs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'about' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            About & Data Wipe
          </button>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* TAB 1: GENERAL & THEMES */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Theme Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-zinc-300">
                  Application Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'system', name: 'System Default', icon: Smartphone, desc: 'Auto follow OS' },
                    { id: 'light', name: 'Light', icon: Sun, desc: 'Clean paper aesthetic' },
                    { id: 'dark', name: 'Dark Mode', icon: Moon, desc: 'Slate & zinc' },
                    { id: 'oled', name: 'OLED Black', icon: Sparkles, desc: 'True #000 pitch-black' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => onUpdateSettings({ theme: t.id as ThemeMode })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        settings.theme === t.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm'
                          : 'border-zinc-800 bg-white/5 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <t.icon className="w-4 h-4" />
                        {settings.theme === t.id && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className="font-semibold text-xs text-zinc-200">{t.name}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Import / Export Preferences */}
              <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--border-color)' }}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Import / Export Preferences
                </h4>

                <label className="flex items-center justify-between p-3.5 rounded-xl border bg-black/10 cursor-pointer" style={{ borderColor: 'var(--border-color)' }}>
                  <div>
                    <span className="font-semibold text-xs block text-zinc-200">Delete original file on import note</span>
                    <span className="text-[11px] text-zinc-400">Display reminder after import to remove original unencrypted files</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.deleteOriginalOnImport}
                    onChange={e => onUpdateSettings({ deleteOriginalOnImport: e.target.checked })}
                    className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl border bg-black/10 cursor-pointer" style={{ borderColor: 'var(--border-color)' }}>
                  <div>
                    <span className="font-semibold text-xs block text-zinc-200">Purge memory cache on file export</span>
                    <span className="text-[11px] text-zinc-400">Clear ephemeral object URLs immediately after downloading</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.deleteCacheOnExport}
                    onChange={e => onUpdateSettings({ deleteCacheOnExport: e.target.checked })}
                    className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                </label>
              </div>

              {/* Backup & Restore */}
              <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--border-color)' }}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Vault Archive Backup & Restore
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleDownloadBackup}
                    className="p-3 rounded-xl border flex items-center justify-center space-x-2 text-xs font-semibold hover:bg-white/5 transition-colors"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Download Encrypted Archive</span>
                  </button>

                  <label className="p-3 rounded-xl border flex items-center justify-center space-x-2 text-xs font-semibold hover:bg-white/5 cursor-pointer transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span>Restore Archive From File</span>
                    <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SECURITY & FAKE VAULT */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Security Toggles */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Sensors & Anti-Capture Safeguards
                </h4>

                <label className="flex items-center justify-between p-3.5 rounded-xl border bg-black/10 cursor-pointer" style={{ borderColor: 'var(--border-color)' }}>
                  <div>
                    <span className="font-semibold text-xs block text-zinc-200">Block Screenshots & Screen Blur</span>
                    <span className="text-[11px] text-zinc-400">Blur screen on window blur or print-screen hotkeys to shield from prying eyes</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.blockScreenshots}
                    onChange={e => onUpdateSettings({ blockScreenshots: e.target.checked })}
                    className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl border bg-black/10 cursor-pointer" style={{ borderColor: 'var(--border-color)' }}>
                  <div>
                    <span className="font-semibold text-xs block text-zinc-200">Flip-to-Lock (Gyroscope / Face-Down)</span>
                    <span className="text-[11px] text-zinc-400">Immediately locks vault when device is turned upside down</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.flipToLock}
                    onChange={e => onUpdateSettings({ flipToLock: e.target.checked })}
                    className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                </label>

                {/* Auto-Lock Timer Dropdown */}
                <div className="p-3.5 rounded-xl border bg-black/10 flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                  <div>
                    <span className="font-semibold text-xs block text-zinc-200">Auto-Lock Inactivity Timer</span>
                    <span className="text-[11px] text-zinc-400">Locks vault automatically when no user activity is detected</span>
                  </div>
                  <select
                    value={settings.autoLockDuration}
                    onChange={e => onUpdateSettings({ autoLockDuration: parseInt(e.target.value) })}
                    className="px-3 py-1.5 rounded-lg border bg-zinc-900 text-xs font-semibold text-emerald-400"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <option value={0}>Off (Manual only)</option>
                    <option value={30}>30 Seconds</option>
                    <option value={60}>1 Minute</option>
                    <option value={300}>5 Minutes</option>
                  </select>
                </div>
              </div>

              {/* FAKE VAULT CONFIGURATION */}
              <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">
                      Fake Vault (Decoy Safe)
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Opening Privstack with this secondary decoy password opens an innocuous alternative vault under coercion.
                    </p>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.fakeVaultEnabled}
                      onChange={e => onUpdateSettings({ fakeVaultEnabled: e.target.checked })}
                      className="w-5 h-5 rounded accent-purple-500 cursor-pointer"
                      aria-label="Enable Fake Vault"
                    />
                    <span className="text-xs font-semibold text-purple-300">
                      {settings.fakeVaultEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>

                {settings.fakeVaultEnabled && (
                  <form onSubmit={handleSaveFakePassword} className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-purple-300 mb-1">
                        Configure Decoy Vault Password
                      </label>
                      <input
                        type="password"
                        value={fakePassInput}
                        onChange={e => setFakePassInput(e.target.value)}
                        placeholder="Enter secondary decoy password..."
                        className="w-full px-3 py-2 rounded-lg border bg-black/40 text-xs text-white focus:outline-none focus:border-purple-400"
                        style={{ borderColor: 'var(--border-color)' }}
                      />
                    </div>
                    {fakePassStatus && (
                      <p className="text-xs text-purple-300 font-medium">{fakePassStatus}</p>
                    )}
                    <button
                      type="submit"
                      disabled={!fakePassInput}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white shadow"
                    >
                      Update Fake Vault Password
                    </button>
                  </form>
                )}
              </div>

              {/* CHANGE MASTER PASSWORD */}
              <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--border-color)' }}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Change Master Password
                </h4>
                {passwordChangeStatus && (
                  <div className={`p-3 rounded-xl text-xs font-medium ${
                    passwordChangeStatus.type === 'error'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {passwordChangeStatus.message}
                  </div>
                )}
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <input
                    type="password"
                    value={currentPasswordInput}
                    onChange={e => setCurrentPasswordInput(e.target.value)}
                    placeholder="Current Master Password"
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-black/20 text-xs focus:outline-none focus:border-emerald-500"
                    style={{ borderColor: 'var(--border-color)' }}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="password"
                      value={newPasswordInput}
                      onChange={e => setNewPasswordInput(e.target.value)}
                      placeholder="New Master Password"
                      className="w-full px-3.5 py-2.5 rounded-xl border bg-black/20 text-xs focus:outline-none focus:border-emerald-500"
                      style={{ borderColor: 'var(--border-color)' }}
                    />
                    <input
                      type="password"
                      value={confirmNewPasswordInput}
                      onChange={e => setConfirmNewPasswordInput(e.target.value)}
                      placeholder="Confirm New Password"
                      className="w-full px-3.5 py-2.5 rounded-xl border bg-black/20 text-xs focus:outline-none focus:border-emerald-500"
                      style={{ borderColor: 'var(--border-color)' }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow"
                  >
                    Save New Master Password
                  </button>
                </form>
              </div>

              {/* View Recovery Credentials Modal Trigger */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowCredentialsModal(true)}
                  className="w-full py-2.5 px-3 rounded-xl border border-zinc-700 hover:bg-white/5 text-xs font-semibold flex items-center justify-center space-x-2 text-zinc-300"
                >
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  <span>View Secret Recovery Credentials</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: INTRUDER DEFENSE */}
          {activeTab === 'intruder' && (
            <div className="space-y-6">
              {/* Intruder Settings */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Breach Response Rules
                </h4>

                {/* Max Attempts */}
                <div className="p-3.5 rounded-xl border bg-black/10 flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                  <div>
                    <span className="font-semibold text-xs block text-zinc-200">Max Failed Login Attempts</span>
                    <span className="text-[11px] text-zinc-400">Threshold before triggering defense actions</span>
                  </div>
                  <select
                    value={settings.maxAttempts}
                    onChange={e => onUpdateSettings({ maxAttempts: parseInt(e.target.value) })}
                    className="px-3 py-1.5 rounded-lg border bg-zinc-900 text-xs font-semibold text-red-400"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <option value={3}>3 Attempts</option>
                    <option value={5}>5 Attempts</option>
                    <option value={10}>10 Attempts</option>
                  </select>
                </div>

                {/* Actions Checkboxes */}
                <div className="space-y-2 pt-1">
                  <label className="flex items-center space-x-3 p-3 rounded-xl border bg-black/10 cursor-pointer" style={{ borderColor: 'var(--border-color)' }}>
                    <input
                      type="checkbox"
                      checked={settings.intruderLockdown}
                      onChange={e => onUpdateSettings({ intruderLockdown: e.target.checked })}
                      className="rounded accent-red-500 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-semibold block text-zinc-200">Timed Vault Lockdown</span>
                      <span className="text-[10px] text-zinc-400">Lock vault interface for 30 seconds upon breach</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 rounded-xl border bg-black/10 cursor-pointer" style={{ borderColor: 'var(--border-color)' }}>
                    <input
                      type="checkbox"
                      checked={settings.intruderSelfie}
                      onChange={e => onUpdateSettings({ intruderSelfie: e.target.checked })}
                      className="rounded accent-red-500 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-semibold block text-zinc-200">Capture Intruder Selfie Snapshot</span>
                      <span className="text-[10px] text-zinc-400">Secretly snaps webcam or simulated photo to intruder log</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 rounded-xl border bg-black/10 cursor-pointer" style={{ borderColor: 'var(--border-color)' }}>
                    <input
                      type="checkbox"
                      checked={settings.intruderAlert}
                      onChange={e => onUpdateSettings({ intruderAlert: e.target.checked })}
                      className="rounded accent-red-500 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-semibold block text-zinc-200">Security Alert Banner On Re-login</span>
                      <span className="text-[10px] text-zinc-400">Notifies you immediately on dashboard after an attempted breach</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Intruder Logs List */}
              <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Captured Intruder Logs ({intruderLogs.length})</span>
                  </h4>
                  {intruderLogs.length > 0 && (
                    <button
                      onClick={onClearLogs}
                      className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
                    >
                      Clear Logs
                    </button>
                  )}
                </div>

                {intruderLogs.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-xl" style={{ borderColor: 'var(--border-color)' }}>
                    <Shield className="w-8 h-8 mx-auto text-emerald-400/40 mb-1" />
                    <p className="text-xs text-zinc-400">No unauthorized breach attempts detected. Your vault is safe!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {intruderLogs.map(log => (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center space-x-3"
                      >
                        {log.photoUrl ? (
                          <img
                            src={log.photoUrl}
                            alt="Intruder Snapshot"
                            className="w-16 h-12 rounded-lg object-cover border border-red-500/30 shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-12 rounded-lg bg-red-950 border border-red-500/30 flex items-center justify-center shrink-0 text-red-400">
                            <Camera className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex-1 truncate">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-red-300">
                              Breach Attempt #{log.attemptCount}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-300 truncate mt-0.5">{log.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ABOUT & DATA WIPE */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border bg-black/10 space-y-2" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-bold text-sm text-zinc-100">Privstack Vault v1.0.0</h4>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Engineered with zero-knowledge local client encryption principles. All photos, videos, audio notes, and configuration remain 100% stored in your browser's persistent localStorage sandbox. No server requests, no tracking analytics, no cloud backdoors.
                </p>
                <div className="pt-2 flex items-center space-x-3 text-xs text-zinc-400">
                  <button
                    onClick={() => setShowFeedbackModal(true)}
                    className="flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send Local Feedback</span>
                  </button>
                </div>
              </div>

              {/* EMERGENCY DATA WIPE SECTION */}
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 space-y-3">
                <div className="flex items-center space-x-2 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  <h4 className="font-bold text-sm">Emergency Data Wipe</h4>
                </div>
                <p className="text-xs text-red-200/80 leading-relaxed">
                  In case of immediate duress or device seizure, execute an instant irreversible wipe. This permanently flushes all photos, audio, videos, notes, logs, and passwords from localStorage.
                </p>
                <button
                  type="button"
                  onClick={() => setShowWipeConfirmModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Execute Emergency Data Wipe</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RECOVERY CREDENTIALS MODAL */}
      {showCredentialsModal && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-2xl"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">Your Recovery Credentials</h3>
              </div>
              <button onClick={() => setShowCredentialsModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl border bg-black/30" style={{ borderColor: 'var(--border-color)' }}>
              {settings.recoveryType === 'key' ? (
                <div className="text-center py-3">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">Master Recovery Key</span>
                  <div className="text-xl font-mono font-bold text-emerald-400 mt-2 select-all">
                    {settings.recoveryKey}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-mono max-h-52 overflow-y-auto">
                  {settings.recoveryPhrase.map((w, idx) => (
                    <div key={idx} className="p-1.5 rounded bg-black/40 border border-zinc-800 flex items-center space-x-1">
                      <span className="text-zinc-500 text-[10px] w-4">{idx + 1}.</span>
                      <span className="text-zinc-200 font-semibold">{w}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  const text = settings.recoveryType === 'key' ? settings.recoveryKey : settings.recoveryPhrase.join(' ');
                  navigator.clipboard.writeText(text);
                  setCopiedCreds(true);
                  setTimeout(() => setCopiedCreds(false), 2000);
                }}
                className="mt-3 w-full py-2 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 hover:bg-white/5 transition-colors"
                style={{ borderColor: 'var(--border-color)' }}
              >
                {copiedCreds ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <span>Copy Credentials</span>
                )}
              </button>
            </div>

            <button
              onClick={() => setShowCredentialsModal(false)}
              className="w-full py-2.5 rounded-xl border text-xs font-semibold hover:bg-white/5"
              style={{ borderColor: 'var(--border-color)' }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* EMERGENCY WIPE CONFIRMATION MODAL */}
      {showWipeConfirmModal && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border-2 border-red-500 p-6 space-y-4 shadow-2xl bg-zinc-950 text-white">
            <div className="flex items-center space-x-3 text-red-500">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
              <div>
                <h3 className="text-base font-bold">PERMANENT DATA WIPE</h3>
                <p className="text-xs text-red-400">Irreversible Action</p>
              </div>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              This will instantly erase ALL media, photos, audio tracks, notes, passwords, and intruder logs from this browser. You cannot undo this.
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowWipeConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-xs font-semibold hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowWipeConfirmModal(false);
                  onEmergencyWipe();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-600/30"
              >
                Yes, Wipe Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK MODAL */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm rounded-2xl border p-6 space-y-4 shadow-2xl"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="text-base font-bold">Vault Feedback</h3>
              <button onClick={() => setShowFeedbackModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedbackSent ? (
              <div className="text-center py-6 space-y-2">
                <Check className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold">Feedback Recorded Locally</h4>
                <p className="text-xs text-zinc-400">Thank you for helping improve Privstack security.</p>
              </div>
            ) : (
              <form onSubmit={e => {
                e.preventDefault();
                setFeedbackSent(true);
                setTimeout(() => {
                  setShowFeedbackModal(false);
                  setFeedbackSent(false);
                  setFeedbackText('');
                }, 1500);
              }} className="space-y-3">
                <textarea
                  rows={4}
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="Share suggestions or security feedback..."
                  className="w-full p-3 rounded-xl border bg-black/20 text-xs focus:outline-none focus:border-emerald-500"
                  style={{ borderColor: 'var(--border-color)' }}
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs shadow"
                >
                  Submit Local Feedback
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
