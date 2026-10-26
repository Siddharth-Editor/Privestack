import { Album, MusicItem, NoteItem, PhotoItem, VideoItem, VaultData } from '../types/vault';

// Generate lightweight, elegant vector-rendered canvas data URLs for demo media
function createSvgDataUrl(bg1: string, bg2: string, title: string, subtitle: string, iconType: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}" />
        <stop offset="100%" stop-color="${bg2}" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-opacity="0.3"/>
      </filter>
    </defs>
    <rect width="800" height="600" fill="url(#grad)" />
    <g fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5">
      <circle cx="400" cy="300" r="220" />
      <circle cx="400" cy="300" r="140" />
      <circle cx="400" cy="300" r="60" />
      <path d="M 100,500 Q 400,320 700,500" />
      <path d="M 50,450 Q 400,280 750,450" />
    </g>
    <g filter="url(#shadow)">
      <rect x="220" y="160" width="360" height="240" rx="16" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" stroke-width="2" />
      <text x="400" y="270" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" letter-spacing="1">${title}</text>
      <text x="400" y="310" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="system-ui, -apple-system, sans-serif" font-size="16">${subtitle}</text>
      <rect x="360" y="200" width="80" height="4" rx="2" fill="rgba(255,255,255,0.6)" />
    </g>
    <text x="400" y="550" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-family="monospace" font-size="13">PROTECTED BY PRIVSTACK LOCAL ENCRYPTION</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Generate simple audible Web Audio WAV byte array as base64 data URL
function generateMelodyWavDataUrl(): string {
  // 3 seconds of a gentle 440Hz / 554Hz / 659Hz major triad chord
  const sampleRate = 8000;
  const duration = 2.5;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Uint8Array(44 + numSamples);

  // RIFF header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) buffer[offset + i] = str.charCodeAt(i);
  };
  const writeUint32 = (offset: number, val: number) => {
    buffer[offset] = val & 0xff;
    buffer[offset + 1] = (val >> 8) & 0xff;
    buffer[offset + 2] = (val >> 16) & 0xff;
    buffer[offset + 3] = (val >> 24) & 0xff;
  };
  const writeUint16 = (offset: number, val: number) => {
    buffer[offset] = val & 0xff;
    buffer[offset + 1] = (val >> 8) & 0xff;
  };

  writeString(0, 'RIFF');
  writeUint32(4, 36 + numSamples);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  writeUint32(16, 16); // SubChunk1Size (PCM)
  writeUint16(20, 1);  // AudioFormat (PCM)
  writeUint16(22, 1);  // NumChannels (Mono)
  writeUint32(24, sampleRate);
  writeUint32(28, sampleRate); // ByteRate
  writeUint16(32, 1);  // BlockAlign
  writeUint16(34, 8);  // BitsPerSample
  writeString(36, 'data');
  writeUint32(40, numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Envelope fade in/out
    const env = Math.min(1, t * 2) * Math.min(1, (duration - t) * 2);
    // Chord synthesis: A4 (440), C#5 (554), E5 (659)
    const s1 = Math.sin(2 * Math.PI * 440 * t);
    const s2 = Math.sin(2 * Math.PI * 554.37 * t);
    const s3 = Math.sin(2 * Math.PI * 659.25 * t);
    const mix = (s1 + s2 * 0.7 + s3 * 0.6) / 2.3;
    const sample = Math.floor((mix * env * 0.4 + 0.5) * 255);
    buffer[44 + i] = Math.max(0, Math.min(255, sample));
  }

  // Convert Uint8Array to base64
  let binary = '';
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

export function getDefaultVaultData(): VaultData {
  const albums: Album[] = [
    { id: 'alb-personal', name: 'Personal & Family', createdAt: Date.now() - 86400000 * 3 },
    { id: 'alb-docs', name: 'ID & Documents', createdAt: Date.now() - 86400000 * 2 },
    { id: 'alb-travel', name: 'Private Travel', createdAt: Date.now() - 86400000 * 1 },
  ];

  const photos: PhotoItem[] = [
    {
      id: 'photo-1',
      albumId: 'alb-personal',
      title: 'Family Summer Retreat 2026.png',
      dataUrl: createSvgDataUrl('#1e3a8a', '#3b82f6', 'Summer Retreat', 'Lake Tahoe • Confidential', 'image'),
      size: 142000,
      mimeType: 'image/png',
      width: 800,
      height: 600,
      pinned: true,
      dateAdded: Date.now() - 3600000 * 5,
    },
    {
      id: 'photo-2',
      albumId: 'alb-docs',
      title: 'Passport & Identity Verification.png',
      dataUrl: createSvgDataUrl('#14532d', '#22c55e', 'Passport Scan', 'National ID • Encrypted', 'id'),
      size: 218000,
      mimeType: 'image/png',
      width: 800,
      height: 600,
      pinned: true,
      dateAdded: Date.now() - 3600000 * 12,
    },
    {
      id: 'photo-3',
      albumId: 'alb-travel',
      title: 'Alps Alpine Cabin Sanctuary.png',
      dataUrl: createSvgDataUrl('#4c1d95', '#a855f7', 'Alpine Hideaway', 'Switzerland • Private', 'mountain'),
      size: 185000,
      mimeType: 'image/png',
      width: 800,
      height: 600,
      pinned: false,
      dateAdded: Date.now() - 86400000,
    },
    {
      id: 'photo-4',
      albumId: 'alb-personal',
      title: 'Hardware Wallet Backup Card.png',
      dataUrl: createSvgDataUrl('#7c2d12', '#ea580c', 'Cold Storage Seed', 'Ledger Backup • Critical', 'lock'),
      size: 98000,
      mimeType: 'image/png',
      width: 800,
      height: 600,
      pinned: false,
      dateAdded: Date.now() - 86400000 * 2,
    }
  ];

  const videos: VideoItem[] = [
    {
      id: 'vid-1',
      title: 'Safe Deposit Box Walkthrough.mp4',
      // Using a valid dummy data URL for video thumbnail and player
      dataUrl: createSvgDataUrl('#0f172a', '#334155', 'Deposit Box 402', 'Walkthrough & Key Placement', 'video'),
      thumbnail: createSvgDataUrl('#0f172a', '#334155', 'Vault Key Placement', '0:45 • Private Video', 'video'),
      size: 4850000,
      mimeType: 'video/mp4',
      duration: 45,
      pinned: true,
      dateAdded: Date.now() - 86400000 * 2,
    }
  ];

  const music: MusicItem[] = [
    {
      id: 'music-1',
      title: 'Ambient Deep Focus Tone',
      artist: 'Privstack Vault Audio',
      dataUrl: generateMelodyWavDataUrl(),
      size: 20480,
      mimeType: 'audio/wav',
      duration: 3,
      dateAdded: Date.now() - 3600000 * 8,
    },
    {
      id: 'music-2',
      title: 'Private Voice Memo - Seed Backup',
      artist: 'Self Recording',
      dataUrl: generateMelodyWavDataUrl(),
      size: 20480,
      mimeType: 'audio/wav',
      duration: 3,
      dateAdded: Date.now() - 86400000 * 4,
    }
  ];

  const notes: NoteItem[] = [
    {
      id: 'note-1',
      title: 'Crypto Hardware Wallet Recovery Seeds',
      content: 'Primary Trezor 24-word backup:\n1. acoustic 2. breeze 3. coyote 4. desert 5. emerald 6. frontier\n7. glacier 8. harvest 9. ivory 10. jungle 11. kinetic 12. lagoon\n\nPIN for device: 789231\nPassphrase: stored in safety box #2',
      category: 'Security',
      pinned: true,
      createdAt: Date.now() - 86400000 * 5,
      updatedAt: Date.now() - 86400000 * 1,
    },
    {
      id: 'note-2',
      title: 'Apartment Building Gate & Lockbox Codes',
      content: 'Front gate keypad: #9842\nBasement storage unit lock: 34-12-88\nBicycle rack combination: 5541\nSpare keys located behind second bookcase on left.',
      category: 'Home',
      pinned: false,
      createdAt: Date.now() - 86400000 * 3,
      updatedAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'note-3',
      title: 'Emergency Medical & Physician Direct Lines',
      content: 'Primary Care Physician: Dr. Marcus Vance - (555) 019-2834\nBlood type: O Positive\nHealth insurance policy: BlueShield PPO #BC-9923841-A\nEmergency proxy: Sarah (555) 012-4910',
      category: 'Emergency',
      pinned: false,
      createdAt: Date.now() - 86400000 * 7,
      updatedAt: Date.now() - 86400000 * 3,
    }
  ];

  return {
    albums,
    photos,
    videos,
    music,
    notes,
  };
}

export function getFakeVaultData(): VaultData {
  return {
    albums: [
      { id: 'alb-fake-1', name: 'Wallpapers & Backgrounds', createdAt: Date.now() - 86400000 }
    ],
    photos: [
      {
        id: 'fake-photo-1',
        albumId: 'alb-fake-1',
        title: 'Minimalist Desktop Wallpaper.png',
        dataUrl: createSvgDataUrl('#334155', '#64748b', 'Standard Wallpaper', '1920x1080 • Landscape', 'image'),
        size: 89000,
        mimeType: 'image/png',
        width: 800,
        height: 600,
        pinned: false,
        dateAdded: Date.now() - 86400000,
      }
    ],
    videos: [],
    music: [],
    notes: [
      {
        id: 'fake-note-1',
        title: 'Weekly Grocery List',
        content: '- Whole milk (organic)\n- Brown eggs\n- Sourdough loaf\n- Olive oil\n- Honeycrisp apples\n- Sparking mineral water',
        category: 'Personal',
        pinned: false,
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
      }
    ],
  };
}
