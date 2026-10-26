import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  generateRecoveryWords,
  generateRecoveryKey,
  validateRecoveryKey,
  validateRecoveryWords,
  checkLoginAttempt,
  calculateLockdownRemaining,
  formatFileSize,
  formatDuration
} from './security';

test('hashPassword produces deterministic output and differentiates passwords', () => {
  const hash1 = hashPassword('Secret123!');
  const hash2 = hashPassword('Secret123!');
  const hash3 = hashPassword('WrongPass');

  assert.equal(typeof hash1, 'string');
  assert.equal(hash1, hash2);
  assert.notEqual(hash1, hash3);
});

test('generateRecoveryWords generates exactly 20 non-empty words', () => {
  const words = generateRecoveryWords();
  assert.equal(words.length, 20);
  assert.ok(words.every(w => typeof w === 'string' && w.length > 2));
  assert.equal(validateRecoveryWords(words), true);
  assert.equal(validateRecoveryWords('invalid short list'), false);
});

test('generateRecoveryKey generates valid format PH-XXXX-XXXX', () => {
  const key = generateRecoveryKey();
  assert.match(key, /^PH-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  assert.equal(validateRecoveryKey(key), true);
  assert.equal(validateRecoveryKey('INVALID-KEY'), false);
  assert.equal(validateRecoveryKey('PH-123-123'), false);
});

test('checkLoginAttempt routes to master, fake, or invalid correctly', () => {
  const masterHash = hashPassword('master123');
  const fakeHash = hashPassword('fake0000');

  // Master correct
  assert.equal(checkLoginAttempt('master123', masterHash, fakeHash, true), 'master');
  // Fake vault correct when enabled
  assert.equal(checkLoginAttempt('fake0000', masterHash, fakeHash, true), 'fake');
  // Fake vault fails when disabled
  assert.equal(checkLoginAttempt('fake0000', masterHash, fakeHash, false), 'invalid');
  // Wrong password
  assert.equal(checkLoginAttempt('random', masterHash, fakeHash, true), 'invalid');
});

test('calculateLockdownRemaining calculates remaining lockout duration', () => {
  const now = 1000000;
  const lockedUntil = now + 30000; // 30 seconds ahead
  assert.equal(calculateLockdownRemaining(lockedUntil, now), 30);
  assert.equal(calculateLockdownRemaining(now - 5000, now), 0);
  assert.equal(calculateLockdownRemaining(null, now), 0);
});

test('formatFileSize formats human readable file sizes', () => {
  assert.equal(formatFileSize(0), '0 B');
  assert.equal(formatFileSize(1024), '1 KB');
  assert.equal(formatFileSize(1048576), '1 MB');
  assert.equal(formatFileSize(5242880), '5 MB');
});

test('formatDuration formats mm:ss', () => {
  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatDuration(65), '1:05');
  assert.equal(formatDuration(120), '2:00');
});
