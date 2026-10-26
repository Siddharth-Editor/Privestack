import React, { useState, useRef } from 'react';
import {
  Image, FolderPlus, Upload, ChevronLeft, ChevronRight, MoreVertical,
  Pin, Download, FolderInput, Trash2, Info, X, Check, Eye, Plus, ArrowLeft
} from 'lucide-react';
import { Album, PhotoItem } from '../../types/vault';
import { formatFileSize } from '../../utils/security';

interface PicturesModuleProps {
  albums: Album[];
  photos: PhotoItem[];
  onAddAlbum: (name: string) => void;
  onImportPhotos: (newPhotos: PhotoItem[]) => void;
  onUpdatePhoto: (photo: PhotoItem) => void;
  onDeletePhoto: (photoId: string) => void;
  onDeleteAlbum: (albumId: string) => void;
}

export const PicturesModule: React.FC<PicturesModuleProps> = ({
  albums,
  photos,
  onAddAlbum,
  onImportPhotos,
  onUpdatePhoto,
  onDeletePhoto,
  onDeleteAlbum,
}) => {
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [showNewAlbumModal, setShowNewAlbumModal] = useState<boolean>(false);
  const [newAlbumName, setNewAlbumName] = useState<string>('');
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showMoveModal, setShowMoveModal] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [filterSearch, setFilterSearch] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active photos filtered by album and search
  const displayedPhotos = photos.filter(p => {
    const matchesAlbum = selectedAlbumId ? p.albumId === selectedAlbumId : true;
    const matchesSearch = filterSearch
      ? p.title.toLowerCase().includes(filterSearch.toLowerCase())
      : true;
    return matchesAlbum && matchesSearch;
  });

  const activePhoto = activePhotoIndex !== null ? displayedPhotos[activePhotoIndex] : null;

  // Handle multi-image file input import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const importedList: PhotoItem[] = [];
    let processed = 0;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new window.Image();
        img.onload = () => {
          importedList.push({
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            albumId: selectedAlbumId || albums[0]?.id || 'alb-personal',
            title: file.name,
            dataUrl,
            size: file.size,
            mimeType: file.type || 'image/jpeg',
            width: img.width,
            height: img.height,
            pinned: false,
            dateAdded: Date.now(),
          });
          processed++;
          if (processed === files.length) {
            onImportPhotos(importedList);
          }
        };
        img.onerror = () => {
          // Fallback if dimensions can't be parsed
          importedList.push({
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            albumId: selectedAlbumId || albums[0]?.id || 'alb-personal',
            title: file.name,
            dataUrl,
            size: file.size,
            mimeType: file.type || 'image/jpeg',
            pinned: false,
            dateAdded: Date.now(),
          });
          processed++;
          if (processed === files.length) {
            onImportPhotos(importedList);
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  const handleCreateAlbumSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;
    onAddAlbum(newAlbumName.trim());
    setNewAlbumName('');
    setShowNewAlbumModal(false);
  };

  const handleExport = (photo: PhotoItem) => {
    const link = document.createElement('a');
    link.href = photo.dataUrl;
    link.download = photo.title || 'privstack-secure-photo.png';
    link.click();
  };

  const handleMoveToAlbum = (destinationAlbumId: string) => {
    if (!activePhoto) return;
    onUpdatePhoto({ ...activePhoto, albumId: destinationAlbumId });
    setShowMoveModal(false);
  };

  const handleTogglePin = () => {
    if (!activePhoto) return;
    onUpdatePhoto({ ...activePhoto, pinned: !activePhoto.pinned });
    setMenuOpen(false);
  };

  const selectedAlbumObj = albums.find(a => a.id === selectedAlbumId);

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          {selectedAlbumId ? (
            <button
              onClick={() => setSelectedAlbumId(null)}
              className="p-2 rounded-xl border hover:bg-white/5 text-zinc-300"
              style={{ borderColor: 'var(--border-color)' }}
              aria-label="Back to all albums"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : null}
          <div>
            <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
              {selectedAlbumId ? selectedAlbumObj?.name || 'Album Photos' : 'Photo Vault & Albums'}
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {selectedAlbumId
                ? `${displayedPhotos.length} photo(s) in this album`
                : `${albums.length} albums • ${photos.length} total encrypted photos`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {!selectedAlbumId && (
            <button
              onClick={() => setShowNewAlbumModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 hover:bg-white/5 transition-colors"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
            >
              <FolderPlus className="w-4 h-4 text-emerald-400" />
              <span>+ New Album</span>
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center space-x-1.5 transition-colors shadow-md shadow-emerald-500/20"
          >
            <Upload className="w-4 h-4" />
            <span>+ Import Photos</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* ALBUMS VIEW (When no album is selected) */}
      {!selectedAlbumId && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {albums.map(album => {
              const albumPhotos = photos.filter(p => p.albumId === album.id);
              const cover = albumPhotos[0]?.dataUrl;

              return (
                <div
                  key={album.id}
                  onClick={() => setSelectedAlbumId(album.id)}
                  className="group rounded-2xl border overflow-hidden cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xl flex flex-col"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-color)',
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setSelectedAlbumId(album.id)}
                >
                  {/* Thumbnail / Cover */}
                  <div className="h-36 bg-zinc-900/50 relative overflow-hidden flex items-center justify-center">
                    {cover ? (
                      <img
                        src={cover}
                        alt={album.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-zinc-500 space-y-1">
                        <Image className="w-8 h-8 opacity-40" />
                        <span className="text-[11px]">Empty Album</span>
                      </div>
                    )}
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-md">
                      {albumPhotos.length} photos
                    </span>
                  </div>

                  {/* Album Info */}
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                        {album.name}
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Added {new Date(album.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {albums.length > 1 && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (confirm(`Delete album "${album.name}"? Photos will remain in your vault.`)) {
                            onDeleteAlbum(album.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Album"
                        aria-label={`Delete ${album.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick All Photos Section */}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">
              All Photos ({photos.length})
            </h3>
            {photos.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-2xl" style={{ borderColor: 'var(--border-color)' }}>
                <Image className="w-12 h-12 mx-auto text-zinc-500 mb-2 opacity-50" />
                <p className="text-sm text-zinc-400">Your photo vault is currently empty.</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                >
                  Import Photos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos.map((photo, idx) => (
                  <div
                    key={photo.id}
                    onClick={() => setActivePhotoIndex(idx)}
                    className="group aspect-square rounded-xl overflow-hidden border relative cursor-pointer hover:border-emerald-500/50 transition-all"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <img
                      src={photo.dataUrl}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {photo.pinned && (
                      <span className="absolute top-1.5 left-1.5 p-1 rounded-md bg-emerald-500/80 text-white shadow">
                        <Pin className="w-3 h-3 fill-white" />
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[11px] font-medium text-white truncate">{photo.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ALBUM DETAIL VIEW (Photos within chosen album) */}
      {selectedAlbumId && (
        <div className="space-y-4">
          {displayedPhotos.length === 0 ? (
            <div className="text-center py-16 border border-dashed rounded-2xl" style={{ borderColor: 'var(--border-color)' }}>
              <Image className="w-12 h-12 mx-auto text-zinc-500 mb-2 opacity-50" />
              <p className="text-sm text-zinc-400">No photos in this album yet.</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-600"
              >
                + Add Photos to Album
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {displayedPhotos.map((photo, idx) => (
                <div
                  key={photo.id}
                  onClick={() => setActivePhotoIndex(idx)}
                  className="group aspect-square rounded-xl overflow-hidden border relative cursor-pointer hover:border-emerald-500/50 transition-all shadow-sm"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
                >
                  <img
                    src={photo.dataUrl}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {photo.pinned && (
                    <span className="absolute top-1.5 left-1.5 p-1 rounded-md bg-emerald-500/80 text-white shadow">
                      <Pin className="w-3 h-3 fill-white" />
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[11px] font-medium text-white truncate">{photo.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FULL-SCREEN IMAGE LIGHTBOX MODAL */}
      {activePhoto !== null && activePhotoIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-800 bg-black/40">
            <button
              onClick={() => setActivePhotoIndex(null)}
              className="flex items-center space-x-1.5 text-zinc-300 hover:text-white px-2 py-1 rounded-lg transition-colors"
              aria-label="Close Lightbox"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs font-medium">Close</span>
            </button>

            <div className="text-center truncate max-w-xs sm:max-w-md px-2">
              <h3 className="text-sm font-semibold text-zinc-100 truncate">{activePhoto.title}</h3>
              <p className="text-[10px] text-zinc-400">
                {activePhotoIndex + 1} of {displayedPhotos.length}
              </p>
            </div>

            {/* Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Image options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-10 w-44 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl py-1.5 text-xs z-50">
                  <button
                    onClick={() => {
                      setShowDetailsModal(true);
                      setMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center space-x-2 text-zinc-200 hover:bg-zinc-800"
                  >
                    <Info className="w-4 h-4 text-blue-400" />
                    <span>View File Details</span>
                  </button>
                  <button
                    onClick={handleTogglePin}
                    className="w-full px-3 py-2 text-left flex items-center space-x-2 text-zinc-200 hover:bg-zinc-800"
                  >
                    <Pin className={`w-4 h-4 ${activePhoto.pinned ? 'text-amber-400 fill-amber-400' : 'text-zinc-400'}`} />
                    <span>{activePhoto.pinned ? 'Unpin Photo' : 'Pin to Top'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main View Area with Prev/Next buttons */}
          <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden select-none">
            {displayedPhotos.length > 1 && (
              <button
                onClick={() => setActivePhotoIndex((activePhotoIndex - 1 + displayedPhotos.length) % displayedPhotos.length)}
                className="absolute left-4 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all z-10"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img
              src={activePhoto.dataUrl}
              alt={activePhoto.title}
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-all duration-300"
            />

            {displayedPhotos.length > 1 && (
              <button
                onClick={() => setActivePhotoIndex((activePhotoIndex + 1) % displayedPhotos.length)}
                className="absolute right-4 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all z-10"
                aria-label="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Footer Actions: Export, Move, Delete */}
          <div className="px-4 py-3 border-t border-zinc-800 bg-black/60 flex items-center justify-center space-x-3 sm:space-x-6 text-xs">
            <button
              onClick={() => handleExport(activePhoto)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export</span>
            </button>

            <button
              onClick={() => setShowMoveModal(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
            >
              <FolderInput className="w-4 h-4 text-purple-400" />
              <span>Move to Album</span>
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* CREATE NEW ALBUM MODAL */}
      {showNewAlbumModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm rounded-2xl border p-6 space-y-4 shadow-2xl"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Create New Album</h3>
              <button onClick={() => setShowNewAlbumModal(false)} className="text-zinc-400 hover:text-white" aria-label="Close modal">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAlbumSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-zinc-300">Album Name</label>
                <input
                  type="text"
                  value={newAlbumName}
                  onChange={e => setNewAlbumName(e.target.value)}
                  placeholder="e.g. Vacation, Documents, Receipts"
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-black/20 focus:outline-none focus:border-emerald-500 text-sm"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  autoFocus
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewAlbumModal(false)}
                  className="flex-1 py-2 px-3 rounded-xl border text-xs font-semibold hover:bg-white/5"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newAlbumName.trim()}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 shadow"
                >
                  Create Album
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FILE DETAILS MODAL */}
      {showDetailsModal && activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm rounded-2xl border p-6 space-y-4 shadow-2xl"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold">Image Metadata</h3>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-zinc-400 hover:text-white" aria-label="Close details">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">File Name:</span>
                <span className="font-medium text-zinc-100 max-w-[180px] truncate">{activePhoto.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">File Size:</span>
                <span className="font-medium text-zinc-100">{formatFileSize(activePhoto.size)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Type:</span>
                <span className="font-medium text-zinc-100 uppercase">{activePhoto.mimeType}</span>
              </div>
              {activePhoto.width && activePhoto.height && (
                <div className="flex justify-between py-1 border-b border-zinc-800">
                  <span className="text-zinc-400">Dimensions:</span>
                  <span className="font-medium text-zinc-100">{activePhoto.width} × {activePhoto.height} px</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Date Added:</span>
                <span className="font-medium text-zinc-100">{new Date(activePhoto.dateAdded).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Current Album:</span>
                <span className="font-medium text-emerald-400">
                  {albums.find(a => a.id === activePhoto.albumId)?.name || 'Default'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowDetailsModal(false)}
              className="w-full py-2.5 rounded-xl border text-xs font-semibold hover:bg-white/5"
              style={{ borderColor: 'var(--border-color)' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MOVE TO ALBUM MODAL */}
      {showMoveModal && activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm rounded-2xl border p-6 space-y-4 shadow-2xl"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Move Photo to Album</h3>
              <button onClick={() => setShowMoveModal(false)} className="text-zinc-400 hover:text-white" aria-label="Close move dialog">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {albums.map(alb => (
                <button
                  key={alb.id}
                  onClick={() => handleMoveToAlbum(alb.id)}
                  className={`w-full p-3 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition-colors ${
                    activePhoto.albumId === alb.id
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                      : 'border-zinc-800 hover:bg-white/5 text-zinc-300'
                  }`}
                >
                  <span>{alb.name}</span>
                  {activePhoto.albumId === alb.id && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm rounded-2xl border border-red-500/30 p-6 space-y-4 shadow-2xl bg-zinc-950"
          >
            <div className="flex items-center space-x-3 text-red-400">
              <div className="p-2 rounded-xl bg-red-500/10">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Delete Photo?</h3>
            </div>
            <p className="text-xs text-zinc-300">
              Are you sure you want to permanently delete "{activePhoto.title}" from your vault? This cannot be undone.
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeletePhoto(activePhoto.id);
                  setShowDeleteConfirm(false);
                  setActivePhotoIndex(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold shadow"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
