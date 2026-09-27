import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 bg-slate-800 rounded-md" />
        <div className="w-10 h-10 rounded-xl bg-slate-800" />
      </div>
      <div className="h-8 w-20 bg-slate-800 rounded-md" />
      <div className="h-3 w-40 bg-slate-800/60 rounded-md" />
    </div>
  );
};

export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className="space-y-3 animate-pulse py-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-800 rounded-md"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
};
