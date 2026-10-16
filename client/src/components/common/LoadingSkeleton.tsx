import React from 'react';

interface LoadingSkeletonProps {
  type?: 'table' | 'card' | 'chart' | 'default' | string;
  rows?: number;
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'default',
  rows = 4,
  count = 3,
}) => {
  if (type === 'table') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4" />
        <div className="space-y-2 pt-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
            <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-pulse p-4 w-full">
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
        ))}
      </div>
    </div>
  );
};
