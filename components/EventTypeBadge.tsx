"use client";

import { useT } from "@/lib/i18n/context";
import { EventType } from "@/lib/types";

// Carré de couleur par catégorie (accents terre de la direction Racines),
// réutilisé pour les repères de carte et les pastilles du calendrier.
export const EVENT_TYPE_SQUARE_STYLES: Record<EventType, string> = {
  vernissage: "bg-cat-vernissage",
  workshop: "bg-cat-atelier",
  open_call: "bg-cat-open-call",
  expo: "bg-cat-expo",
  residency: "bg-cat-residence",
  annonce: "bg-cat-annonce",
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  vernissage: "var(--cat-vernissage)",
  workshop: "var(--cat-atelier)",
  open_call: "var(--cat-open-call)",
  expo: "var(--cat-expo)",
  residency: "var(--cat-residence)",
  annonce: "var(--cat-annonce)",
};

export function EventTypeBadge({ type }: { type: EventType }) {
  const t = useT();
  const label = t.eventTypeLabels[type] ?? type;

  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-foreground">
      <span aria-hidden="true" className={`h-[9px] w-[9px] shrink-0 ${EVENT_TYPE_SQUARE_STYLES[type] ?? "bg-cat-annonce"}`} />
      {label}
    </span>
  );
}
