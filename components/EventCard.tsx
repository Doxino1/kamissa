"use client";

import Link from "next/link";
import { SaveButtons } from "./SaveButtons";
import { EventTypeBadge } from "./EventTypeBadge";
import { CostBadge } from "./CostBadge";
import { ArtEvent } from "@/lib/types";
import { formatInVille } from "@/lib/timezone";
import { localizedTitle } from "@/lib/localize-event";
import { useSavedEvents } from "@/lib/use-saved-events";
import { useLocale } from "@/lib/i18n/context";

export function EventCard({
  event,
  highlighted,
  onMouseEnter,
  onMouseLeave,
}: {
  event: ArtEvent;
  highlighted?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const { saved, setStatus, canSave } = useSavedEvents();
  const { locale, t } = useLocale();

  const date = formatInVille(
    event.date,
    event.ville,
    { weekday: "short", day: "numeric", month: "short" },
    locale
  );

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`rounded-lg bg-surface p-4 shadow-soft transition hover:-translate-y-0.5 ${
        highlighted ? "ring-2 ring-accent" : ""
      }`}
    >
      <Link href={`/events/${event.id}`} className="block">
        <div className="flex items-center justify-between gap-2 text-xs text-foreground-muted">
          <div className="flex items-center gap-1.5">
            <EventTypeBadge type={event.type} />
            {event.coutType && <CostBadge type={event.coutType} />}
          </div>
          <span>{date}</span>
        </div>
        <h3 className="mt-2 font-medium">{localizedTitle(event, locale)}</h3>
        <p className="mt-1 text-sm text-foreground-muted">
          {t.villeLabels[event.ville]} · {t.disciplineLabels[event.discipline] ?? event.discipline}
        </p>
      </Link>
      <div className="mt-3">
        {canSave ? (
          <SaveButtons status={saved[event.id]} onChange={(status) => setStatus(event.id, status)} />
        ) : (
          <Link href="/login" className="text-xs text-foreground/40 hover:text-foreground-muted">
            {t.saveButtons.loginToSave}
          </Link>
        )}
      </div>
    </div>
  );
}
