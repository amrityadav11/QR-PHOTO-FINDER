import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CalendarDays, MapPin, FileText, Image, Settings, ArrowLeft, Upload } from 'lucide-react';
import { eventsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const EVENT_TYPES = [
  { value: 'wedding', label: '💍 Wedding' },
  { value: 'engagement', label: '💑 Engagement' },
  { value: 'birthday', label: '🎂 Birthday' },
  { value: 'college', label: '🎓 College Event' },
  { value: 'corporate', label: '🏢 Corporate' },
  { value: 'conference', label: '🎤 Conference' },
  { value: 'festival', label: '🎉 Festival' },
  { value: 'sports', label: '🏆 Sports' },
  { value: 'photography', label: '📷 Photography' },
  { value: 'other', label: '✨ Other' },
];

const FormSection = ({ icon: Icon, title, children }) => (
  <div className="card p-6">
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
      <div className="p-2 bg-violet-50 rounded-lg">
        <Icon className="w-4 h-4 text-violet-600" />
      </div>
      <h2 className="font-semibold text-gray-900">{title}</h2>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

const CreateEventPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      allowDownloads: true,
      allowOriginalDownloads: false,
      watermarkEnabled: false,
      isPublic: true,
      requireConsent: true,
      faceSimilarityThreshold: 0.80,
    },
  });

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value);
        }
      });

      const fileInput = document.getElementById('coverImageInput');
      if (fileInput?.files[0]) {
        formData.append('coverImage', fileInput.files[0]);
      }

      const res = await eventsAPI.create(formData);
      toast.success('Event created successfully!');
      navigate(`/dashboard/events/${res.data.event._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Event</h1>
          <p className="text-gray-500 text-sm mt-0.5">Set up your event and generate a QR code</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <FormSection icon={CalendarDays} title="Event Details">
          <div>
            <label className="label">Event Name *</label>
            <input
              type="text"
              placeholder="e.g. Rahul & Priya Wedding 2026"
              className={`input-field ${errors.name ? 'border-red-400' : ''}`}
              {...register('name', { required: 'Event name is required', minLength: { value: 2, message: 'Too short' } })}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Event Type *</label>
              <select
                className={`input-field ${errors.type ? 'border-red-400' : ''}`}
                {...register('type', { required: 'Please select an event type' })}
              >
                <option value="">Select type…</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {errors.type && <p className="mt-1 text-xs text-red-500">{errors.type.message}</p>}
            </div>

            <div>
              <label className="label">Event Date *</label>
              <input
                type="date"
                className={`input-field ${errors.date ? 'border-red-400' : ''}`}
                {...register('date', { required: 'Event date is required' })}
              />
              {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. The Grand Ballroom, Mumbai"
                className="input-field pl-10"
                {...register('location')}
              />
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                rows={3}
                placeholder="A short description for your guests…"
                className="input-field pl-10 resize-none"
                {...register('description')}
              />
            </div>
          </div>
        </FormSection>

        {/* Cover image */}
        <FormSection icon={Image} title="Cover Image">
          <div>
            <label className="label">Upload Cover Photo (optional)</label>
            <div
              className="relative border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-violet-400 transition-colors cursor-pointer"
              onClick={() => document.getElementById('coverImageInput').click()}
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Cover preview" className="w-full h-40 object-cover rounded-lg" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Upload className="w-8 h-8" />
                  <p className="text-sm">Click to upload cover image</p>
                  <p className="text-xs">JPG, PNG, WEBP · Max 10MB</p>
                </div>
              )}
              <input
                id="coverImageInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleCoverChange}
              />
            </div>
          </div>
        </FormSection>

        {/* Settings */}
        <FormSection icon={Settings} title="Event Settings">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Event Expiry Date (optional)</label>
              <input type="date" className="input-field" {...register('expiresAt')} />
            </div>
            <div>
              <label className="label">Face Match Threshold</label>
              <input
                type="number"
                step="0.05"
                min="0.5"
                max="1.0"
                className="input-field"
                {...register('faceSimilarityThreshold')}
              />
              <p className="text-xs text-gray-400 mt-1">0.80 = recommended. Higher = stricter.</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { name: 'allowDownloads', label: 'Allow guests to download photos' },
              { name: 'allowOriginalDownloads', label: 'Allow original resolution downloads' },
              { name: 'watermarkEnabled', label: 'Add watermark to downloaded photos' },
              { name: 'isPublic', label: 'Make event publicly accessible via QR code' },
              { name: 'requireConsent', label: 'Require privacy consent before selfie search' },
            ].map((item) => (
              <label key={item.name} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-violet-600 border-gray-300 rounded accent-violet-600"
                  {...register(item.name)}
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{item.label}</span>
              </label>
            ))}
          </div>
        </FormSection>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating…
              </span>
            ) : 'Create Event & Generate QR'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventPage;
