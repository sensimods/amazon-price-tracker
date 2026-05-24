import { Skeleton } from "@/components/ui/skeleton";

export default function PricesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border">
          <div className="border-b p-4">
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="p-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-4 border-b py-3 last:border-b-0">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}