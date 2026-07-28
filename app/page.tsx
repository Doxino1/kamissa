"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { List, CalendarDays, Map as MapIcon, Bookmark, Store, Filter, X, Plus } from "lucide-react";
import { EventCard } from "@/components/EventCard";
import { EventCalendar } from "@/components/EventCalendar";
import { HomeGreeting } from "@/components/HomeGreeting";
import { useEvents } from "@/lib/use-events";
import { useSavedEvents } from "@/lib/use-saved-events";
import { createClient } from "@/lib/supabase/client";
import { formatInVille } from "@/lib/timezone";
import { useT } from "@/lib/i18n/context";
import { CoutType, DISCIPLINES, EventType, Ville } from "@/lib/types";

const VILLES: Ville[] = ["Paris", "Athènes"];

const EventMap = dynamic(() => import("@/components/EventMap").then((m) => m.EventMap), {
  ssr: false,
});

type ViewMode = "liste" | "calendrier" | "carte";
type SubmissionStatut = "en_attente" | "publie";

interface MySubmission {
  id: string;
  titre: string;
  ville: Ville;
  date: string;
  statut: SubmissionStatut;
}

function pillClass(active: boolean) {
  return `rounded-lg border px-4 py-1.5 text-sm transition ${
    active
      ? "border-accent bg-accent text-accent-foreground"
      : "border-foreground/20 hover:border-foreground/40"
  }`;
}

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function EvenementsPage() {
  const t = useT();
  const { events: allEvents, loading, error } = useEvents();
  const { saved } = useSavedEvents();

  const [view, setView] = useState<ViewMode>("liste");
  const [showSaved, setShowSaved] = useState(false);
  const [ville, setVille] = useState<Ville>("Paris");
  const [types, setTypes] = useState<EventType[]>([]);
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [cout, setCout] = useState<CoutType | "">("");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = types.length + disciplines.length + (cout ? 1 : 0);

  const [userId, setUserId] = useState<string | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [submissions, setSubmissions] = useState<MySubmission[] | null>(null);
  const [now] = useState(() => Date.now());

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

  const events = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allEvents
      .filter((e) => new Date(e.date).getTime() >= now)
      .filter((e) => e.ville === ville)
      .filter((e) => types.length === 0 || types.includes(e.type))
      .filter((e) => disciplines.length === 0 || disciplines.includes(e.discipline))
      // Le filtre coût ne doit jamais masquer un événement qui n'a pas ce
      // champ (vernissage/expo/annonce) — seuls les workshop/open_call/
      // residency avec un coût non correspondant sont exclus.
      .filter((e) => !cout || !e.coutType || e.coutType === cout)
      .filter(
        (e) =>
          !q ||
          e.titre.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allEvents, ville, types, disciplines, cout, query, now]);

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

  return (
    <div className="relative mx-auto w-full max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-xl font-semibold">{t.nav.evenements}</h1>
        {!checkingUser && !userId && (
          <Link href="/login" className="text-sm text-accent hover:opacity-80">
            {t.nav.connexion}
          </Link>
        )}
      </div>

      {!showSaved && userId && (
        <div className="mt-4">
          <HomeGreeting
            userId={userId}
            ville={ville}
            eventsThisWeekCount={eventsThisWeekCount}
            nextGoingEvent={nextGoingEvent}
          />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
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
              setView("calendrier");
            }}
            aria-label={t.calendar.tab}
            title={t.calendar.tab}
            className={`flex items-center justify-center rounded-full p-2 transition ${
              !showSaved && view === "calendrier"
                ? "bg-accent text-accent-foreground"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            <CalendarDays size={18} strokeWidth={1.75} />
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
            className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/20 text-foreground-muted hover:text-foreground"
          >
            <Store size={16} strokeWidth={1.75} />
          </Link>
        </div>
      </div>

      {!showSaved && (
        <>
          <div className={`flex items-center gap-2 ${activeFilterCount > 0 || filtersOpen ? "mt-4 mb-2" : "mt-4 mb-6"}`}>
            <input
              type="search"
              placeholder={t.evenements.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
            />
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              aria-label={t.evenements.filtersButton}
              title={t.evenements.filtersButton}
              className={`relative shrink-0 rounded-lg border p-2 transition ${
                filtersOpen
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-foreground/20 hover:border-foreground/40"
              }`}
            >
              <Filter size={16} strokeWidth={1.75} />
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {!filtersOpen && activeFilterCount > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {types.map((v) => (
                <button
                  key={v}
                  onClick={() => setTypes((prev) => toggleValue(prev, v))}
                  className="flex items-center gap-1 rounded-full border border-foreground/20 px-3 py-1 text-xs hover:border-foreground/40"
                >
                  {t.eventTypeLabels[v]}
                  <X size={12} strokeWidth={2} />
                </button>
              ))}
              {disciplines.map((d) => (
                <button
                  key={d}
                  onClick={() => setDisciplines((prev) => toggleValue(prev, d))}
                  className="flex items-center gap-1 rounded-full border border-foreground/20 px-3 py-1 text-xs hover:border-foreground/40"
                >
                  {t.disciplineLabels[d] ?? d}
                  <X size={12} strokeWidth={2} />
                </button>
              ))}
              {cout && (
                <button
                  onClick={() => setCout("")}
                  className="flex items-center gap-1 rounded-full border border-foreground/20 px-3 py-1 text-xs hover:border-foreground/40"
                >
                  {t.coutLabels[cout]}
                  <X size={12} strokeWidth={2} />
                </button>
              )}
            </div>
          )}

          {filtersOpen && (
            <div className="mb-6 rounded-lg bg-surface p-3 shadow-soft">
              <p className="mb-1 px-1 text-xs font-medium text-foreground-muted">{t.profil.ville}</p>
              <div className="mb-2 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {VILLES.map((v) => (
                  <button
                    key={v}
                    onClick={() => setVille(v)}
                    className={`shrink-0 whitespace-nowrap ${pillClass(ville === v)}`}
                  >
                    {t.villeLabels[v]}
                  </button>
                ))}
              </div>

              <div className="mb-2 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  onClick={() => setTypes([])}
                  className={`shrink-0 whitespace-nowrap ${pillClass(types.length === 0)}`}
                >
                  {t.evenements.tousTypes}
                </button>
                {Object.entries(t.eventTypeLabels).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setTypes((prev) => toggleValue(prev, value as EventType))}
                    className={`shrink-0 whitespace-nowrap ${pillClass(types.includes(value as EventType))}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  onClick={() => setDisciplines([])}
                  className={`shrink-0 whitespace-nowrap ${pillClass(disciplines.length === 0)}`}
                >
                  {t.evenements.toutesDisciplines}
                </button>
                {DISCIPLINES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDisciplines((prev) => toggleValue(prev, d))}
                    className={`shrink-0 whitespace-nowrap ${pillClass(disciplines.includes(d))}`}
                  >
                    {t.disciplineLabels[d]}
                  </button>
                ))}
              </div>

              <div className="mt-2 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  onClick={() => setCout("")}
                  className={`shrink-0 whitespace-nowrap ${pillClass(cout === "")}`}
                >
                  {t.evenements.tousCouts}
                </button>
                {Object.entries(t.coutLabels).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setCout(value as CoutType)}
                    className={`shrink-0 whitespace-nowrap ${pillClass(cout === value)}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === "liste" && (
            <div className="flex flex-col gap-3">
              {loading && <p className="text-sm text-foreground-muted">{t.common.loading}</p>}
              {error && <p className="text-sm text-red-600">{t.evenements.loadError(error)}</p>}
              {!loading && !error && events.length === 0 && (
                <p className="text-sm text-foreground-muted">{t.evenements.noResults}</p>
              )}
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}

          {view === "calendrier" && <EventCalendar events={events} ville={ville} />}

          {view === "carte" && <EventMap key={ville} events={events} ville={ville} />}
        </>
      )}

      {showSaved && (
        <>
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
        </>
      )}

      {userId && (
        <Link
          href="/evenements/nouveau"
          aria-label={t.evenements.proposer}
          title={t.evenements.proposer}
          className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-soft transition hover:opacity-90"
        >
          <Plus size={26} strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}
