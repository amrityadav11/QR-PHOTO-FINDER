import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QrCode, Camera, CalendarDays, MapPin, Shield, ArrowRight, AlertCircle } from 'lucide-react';
import { publicAPI } from '../../services/api';
import { PageLoader } from '../../components/ui/LoadingSpinner';

const GuestEventPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consent, setConsent] = useState(false);
  const [processingMsg, setProcessingMsg] = useState(null);

  useEffect(() => {
    publicAPI.getEvent(slug)
      .then((res) => {
        setEvent(res.data.event);
        setProcessingMsg(res.data.processingMessage);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Event not found');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <PageLoader message="Loading event…" />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Oops</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <a href="/" className="btn-primary">Go Home</a>
        </div>
      </div>
    );
  }

  const handleContinue = () => {
    if (!consent) return;
    // Pass consent through navigation state
    navigate(`/e/${slug}/search`, { state: { consentGiven: true, event } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center gap-2">
        <div className="w-7 h-7 gradient-primary rounded-lg flex items-center justify-center">
          <QrCode className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-sm">SnapFind</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Cover image */}
        {event.coverImage && (
          <div className="rounded-2xl overflow-hidden mb-6 h-52 shadow-sm">
            <img src={event.coverImage} alt={event.name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Event info */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{event.name}</h1>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500 flex-wrap">
            {event.date && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" />
                {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {event.location}
              </span>
            )}
          </div>
          {event.description && (
            <p className="text-gray-500 text-sm mt-3 leading-relaxed">{event.description}</p>
          )}
        </div>

        {/* Processing warning */}
        {processingMsg && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3 mb-6">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">{processingMsg}</p>
          </div>
        )}

        {/* Privacy notice */}
        <div className="card p-5 mb-6">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 bg-violet-50 rounded-lg">
              <Shield className="w-4 h-4 text-violet-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Privacy Notice</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            To find your photos, we need to take a quick selfie. Here's how we protect your privacy:
          </p>
          <ul className="space-y-2 mb-5">
            {[
              'Your selfie is used only to find your event photos',
              'It is processed in real-time and never stored permanently',
              'Only the photos you appear in will be shown to you',
              'Face data is never shared with third parties',
              'You can choose not to use this feature',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                {item}
              </li>
            ))}
          </ul>

          {/* Consent checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                id="consent"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-violet-600 peer-checked:border-violet-600 transition-all flex items-center justify-center">
                {consent && <div className="w-2.5 h-2 border-r-2 border-b-2 border-white transform rotate-45 -mt-0.5" />}
              </div>
            </div>
            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
              I agree to the photo matching and privacy terms. I understand my selfie will be processed temporarily to find my photos.
            </span>
          </label>
        </div>

        {/* CTA */}
        <button
          onClick={handleContinue}
          disabled={!consent}
          className="btn-primary w-full justify-center py-4 text-base"
          style={{ opacity: consent ? 1 : 0.5 }}
        >
          <Camera className="w-5 h-5" />
          Find My Photos
          <ArrowRight className="w-4 h-4" />
        </button>

        {!consent && (
          <p className="text-center text-xs text-gray-400 mt-3">Please accept the privacy terms to continue</p>
        )}
      </div>
    </div>
  );
};

export default GuestEventPage;
