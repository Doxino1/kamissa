export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse rounded-lg bg-surface p-4 shadow-soft">
          <div className="flex items-center justify-between gap-2">
            <div className="h-4 w-20 rounded-full bg-foreground/10" />
            <div className="h-3 w-16 rounded bg-foreground/10" />
          </div>
          <div className="mt-3 h-4 w-3/4 rounded bg-foreground/10" />
          <div className="mt-2 h-3 w-1/2 rounded bg-foreground/10" />
          <div className="mt-4 h-7 w-24 rounded-lg bg-foreground/10" />
        </div>
      ))}
    </>
  );
}
