import React, { useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Upload, Image, Trash2, ArrowLeft, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { photosAPI } from '../../services/api';
import { useEvent } from '../../hooks/useEvents';
import useProcessingStatus from '../../hooks/useProcessingStatus';
import { ConfirmModal } from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { InlineLoader } from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

const statusIcon = { completed: CheckCircle, failed: AlertCircle, pending: Clock, processing: RefreshCw };
const statusColor = { completed: 'text-emerald-500', failed: 'text-red-500', pending: 'text-amber-500', processing: 'text-blue-500 animate-spin' };

const PhotoCard = ({ photo, eventId, onDelete }) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const Icon = statusIcon[photo.processingStatus] || Clock;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await photosAPI.delete(eventId, photo.id);
      onDelete(photo.id);
      toast.success('Photo deleted');
    } catch {
      toast.error('Failed to delete photo');
      setDeleting(false);
    }
    setDeleteOpen(false);
  };

  return (
    <>
      <div className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-square">
        <img
          src={photo.thumbnailUrl}
          alt=""
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Status badge */}
        <div className="absolute top-1.5 right-1.5">
          <Icon className={`w-4 h-4 ${statusColor[photo.processingStatus]} drop-shadow`} />
        </div>
        {/* Delete on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={() => setDeleteOpen(true)}
            className="p-2 bg-white/90 rounded-full text-red-600 hover:bg-white"
            aria-label="Delete photo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Photo"
        message="Remove this photo and all associated face data? This cannot be undone."
        confirmText="Delete"
        danger
        loading={deleting}
      />
    </>
  );
};

const EventPhotosPage = () => {
  const { id } = useParams();
  const { event, loading: eventLoading } = useEvent(id);
  const { status: procStatus } = useProcessingStatus(id, true);

  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();

  const loadPhotos = useCallback(async (pageNum = 1) => {
    setPhotosLoading(true);
    try {
      const res = await photosAPI.getAll(id, { page: pageNum, limit: 30 });
      const newPhotos = res.data.data || [];
      if (pageNum === 1) {
        setPhotos(newPhotos);
      } else {
        setPhotos((prev) => [...prev, ...newPhotos]);
      }
      setHasMore(res.data.pagination?.hasNext || false);
      setPage(pageNum);
    } catch {
      toast.error('Failed to load photos');
    } finally {
      setPhotosLoading(false);
    }
  }, [id]);

  React.useEffect(() => { loadPhotos(1); }, [loadPhotos]);

  const handleFiles = async (files) => {
    const validFiles = Array.from(files).filter((f) =>
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(f.type)
    );

    if (validFiles.length === 0) {
      return toast.error('Please select JPG, PNG, or WEBP images only.');
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const BATCH = 20;
      let totalUploaded = 0;

      for (let i = 0; i < validFiles.length; i += BATCH) {
        const batch = validFiles.slice(i, i + BATCH);
        const fd = new FormData();
        batch.forEach((f) => fd.append('photos', f));

        await photosAPI.upload(id, fd, (pct) => {
          const overall = Math.round(((i + batch.length * pct / 100) / validFiles.length) * 100);
          setUploadProgress(overall);
        });

        totalUploaded += batch.length;
      }

      toast.success(`${totalUploaded} photo${totalUploaded > 1 ? 's' : ''} uploaded and queued for processing`);
      loadPhotos(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handlePhotoDelete = (photoId) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  if (eventLoading) return <InlineLoader message="Loading…" />;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link to={`/dashboard/events/${id}`} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{event?.name} — Photos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{event?.photoCount || 0} photos · {event?.faceCount || 0} faces detected</p>
        </div>
      </div>

      {/* Processing status bar */}
      {procStatus && event?.photoCount > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {procStatus.processingStatus === 'completed' ? '✓ Processing complete' : `Processing ${procStatus.processedPhotoCount}/${procStatus.photoCount} photos…`}
            </span>
            <span className="text-sm font-bold text-violet-600">{procStatus.progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${procStatus.processingStatus === 'completed' ? 'bg-emerald-500' : 'bg-violet-500'}`}
              style={{ width: `${procStatus.progress || 0}%` }}
            />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span>✓ {procStatus.breakdown?.completed || 0} done</span>
            <span>⟳ {procStatus.breakdown?.processing || 0} processing</span>
            {procStatus.breakdown?.failed > 0 && <span className="text-red-500">✗ {procStatus.breakdown.failed} failed</span>}
            <span className="ml-auto">{procStatus.faceCount?.toLocaleString()} faces detected</span>
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragOver ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50'
        } ${uploading ? 'pointer-events-none opacity-75' : ''}`}
        role="button"
        aria-label="Upload photos"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-gray-900">Uploading… {uploadProgress}%</p>
            <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center">
              <Upload className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">
                {dragOver ? 'Drop photos here' : 'Click or drag to upload photos'}
              </p>
              <p className="text-sm text-gray-400 mt-1">JPG, PNG, WEBP · Max 20MB per file · Up to 100 files at once</p>
            </div>
          </div>
        )}
      </div>

      {/* Photo grid */}
      {photosLoading && photos.length === 0 ? (
        <InlineLoader message="Loading photos…" />
      ) : photos.length === 0 ? (
        <EmptyState
          icon={Image}
          title="No photos yet"
          description="Upload your event photos to get started. AI will process each photo to detect and index faces."
        />
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id || photo._id}
                photo={{ ...photo, id: photo.id || photo._id }}
                eventId={id}
                onDelete={handlePhotoDelete}
              />
            ))}
          </div>

          {hasMore && (
            <div className="text-center">
              <button
                onClick={() => loadPhotos(page + 1)}
                disabled={photosLoading}
                className="btn-secondary"
              >
                {photosLoading ? 'Loading…' : 'Load more photos'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventPhotosPage;
