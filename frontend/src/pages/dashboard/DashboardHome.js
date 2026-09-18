import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Image, Search, Download, PlusCircle, ArrowRight } from 'lucide-react';
import { analyticsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/ui/StatCard';

const DashboardHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getDashboard()
      .then((res) => setStats(res.data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Here's what's happening with your events.</p>
        </div>
        <Link to="/dashboard/events/create" className="btn-primary">
          <PlusCircle className="w-4 h-4" />
          Create Event
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarDays} label="Total Events" value={stats?.totalEvents ?? '—'} color="violet" loading={loading} />
        <StatCard icon={Image} label="Total Photos" value={stats?.totalPhotos ?? '—'} color="blue" loading={loading} />
        <StatCard icon={Search} label="Photo Searches" value={stats?.totalSearches ?? '—'} color="emerald" loading={loading} />
        <StatCard icon={Download} label="Downloads" value={stats?.totalDownloads ?? '—'} color="amber" loading={loading} />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            to: '/dashboard/events/create',
            icon: PlusCircle,
            title: 'New Event',
            desc: 'Create an event and generate a QR code',
            color: 'bg-violet-50 text-violet-600',
          },
          {
            to: '/dashboard/events',
            icon: CalendarDays,
            title: 'My Events',
            desc: 'Manage uploads, settings, and analytics',
            color: 'bg-blue-50 text-blue-600',
          },
          {
            to: '/dashboard/profile',
            icon: ArrowRight,
            title: 'Profile Settings',
            desc: 'Update your account details and plan',
            color: 'bg-emerald-50 text-emerald-600',
          },
        ].map((item, i) => (
          <Link
            key={i}
            to={item.to}
            className="card p-5 hover:shadow-card-hover transition-all group flex items-start gap-4"
          >
            <div className={`p-3 rounded-xl ${item.color} flex-shrink-0`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm group-hover:text-violet-600 transition-colors">{item.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Plan info */}
      <div className="card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-0.5">
            You're on the <span className="capitalize text-violet-600">{user?.plan || 'Free'}</span> plan
          </p>
          <p className="text-xs text-gray-500">
            {user?.planLimits?.maxPhotosPerEvent?.toLocaleString()} photos/event ·{' '}
            {user?.planLimits?.allowFaceMatching ? 'AI face matching enabled' : 'Upgrade to enable face matching'}
          </p>
        </div>
        <a href="#pricing" className="btn-primary text-sm">
          Upgrade Plan
        </a>
      </div>
    </div>
  );
};

export default DashboardHome;
