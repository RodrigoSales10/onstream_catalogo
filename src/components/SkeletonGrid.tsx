import React from "react";

interface SkeletonGridProps {
  count?: number;
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({ count = 18 }) => {
  return (
    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 w-full">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col w-full rounded-2xl bg-slate-900/60 border border-white/5 overflow-hidden"
        >
          <div className="w-full aspect-[2/3] skeleton-shimmer" />
          <div className="p-3 flex flex-col gap-2">
            <div className="h-3.5 w-3/4 rounded bg-white/5 skeleton-shimmer" />
            <div className="h-2.5 w-1/2 rounded bg-white/5 skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
};
