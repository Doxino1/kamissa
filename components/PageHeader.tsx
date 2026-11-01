// En-tête de page « Racines » : petit sur-titre facultatif, titre en très
// grandes capitales serif, ligne en italique ; le contenu de droite (filtres,
// navigation…) se range en bas à droite et passe dessous sur petit écran.
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
  bordered = true,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  bordered?: boolean;
}) {
  return (
    <section
      className={`mx-auto flex max-w-[1360px] flex-wrap items-end justify-between gap-x-6 gap-y-4 px-4 pb-[18px] pt-4 md:px-10 md:pt-6 ${
        bordered ? "border-b border-foreground" : ""
      }`}
    >
      <div className="min-w-0">
        {eyebrow}
        <h1 className="break-words pt-[0.12em] font-display text-[clamp(3.25rem,12vw,7.5rem)] uppercase leading-none">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 font-display text-[clamp(1.375rem,4vw,2.25rem)] italic leading-tight">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

// Onglet Racines : grand serif, l'actif en italique, les autres grisés. Le
// soulignement se pose sur le libellé seul (tabLabelClass), pas sur le numéro.
export function serifTabClass(active: boolean, size = "md:text-[36px]") {
  return `flex min-h-11 items-baseline gap-2.5 font-display text-[28px] transition ${size} ${
    active ? "italic text-foreground" : "text-muted-strong hover:text-foreground"
  }`;
}

export function tabLabelClass(active: boolean) {
  return active ? "underline decoration-1 underline-offset-8" : "";
}

export const TAB_NUMBER = "shrink-0 whitespace-nowrap font-sans text-xs not-italic tracking-[0.12em] text-foreground-muted";

export function tabNumber(n: number) {
  return `( ${String(n).padStart(2, "0")} )`;
}
