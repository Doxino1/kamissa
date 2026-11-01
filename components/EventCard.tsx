"use client";

import Link from "next/link";
import { Share2 } from "lucide-react";
import { SaveButtons } from "./SaveButtons";
import { EventTypeBadge } from "./EventTypeBadge";
import { ArtEvent } from "@/lib/types";
import { formatInVille } from "@/lib/timezone";
import { localizedTitle } from "@/lib/localize-event";
import { useSavedEvents } from "@/lib/use-saved-events";
import { useLocale } from "@/lib/i18n/context";
import { useToast } from "@/lib/toast-context";

// Numéro de ligne façon Racines : ( 01 ), ( 02 )… — le même que sur le repère
// de la carte.
export function rowNumber(n: number) {
  return `( ${String(n).padStart(2, "0")} )`;
}

// Ligne d'événement « Racines » : pas de carte, un filet sous chaque entrée ;
// le survol (ou le repère survolé sur la carte) teinte légèrement le fond.
export function EventCard({
  event,
  index,
  highlighted,
  onMouseEnter,
  onMouseLeave,
}: {
  event: ArtEvent;
  index?: number;
  highlighted?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const { saved, setStatus, canSave } = useSavedEvents();
  const { locale, t } = useLocale();
  const { showToast } = useToast();

  function handleShare() {
    const url = `${window.location.origin}/events/${event.id}`;
    navigator.clipboard.writeText(url).then(() => showToast(t.toast.linkCopied));
  }

  const date = formatInVille(
    event.date,
    event.ville,
    { weekday: "short", day: "numeric", month: "short" },
    locale
  );

  return (
    <article
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`border-b border-border py-[22px] transition-colors ${highlighted ? "bg-surface-hover" : ""}`}
    >
      <Link href={`/events/${event.id}`} className="block">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            {index !== undefined && (
              <span className="text-xs tracking-[0.1em] text-foreground-muted">{rowNumber(index)}</span>
            )}
            <EventTypeBadge type={event.type} />
          </span>
          <span className="text-xs uppercase tracking-[0.08em] text-foreground-muted">{date}</span>
        </div>
        <h3 className="mt-2.5 font-display text-[26px] leading-[1.05] md:text-[32px]">
          {localizedTitle(event, locale)}
        </h3>
        <p className="mt-1.5 text-sm text-foreground-muted">
          {t.villeLabels[event.ville]} · {t.disciplineLabels[event.discipline] ?? event.discipline}
          {event.coutType && (
            <>
              {" · "}
              <span className="font-semibold text-foreground">{t.coutLabels[event.coutType]}</span>
            </>
          )}
        </p>
      </Link>
      <div className="mt-3.5 flex items-center gap-2.5">
        {canSave ? (
          <SaveButtons status={saved[event.id]} onChange={(status) => setStatus(event.id, status)} />
        ) : (
          <Link href="/login" className="flex-1 text-xs text-foreground-muted underline-offset-4 hover:underline">
            {t.saveButtons.loginToSave}
          </Link>
        )}
        <button
          type="button"
          onClick={handleShare}
          aria-label={t.common.share}
          title={t.common.share}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition hover:border-foreground"
        >
          <Share2 size={14} strokeWidth={1.75} />
        </button>
      </div>
    </article>
  );
}
