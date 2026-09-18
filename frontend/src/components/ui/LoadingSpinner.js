import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '', color = 'violet' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };
  const colors = {
    violet: 'border-violet-600',
    white: 'border-white',
    gray: 'border-gray-600',
  };

  return (
    <div
      className={`${sizes[size]} ${colors[color]} border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

export const PageLoader = ({ message = 'Loading...' }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
    <LoadingSpinner size="lg" />
    <p className="text-gray-500 text-sm">{message}</p>
  </div>
);

export const InlineLoader = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center gap-3 py-12">
    <LoadingSpinner size="md" />
    <span className="text-gray-500 text-sm">{message}</span>
  </div>
);

export default LoadingSpinner;
