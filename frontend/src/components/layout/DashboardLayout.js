import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  QrCode, LayoutDashboard, CalendarDays, PlusCircle,
  BarChart2, User, Settings, LogOut, Menu, X, ChevronRight, Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/events', icon: CalendarDays, label: 'My Events' },
  { to: '/dashboard/events/create', icon: PlusCircle, label: 'Create Event' },
  { to: '/dashboard/profile', icon: User, label: 'Profile' },
];

const SidebarLink = ({ to, icon: Icon, label, end, onClick }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`
    }
  >
    <Icon className="w-4 h-4 flex-shrink-0" />
    {label}
  </NavLink>
);

const Sidebar = ({ mobile = false, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100">
        <Link to="/dashboard" className="flex items-center gap-2" onClick={onClose}>
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <QrCode className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">SnapFind</span>
        </Link>
        {mobile && (
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" aria-label="Close menu">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <SidebarLink key={item.to} {...item} onClick={onClose} />
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-violet-600">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.plan || 'free'} plan</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Log out
        </button>
      </div>
    </div>
  );
};

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-100 fixed inset-y-0 left-0 z-30">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl z-50 animate-slide-up">
            <Sidebar mobile onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100 px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb placeholder — individual pages fill this via page title */}
          <div className="hidden lg:flex items-center gap-1.5 text-sm text-gray-500">
            <span className="text-gray-400">Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg" aria-label="Notifications">
              <Bell className="w-4 h-4" />
            </button>
            <Link to="/dashboard/profile" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user?.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-violet-600">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
