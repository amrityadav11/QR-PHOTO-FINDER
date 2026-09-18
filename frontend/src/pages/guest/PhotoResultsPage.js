import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Download, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Share2, Camera, Image, CheckSquare, Square, Check
} from 'lucide-react';
import { publicAPI } from '../../services/api';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

// ─── Lightbox ─────────────────────────────────────────────────────────────────
const Lightbox = ({ photos, currentIndex, onClose, onPrev, onNext, onDownload, allowDownloads }) => {
  const photo = photos[currentIndex];
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setZoom(1); // reset zoom on photo change
  }, [currentIndex]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, onPrev, onNext]);

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in" role="dialog" aria-modal="true">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 flex-shrink-0">
        <span className="text-white/70 text-sm">{currentIndex + 1} / {photos.length}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom((z) => Math.min(3, z + 0.5))} className="p-2 text-white/70 hover:text-white" aria-label="Zoom in">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button onClick={() => setZoom((z) => Math.max(1, z - 0.5))} className="p-2 text-white/70 hover:text-white" aria-label="Zoom out">
            <ZoomOut className="w-5 h-5" />
          </button>
          {allowDownloads && (
            <button onClick={() => onDownload(photo)} className="p-2 text-white/70 hover:text-white" aria-label="Download">
              <Download className="w-5 h-5" />
            </button>
          )}
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <img
          src={photo.previewUrl || photo.thumbnailUrl}
          alt={`Photo ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
          draggable={false}
        />

        {/* Nav buttons */}
        {currentIndex > 0 && (
          <button
            onClick={onPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {currentIndex < photos.length - 1 && (
          <button
            onClick={onNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
            aria-label="Next photo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Photo grid card ──────────────────────────────────────────────────────────
const PhotoCard = ({ photo, selected, onSelect, onOpen, allowDownloads }) => (
  <div className="relative group photo-card rounded-xl overflow-hidden bg-gray-100 aspect-square cursor-pointer">
    <img
      src={photo.thumbnailUrl}
      alt=""
      className="w-full h-full object-cover"
      loading="lazy"
      onClick={() => onOpen(photo)}
    />
    {/* Select checkbox */}
    <button
      onClick={(e) => { e.stopPropagation(); onSelect(photo.id); }}
      className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
      aria-label={selected ? 'Deselect photo' : 'Select photo'}
    >
      {selected
        ? <div className="w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center shadow"><Check className="w-3.5 h-3.5 text-white" /></div>
        : <div className="w-6 h-6 bg-white/80 rounded-full shadow" />
      }
    </button>
    {selected && <div className="absolute inset-0 ring-2 ring-violet-500 rounded-xl pointer-events-none" />}
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const PhotoResultsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [photos, setPhotos] = useState(location.state?.photos || []);
  const [matchCount, setMatchCount] = useState(location.state?.matchCount || 0);
  const [loading, setLoading] = useState(!location.state?.photos);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [downloadingAll, setDownloadingAll] = useState(false);

  // If arrived without state, try to load from searchId
  useEffect(() => {
    if (!location.state?.photos && location.state?.searchId) {
      publicAPI.getResults(slug, location.state.searchId)
        .then((res) => {
          setPhotos(res.data.photos || []);
          setMatchCount(res.data.matchCount || 0);
        })
        .catch(() => toast.error('Failed to load results'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [slug, location.state]);

  const allowDownloads = photos.length > 0 && !!photos[0].originalUrl;

  const handleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selected.size === photos.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(photos.map((p) => p.id)));
    }
  };

  const downloadPhoto = async (photo) => {
    try {
      if (photo.originalUrl) {
        const a = document.createElement('a');
        a.href = photo.originalUrl;
        a.download = `photo-${photo.id}.jpg`;
        a.target = '_blank';
        a.click();
      } else {
        const res = await publicAPI.getDownloadUrl(slug, photo.id);
        const a = document.createElement('a');
        a.href = res.data.downloadUrl;
        a.download = `photo-${photo.id}.jpg`;
        a.target = '_blank';
        a.click();
      }
    } catch {
      toast.error('Download failed. Please try again.');
    }
  };

  const downloadSelected = async () => {
    const toDownload = photos.filter((p) => selected.has(p.id));
    if (toDownload.length === 0) return;
    setDownloadingAll(true);
    toast(`Downloading ${toDownload.length} photo${toDownload.length > 1 ? 's' : ''}…`);
    for (const photo of toDownload) {
      await downloadPhoto(photo);
      await new Promise((r) => setTimeout(r, 300));
    }
    setDownloadingAll(false);
    toast.success('Download complete!');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'My Event Photos', url: window.location.href })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  const openLightbox = (photo) => {
    const idx = photos.findIndex((p) => p.id === photo.id);
    setLightboxIndex(idx);
  };

  if (loading) return <PageLoader message="Loading your photos…" />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-bold text-gray-900 text-sm sm:text-base">
              {matchCount > 0 ? `${matchCount} photo${matchCount > 1 ? 's' : ''} found!` : 'No matches found'}
            </h1>
            {selected.size > 0 && (
              <p className="text-xs text-violet-600">{selected.size} selected</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {allowDownloads && selected.size > 0 && (
              <button
                onClick={downloadSelected}
                disabled={downloadingAll}
                className="btn-primary text-xs py-1.5 px-3"
              >
                <Download className="w-3.5 h-3.5" />
                Download {selected.size > 0 ? `(${selected.size})` : 'All'}
              </button>
            )}
            <button onClick={handleShare} className="btn-secondary text-xs py-1.5 px-3">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
          </div>
        </div>

        {/* Sub bar */}
        {photos.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 pb-2 flex items-center gap-3">
            <button onClick={handleSelectAll} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
              {selected.size === photos.length
                ? <CheckSquare className="w-4 h-4 text-violet-600" />
                : <Square className="w-4 h-4" />}
              {selected.size === photos.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {photos.length === 0 ? (
          /* No results */
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Image className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No photos found</h2>
            <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
              We couldn't find any photos matching your face. Try a clearer, well-lit selfie.
            </p>
            <button
              onClick={() => navigate(`/e/${slug}/search`, { state: { consentGiven: true } })}
              className="btn-primary"
            >
              <Camera className="w-4 h-4" /> Try Another Selfie
            </button>
          </div>
        ) : (
          <>
            {/* Photo grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  selected={selected.has(photo.id)}
                  onSelect={handleSelect}
                  onOpen={openLightbox}
                  allowDownloads={allowDownloads}
                />
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-10 text-center space-y-3">
              {allowDownloads && (
                <button onClick={() => { handleSelectAll(); }} className="btn-primary">
                  <Download className="w-4 h-4" /> Download All Photos
                </button>
              )}
              <div>
                <button
                  onClick={() => navigate(`/e/${slug}/search`, { state: { consentGiven: true } })}
                  className="btn-ghost text-sm"
                >
                  <Camera className="w-4 h-4" /> Try Another Selfie
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => Math.max(0, i - 1))}
          onNext={() => setLightboxIndex((i) => Math.min(photos.length - 1, i + 1))}
          onDownload={downloadPhoto}
          allowDownloads={allowDownloads}
        />
      )}
    </div>
  );
};

export default PhotoResultsPage;
