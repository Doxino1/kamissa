// Champs de formulaire « Racines » : soulignés, saisie en serif ; les zones de
// texte longues gardent un cadre fin. Partagés par les fenêtres d'ajout.
export const FIELD_INPUT =
  "min-h-12 w-full border-0 border-b border-foreground bg-transparent font-display text-2xl text-foreground outline-none placeholder:text-muted-strong focus:border-b-2 md:text-[26px]";

export const FIELD_TEXTAREA =
  "w-full border border-border bg-transparent px-3 py-2.5 font-display text-[22px] leading-snug text-foreground outline-none placeholder:text-muted-strong focus:border-foreground";

export const FIELD_LABEL = "text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-muted";

export const FIELD_HINT = "text-xs text-foreground-muted";

export const PRIMARY_BUTTON =
  "min-h-14 rounded-full bg-foreground px-8 text-[13px] font-semibold uppercase tracking-[0.12em] text-background transition hover:bg-accent-hover disabled:opacity-50";

export const FIELD = "flex flex-col gap-1";

export const FILE_INPUT =
  "text-sm text-foreground-muted file:mr-3 file:min-h-10 file:cursor-pointer file:rounded-full file:border file:border-foreground file:bg-transparent file:px-[18px] file:text-xs file:font-semibold file:uppercase file:tracking-[0.1em] file:text-foreground hover:file:bg-surface-hover";

export const SECONDARY_BUTTON =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-foreground px-[22px] text-xs font-semibold uppercase tracking-[0.1em] text-foreground transition hover:bg-surface-hover disabled:opacity-50";

// Action discrète sous un élément de liste (supprimer, débloquer…).
export const TEXT_ACTION =
  "min-h-8 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-muted underline-offset-4 hover:text-foreground hover:underline";

export const DANGER_ACTION =
  "min-h-8 text-[11px] font-semibold uppercase tracking-[0.12em] text-danger underline-offset-4 hover:underline";

// Sections de page séparées par des filets, titre en serif.
export const SECTION = "border-b border-border pb-8 pt-7";
export const SECTION_TITLE = "mb-[18px] font-display text-[34px] leading-none md:text-[40px]";

// Petit texte secondaire (libellés de métadonnées sous une œuvre, dates…).
export const META = "text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-muted";
