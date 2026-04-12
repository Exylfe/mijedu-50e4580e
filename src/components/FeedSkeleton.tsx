import { Skeleton } from '@/components/ui/skeleton';

const PostSkeleton = () => (
  <div className="rounded-2xl border border-border bg-card p-4 space-y-3 card-shadow">
    {/* Header: avatar + name */}
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-2.5 w-20" />
      </div>
      <Skeleton className="h-3 w-12" />
    </div>
    {/* Content lines */}
    <div className="space-y-2">
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-4/5" />
      <Skeleton className="h-3.5 w-3/5" />
    </div>
    {/* Action buttons row */}
    <div className="flex items-center gap-6 pt-2">
      <Skeleton className="h-8 w-16 rounded-full" />
      <Skeleton className="h-8 w-16 rounded-full" />
      <Skeleton className="h-8 w-16 rounded-full" />
    </div>
  </div>
);

const ProductSkeleton = () => (
  <div className="rounded-2xl border border-border bg-card overflow-hidden card-shadow">
    <Skeleton className="aspect-square w-full" />
    <div className="p-3 space-y-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-4 w-20" />
    </div>
  </div>
);

const ExploreSkeleton = () => (
  <div className="space-y-4">
    {/* Horizontal scroll cards */}
    <div className="flex gap-3 overflow-hidden">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex-shrink-0 w-28 p-3 rounded-xl border border-border space-y-2">
          <Skeleton className="w-10 h-10 rounded-full mx-auto" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-2.5 w-16 mx-auto" />
        </div>
      ))}
    </div>
    {/* Category cards */}
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-20 w-full rounded-xl" />
    ))}
  </div>
);

export const FeedSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <PostSkeleton key={i} />
    ))}
  </div>
);

export const MarketSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-2 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <ProductSkeleton key={i} />
    ))}
  </div>
);

export { ExploreSkeleton };
export default FeedSkeleton;
