export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="border-b border-border py-[22px]">
          <div className="h-3 w-28 animate-pulse bg-border" />
          <div className="mt-3.5 h-7 w-[70%] animate-pulse bg-border" />
          <div className="mt-2.5 h-3 w-1/2 animate-pulse bg-border" />
        </div>
      ))}
    </>
  );
}
