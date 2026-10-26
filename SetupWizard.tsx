import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, KeyRound, Copy, Check, Camera, Compass, Database, ArrowRight, ArrowLeft } from 'lucide-react';
import { RecoveryType, VaultSettings } from '../types/vault';
import { generateRecoveryKey, generateRecoveryWords, hashPassword } from '../utils/security';

interface SetupWizardProps {
  onComplete: (updatedSettings: Partial<VaultSettings>) => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [recoveryType, setRecoveryType] = useState<RecoveryType>('key');
  const [recoveryPhrase, setRecoveryPhrase] = useState<string[]>(() => generateRecoveryWords());
  const [recoveryKey, setRecoveryKey] = useState<string>(() => generateRecoveryKey());
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [cameraPermGranted, setCameraPermGranted] = useState<boolean>(false);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Empty', color: 'bg-zinc-700' };
    let s = 0;
    if (pwd.length >= 6) s++;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;

    if (s <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (s <= 3) return { score: 2, label: 'Moderate', color: 'bg-amber-500' };
    if (s <= 4) return { score: 3, label: 'Strong', color: 'bg-emerald-400' };
    return { score: 4, label: 'Very Strong', color: 'bg-emerald-500' };
  };

  const handleCopyRecovery = () => {
    const textToCopy = recoveryType === 'words' ? recoveryPhrase.join(' ') : recoveryKey;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const requestCameraPermission = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Stop stream immediately after permission is confirmed
        stream.getTracks().forEach(track => track.stop());
        setCameraPermGranted(true);
      } else {
        setCameraPermGranted(true);
      }
    } catch {
      // User declined or unavailable, simulated selfie fallback enabled
      setCameraPermGranted(false);
    }
  };

  const handlePasswordNext = () => {
    setError('');
    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }
    setStep(4);
  };

  const handleFinishSetup = () => {
    const hashed = hashPassword(password);
    onComplete({
      isSetupComplete: true,
      passwordHash: hashed,
      recoveryType,
      recoveryPhrase,
      recoveryKey,
      failedAttempts: 0,
      lockdownUntil: null,
    });
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl p-6 sm:p-8 transition-all"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-main)',
        }}
      >
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">Setup Wizard</span>
              <h2 className="text-sm font-semibold text-zinc-400">Step {step} of 4</h2>
            </div>
          </div>
          <div className="flex space-x-1.5">
            {[1, 2, 3, 4].map(num => (
              <div
                key={num}
                className={`h-2 rounded-full transition-all ${
                  num === step ? 'w-6 bg-emerald-500' : num < step ? 'w-2 bg-emerald-700' : 'w-2 bg-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: WELCOME */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
                <Shield className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome to Privstack</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Your private, client-side digital vault. No cloud servers, no account required, 100% stored securely in your browser.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border flex items-start space-x-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold">Zero-Cloud Encryption</h4>
                  <p className="text-xs text-zinc-400">All photos, videos, audio, and secret notes remain strictly on your local device.</p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl border flex items-start space-x-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <Camera className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold">Intruder Defense & Decoy Vault</h4>
                  <p className="text-xs text-zinc-400">Capture intruder selfies on unauthorized attempts, plus a secondary Fake Vault for coercion.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 px-4 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: PERMISSIONS INFO */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Device Permissions</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Privstack uses modern browser APIs to protect your vault. You can review or configure these anytime in Settings.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border flex items-center justify-between" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Camera Access (Intruder Snapshot)</h4>
                    <p className="text-xs text-zinc-400">Captures a selfie if an unauthorized user attempts to breach your vault.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={requestCameraPermission}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    cameraPermGranted
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-white/5 hover:bg-white/10 text-zinc-200 border-zinc-700'
                  }`}
                >
                  {cameraPermGranted ? 'Granted' : 'Enable'}
                </button>
              </div>

              <div className="p-4 rounded-xl border flex items-center justify-between" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Flip-to-Lock (Orientation)</h4>
                    <p className="text-xs text-zinc-400">Instantly locks the vault when device is turned face-down.</p>
                  </div>
                </div>
                <span className="text-xs text-emerald-400 font-medium px-2.5 py-1 rounded bg-emerald-500/10">Ready</span>
              </div>

              <div className="p-4 rounded-xl border flex items-center justify-between" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Local Storage Persistence</h4>
                    <p className="text-xs text-zinc-400">Stores media & credentials in your browser's persistent sandbox.</p>
                  </div>
                </div>
                <span className="text-xs text-emerald-400 font-medium px-2.5 py-1 rounded bg-emerald-500/10">Active</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-xl font-semibold border hover:bg-white/5 transition-all text-zinc-300"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-3 px-4 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-500/20"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: MASTER PASSWORD CREATION */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Create Master Password</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                This password protects your vault. Privstack does not store plaintext passwords.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-300">
                  Master Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter strong password"
                    className="w-full px-4 py-3 rounded-xl border bg-black/20 focus:outline-none focus:border-emerald-500 text-sm transition-all pr-12"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
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

                {/* Password strength meter */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center text-[11px] text-zinc-400">
                      <span>Strength</span>
                      <span className="font-medium text-zinc-200">{strength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: `${(strength.score / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm master password"
                    className="w-full px-4 py-3 rounded-xl border bg-black/20 focus:outline-none focus:border-emerald-500 text-sm transition-all pr-12"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-200"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3 px-4 rounded-xl font-semibold border hover:bg-white/5 transition-all text-zinc-300"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handlePasswordNext}
                className="flex-1 py-3 px-4 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-500/20"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: RECOVERY CREDENTIALS SELECTION */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Set Recovery Method</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                If you forget your master password, this is the only way to recover your vault. Store it securely.
              </p>
            </div>

            {/* Toggle Recovery Format */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <button
                type="button"
                onClick={() => setRecoveryType('key')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  recoveryType === 'key' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Master Recovery Key
              </button>
              <button
                type="button"
                onClick={() => setRecoveryType('words')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  recoveryType === 'words' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                20 Secret Words
              </button>
            </div>

            {/* Content Box */}
            <div className="p-4 rounded-xl border relative" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              {recoveryType === 'key' ? (
                <div className="text-center py-4">
                  <span className="text-xs uppercase tracking-widest text-zinc-400 font-mono">Format: PH-XXXX-XXXX</span>
                  <div className="text-2xl font-mono font-bold tracking-wider text-emerald-400 mt-2 select-all">
                    {recoveryKey}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono max-h-56 overflow-y-auto p-1">
                  {recoveryPhrase.map((word, idx) => (
                    <div key={idx} className="p-2 rounded bg-black/30 border border-zinc-800 flex items-center space-x-1.5">
                      <span className="text-zinc-500 text-[10px] w-4">{idx + 1}.</span>
                      <span className="font-semibold text-zinc-200">{word}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopyRecovery}
                className="mt-3 w-full py-2.5 px-3 rounded-lg border flex items-center justify-center space-x-2 text-xs font-medium bg-white/5 hover:bg-white/10 transition-all text-zinc-200"
                style={{ borderColor: 'var(--border-color)' }}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-zinc-400" />
                    <span>Copy Recovery Credentials</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start space-x-2">
              <KeyRound className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Privstack cannot restore lost passwords without this credential. Keep a paper or password-manager copy.</span>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="py-3 px-4 rounded-xl font-semibold border hover:bg-white/5 transition-all text-zinc-300"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleFinishSetup}
                className="flex-1 py-3 px-4 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-500/25"
              >
                <Shield className="w-4 h-4" />
                <span>Complete Setup & Unlock Vault</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
