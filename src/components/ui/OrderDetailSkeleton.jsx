import Skeleton from './Skeleton';

/**
 * OrderDetailSkeleton — Full order detail page skeleton
 * Matches the redesigned card-based OrderDetailPage layout with stone/amber theme.
 */
export default function OrderDetailSkeleton() {
  return (
    <div className="min-h-screen bg-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Breadcrumb */}
        <div className="flex gap-2 mb-6">
          <Skeleton className="!w-12 !h-4 !rounded-md" />
          <Skeleton className="!w-8 !h-4 !rounded-md" />
          <Skeleton className="!w-16 !h-4 !rounded-md" />
          <Skeleton className="!w-8 !h-4 !rounded-md" />
          <Skeleton className="!w-24 !h-4 !rounded-md" />
        </div>

        {/* Order Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <Skeleton className="!w-36 !h-3 !rounded-md mb-2" />
            <Skeleton className="!w-48 !h-8 !rounded-lg" />
          </div>
          <Skeleton className="!w-24 !h-7 !rounded-full" />
        </div>

        {/* Timeline Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 md:p-7 mb-6 shadow-sm">
          <Skeleton className="!w-36 !h-5 !rounded-md mb-5" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 md:gap-4">
                <Skeleton className="!w-8 !h-8 !rounded-full shrink-0" />
                {i < 3 && <Skeleton className="!w-0.5 !h-8 md:!h-10 shrink-0" />}
                <Skeleton className="!w-32 !h-4 !rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Items Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 md:p-7 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Skeleton className="!w-24 !h-5 !rounded-md" />
              <Skeleton className="!w-10 !h-4 !rounded-md" />
            </div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-stone-200">
                <Skeleton className="!w-14 !h-14 md:!w-16 md:!h-16 !rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="!w-48 !h-4 !rounded-md" />
                  <Skeleton className="!w-24 !h-3 !rounded-md" />
                </div>
                <div className="text-center shrink-0">
                  <Skeleton className="!w-8 !h-4 !rounded-md mb-1" />
                  <Skeleton className="!w-6 !h-5 !rounded-md mx-auto" />
                </div>
                <div className="text-right shrink-0 min-w-[80px]">
                  <Skeleton className="!w-12 !h-4 !rounded-md mb-1" />
                  <Skeleton className="!w-16 !h-5 !rounded-md" />
                  <Skeleton className="!w-14 !h-3 !rounded-md mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="!w-28 !h-3 !rounded-md mb-2" />
              <Skeleton className="!w-36 !h-7 !rounded-md" />
            </div>
            <Skeleton className="!w-28 !h-9 !rounded-md" />
          </div>
        </div>

        {/* Subscription Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 md:p-7 mt-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Skeleton className="!w-10 !h-10 !rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="!w-40 !h-5 !rounded-md" />
              <Skeleton className="!w-56 !h-3 !rounded-md" />
            </div>
            <Skeleton className="!w-5 !h-5 !rounded-md shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
