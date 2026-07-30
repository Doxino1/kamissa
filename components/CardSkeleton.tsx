export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-lg border border-border bg-surface px-5 py-[18px]">
          <div className="h-[18px] w-20 animate-pulse rounded-full bg-border" />
          <div className="mt-3.5 h-4 w-[70%] animate-pulse rounded-md bg-border" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded-md bg-border" />
        </div>
      ))}
    </>
  );
}
