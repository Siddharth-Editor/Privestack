import { IntruderLog, VaultData, VaultSettings } from '../types/vault';
import { getDefaultVaultData, getFakeVaultData } from './mediaDefaults';
import { generateRecoveryKey, generateRecoveryWords, hashPassword } from './security';

const SETTINGS_KEY = 'privstack_vault_settings_v1';
const DATA_MASTER_KEY = 'privstack_data_master_v1';
const DATA_FAKE_KEY = 'privstack_data_fake_v1';
const INTRUDER_LOGS_KEY = 'privstack_intruder_logs_v1';

export function getInitialSettings(): VaultSettings {
  return {
    isSetupComplete: false,
    passwordHash: '',
    recoveryType: 'key',
    recoveryPhrase: generateRecoveryWords(),
    recoveryKey: generateRecoveryKey(),
    fakeVaultEnabled: false,
    fakePasswordHash: '',
    maxAttempts: 3,
    intruderLockdown: true,
    intruderSelfie: true,
    intruderAlert: true,
    lockdownUntil: null,
    failedAttempts: 0,
    unseenBreachAlert: false,
    theme: 'dark',
    blockScreenshots: false,
    flipToLock: false,
    autoLockDuration: 0, // Off by default
    deleteOriginalOnImport: false,
    deleteCacheOnExport: true,
  };
}

export function loadSettings(): VaultSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return getInitialSettings();
    const parsed = JSON.parse(raw);
    return { ...getInitialSettings(), ...parsed };
  } catch (err) {
    console.error('Failed to load Privstack settings:', err);
    return getInitialSettings();
  }
}

export function saveSettings(settings: VaultSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save Privstack settings:', err);
  }
}

export function loadVaultData(isFake: boolean): VaultData {
  const key = isFake ? DATA_FAKE_KEY : DATA_MASTER_KEY;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initial = isFake ? getFakeVaultData() : getDefaultVaultData();
      saveVaultData(initial, isFake);
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load vault data:', err);
    return isFake ? getFakeVaultData() : getDefaultVaultData();
  }
}

export function saveVaultData(data: VaultData, isFake: boolean): void {
  const key = isFake ? DATA_FAKE_KEY : DATA_MASTER_KEY;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save vault data:', err);
  }
}

export function loadIntruderLogs(): IntruderLog[] {
  try {
    const raw = localStorage.getItem(INTRUDER_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addIntruderLog(log: IntruderLog): IntruderLog[] {
  try {
    const logs = loadIntruderLogs();
    const updated = [log, ...logs].slice(0, 30); // Keep last 30 logs
    localStorage.setItem(INTRUDER_LOGS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearIntruderLogs(): void {
  try {
    localStorage.removeItem(INTRUDER_LOGS_KEY);
  } catch (err) {
    console.error('Failed to clear intruder logs:', err);
  }
}

export function wipeAllData(): void {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(DATA_MASTER_KEY);
    localStorage.removeItem(DATA_FAKE_KEY);
    localStorage.removeItem(INTRUDER_LOGS_KEY);
  } catch (err) {
    console.error('Failed to wipe data:', err);
  }
}

export function exportVaultBackup(masterData: VaultData, settings: VaultSettings): string {
  const backup = {
    app: 'Privstack',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    settings: {
      theme: settings.theme,
      maxAttempts: settings.maxAttempts,
      intruderAlert: settings.intruderAlert,
      intruderLockdown: settings.intruderLockdown,
    },
    data: masterData,
  };
  return JSON.stringify(backup, null, 2);
}
