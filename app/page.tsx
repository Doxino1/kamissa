"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { List, Map as MapIcon, Store, Plus, X } from "lucide-react";
import { EventCard } from "@/components/EventCard";
import { EventFilterBar } from "@/components/EventFilterBar";
import { HomeGreeting } from "@/components/HomeGreeting";
import { FreeDaysNotice } from "@/components/FreeDaysNotice";
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
    <div className="relative pb-24 md:pb-12">
      {/* Mobile : pas de barre du haut, les raccourcis notifications et
          boutiques restent accessibles ici. */}
      <div className="flex items-center justify-end gap-2 px-4 pt-4 md:hidden">
        {!checkingUser && !userId ? (
          <Link href="/login" className="text-xs font-semibold uppercase tracking-[0.1em] underline underline-offset-4">
            {t.nav.connexion}
          </Link>
        ) : (
          <>
            <NotificationBell userId={userId} />
            <Link
              href="/boutiques"
              aria-label={t.shops.title}
              title={t.shops.title}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-foreground"
            >
              <Store size={17} strokeWidth={1.75} />
            </Link>
          </>
        )}
      </div>

      {/* En-tête : grand titre, accroche, compteur de la semaine. */}
      <section className="mx-auto flex max-w-[1360px] flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-foreground px-4 pt-4 md:px-10 md:pt-6">
        <div className="pb-[18px]">
          <HomeGreeting userId={userId} ville={ville} nextGoingEvent={nextGoingEvent}>
            <h1 className="pt-[0.12em] font-display text-[clamp(3.25rem,12vw,7.5rem)] uppercase leading-[0.85]">
              {t.nav.evenements}
            </h1>
            <p className="mt-2 font-display text-[clamp(1.375rem,4vw,2.25rem)] italic leading-tight">
              {t.evenements.tagline}
            </p>
          </HomeGreeting>
        </div>
        <div className="pb-[22px] md:text-right">
          <p className="font-display text-[clamp(3.5rem,9vw,6rem)] leading-[0.9]">{eventsThisWeekCount}</p>
          <p className="mb-3.5 mt-1.5 text-xs uppercase tracking-[0.12em] text-foreground-muted">
            {t.evenements.thisWeekLabel(eventsThisWeekCount, t.villeLabels[ville])}
          </p>
          {!checkingUser && !userId ? (
            <Link
              href="/login"
              className="hidden min-h-11 items-center rounded-full border border-foreground px-5 text-xs font-semibold uppercase tracking-[0.1em] md:inline-flex"
            >
              {t.nav.connexion}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setShowSaved((s) => !s)}
              aria-pressed={showSaved}
              className={`min-h-11 rounded-full border border-foreground px-5 text-xs font-semibold uppercase tracking-[0.1em] transition ${
                showSaved ? "bg-foreground text-background" : "bg-transparent text-foreground hover:bg-surface-hover"
              }`}
            >
              {t.evenements.tabMes}
            </button>
          )}
        </div>
      </section>

      {!showSaved && (
        <section className="mx-auto max-w-[1360px] border-b border-border px-4 py-[18px] md:px-10">
          <EventFilterBar filters={filters} />
        </section>
      )}

      {!showSaved && <FreeDaysNotice ville={ville} now={now} />}

      {!showSaved && (
        <main className="mx-auto max-w-[1360px] px-4 md:flex md:items-start md:gap-8 md:px-10">
          <div className="min-w-0 md:w-[42%] md:max-w-[600px] md:shrink-0">
            {userId && profileIncomplete && !bannerDismissed && (
              <div className="flex items-center justify-between gap-3 border-b border-border py-3.5 text-sm">
                <p>
                  {t.profileBanner.message}{" "}
                  <Link href="/profil/parametres" className="font-bold underline-offset-4 hover:underline">
                    {t.profileBanner.cta} →
                  </Link>
                </p>
                <button
                  type="button"
                  onClick={dismissProfileBanner}
                  aria-label={t.modal.close}
                  className="flex h-9 w-9 shrink-0 items-center justify-center text-foreground-muted hover:text-foreground"
                >
                  <X size={16} strokeWidth={1.75} />
                </button>
              </div>
            )}

            {showList && (
              <div className="flex flex-col">
                {loadingShown && <CardSkeleton />}
                {error && <p className="py-6 text-sm text-danger">{t.evenements.loadError(error)}</p>}
                {!loadingShown && !error && events.length === 0 && (
                  <p className="py-12 text-center font-display text-2xl italic text-foreground-muted md:text-[28px]">
                    {t.evenements.noResults}
                  </p>
                )}
                {!loadingShown &&
                  events.slice(0, visibleCount).map((event, i) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      index={i + 1}
                      highlighted={hoveredEventId === event.id}
                      onMouseEnter={() => setHoveredEventId(event.id)}
                      onMouseLeave={() => setHoveredEventId(null)}
                    />
                  ))}
                {!loadingShown && events.length > visibleCount && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="mt-5 min-h-11 self-start rounded-full border border-foreground px-[22px] text-xs font-semibold uppercase tracking-[0.1em] transition hover:bg-surface-hover"
                  >
                    {t.common.loadMore}
                  </button>
                )}
              </div>
            )}
          </div>

          {showMap && (
            <div className="relative mt-4 md:sticky md:top-[104px] md:mt-6 md:h-[calc(100vh-128px)] md:min-h-[480px] md:flex-1">
              <EventMap
                key={ville}
                events={events}
                ville={ville}
                hoveredEventId={hoveredEventId}
                onHoverEvent={setHoveredEventId}
              />
              <p className="pointer-events-none absolute bottom-4 left-5 z-[500] hidden text-xs uppercase tracking-[0.12em] text-foreground-muted md:block">
                ( {t.villeLabels[ville]} )
              </p>
              {userId && (
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(true)}
                  aria-label={t.evenements.proposer}
                  title={t.evenements.proposer}
                  className="absolute bottom-6 right-6 z-[1000] flex min-h-14 items-center gap-2.5 rounded-full bg-foreground px-[26px] text-[13px] font-semibold uppercase tracking-[0.1em] text-background transition hover:bg-accent-hover"
                >
                  <Plus size={18} strokeWidth={2} />
                  {t.evenements.proposer}
                </button>
              )}
            </div>
          )}
        </main>
      )}

      {showSaved && (
        <main className="mx-auto max-w-[1360px] px-4 md:px-10">
          {checkingUser && <p className="py-6 text-sm text-foreground-muted">{t.common.loading}</p>}

          {!checkingUser && !userId && (
            <p className="py-6 text-sm text-foreground-muted">
              <Link href="/login" className="underline hover:text-foreground">
                {t.evenements.loginLink}
              </Link>{" "}
              {t.evenements.loginToSee}
            </p>
          )}

          {!checkingUser && userId && (
            <div className="grid gap-x-12 md:grid-cols-2">
              <section className="pt-7">
                <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground-muted">
                  ( {t.evenements.jeViens} )
                </h2>
                <div className="flex flex-col">
                  {goingEvents.length === 0 && (
                    <p className="py-6 font-display text-2xl italic text-foreground-muted">{t.evenements.noneYet}</p>
                  )}
                  {goingEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>

              <section className="pt-7">
                <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground-muted">
                  ( {t.evenements.sauvegardes} )
                </h2>
                <div className="flex flex-col">
                  {savedEvents.length === 0 && (
                    <p className="py-6 font-display text-2xl italic text-foreground-muted">{t.evenements.noneYet}</p>
                  )}
                  {savedEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>

              <section className="pt-7 md:col-span-2">
                <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground-muted">
                  ( {t.evenements.mesSoumissions} )
                </h2>
                <div className="flex flex-col">
                  {submissions === null && <p className="py-6 text-sm text-foreground-muted">{t.common.loading}</p>}
                  {submissions !== null && submissions.length === 0 && (
                    <p className="py-6 font-display text-2xl italic text-foreground-muted">
                      {t.evenements.noSubmissions}
                    </p>
                  )}
                  {(submissions ?? []).map((s) => (
                    <div key={s.id} className="border-b border-border py-5">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-display text-[26px] leading-tight">{s.titre}</h3>
                        <span
                          className={`shrink-0 text-[11px] font-semibold uppercase tracking-[0.1em] ${
                            s.statut === "publie" ? "text-accent-secondary" : "text-foreground-muted"
                          }`}
                        >
                          {s.statut === "publie" ? t.evenements.statutPublie : t.evenements.statutEnAttente}
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
                      <Link
                        href={`/evenements/${s.id}/modifier`}
                        className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-[0.1em] underline underline-offset-4"
                      >
                        {t.evenements.editLink}
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      )}

      {!showSaved && (
        <button
          type="button"
          onClick={() => setView((v) => (v === "liste" ? "carte" : "liste"))}
          className="fixed bottom-20 left-1/2 z-[500] flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-[22px] text-xs font-semibold uppercase tracking-[0.1em] text-background shadow-modal md:hidden"
        >
          {view === "liste" ? (
            <>
              <MapIcon size={16} strokeWidth={1.75} />
              {t.evenements.tabCarte}
            </>
          ) : (
            <>
              <List size={16} strokeWidth={1.75} />
              {t.evenements.tabTous}
            </>
          )}
        </button>
      )}

      {showAddEventModal && <AddEventModal onClose={() => setShowAddEventModal(false)} />}
    </div>
  );
}
