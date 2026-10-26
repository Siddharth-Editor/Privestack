export type RecoveryType = 'words' | 'key';
export type ThemeMode = 'system' | 'light' | 'dark' | 'oled';

export interface Album {
  id: string;
  name: string;
  coverImage?: string;
  createdAt: number;
}

export interface PhotoItem {
  id: string;
  albumId: string;
  title: string;
  dataUrl: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  pinned?: boolean;
  dateAdded: number;
}

export interface VideoItem {
  id: string;
  title: string;
  dataUrl: string;
  size: number;
  mimeType: string;
  duration?: number;
  thumbnail?: string;
  pinned?: boolean;
  dateAdded: number;
}

export interface MusicItem {
  id: string;
  title: string;
  artist: string;
  dataUrl: string;
  size: number;
  mimeType: string;
  duration?: number;
  dateAdded: number;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  updatedAt: number;
  createdAt: number;
}

export interface IntruderLog {
  id: string;
  timestamp: number;
  attemptCount: number;
  photoUrl?: string;
  reason: string;
}

export interface VaultSettings {
  isSetupComplete: boolean;
  passwordHash: string;
  recoveryType: RecoveryType;
  recoveryPhrase: string[]; // 20 words
  recoveryKey: string;      // PH-XXXX-XXXX
  fakeVaultEnabled: boolean;
  fakePasswordHash: string;
  maxAttempts: number;
  intruderLockdown: boolean;
  intruderSelfie: boolean;
  intruderAlert: boolean;
  lockdownUntil: number | null;
  failedAttempts: number;
  unseenBreachAlert: boolean;
  theme: ThemeMode;
  blockScreenshots: boolean;
  flipToLock: boolean;
  autoLockDuration: number; // in seconds, 0 = off
  deleteOriginalOnImport: boolean;
  deleteCacheOnExport: boolean;
}

export interface VaultData {
  albums: Album[];
  photos: PhotoItem[];
  videos: VideoItem[];
  music: MusicItem[];
  notes: NoteItem[];
}
