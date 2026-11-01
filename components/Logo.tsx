// Logo « Racines » : le nom en serif, surmontant trois carrés ocre, sauge et
// ardoise (les trois premiers accents terre de la palette).
export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const square = size === "lg" ? "h-[14px] w-[14px]" : "h-2 w-2";
  return (
    <span className="flex flex-col items-center gap-1.5 text-foreground">
      <span className={`font-display leading-none ${size === "lg" ? "text-[30px]" : "text-[26px] md:text-[30px]"}`}>Kamissa</span>
      <LogoSquares className={square} />
    </span>
  );
}

export function LogoSquares({ className = "h-2 w-2" }: { className?: string }) {
  return (
    <span aria-hidden="true" className="flex gap-[5px]">
      <span className={`${className} bg-cat-atelier`} />
      <span className={`${className} bg-cat-residence`} />
      <span className={`${className} bg-cat-expo`} />
    </span>
  );
}
