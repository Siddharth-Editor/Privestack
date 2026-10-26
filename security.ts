// Wordlist for 20 secret recovery words
export const WORD_LIST: string[] = [
  'amber', 'beacon', 'canyon', 'delta', 'ember', 'falcon', 'glacier', 'harbor',
  'island', 'jungle', 'kinetic', 'lagoon', 'matrix', 'nebula', 'oasis', 'prism',
  'quartz', 'radiant', 'summit', 'timber', 'ultra', 'vortex', 'whisper', 'zenith',
  'aurora', 'breeze', 'cliff', 'dusk', 'echo', 'frost', 'grove', 'horizon',
  'ignite', 'journey', 'karma', 'lunar', 'meadow', 'nova', 'orbit', 'pulse',
  'quest', 'ripple', 'solar', 'tide', 'unity', 'valley', 'wave', 'yield',
  'zen', 'alpha', 'bravo', 'cipher', 'dynamo', 'enigma', 'flame', 'galaxy',
  'haven', 'iron', 'jupiter', 'krypton', 'legend', 'mirage', 'nexus', 'omega'
];

/**
 * Fast synchronous DJB2/FNV-1a hybrid string hash with salt
 * Provides reliable, deterministic hashed comparison for local vault passwords
 */
export function hashPassword(password: string): string {
  if (!password) return '';
  const salt = 'PRIVSTACK_SECURE_SALT_v1_';
  const str = salt + password;
  let hash1 = 5381;
  let hash2 = 0x811c9dc5;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = Math.imul(hash2 ^ char, 0x01000193);
  }

  const h1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const h2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  return `ps_${h1}${h2}`;
}

/**
 * Generates exactly 20 unique secret words
 */
export function generateRecoveryWords(): string[] {
  const shuffled = [...WORD_LIST].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 20);
}

/**
 * Generates a master recovery key formatted as PH-XXXX-XXXX
 */
export function generateRecoveryKey(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // base32 without easily confused chars (0, 1, I, O)
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `PH-${part1}-${part2}`;
}

/**
 * Validates format of recovery key PH-XXXX-XXXX
 */
export function validateRecoveryKey(inputKey: string): boolean {
  if (!inputKey) return false;
  const clean = inputKey.trim().toUpperCase();
  const regex = /^PH-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return regex.test(clean);
}

/**
 * Validates recovery words array or space-separated string
 */
export function validateRecoveryWords(inputWords: string[] | string): boolean {
  const words = Array.isArray(inputWords)
    ? inputWords
    : inputWords.trim().split(/\s+/);
  return words.length === 20 && words.every(w => w.trim().length > 1);
}

/**
 * Evaluates login attempt against master and fake vault credentials
 */
export function checkLoginAttempt(
  attemptPassword: string,
  masterHash: string,
  fakeHash: string,
  isFakeEnabled: boolean
): 'master' | 'fake' | 'invalid' {
  if (!attemptPassword) return 'invalid';
  const hashed = hashPassword(attemptPassword);

  if (masterHash && hashed === masterHash) {
    return 'master';
  }

  if (isFakeEnabled && fakeHash && hashed === fakeHash) {
    return 'fake';
  }

  return 'invalid';
}

/**
 * Returns remaining seconds in lockdown, or 0 if lockdown expired or inactive
 */
export function calculateLockdownRemaining(lockdownUntil: number | null, now: number = Date.now()): number {
  if (!lockdownUntil) return 0;
  const diff = Math.ceil((lockdownUntil - now) / 1000);
  return diff > 0 ? diff : 0;
}

/**
 * Formats bytes into human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Formats seconds into mm:ss
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
