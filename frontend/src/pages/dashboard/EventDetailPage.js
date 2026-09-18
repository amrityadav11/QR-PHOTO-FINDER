import React, { useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, QrCode, Upload, BarChart2, Settings, Trash2,
  Copy, Download, ExternalLink, CheckCircle, Clock, AlertCircle,
  Image, Search, Users, Eye, RefreshCw, Globe
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEvent } from '../../hooks/useEvents';
import useProcessingStatus from '../../hooks/useProcessingStatus';
import { eventsAPI } from '../../services/api';
import Badge from '../../components/ui/Badge';
import { ConfirmModal } from '../../components/ui/Modal';
import { InlineLoader } from '../../components/ui/LoadingSpinner';
import StatCard from '../../components/ui/StatCard';
import toast from 'react-hot-toast';

// ─── Processing status card ───────────────────────────────────────────────────
const ProcessingCard = ({ eventId, photoCount }) => {
  const { status } = useProcessingStatus(eventId, photoCount > 0);
  if (!status || photoCount === 0) return null;

  const { processingStatus, processedPhotoCount, faceCount, progress, breakdown } = status;
  const done = processingStatus === 'completed' || processingStatus === 'partial';
  const failed = processingStatus === 'failed';

  return (
    <div className={`card p-5 border-l-4 ${done ? 'border-emerald-400' : failed ? 'border-red-400' : 'border-violet-400'}`}>
      <div className="flex items-center gap-3 mb-3">
        {done ? <CheckCircle className="w-5 h-5 text-emerald-500" /> :
         failed ? <AlertCircle className="w-5 h-5 text-red-500" /> :
         <RefreshCw className="w-5 h-5 text-violet-500 animate-spin" />}
        <span className="font-semibold text-gray-900 text-sm">
          {done ? 'AI Processing Complete' : failed ? 'Processing Failed' : 'AI Processing…'}
        </span>
        <Badge status={processingStatus} className="ml-auto">{processingStatus}</Badge>
      </div>

      {!done && !failed && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{processedPhotoCount?.toLocaleString()} / {photoCount?.toLocaleString()} photos</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progress || 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-6 text-sm text-gray-600">
        <span className="flex items-center gap-1.5">
          <Image className="w-3.5 h-3.5 text-gray-400" />
          {processedPhotoCount?.toLocaleString()} processed
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          {faceCount?.toLocaleString()} faces found
        </span>
        {breakdown?.failed > 0 && (
          <span className="text-amber-600">{breakdown.failed} failed</span>
        )}
      </div>
    </div>
  );
};

// ─── QR Card ─────────────────────────────────────────────────────────────────
const QRCard = ({ event }) => {
  const [qrData, setQrData] = useState(event.qrCode);
  const [loading, setLoading] = useState(false);
  const eventUrl = event.qrCode?.publicUrl || `${window.location.origin}/e/${event.slug}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(eventUrl);
    toast.success('Event URL copied!');
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('event-qr-svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.slug}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('QR code downloaded!');
  };

  const handleDownloadPNG = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 500;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 500);

    const img = new Image();
    const svgEl = document.getElementById('event-qr-svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 50, 30, 300, 300);
      ctx.fillStyle = '#1a1a2e';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FIND YOUR PHOTOS', 200, 370);
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#555';
      ctx.fillText('Scan & Take a Selfie', 200, 400);
      ctx.fillText('Your photos will appear automatically', 200, 420);

      const a = document.createElement('a');
      a.download = `${event.slug}-qr.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      URL.revokeObjectURL(url);
      toast.success('QR PNG downloaded!');
    };
    img.src = url;
  };

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const res = await eventsAPI.regenerateQR(event._id);
      setQrData(res.data.qrCode);
      toast.success('QR code regenerated');
    } catch {
      toast.error('Failed to regenerate QR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <QrCode className="w-4 h-4 text-violet-600" /> Event QR Code
      </h3>

      {/* QR Code display */}
      <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 text-center mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">FIND YOUR PHOTOS</p>
        <div className="flex justify-center mb-4">
          <QRCodeSVG
            id="event-qr-svg"
            value={eventUrl}
            size={200}
            level="H"
            fgColor="#1a1a2e"
            bgColor="#ffffff"
          />
        </div>
        <p className="text-xs font-medium text-gray-600 mb-1">Scan & Take a Selfie</p>
        <p className="text-xs text-gray-400">Your photos will appear automatically.</p>
      </div>

      {/* URL */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={eventUrl}
          readOnly
          className="input-field text-xs flex-1 py-2"
        />
        <button onClick={handleCopyUrl} className="btn-secondary p-2.5" title="Copy URL">
          <Copy className="w-4 h-4" />
        </button>
        <a href={eventUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary p-2.5" title="Open">
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={handleDownloadPNG} className="btn-primary text-xs py-2">
          <Download className="w-3.5 h-3.5" /> Download PNG
        </button>
        <button onClick={handleDownloadQR} className="btn-secondary text-xs py-2">
          <Download className="w-3.5 h-3.5" /> Download SVG
        </button>
      </div>
      <button
        onClick={handleRegenerate}
        disabled={loading}
        className="btn-ghost w-full mt-2 text-xs justify-center"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Regenerate QR
      </button>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { event, loading, refetch } = useEvent(id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await eventsAPI.delete(id);
      toast.success('Event deleted');
      navigate('/dashboard/events');
    } catch {
      toast.error('Failed to delete event');
      setDeleting(false);
    }
  };

  if (loading) return <InlineLoader message="Loading event…" />;
  if (!event) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Event not found.</p>
      <Link to="/dashboard/events" className="btn-primary mt-4">Back to Events</Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <button onClick={() => navigate('/dashboard/events')} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 truncate">{event.name}</h1>
            <Badge status={event.status}>{event.status}</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            {event.location && ` · ${event.location}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link to={`/dashboard/events/${id}/photos`} className="btn-primary text-sm">
            <Upload className="w-4 h-4" /> Upload Photos
          </Link>
          <Link to={`/dashboard/events/${id}/analytics`} className="btn-secondary text-sm">
            <BarChart2 className="w-4 h-4" /> Analytics
          </Link>
          <button onClick={() => setConfirmDelete(true)} className="btn-secondary text-sm text-red-600 hover:bg-red-50 hover:border-red-200">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Processing status */}
      <ProcessingCard eventId={id} photoCount={event.photoCount} />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Image} label="Photos" value={event.photoCount} color="violet" />
        <StatCard icon={Users} label="Faces Detected" value={event.faceCount} color="blue" />
        <StatCard icon={Search} label="Searches" value={event.totalSearches} color="emerald" />
        <StatCard icon={Eye} label="QR Scans" value={event.qrScans} color="amber" />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Event info */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Event Information</h3>
            <dl className="space-y-3">
              {[
                { label: 'Type', value: event.type },
                { label: 'Date', value: new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                { label: 'Location', value: event.location || '—' },
                { label: 'Description', value: event.description || '—' },
                { label: 'Processing', value: `${event.processedPhotoCount || 0}/${event.photoCount} photos (${event.faceCount} faces)` },
                { label: 'Downloads', value: event.allowDownloads ? 'Enabled' : 'Disabled' },
                { label: 'Expires', value: event.expiresAt ? new Date(event.expiresAt).toLocaleDateString() : 'Never' },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-4">
                  <dt className="text-sm text-gray-500 w-28 flex-shrink-0">{label}</dt>
                  <dd className="text-sm text-gray-900 capitalize">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to={`/dashboard/events/${id}/photos`} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50 transition-all group">
                <Upload className="w-5 h-5 text-gray-400 group-hover:text-violet-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Upload Photos</p>
                  <p className="text-xs text-gray-500">{event.photoCount} uploaded</p>
                </div>
              </Link>
              <Link to={`/dashboard/events/${id}/analytics`} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50 transition-all group">
                <BarChart2 className="w-5 h-5 text-gray-400 group-hover:text-violet-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Analytics</p>
                  <p className="text-xs text-gray-500">{event.totalSearches} searches</p>
                </div>
              </Link>
              <a
                href={`/e/${event.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50 transition-all group"
              >
                <Globe className="w-5 h-5 text-gray-400 group-hover:text-violet-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Guest View</p>
                  <p className="text-xs text-gray-500">Preview event page</p>
                </div>
              </a>
              <Link to={`/dashboard/events/create`} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50 transition-all group">
                <Settings className="w-5 h-5 text-gray-400 group-hover:text-violet-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">New Event</p>
                  <p className="text-xs text-gray-500">Create another</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Right: QR */}
        <div className="lg:col-span-1">
          <QRCard event={event} />
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Event"
        message={`This will permanently delete "${event.name}" and all associated photos, face data, and analytics. This cannot be undone.`}
        confirmText="Delete Event"
        danger
        loading={deleting}
      />
    </div>
  );
};

export default EventDetailPage;
