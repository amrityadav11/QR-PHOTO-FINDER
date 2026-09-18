import React from 'react';

const variants = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  error: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  purple: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  gray: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
  processing: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 animate-pulse',
};

const statusMap = {
  active: 'success',
  completed: 'success',
  draft: 'gray',
  expired: 'error',
  archived: 'gray',
  processing: 'processing',
  partial: 'warning',
  failed: 'error',
  pending: 'warning',
  idle: 'gray',
};

const Badge = ({ children, variant = 'gray', status, className = '' }) => {
  const v = status ? statusMap[status] || 'gray' : variant;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[v]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
