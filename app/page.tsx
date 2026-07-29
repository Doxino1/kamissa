"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { List, Map as MapIcon, Bookmark, Store, Plus } from "lucide-react";
import { EventCard } from "@/components/EventCard";
import { EventFilterBar } from "@/components/EventFilterBar";
import { HomeGreeting } from "@/components/HomeGreeting";
import { useEvents } from "@/lib/use-events";
import { useEventFilters } from "@/lib/use-event-filters";
import { useMediaQuery } from "@/lib/use-media-query";
import { useSavedEvents } from "@/lib/use-saved-events";
import { createClient } from "@/lib/supabase/client";
import { formatInVille } from "@/lib/timezone";
import { useT } from "@/lib/i18n/context";
import { Ville } from "@/lib/types";

const EventMap = dynamic(() => import("@/components/EventMap").then((m) => m.EventMap), {
  ssr: false,
});

type ViewMode = "liste" | "carte";
type SubmissionStatut = "en_attente" | "publie";

interface MySubmission {
  id: string;
  titre: string;
  ville: Ville;
  date: string;
  statut: SubmissionStatut;
}

export default function EvenementsPage() {
  const t = useT();
  const { events: allEvents, loading, error } = useEvents();
  const { saved } = useSavedEvents();

  const [view, setView] = useState<ViewMode>("liste");
  const [showSaved, setShowSaved] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [userId, setUserId] = useState<string | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [submissions, setSubmissions] = useState<MySubmission[] | null>(null);
  const [now] = useState(() => Date.now());
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  const filters = useEventFilters(allEvents, now);
  const { ville, events } = filters;

  useEffect(() => {
    let active = true;
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (!active) return;
        setUserId(user?.id ?? null);
        setCheckingUser(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!showSaved || !userId) return;
    let active = true;
    createClient()
      .from("events")
      .select("id, titre, ville, date, statut")
      .eq("soumis_par", userId)
      .order("date", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setSubmissions((data ?? []) as MySubmission[]);
      });
    return () => {
      active = false;
    };
  }, [showSaved, userId]);

  const savedEvents = allEvents
    .filter((e) => saved[e.id] === "sauvegarde")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const goingEvents = allEvents
    .filter((e) => saved[e.id] === "je_viens")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;
  const eventsThisWeekCount = allEvents.filter(
    (e) => e.ville === ville && new Date(e.date).getTime() >= now && new Date(e.date).getTime() <= weekFromNow
  ).length;
  const nextGoingEvent = goingEvents.find((e) => new Date(e.date).getTime() >= now) ?? null;
  const showList = isDesktop || view === "liste";
  const showMap = isDesktop || view === "carte";

  return (
    <div className="relative mx-auto w-full max-w-2xl px-4 py-8 md:max-w-none md:px-6 md:py-4">
      <div className="flex items-center justify-between gap-2 md:hidden">
        <h1 className="font-display text-xl font-semibold">{t.nav.evenements}</h1>
        {!checkingUser && !userId && (
          <Link href="/login" className="text-sm text-accent hover:opacity-80">
            {t.nav.connexion}
          </Link>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 md:hidden">
        <div className="flex items-center gap-1 rounded-full bg-surface p-1">
          <button
            onClick={() => {
              setShowSaved(false);
              setView("liste");
            }}
            aria-label={t.evenements.tabTous}
            title={t.evenements.tabTous}
            className={`flex items-center justify-center rounded-full p-2 transition ${
              !showSaved && view === "liste"
                ? "bg-accent text-accent-foreground"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            <List size={18} strokeWidth={1.75} />
          </button>
          <button
            onClick={() => {
              setShowSaved(false);
              setView("carte");
            }}
            aria-label={t.evenements.tabCarte}
            title={t.evenements.tabCarte}
            className={`flex items-center justify-center rounded-full p-2 transition ${
              !showSaved && view === "carte"
                ? "bg-accent text-accent-foreground"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            <MapIcon size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSaved((s) => !s)}
            aria-label={t.evenements.tabMes}
            title={t.evenements.tabMes}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
              showSaved
                ? "bg-accent text-accent-foreground"
                : "border border-foreground/20 text-foreground-muted hover:text-foreground"
            }`}
          >
            <Bookmark size={16} strokeWidth={1.75} />
          </button>
          <Link
            href="/boutiques"
            aria-label={t.shops.title}
            title={t.shops.title}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/20 text-foreground-muted hover:text-foreground md:hidden"
          >
            <Store size={16} strokeWidth={1.75} />
          </Link>
        </div>
      </div>

      {!showSaved && (
        <>
          <div className="mt-4 md:hidden">
            <EventFilterBar filters={filters} />
          </div>

          <div className="hidden md:mb-3 md:flex md:justify-center">
            <div className="w-full max-w-xl">
              <EventFilterBar filters={filters} />
            </div>
          </div>
        </>
      )}

      <div className="md:flex md:h-[calc(100vh-10rem)] md:flex-col md:overflow-hidden md:rounded-2xl md:border md:border-foreground/10 md:shadow-soft">
        <div className="hidden shrink-0 items-center justify-between border-b border-foreground/10 px-4 py-3 md:flex">
          <h2 className="font-display text-lg font-semibold">{t.nav.evenements}</h2>
          {!checkingUser && !userId ? (
            <Link href="/login" className="text-sm text-accent hover:opacity-80">
              {t.nav.connexion}
            </Link>
          ) : (
            <button
              onClick={() => setShowSaved((s) => !s)}
              aria-label={t.evenements.tabMes}
              title={t.evenements.tabMes}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                showSaved
                  ? "bg-accent text-accent-foreground"
                  : "border border-foreground/20 text-foreground-muted hover:text-foreground"
              }`}
            >
              <Bookmark size={16} strokeWidth={1.75} />
              {t.evenements.tabMes}
            </button>
          )}
        </div>

        {!showSaved && (
          <div className="md:flex md:min-h-0 md:flex-1 md:items-stretch">
            <div className="md:h-full md:w-[42%] md:shrink-0 md:overflow-y-auto md:p-4">
              {userId && (
                <div className="mt-4 md:mt-0">
                  <HomeGreeting
                    userId={userId}
                    ville={ville}
                    eventsThisWeekCount={eventsThisWeekCount}
                    nextGoingEvent={nextGoingEvent}
                  />
                </div>
              )}

              {showList && (
                <div className="flex flex-col gap-3">
                  {loading && <p className="text-sm text-foreground-muted">{t.common.loading}</p>}
                  {error && <p className="text-sm text-red-600">{t.evenements.loadError(error)}</p>}
                  {!loading && !error && events.length === 0 && (
                    <p className="text-sm text-foreground-muted">{t.evenements.noResults}</p>
                  )}
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      highlighted={hoveredEventId === event.id}
                      onMouseEnter={() => setHoveredEventId(event.id)}
                      onMouseLeave={() => setHoveredEventId(null)}
                    />
                  ))}
                </div>
              )}
            </div>

            {showMap && (
              <div className="mt-4 md:mt-0 md:h-full md:flex-1">
                <EventMap
                  key={ville}
                  events={events}
                  ville={ville}
                  hoveredEventId={hoveredEventId}
                  onHoverEvent={setHoveredEventId}
                />
              </div>
            )}
          </div>
        )}

        {showSaved && (
          <div className="mt-4 md:mt-0 md:min-h-0 md:flex-1 md:overflow-y-auto md:p-4">
            {checkingUser && <p className="text-sm text-foreground-muted">{t.common.loading}</p>}

            {!checkingUser && !userId && (
              <p className="text-sm text-foreground-muted">
                <Link href="/login" className="underline hover:text-foreground">
                  {t.evenements.loginLink}
                </Link>{" "}
                {t.evenements.loginToSee}
              </p>
            )}

            {!checkingUser && userId && (
              <>
                <section>
                  <h2 className="text-sm font-medium text-foreground-muted">{t.evenements.jeViens}</h2>
                  <div className="mt-3 flex flex-col gap-3">
                    {goingEvents.length === 0 && (
                      <p className="text-sm text-foreground-muted">{t.evenements.noneYet}</p>
                    )}
                    {goingEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </section>

                <section className="mt-8">
                  <h2 className="text-sm font-medium text-foreground-muted">{t.evenements.sauvegardes}</h2>
                  <div className="mt-3 flex flex-col gap-3">
                    {savedEvents.length === 0 && (
                      <p className="text-sm text-foreground-muted">{t.evenements.noneYet}</p>
                    )}
                    {savedEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </section>

                <section className="mt-8">
                  <h2 className="text-sm font-medium text-foreground-muted">{t.evenements.mesSoumissions}</h2>
                  <div className="mt-3 flex flex-col gap-3">
                    {submissions === null && (
                      <p className="text-sm text-foreground-muted">{t.common.loading}</p>
                    )}
                    {submissions !== null && submissions.length === 0 && (
                      <p className="text-sm text-foreground-muted">{t.evenements.noSubmissions}</p>
                    )}
                    {(submissions ?? []).map((s) => (
                      <div key={s.id} className="rounded-lg bg-surface p-4 shadow-soft">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-medium">{s.titre}</h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              s.statut === "publie"
                                ? "bg-green-600/10 text-green-700"
                                : "bg-foreground/5 text-foreground-muted"
                            }`}
                          >
                            {s.statut === "publie"
                              ? t.evenements.statutPublie
                              : t.evenements.statutEnAttente}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-foreground-muted">
                          {t.villeLabels[s.ville]} ·{" "}
                          {formatInVille(s.date, s.ville, {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <div className="mt-2 flex gap-3 text-xs">
                          <Link
                            href={`/evenements/${s.id}/modifier`}
                            className="text-foreground-muted underline hover:text-foreground"
                          >
                            {t.evenements.editLink}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </div>

      {userId && (
        <Link
          href="/evenements/nouveau"
          aria-label={t.evenements.proposer}
          title={t.evenements.proposer}
          className="fixed bottom-24 right-4 z-[1000] flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-medium text-accent-foreground shadow-soft transition hover:opacity-90 md:bottom-8 md:right-8"
        >
          <Plus size={20} strokeWidth={2} />
          {t.evenements.proposer}
        </Link>
      )}
    </div>
  );
}
