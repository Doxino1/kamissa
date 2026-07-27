"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SaveButtons } from "@/components/SaveButtons";
import { CalendarButtons } from "@/components/CalendarButtons";
import { EventTypeBadge } from "@/components/EventTypeBadge";
import { CostBadge } from "@/components/CostBadge";
import { useEvents } from "@/lib/use-events";
import { formatInVille } from "@/lib/timezone";
import { localizedTitle, localizedDescription } from "@/lib/localize-event";
import { useSavedEvents } from "@/lib/use-saved-events";
import { useGoingFollows } from "@/lib/use-going-follows";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/context";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { events, loading, error } = useEvents();
  const { saved, setStatus, canSave } = useSavedEvents();
  const { locale, t } = useLocale();
  const [userId, setUserId] = useState<string | null>(null);
  const goingFollows = useGoingFollows(id, userId);

  useEffect(() => {
    let active = true;
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (active) setUserId(user?.id ?? null);
      });
    return () => {
      active = false;
    };
  }, []);

  const event = events.find((e) => e.id === id);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <p className="text-sm text-foreground-muted">{t.common.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <p className="text-sm text-red-600">{t.eventDetail.loadError(error)}</p>
      </div>
    );
  }

  if (!event) notFound();

  const date = formatInVille(
    event.date,
    event.ville,
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
    locale
  );

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link href="/" className="flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground">
        <ArrowLeft size={14} strokeWidth={1.75} />
        {t.eventDetail.back}
      </Link>

      <div className="mt-4 flex items-center justify-between gap-2 text-xs text-foreground-muted">
        <div className="flex items-center gap-1.5">
          <EventTypeBadge type={event.type} />
          {event.coutType && <CostBadge type={event.coutType} />}
        </div>
        <span>{t.villeLabels[event.ville]}</span>
      </div>

      <h1 className="mt-3 text-2xl font-semibold">{localizedTitle(event, locale)}</h1>
      <p className="mt-1 text-sm text-foreground-muted">{date}</p>
      <p className="mt-1 text-sm text-foreground-muted">{event.lieu}</p>
      {event.coutDetail && <p className="mt-1 text-sm text-foreground-muted">{event.coutDetail}</p>}

      <p className="mt-6 text-base leading-relaxed">{localizedDescription(event, locale)}</p>

      {event.type === "annonce" && (
        <p className="mt-4 rounded-lg bg-foreground/5 px-3 py-2 text-xs text-foreground-muted">
          {t.eventDetail.annonceDisclaimer}
        </p>
      )}

      {goingFollows.length > 0 && (
        <p className="mt-4 text-sm text-foreground-muted">
          {t.eventDetail.goingFollows(
            goingFollows.map((f) => f.nom).join(", "),
            goingFollows.length
          )}
        </p>
      )}

      <div className="mt-6">
        <CalendarButtons event={event} />
      </div>

      <div className="mt-6">
        {canSave ? (
          <SaveButtons status={saved[event.id]} onChange={(status) => setStatus(event.id, status)} />
        ) : (
          <Link href="/login" className="text-sm text-foreground/40 hover:text-foreground-muted">
            {t.saveButtons.loginToSave}
          </Link>
        )}
      </div>
    </div>
  );
}
