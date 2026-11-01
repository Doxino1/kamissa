"use client";

import { useMemo, useState } from "react";
import { EventCard } from "./EventCard";
import { EVENT_TYPE_SQUARE_STYLES } from "./EventTypeBadge";
import { PageHeader } from "./PageHeader";
import { VILLE_TIMEZONES } from "@/lib/timezone";
import { useLocale } from "@/lib/i18n/context";
import { ArtEvent, Ville } from "@/lib/types";

const BCP47_TAGS: Record<string, string> = { fr: "fr-FR", en: "en-US", el: "el-GR" };

const NAV_BUTTON =
  "flex h-12 min-w-12 items-center justify-center rounded-full border border-foreground bg-transparent transition hover:bg-surface-hover";

function dayKey(iso: string, ville: Ville): string {
  // Clé YYYY-MM-DD dans le fuseau de la ville, pas celui du navigateur.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: VILLE_TIMEZONES[ville],
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function localKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Vue calendrier « Racines » : en-tête de page avec le mois en italique et la
// navigation, grille à filets, et la journée sélectionnée dans une colonne à
// droite (aujourd'hui par défaut, comme dans le prototype).
export function EventCalendar({
  events,
  ville,
  filterBar,
  status,
}: {
  events: ArtEvent[];
  ville: Ville;
  filterBar: React.ReactNode;
  status?: React.ReactNode;
}) {
  const { locale, t } = useLocale();
  const todayKey = useMemo(() => localKey(new Date()), []);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(todayKey);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, ArtEvent[]>();
    for (const e of events) {
      const key = dayKey(e.date, ville);
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [events, ville]);

  const cells = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const startOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7; // lundi = 0
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const result: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(new Date(year, monthIndex, d));
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [month]);

  const tag = BCP47_TAGS[locale] ?? "fr-FR";
  const monthLabel = month.toLocaleDateString(tag, { month: "long", year: "numeric" });

  const weekdayLabels = useMemo(() => {
    const base = new Date(2026, 0, 5); // un lundi
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d.toLocaleDateString(BCP47_TAGS[locale] ?? "fr-FR", { weekday: "short" });
    });
  }, [locale]);

  const selectedEvents = selectedDay ? (eventsByDay.get(selectedDay) ?? []) : [];
  const selectedLabel = selectedDay
    ? new Date(`${selectedDay}T12:00:00`).toLocaleDateString(tag, { weekday: "short", day: "numeric", month: "long" })
    : null;

  return (
    <>
      <PageHeader title={t.calendar.tab} subtitle={monthLabel}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            className={`${NAV_BUTTON} text-xl`}
            aria-label="Mois précédent"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
              setSelectedDay(todayKey);
            }}
            className={`${NAV_BUTTON} px-5 text-xs font-semibold uppercase tracking-[0.1em]`}
          >
            {t.calendar.today}
          </button>
          <button
            type="button"
            onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            className={`${NAV_BUTTON} text-xl`}
            aria-label="Mois suivant"
          >
            ›
          </button>
        </div>
      </PageHeader>

      <section className="mx-auto max-w-[1360px] border-b border-border px-4 py-[18px] md:px-10">{filterBar}</section>

      <main className="mx-auto flex max-w-[1360px] flex-wrap gap-10 px-4 md:px-10">
        <div className="min-w-0 flex-[999_1_640px]">
          {status}
          <div aria-hidden="true" className="grid grid-cols-7 border-b border-border py-3.5">
            {weekdayLabels.map((w) => (
              <span key={w} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-muted">
                {w}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 border-l border-border">
            {cells.map((date, i) => {
              if (!date) return <div key={i} className="border-b border-r border-border opacity-35" />;
              const key = localKey(date);
              const dayEvents = eventsByDay.get(key) ?? [];
              const isToday = key === todayKey;
              const isSelected = key === selectedDay;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedDay(isSelected ? null : key)}
                  aria-pressed={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  className={`flex min-h-16 flex-col items-stretch border-b border-r border-border p-1.5 text-left transition md:min-h-[118px] md:px-2.5 md:pb-2 md:pt-2.5 ${
                    isSelected ? "bg-surface-selected outline outline-1 -outline-offset-1 outline-foreground" : "hover:bg-surface-hover"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className={`font-display text-xl leading-none md:text-[30px] ${isSelected ? "italic" : ""}`}>
                      {date.getDate()}
                    </span>
                    {isToday && <span aria-hidden="true" className="h-1.5 w-1.5 bg-foreground" />}
                  </span>
                  {dayEvents.slice(0, 2).map((ev) => (
                    <span key={ev.id} className="mt-1 flex min-w-0 items-center gap-[5px] text-[11px] leading-tight">
                      <span
                        aria-hidden="true"
                        className={`h-2 w-2 shrink-0 ${EVENT_TYPE_SQUARE_STYLES[ev.type] ?? "bg-cat-annonce"}`}
                      />
                      <span className="hidden truncate md:inline">{ev.titre}</span>
                    </span>
                  ))}
                </button>
              );
            })}
          </div>
        </div>

        {selectedDay && (
          <aside className="min-w-0 flex-[1_1_320px] pt-[18px] md:max-w-[400px]">
            <h2 className="font-display text-[40px] leading-none first-letter:uppercase md:text-[52px]">{selectedLabel}</h2>
            {selectedEvents.length === 0 && (
              <p className="mt-6 font-display text-[26px] italic text-foreground-muted md:text-[28px]">
                {t.evenements.noResults}
              </p>
            )}
            <div className="flex flex-col">
              {selectedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </aside>
        )}
      </main>
    </>
  );
}
