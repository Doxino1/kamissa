"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SaveButtons } from "@/components/SaveButtons";
import { Share2 } from "lucide-react";
import { CalendarButtons } from "@/components/CalendarButtons";
import { ShareButton } from "@/components/ShareButton";
import { EventTypeBadge } from "@/components/EventTypeBadge";
import { CostBadge } from "@/components/CostBadge";
import { useEvents } from "@/lib/use-events";
import { formatInVille } from "@/lib/timezone";
import { localizedTitle, localizedDescription } from "@/lib/localize-event";
import { useSavedEvents } from "@/lib/use-saved-events";
import { useGoingFollows } from "@/lib/use-going-follows";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/context";
import { BackLink, PageHeader } from "@/components/PageHeader";
import { LinkifiedText } from "@/components/LinkifiedText";
import { TEXT_ACTION } from "@/lib/form-styles";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { events, loading, error } = useEvents();
  const { saved, setStatus, canSave } = useSavedEvents();
  const { locale, t } = useLocale();
  const [userId, setUserId] = useState<string | null>(null);
  const [isModerator, setIsModerator] = useState(false);
  const goingFollows = useGoingFollows(id, userId);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      setUserId(user?.id ?? null);
      if (!user) return;
      const { data } = await supabase.from("profiles").select("is_moderator").eq("id", user.id).single();
      if (active) setIsModerator(data?.is_moderator === true);
    }

    loadUser();
    return () => {
      active = false;
    };
  }, []);

  const event = events.find((e) => e.id === id);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1360px] px-4 py-10 md:px-10">
        <p className="text-sm text-foreground-muted">{t.common.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-[1360px] px-4 py-10 md:px-10">
        <p className="text-sm text-danger">{t.eventDetail.loadError(error)}</p>
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
    <div className="pb-16">
      <PageHeader
        eyebrow={
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <BackLink href="/">{t.eventDetail.back}</BackLink>
            <EventTypeBadge type={event.type} />
            {event.coutType && <CostBadge type={event.coutType} />}
          </div>
        }
        title={localizedTitle(event, locale)}
        compact
        subtitle={t.villeLabels[event.ville]}
      />

      <main className="mx-auto flex max-w-[1360px] flex-wrap gap-x-14 gap-y-8 px-4 pt-8 md:px-10">
        <div className="min-w-0 flex-[999_1_480px]">
          <p className="whitespace-pre-line font-display text-2xl leading-snug md:text-[28px]">
            <LinkifiedText text={localizedDescription(event, locale)} />
          </p>

          {event.type === "annonce" && (
            <p className="mt-6 border-l-2 border-foreground pl-4 text-sm text-text-soft">
              {t.eventDetail.annonceDisclaimer}
            </p>
          )}
        </div>

        <aside className="min-w-0 flex-[1_1_300px] md:max-w-[380px]">
          <div className="border-t border-foreground">
            <div className="border-b border-border py-4">
              <p className="font-display text-2xl leading-tight first-letter:uppercase">{date}</p>
              {event.dateFin && (
                <p className="mt-1 text-[15px] text-text-soft">
                  {t.evenements.until(
                    formatInVille(event.dateFin, event.ville, { day: "numeric", month: "long", year: "numeric" }, locale)
                  )}
                </p>
              )}
            </div>
            <div className="border-b border-border py-4">
              <p className="font-display text-2xl leading-tight">{event.lieu}</p>
            </div>
            {event.coutDetail && (
              <div className="border-b border-border py-4">
                <p className="text-[15px] text-text-soft">{event.coutDetail}</p>
              </div>
            )}
          </div>

          {goingFollows.length > 0 && (
            <p className="mt-5 text-sm text-text-soft">
              {t.eventDetail.goingFollows(
                goingFollows.map((f) => f.nom).join(", "),
                goingFollows.length
              )}
            </p>
          )}

          <div className="mt-6">
            {canSave ? (
              <SaveButtons status={saved[event.id]} onChange={(status) => setStatus(event.id, status)} />
            ) : (
              <Link href="/login" className={TEXT_ACTION}>
                {t.saveButtons.loginToSave}
              </Link>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-start gap-2">
            <CalendarButtons event={event} />
            <ShareButton
              path={`/events/${event.id}`}
              title={localizedTitle(event, locale)}
              align="left"
              className="flex min-h-10 items-center gap-1.5 rounded-full border border-foreground px-4 text-xs font-semibold uppercase tracking-[0.08em] transition hover:bg-surface-hover"
            >
              <Share2 size={14} strokeWidth={1.75} />
              {t.common.share}
            </ShareButton>
          </div>

          {isModerator && (
            <Link href={`/evenements/${event.id}/modifier`} className={`${TEXT_ACTION} mt-6 inline-flex items-center`}>
              {t.moderation.edit}
            </Link>
          )}
        </aside>
      </main>
    </div>
  );
}
