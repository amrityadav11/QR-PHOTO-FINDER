import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, QrCode, Search, Image, Download, Users, TrendingUp } from 'lucide-react';
import { analyticsAPI } from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import { InlineLoader } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const EventAnalyticsPage = () => {
  const { id } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getEventAnalytics(id)
      .then((res) => setAnalytics(res.data.analytics))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <InlineLoader message="Loading analytics…" />;
  if (!analytics) return <p className="text-gray-500 text-center py-16">No analytics data found.</p>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to={`/dashboard/events/${id}`} className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{analytics.eventName} — Analytics</h1>
          <p className="text-sm text-gray-500">Performance overview</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={QrCode} label="QR Scans" value={analytics.qrScans} color="violet" />
        <StatCard icon={Users} label="Unique Visitors" value={analytics.uniqueVisitors} color="blue" />
        <StatCard icon={Search} label="Searches" value={analytics.totalSearches} color="emerald" />
        <StatCard icon={TrendingUp} label="Successful" value={analytics.successfulSearches} color="amber" />
        <StatCard icon={Image} label="Views" value={analytics.totalViews} color="rose" />
        <StatCard icon={Download} label="Downloads" value={analytics.totalDownloads} color="violet" />
      </div>

      {/* Funnel */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-5">Guest Funnel</h3>
        {[
          { label: 'QR Scans', value: analytics.qrScans, color: 'bg-violet-500' },
          { label: 'Photo Searches', value: analytics.totalSearches, color: 'bg-blue-500' },
          { label: 'Successful Matches', value: analytics.successfulSearches, color: 'bg-emerald-500' },
          { label: 'Photos Downloaded', value: analytics.totalDownloads, color: 'bg-amber-500' },
        ].map(({ label, value, color }, i, arr) => {
          const max = arr[0].value || 1;
          const pct = Math.round((value / max) * 100);
          return (
            <div key={label} className="mb-4">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-700 font-medium">{label}</span>
                <span className="text-gray-500">{value?.toLocaleString()} <span className="text-xs text-gray-400">({pct}%)</span></span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily searches chart */}
      {analytics.recentSearches?.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-5">Daily Searches (Last 30 Days)</h3>
          <div className="flex items-end gap-1 h-32">
            {analytics.recentSearches.map((day) => {
              const maxVal = Math.max(...analytics.recentSearches.map((d) => d.count), 1);
              const h = Math.max(4, Math.round((day.count / maxVal) * 100));
              return (
                <div key={day._id} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full bg-violet-400 rounded-t group-hover:bg-violet-600 transition-colors"
                    style={{ height: `${h}%` }}
                    title={`${day._id}: ${day.count} searches`}
                  />
                  <span className="text-xs text-gray-300 hidden group-hover:block absolute -top-5 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap z-10">
                    {day._id}: {day.count}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">Last 30 days</p>
        </div>
      )}

      {/* Photo stats */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Photo Processing</h3>
        <div className="space-y-3">
          {[
            { label: 'Total Photos', value: analytics.photoCount, color: 'bg-violet-500' },
            { label: 'Processed', value: analytics.processedPhotoCount, color: 'bg-emerald-500' },
            { label: 'Faces Detected', value: analytics.faceCount, color: 'bg-blue-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-4">
              <span className="text-sm text-gray-600 w-32 flex-shrink-0">{label}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} rounded-full`}
                  style={{ width: `${analytics.photoCount > 0 ? Math.min(100, (value / analytics.photoCount) * 100) : 0}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900 w-16 text-right">{value?.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventAnalyticsPage;
