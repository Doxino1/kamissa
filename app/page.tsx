"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { List, Map as MapIcon, Bookmark, Store, Plus, X } from "lucide-react";
import { EventCard } from "@/components/EventCard";
import { EventFilterBar } from "@/components/EventFilterBar";
import { HomeGreeting } from "@/components/HomeGreeting";
import { CardSkeleton } from "@/components/CardSkeleton";
import { AddEventModal } from "@/components/AddEventModal";
import { NotificationBell } from "@/components/NotificationBell";
import { useEvents } from "@/lib/use-events";
import { useEventFilters } from "@/lib/use-event-filters";
import { useMediaQuery } from "@/lib/use-media-query";
import { useMinimumLoading } from "@/lib/use-minimum-loading";
import { useSavedEvents } from "@/lib/use-saved-events";
import { createClient } from "@/lib/supabase/client";
import { formatInVille } from "@/lib/timezone";
import { useT } from "@/lib/i18n/context";
import { Ville } from "@/lib/types";

const PAGE_SIZE = 6;
const PROFILE_BANNER_KEY = "kamissa_hide_profile_banner";

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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(true);

  const filters = useEventFilters(allEvents, now);
  const { ville, types, disciplines, cout, query, events } = filters;
  const loadingShown = useMinimumLoading(loading);

  useEffect(() => {
    let active = true;
    createClient()
      .auth.getUser()
      .then(async ({ data: { user } }) => {
        if (!active) return;
        setUserId(user?.id ?? null);
        setCheckingUser(false);
        if (!user) return;

        setBannerDismissed(window.localStorage.getItem(`${PROFILE_BANNER_KEY}_${user.id}`) === "1");

        const { data } = await createClient()
          .from("profiles")
          .select("bio, disciplines")
          .eq("id", user.id)
          .single();
        if (!active || !data) return;
        setProfileIncomplete(!data.bio && (data.disciplines ?? []).length === 0);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function sync() {
      setVisibleCount(PAGE_SIZE);
    }
    sync();
  }, [ville, types, disciplines, cout, query]);

  function dismissProfileBanner() {
    setBannerDismissed(true);
    if (userId) window.localStorage.setItem(`${PROFILE_BANNER_KEY}_${userId}`, "1");
  }

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
        <h1 className="font-display text-xl font-black">{t.nav.evenements}</h1>
        {!checkingUser && !userId && (
          <Link href="/login" className="text-sm text-accent hover:opacity-80">
            {t.nav.connexion}
          </Link>
        )}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 md:hidden">
        <div className="flex items-center gap-2">
          <NotificationBell userId={userId} />
          <button
            onClick={() => setShowSaved((s) => !s)}
            aria-label={t.evenements.tabMes}
            title={t.evenements.tabMes}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
              showSaved ? "border-transparent bg-accent text-accent-foreground" : "border-border text-foreground"
            }`}
          >
            <Bookmark size={16} strokeWidth={1.75} />
          </button>
          <Link
            href="/boutiques"
            aria-label={t.shops.title}
            title={t.shops.title}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground md:hidden"
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

      <div className="md:flex md:h-[calc(100vh-10rem)] md:flex-col md:overflow-hidden md:rounded-2xl md:border md:border-border md:shadow-soft">
        <div className="hidden shrink-0 items-center justify-between border-b border-border px-4 py-3 md:flex">
          <h2 className="font-display text-lg font-black">{t.nav.evenements}</h2>
          {!checkingUser && !userId ? (
            <Link href="/login" className="text-sm text-accent hover:opacity-80">
              {t.nav.connexion}
            </Link>
          ) : (
            <button
              onClick={() => setShowSaved((s) => !s)}
              aria-label={t.evenements.tabMes}
              title={t.evenements.tabMes}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
                showSaved ? "border-transparent bg-accent text-accent-foreground" : "border-border text-foreground"
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
              {userId && profileIncomplete && !bannerDismissed && (
                <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-badge-open-call-fg/25 bg-badge-open-call-bg px-[18px] py-3.5 text-sm md:mt-0">
                  <p>
                    {t.profileBanner.message}{" "}
                    <Link href="/profil/parametres" className="font-bold text-accent">
                      {t.profileBanner.cta} →
                    </Link>
                  </p>
                  <button
                    type="button"
                    onClick={dismissProfileBanner}
                    aria-label={t.modal.close}
                    className="shrink-0 opacity-70 hover:opacity-100"
                  >
                    <X size={16} strokeWidth={1.75} />
                  </button>
                </div>
              )}

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
                  {loadingShown && <CardSkeleton />}
                  {error && <p className="text-sm text-red-600">{t.evenements.loadError(error)}</p>}
                  {!loadingShown && !error && events.length === 0 && (
                    <p className="text-sm text-foreground-muted">{t.evenements.noResults}</p>
                  )}
                  {!loadingShown &&
                    events.slice(0, visibleCount).map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        highlighted={hoveredEventId === event.id}
                        onMouseEnter={() => setHoveredEventId(event.id)}
                        onMouseLeave={() => setHoveredEventId(null)}
                      />
                    ))}
                  {!loadingShown && events.length > visibleCount && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      className="self-center rounded-full border border-border px-[22px] py-2.5 text-sm font-bold"
                    >
                      {t.common.loadMore}
                    </button>
                  )}
                </div>
              )}
            </div>

            {showMap && (
              <div className="relative mt-4 md:mt-0 md:h-full md:flex-1">
                <EventMap
                  key={ville}
                  events={events}
                  ville={ville}
                  hoveredEventId={hoveredEventId}
                  onHoverEvent={setHoveredEventId}
                />
                {userId && (
                  <button
                    type="button"
                    onClick={() => setShowAddEventModal(true)}
                    aria-label={t.evenements.proposer}
                    title={t.evenements.proposer}
                    className="absolute bottom-6 right-6 z-[1000] flex items-center gap-2 rounded-full bg-accent px-[22px] py-3.5 text-sm font-bold text-accent-foreground shadow-event-hover transition hover:bg-accent-hover"
                  >
                    <Plus size={20} strokeWidth={2} />
                    {t.evenements.proposer}
                  </button>
                )}
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

      {!showSaved && (
        <button
          type="button"
          onClick={() => setView((v) => (v === "liste" ? "carte" : "liste"))}
          className="fixed bottom-20 left-1/2 z-[500] flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-[22px] py-3 text-sm font-bold text-background shadow-modal md:hidden"
        >
          {view === "liste" ? (
            <>
              <MapIcon size={16} strokeWidth={2} />
              {t.evenements.tabCarte}
            </>
          ) : (
            <>
              <List size={16} strokeWidth={2} />
              {t.evenements.tabTous}
            </>
          )}
        </button>
      )}

      {showAddEventModal && <AddEventModal onClose={() => setShowAddEventModal(false)} />}
    </div>
  );
}
