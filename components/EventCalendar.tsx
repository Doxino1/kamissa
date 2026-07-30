"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EventCard } from "./EventCard";
import { EVENT_TYPE_BADGE_STYLES } from "./EventTypeBadge";
import { VILLE_TIMEZONES } from "@/lib/timezone";
import { useLocale } from "@/lib/i18n/context";
import { ArtEvent, Ville } from "@/lib/types";

const BCP47_TAGS: Record<string, string> = { fr: "fr-FR", en: "en-US", el: "el-GR" };

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

export function EventCalendar({ events, ville }: { events: ArtEvent[]; ville: Ville }) {
  const { locale, t } = useLocale();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

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

  const weeks = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // lundi = 0
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, monthIndex, d));
    while (cells.length % 7 !== 0) cells.push(null);

    const result: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) result.push(cells.slice(i, i + 7));
    return result;
  }, [month]);

  const monthLabel = month.toLocaleDateString(BCP47_TAGS[locale] ?? "fr-FR", {
    month: "long",
    year: "numeric",
  });

  const weekdayLabels = useMemo(() => {
    const base = new Date(2026, 0, 5); // un lundi
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d.toLocaleDateString(BCP47_TAGS[locale] ?? "fr-FR", { weekday: "short" });
    });
  }, [locale]);

  const selectedEvents = selectedDay ? (eventsByDay.get(selectedDay) ?? []) : [];
  const todayKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  return (
    <div className="md:rounded-3xl md:border md:border-border md:bg-background md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-[22px] font-black capitalize">{monthLabel}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-border"
            aria-label="Mois précédent"
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
              setSelectedDay(todayKey);
            }}
            className="flex h-[34px] items-center justify-center rounded-full border border-border px-4 text-sm font-bold"
          >
            {t.calendar.today}
          </button>
          <button
            type="button"
            onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-border"
            aria-label="Mois suivant"
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-foreground-muted">
        {weekdayLabels.map((w) => (
          <div key={w} className="py-1.5">
            {w}
          </div>
        ))}
      </div>

      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {weeks.flat().map((date, i) => {
          if (!date) return <div key={i} />;
          const year = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, "0");
          const d = String(date.getDate()).padStart(2, "0");
          const key = `${year}-${m}-${d}`;
          const dayEvents = eventsByDay.get(key) ?? [];
          const isToday = key === todayKey;
          const isSelected = key === selectedDay;

          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedDay(key === selectedDay ? null : key)}
              className={`flex min-h-[70px] flex-col items-start gap-1 rounded-xl border p-1.5 text-left transition md:min-h-[92px] md:p-2 ${
                isSelected ? "border-badge-open-call-fg/20 bg-badge-open-call-bg" : "border-border"
              } ${isToday ? "border-2 border-accent" : ""}`}
            >
              <span className={`text-xs ${isToday ? "font-extrabold" : "font-semibold"}`}>{date.getDate()}</span>
              <div className="flex w-full flex-col gap-0.5">
                {dayEvents.slice(0, 2).map((ev) => (
                  <span
                    key={ev.id}
                    className={`truncate rounded-full px-1.5 py-0.5 text-[10px] font-bold ${EVENT_TYPE_BADGE_STYLES[ev.type] ?? "bg-surface text-foreground-muted"}`}
                  >
                    {ev.titre}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="mt-6 flex flex-col gap-3">
          {selectedEvents.length === 0 && (
            <p className="text-sm text-foreground-muted">{t.evenements.noResults}</p>
          )}
          {selectedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
