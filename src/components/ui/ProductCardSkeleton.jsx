import Skeleton from './Skeleton';

/**
 * ProductCardSkeleton — Placeholder for a single product card
 * Matches the dimensions of ProductCard (4:5 image + info block below).
 */
export default function ProductCardSkeleton({ className = '' }) {
  return (
    <div className={`bg-white rounded-xl overflow-hidden border border-stone-200/80 ${className}`}>
      {/* Image area — 4:5 aspect ratio */}
      <Skeleton className="!w-full !aspect-[4/5] !rounded-none !bg-stone-100" />
      {/* Info area */}
      <div className="p-3 space-y-2">
        <Skeleton className="!w-16 !h-2.5 !rounded !bg-stone-200" />
        <Skeleton className="!w-32 !h-3.5 !rounded !bg-stone-200" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="!w-10 !h-4 !rounded-sm !bg-stone-200" />
          <Skeleton className="!w-8 !h-2.5 !rounded !bg-stone-200" />
        </div>
        <Skeleton className="!w-24 !h-5 !rounded !bg-stone-200" />
        <Skeleton className="!w-full !h-9 !rounded-lg !bg-stone-100" />
      </div>
    </div>
  );
}

/**
 * ProductGridSkeleton — Grid of product card skeletons
 * @param {number} count - Number of skeleton cards (default: 8)
 * @param {string} gridClass - Tailwind grid classes (default: grid-cols-2 md:grid-cols-4)
 */
export function ProductGridSkeleton({ count = 8, gridClass = 'grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6' }) {
  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
