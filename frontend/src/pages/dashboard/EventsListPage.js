import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle, CalendarDays, Image, Search, MoreVertical,
  Trash2, BarChart2, Eye, QrCode, Upload
} from 'lucide-react';
import { useEvents } from '../../hooks/useEvents';
import { ConfirmModal } from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { InlineLoader } from '../../components/ui/LoadingSpinner';

const EventCard = ({ event, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const ok = await onDelete(event._id);
    if (!ok) setDeleting(false);
  };

  const progress = event.photoCount > 0
    ? Math.round((event.processedPhotoCount / event.photoCount) * 100)
    : 0;

  return (
    <>
      <div className="card overflow-hidden hover:shadow-card-hover transition-all">
        {/* Cover */}
        <div className="relative h-40 bg-gradient-to-br from-violet-100 to-blue-100">
          {event.coverImage ? (
            <img src={event.coverImage} alt={event.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CalendarDays className="w-10 h-10 text-violet-300" />
            </div>
          )}
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            <Badge status={event.status}>{event.status}</Badge>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{event.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                {event.location && ` · ${event.location}`}
              </p>
            </div>
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                aria-label="Event options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-10 py-1 animate-scale-in">
                  <Link to={`/dashboard/events/${event._id}`} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </Link>
                  <Link to={`/dashboard/events/${event._id}/photos`} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                    <Upload className="w-3.5 h-3.5" /> Upload Photos
                  </Link>
                  <Link to={`/dashboard/events/${event._id}/analytics`} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                    <BarChart2 className="w-3.5 h-3.5" /> Analytics
                  </Link>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Event
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
            <span className="flex items-center gap-1"><Image className="w-3.5 h-3.5" />{event.photoCount} photos</span>
            <span className="flex items-center gap-1"><Search className="w-3.5 h-3.5" />{event.totalSearches || 0} searches</span>
            <span className="flex items-center gap-1"><QrCode className="w-3.5 h-3.5" />{event.qrScans || 0} scans</span>
          </div>

          {/* Processing bar */}
          {event.processingStatus === 'processing' && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Processing…</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2">
            <Link to={`/dashboard/events/${event._id}`} className="btn-secondary text-xs py-1.5 flex-1 justify-center">
              Manage
            </Link>
            <Link to={`/dashboard/events/${event._id}/photos`} className="btn-primary text-xs py-1.5 flex-1 justify-center">
              <Upload className="w-3 h-3" /> Upload
            </Link>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${event.name}"? This will permanently remove all photos, face data, and analytics. This action cannot be undone.`}
        confirmText="Delete Event"
        danger
        loading={deleting}
      />
    </>
  );
};

const EventsListPage = () => {
  const { events, loading, deleteEvent } = useEvents();

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
          <p className="text-gray-500 text-sm mt-1">{events.length} event{events.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link to="/dashboard/events/create" className="btn-primary">
          <PlusCircle className="w-4 h-4" /> New Event
        </Link>
      </div>

      {loading ? (
        <InlineLoader message="Loading events..." />
      ) : events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events yet"
          description="Create your first event to generate a QR code and start uploading photos."
          action={
            <Link to="/dashboard/events/create" className="btn-primary">
              <PlusCircle className="w-4 h-4" /> Create Your First Event
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => (
            <EventCard key={event._id} event={event} onDelete={deleteEvent} />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsListPage;
