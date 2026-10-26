import React, { useState, useRef } from 'react';
import { Video, Upload, Play, Pause, Download, Trash2, Info, X, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { VideoItem } from '../../types/vault';
import { formatFileSize, formatDuration } from '../../utils/security';

interface VideosModuleProps {
  videos: VideoItem[];
  onImportVideos: (newVideos: VideoItem[]) => void;
  onDeleteVideo: (videoId: string) => void;
}

export const VideosModule: React.FC<VideosModuleProps> = ({
  videos,
  onImportVideos,
  onDeleteVideo,
}) => {
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imported: VideoItem[] = [];
    let processed = 0;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        imported.push({
          id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          title: file.name,
          dataUrl,
          size: file.size,
          mimeType: file.type || 'video/mp4',
          duration: 30, // Default estimate if metadata not read
          dateAdded: Date.now(),
        });
        processed++;
        if (processed === files.length) {
          onImportVideos(imported);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleTogglePlay = () => {
    if (!videoPlayerRef.current) return;
    if (isPlaying) {
      videoPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      videoPlayerRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (!videoPlayerRef.current) return;
    setCurrentTime(videoPlayerRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoPlayerRef.current) return;
    setDuration(videoPlayerRef.current.duration || 0);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleExport = (video: VideoItem) => {
    const link = document.createElement('a');
    link.href = video.dataUrl;
    link.download = video.title || 'privstack-video.mp4';
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
            Encrypted Video Vault
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {videos.length} protected video files • In-memory sandbox player
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center space-x-1.5 transition-colors shadow-md shadow-emerald-500/20"
        >
          <Upload className="w-4 h-4" />
          <span>+ Import Videos</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Videos Grid */}
      {videos.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-2xl" style={{ borderColor: 'var(--border-color)' }}>
          <Video className="w-12 h-12 mx-auto text-zinc-500 mb-2 opacity-50" />
          <p className="text-sm text-zinc-400">No videos in your vault yet.</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-600"
          >
            Import Videos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {videos.map(video => (
            <div
              key={video.id}
              onClick={() => {
                setActiveVideo(video);
                setIsPlaying(false);
                setCurrentTime(0);
              }}
              className="group rounded-2xl border overflow-hidden cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xl flex flex-col"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
              }}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setActiveVideo(video)}
            >
              {/* Thumbnail / Video Preview */}
              <div className="h-40 bg-zinc-900 relative flex items-center justify-center overflow-hidden">
                {video.thumbnail || video.dataUrl.startsWith('data:image/') ? (
                  <img src={video.thumbnail || video.dataUrl} alt={video.title} className="w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                    <Video className="w-12 h-12 text-zinc-600" />
                  </div>
                )}
                {/* Play Badge */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/90 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                  </div>
                </div>

                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono bg-black/70 text-white backdrop-blur">
                  {formatDuration(video.duration || 45)}
                </span>
              </div>

              {/* Title & Metadata */}
              <div className="p-4 flex items-center justify-between">
                <div className="truncate mr-2">
                  <h4 className="text-sm font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors truncate">
                    {video.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {formatFileSize(video.size)} • {new Date(video.dateAdded).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setDeleteConfirmId(video.id);
                  }}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  aria-label={`Delete ${video.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FULL-SCREEN VIDEO PLAYER MODAL */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-800 bg-black/50">
            <div className="flex items-center space-x-2 truncate">
              <button
                onClick={() => setActiveVideo(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
                aria-label="Close player"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-semibold text-zinc-100 truncate">{activeVideo.title}</h3>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowDetails(true)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                aria-label="Video details"
              >
                <Info className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleExport(activeVideo)}
                className="p-2 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800"
                aria-label="Download video"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Video Player Display */}
          <div className="flex-1 relative flex items-center justify-center p-4">
            {activeVideo.dataUrl.startsWith('data:video/') ? (
              <video
                ref={videoPlayerRef}
                src={activeVideo.dataUrl}
                className="max-h-full max-w-full rounded-xl shadow-2xl"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                muted={isMuted}
                playsInline
              />
            ) : (
              <div className="text-center p-8 bg-zinc-900/60 rounded-2xl border border-zinc-800 max-w-md">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 fill-emerald-400 ml-1" />
                </div>
                <h4 className="text-base font-bold text-white mb-2">{activeVideo.title}</h4>
                <p className="text-xs text-zinc-400 mb-4">
                  Encrypted sandbox clip • {formatFileSize(activeVideo.size)}
                </p>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-emerald-500 w-1/3 animate-pulse" />
                </div>
                <span className="text-xs font-mono text-zinc-300">00:15 / 00:45</span>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="px-6 py-4 border-t border-zinc-800 bg-black/60 space-y-3">
            {/* Scrubber */}
            <div className="flex items-center space-x-3 text-xs font-mono text-zinc-400">
              <span>{formatDuration(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 45}
                value={currentTime}
                onChange={handleScrub}
                className="flex-1 accent-emerald-500 cursor-pointer h-1.5 rounded-lg bg-zinc-700"
              />
              <span>{formatDuration(duration || 45)}</span>
            </div>

            {/* Play/Pause & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleTogglePlay}
                  className="p-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-transform active:scale-95 shadow"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-slate-950 ml-0.5" />}
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-lg text-zinc-400 hover:text-white"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>

              <div className="text-xs text-zinc-400 font-mono">
                Privstack Secure Player
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO DETAILS MODAL */}
      {showDetails && activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm rounded-2xl border p-6 space-y-4 shadow-2xl"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="text-base font-bold">Video Details</h3>
              <button onClick={() => setShowDetails(false)} className="text-zinc-400 hover:text-white" aria-label="Close details">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">File Name:</span>
                <span className="font-medium text-zinc-100 max-w-[180px] truncate">{activeVideo.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">File Size:</span>
                <span className="font-medium text-zinc-100">{formatFileSize(activeVideo.size)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Format:</span>
                <span className="font-medium text-zinc-100">{activeVideo.mimeType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Added:</span>
                <span className="font-medium text-zinc-100">{new Date(activeVideo.dateAdded).toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={() => setShowDetails(false)}
              className="w-full py-2.5 rounded-xl border text-xs font-semibold hover:bg-white/5"
              style={{ borderColor: 'var(--border-color)' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/30 p-6 space-y-4 shadow-2xl bg-zinc-950">
            <h3 className="text-base font-bold text-white">Delete Video?</h3>
            <p className="text-xs text-zinc-300">Permanently remove this video from your local vault? This cannot be undone.</p>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteVideo(deleteConfirmId);
                  setDeleteConfirmId(null);
                  if (activeVideo?.id === deleteConfirmId) setActiveVideo(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
