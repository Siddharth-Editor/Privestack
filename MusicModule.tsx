import React, { useState, useRef, useEffect } from 'react';
import { Music, Upload, Play, Pause, Download, Trash2, Volume2, VolumeX, SkipBack, SkipForward, Disc } from 'lucide-react';
import { MusicItem } from '../../types/vault';
import { formatFileSize, formatDuration } from '../../utils/security';

interface MusicModuleProps {
  music: MusicItem[];
  onImportMusic: (newItems: MusicItem[]) => void;
  onDeleteMusic: (musicId: string) => void;
}

export const MusicModule: React.FC<MusicModuleProps> = ({
  music,
  onImportMusic,
  onDeleteMusic,
}) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeTrack = currentTrackIndex !== null ? music[currentTrackIndex] : null;

  useEffect(() => {
    if (activeTrack && audioRef.current) {
      audioRef.current.src = activeTrack.dataUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [currentTrackIndex]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imported: MusicItem[] = [];
    let processed = 0;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // Clean title
        const cleanTitle = file.name.replace(/\.[^/.]+$/, "");
        imported.push({
          id: `music-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          title: cleanTitle,
          artist: 'Vault Audio',
          dataUrl,
          size: file.size,
          mimeType: file.type || 'audio/mp3',
          duration: 180,
          dateAdded: Date.now(),
        });
        processed++;
        if (processed === files.length) {
          onImportMusic(imported);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || activeTrack?.duration || 0);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const handleToggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      setIsMuted(false);
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handleNext = () => {
    if (music.length === 0) return;
    const nextIdx = ((currentTrackIndex ?? 0) + 1) % music.length;
    setCurrentTrackIndex(nextIdx);
  };

  const handlePrev = () => {
    if (music.length === 0) return;
    const prevIdx = ((currentTrackIndex ?? 0) - 1 + music.length) % music.length;
    setCurrentTrackIndex(prevIdx);
  };

  const handleExport = (track: MusicItem) => {
    const link = document.createElement('a');
    link.href = track.dataUrl;
    link.download = `${track.title}.wav`;
    link.click();
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleNext}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
            Encrypted Music & Voice Memos
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {music.length} tracks stored • High-fidelity local decoding
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center space-x-1.5 transition-colors shadow-md shadow-emerald-500/20"
        >
          <Upload className="w-4 h-4" />
          <span>+ Import Audio</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Track List Container */}
      {music.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-2xl" style={{ borderColor: 'var(--border-color)' }}>
          <Music className="w-12 h-12 mx-auto text-zinc-500 mb-2 opacity-50" />
          <p className="text-sm text-zinc-400">No audio tracks or voice memos in vault.</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-600"
          >
            Import Audio Files
          </button>
        </div>
      ) : (
        <div
          className="rounded-2xl border divide-y overflow-hidden shadow-sm"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
          }}
        >
          {music.map((track, idx) => {
            const isThisTrackPlaying = currentTrackIndex === idx && isPlaying;
            const isThisSelected = currentTrackIndex === idx;

            return (
              <div
                key={track.id}
                onClick={() => {
                  if (currentTrackIndex === idx) {
                    handleTogglePlay();
                  } else {
                    setCurrentTrackIndex(idx);
                  }
                }}
                className={`p-3.5 sm:p-4 flex items-center justify-between transition-colors cursor-pointer ${
                  isThisSelected ? 'bg-emerald-500/10' : 'hover:bg-white/5'
                }`}
                style={{ borderColor: 'var(--border-color)' }}
              >
                {/* Left: Play button + Title */}
                <div className="flex items-center space-x-3 truncate mr-2">
                  <div className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                    isThisTrackPlaying
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md scale-105'
                      : 'bg-white/5 border-zinc-700 text-zinc-300'
                  }`}>
                    {isThisTrackPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </div>

                  <div className="truncate">
                    <h4 className={`text-sm font-semibold truncate ${isThisSelected ? 'text-emerald-400 font-bold' : 'text-zinc-100'}`}>
                      {track.title}
                    </h4>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      {track.artist} • {formatFileSize(track.size)}
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
                    {formatDuration(track.duration || 3)}
                  </span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleExport(track);
                    }}
                    className="p-2 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-white/5 transition-colors"
                    title="Export Audio"
                    aria-label={`Export ${track.title}`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (confirm(`Delete "${track.title}" from your vault?`)) {
                        onDeleteMusic(track.id);
                        if (currentTrackIndex === idx) {
                          setCurrentTrackIndex(null);
                          setIsPlaying(false);
                        }
                      }
                    }}
                    className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete Audio"
                    aria-label={`Delete ${track.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PERSISTENT FLOATING AUDIO PLAYER BAR */}
      {activeTrack && (
        <div
          className="fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-xl p-3 sm:p-4 shadow-2xl transition-all"
          style={{
            backgroundColor: 'rgba(var(--bg-secondary), 0.95)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Track Info */}
            <div className="flex items-center space-x-3 min-w-0 sm:w-1/3">
              <div className={`w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30 shrink-0 ${
                isPlaying ? 'animate-spin' : ''
              }`} style={{ animationDuration: '8s' }}>
                <Disc className="w-5 h-5" />
              </div>
              <div className="truncate">
                <h4 className="text-sm font-bold text-white truncate">{activeTrack.title}</h4>
                <p className="text-xs text-zinc-400 truncate">{activeTrack.artist}</p>
              </div>
            </div>

            {/* Playback Controls & Scrubber */}
            <div className="flex-1 max-w-md flex flex-col items-center space-y-1">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePrev}
                  className="text-zinc-400 hover:text-white transition-colors"
                  aria-label="Previous track"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={handleTogglePlay}
                  className="p-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-transform active:scale-95 shadow"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
                </button>
                <button
                  onClick={handleNext}
                  className="text-zinc-400 hover:text-white transition-colors"
                  aria-label="Next track"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Scrubber */}
              <div className="w-full flex items-center space-x-2 text-[10px] font-mono text-zinc-400">
                <span>{formatDuration(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 3}
                  step={0.1}
                  value={currentTime}
                  onChange={handleScrub}
                  className="flex-1 accent-emerald-500 cursor-pointer h-1 rounded-lg bg-zinc-700"
                />
                <span>{formatDuration(duration || 3)}</span>
              </div>
            </div>

            {/* Volume */}
            <div className="hidden sm:flex items-center justify-end space-x-2 sm:w-1/3">
              <button
                onClick={handleToggleMute}
                className="text-zinc-400 hover:text-white"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 accent-emerald-500 cursor-pointer h-1 rounded-lg bg-zinc-700"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
