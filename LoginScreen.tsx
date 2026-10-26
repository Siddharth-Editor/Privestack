import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, Eye, EyeOff, KeyRound, AlertTriangle, Clock, RefreshCw, X } from 'lucide-react';
import { IntruderLog, VaultSettings } from '../types/vault';
import { checkLoginAttempt, calculateLockdownRemaining, hashPassword, validateRecoveryKey, validateRecoveryWords } from '../utils/security';

interface LoginScreenProps {
  settings: VaultSettings;
  onLoginSuccess: (isFake: boolean) => void;
  onUpdateSettings: (updates: Partial<VaultSettings>) => void;
  onAddIntruderLog: (log: IntruderLog) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  settings,
  onLoginSuccess,
  onUpdateSettings,
  onAddIntruderLog,
}) => {
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [remainingLockdown, setRemainingLockdown] = useState<number>(0);
  const [showRecoveryModal, setShowRecoveryModal] = useState<boolean>(false);
  const [recoveryInput, setRecoveryInput] = useState<string>('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState<string>('');
  const [recoveryError, setRecoveryError] = useState<string>('');
  const [recoverySuccess, setRecoverySuccess] = useState<boolean>(false);

  // Hidden video element for real camera selfie capture if permitted
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Lockdown timer countdown
  useEffect(() => {
    const checkLock = () => {
      const remaining = calculateLockdownRemaining(settings.lockdownUntil);
      setRemainingLockdown(remaining);
      if (remaining === 0 && settings.lockdownUntil !== null) {
        onUpdateSettings({ lockdownUntil: null });
      }
    };

    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, [settings.lockdownUntil]);

  // Attempt to capture selfie (real webcam or simulated intruder snapshot)
  const captureIntruderSnapshot = async (): Promise<string> => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 320, height: 240 }
        });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, 320, 240);
        }
        stream.getTracks().forEach(track => track.stop());
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        if (dataUrl && dataUrl.length > 500) {
          return dataUrl;
        }
      }
    } catch {
      // Fallback to simulated silhouette
    }

    // Simulated camera capture image
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Dark surveillance background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 320, 240);

      // Red surveillance overlay grid
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 320; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 240);
        ctx.stroke();
      }
      for (let y = 0; y < 240; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(320, y);
        ctx.stroke();
      }

      // Intruder silhouette
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(160, 90, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(160, 190, 70, 50, 0, 0, Math.PI);
      ctx.fill();

      // Stamp
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`BREACH ATTEMPT: ${new Date().toLocaleTimeString()}`, 15, 220);
    }
    return canvas.toDataURL('image/png');
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (remainingLockdown > 0) return;

    if (!password) {
      setErrorMessage('Please enter your vault password.');
      return;
    }

    const result = checkLoginAttempt(
      password,
      settings.passwordHash,
      settings.fakePasswordHash,
      settings.fakeVaultEnabled
    );

    if (result === 'master') {
      // Reset failed attempts
      onUpdateSettings({ failedAttempts: 0, lockdownUntil: null });
      onLoginSuccess(false);
    } else if (result === 'fake') {
      // Decoy fake vault unlocked!
      onLoginSuccess(true);
    } else {
      // Invalid password attempt!
      const newFailedCount = (settings.failedAttempts || 0) + 1;
      const willLockdown = settings.intruderLockdown && newFailedCount >= settings.maxAttempts;
      const lockdownDurationMs = 30000; // 30s lockdown

      let photoUrl: string | undefined = undefined;
      if (settings.intruderSelfie) {
        photoUrl = await captureIntruderSnapshot();
      }

      // Log intruder attempt
      const log: IntruderLog = {
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        attemptCount: newFailedCount,
        photoUrl,
        reason: `Failed login attempt with input "${password.slice(0, 2)}***"`
      };
      onAddIntruderLog(log);

      const updates: Partial<VaultSettings> = {
        failedAttempts: newFailedCount,
        unseenBreachAlert: settings.intruderAlert ? true : settings.unseenBreachAlert,
      };

      if (willLockdown) {
        const until = Date.now() + lockdownDurationMs;
        updates.lockdownUntil = until;
        setRemainingLockdown(Math.ceil(lockdownDurationMs / 1000));
        setErrorMessage(`Maximum attempts exceeded (${settings.maxAttempts}). Vault locked for 30s.`);
      } else {
        const remainingAttempts = settings.maxAttempts - newFailedCount;
        setErrorMessage(
          `Incorrect password. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : 'Intruder detected.'}`
        );
      }

      onUpdateSettings(updates);
    }
  };

  // Recovery modal logic
  const handleRecoverPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');

    if (!recoveryInput.trim()) {
      setRecoveryError('Please enter your recovery credential.');
      return;
    }

    if (!recoveryNewPassword || recoveryNewPassword.length < 4) {
      setRecoveryError('New password must be at least 4 characters.');
      return;
    }

    // Verify against saved recovery
    const cleanInput = recoveryInput.trim();
    let isMatch = false;

    if (settings.recoveryType === 'key') {
      isMatch = cleanInput.toUpperCase() === settings.recoveryKey.toUpperCase();
    } else {
      const inputWords = cleanInput.split(/\s+/).map(w => w.toLowerCase());
      const savedWords = settings.recoveryPhrase.map(w => w.toLowerCase());
      isMatch = inputWords.length === savedWords.length &&
        inputWords.every((word, idx) => word === savedWords[idx]);
    }

    if (!isMatch) {
      setRecoveryError('Invalid recovery credential. Please check spelling and try again.');
      return;
    }

    // Reset password
    const newHash = hashPassword(recoveryNewPassword);
    onUpdateSettings({
      passwordHash: newHash,
      failedAttempts: 0,
      lockdownUntil: null,
      unseenBreachAlert: false,
    });

    setRecoverySuccess(true);
    setTimeout(() => {
      setShowRecoveryModal(false);
      setRecoverySuccess(false);
      setRecoveryInput('');
      setRecoveryNewPassword('');
      setPassword('');
      setErrorMessage('');
    }, 1800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Container Card */}
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl p-6 sm:p-8 relative overflow-hidden transition-all"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-main)',
        }}
      >
        {/* Lockdown Banner */}
        {remainingLockdown > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 flex items-start space-x-3 animate-pulse">
            <Clock className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">Vault Lockdown Active</h4>
              <p className="text-xs mt-0.5 text-red-300">
                Multiple unauthorized attempts detected. Access blocked for{' '}
                <span className="font-mono font-bold text-sm text-white">{remainingLockdown}s</span>.
              </p>
            </div>
          </div>
        )}

        {/* Vault Icon Header */}
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Privstack Vault</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Enter your master password to decrypt vault
          </p>
        </div>

        {errorMessage && remainingLockdown === 0 && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-300">
              Master Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setErrorMessage('');
                }}
                disabled={remainingLockdown > 0}
                placeholder="Enter password..."
                className="w-full px-4 py-3 rounded-xl border bg-black/20 focus:outline-none focus:border-emerald-500 text-sm transition-all pr-12 disabled:opacity-50"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={remainingLockdown > 0 || !password}
            className="w-full py-3.5 px-4 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]"
          >
            <Lock className="w-4 h-4" />
            <span>Unlock Vault</span>
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border-color)' }}>
          <button
            type="button"
            onClick={() => {
              setShowRecoveryModal(true);
              setRecoveryError('');
            }}
            className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            Forgot Password?
          </button>

          {settings.fakeVaultEnabled && (
            <span className="text-[11px] text-zinc-500 italic">
              Dual-Vault Defense Enabled
            </span>
          )}
        </div>
      </div>

      {/* RECOVERY MODAL */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-2xl border shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)',
            }}
          >
            <button
              onClick={() => setShowRecoveryModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-200"
              aria-label="Close recovery dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-4">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Vault Recovery</h3>
                <p className="text-xs text-zinc-400">
                  {settings.recoveryType === 'key'
                    ? 'Enter your Master Recovery Key (PH-XXXX-XXXX)'
                    : 'Enter your 20 Secret Recovery Words'}
                </p>
              </div>
            </div>

            {recoverySuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center space-y-2">
                <Shield className="w-8 h-8 mx-auto" />
                <h4 className="font-bold text-sm">Master Password Reset!</h4>
                <p className="text-xs text-emerald-300">You can now unlock your vault with your new password.</p>
              </div>
            ) : (
              <form onSubmit={handleRecoverPassword} className="space-y-4">
                {recoveryError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                    {recoveryError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-300">
                    {settings.recoveryType === 'key' ? 'Master Recovery Key' : '20 Secret Words'}
                  </label>
                  {settings.recoveryType === 'key' ? (
                    <input
                      type="text"
                      value={recoveryInput}
                      onChange={e => setRecoveryInput(e.target.value)}
                      placeholder="PH-XXXX-XXXX"
                      className="w-full px-3.5 py-2.5 rounded-xl border bg-black/20 focus:outline-none focus:border-emerald-500 text-sm font-mono tracking-wider"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                    />
                  ) : (
                    <textarea
                      rows={3}
                      value={recoveryInput}
                      onChange={e => setRecoveryInput(e.target.value)}
                      placeholder="Enter the 20 words separated by spaces..."
                      className="w-full px-3.5 py-2.5 rounded-xl border bg-black/20 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-300">
                    Set New Master Password
                  </label>
                  <input
                    type="password"
                    value={recoveryNewPassword}
                    onChange={e => setRecoveryNewPassword(e.target.value)}
                    placeholder="Enter new master password"
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-black/20 focus:outline-none focus:border-emerald-500 text-sm"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(false)}
                    className="flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold hover:bg-white/5"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-colors shadow-md"
                  >
                    Reset Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
