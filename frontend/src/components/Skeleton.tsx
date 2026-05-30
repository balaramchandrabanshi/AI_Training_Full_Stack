interface SkeletonProps {
  className?: string;
}

export function SkeletonBase({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-slate-800 rounded-lg ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <SkeletonBase className="w-12 h-12" />
        <SkeletonBase className="w-24 h-6 rounded-full" />
      </div>
      <SkeletonBase className="w-3/4 h-6" />
      <SkeletonBase className="w-full h-12" />
      <div className="border-t border-slate-800 pt-4 flex gap-4">
        <SkeletonBase className="w-20 h-8" />
        <SkeletonBase className="w-20 h-8" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex justify-between">
        <SkeletonBase className="w-1/4 h-5" />
        <SkeletonBase className="w-12 h-5" />
      </div>
      <div className="p-6 space-y-4">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex items-center gap-4 py-2">
            <SkeletonBase className="w-8 h-8 rounded-lg flex-shrink-0" />
            {Array.from({ length: cols - 1 }).map((_, cIdx) => (
              <SkeletonBase
                key={cIdx}
                className={`h-5 ${
                  cIdx === 0
                    ? 'w-1/3'
                    : cIdx === 1
                    ? 'w-1/6'
                    : 'w-1/12'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {Array.from({ length: 8 }).map((_, idx) => (
        <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center justify-between">
          <div className="space-y-2 flex-1 mr-4">
            <SkeletonBase className="w-20 h-4" />
            <SkeletonBase className="w-16 h-8" />
          </div>
          <SkeletonBase className="w-12 h-12 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}
