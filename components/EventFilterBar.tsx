"use client";

import { Filter, Search, X } from "lucide-react";
import { useT } from "@/lib/i18n/context";
import { CoutType, DISCIPLINES, EventType, Ville } from "@/lib/types";
import type { EventFilters } from "@/lib/use-event-filters";

const VILLES: Ville[] = ["Paris", "Athènes"];

// Pilule Racines : contour fin, pleine noire quand elle est active.
export function pillClass(active: boolean) {
  return `min-h-10 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.08em] transition ${
    active
      ? "border-foreground bg-foreground text-background"
      : "border-border bg-transparent text-foreground hover:border-foreground"
  }`;
}

const CHIP =
  "flex min-h-8 items-center gap-1.5 rounded-full border border-border px-3 text-[11px] font-semibold uppercase tracking-[0.08em] hover:border-foreground";
const ROW = "-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// Barre de recherche + filtres partagée entre la page Événements et la page
// Calendrier — mêmes filtres (ville, type, discipline, coût), même
// comportement, pour que les deux vues restent cohérentes.
export function EventFilterBar({ filters }: { filters: EventFilters }) {
  const t = useT();
  const {
    ville,
    setVille,
    types,
    setTypes,
    disciplines,
    setDisciplines,
    cout,
    setCout,
    query,
    setQuery,
    filtersOpen,
    setFiltersOpen,
    activeFilterCount,
  } = filters;

  return (
    <>
      <div className="flex items-center gap-3">
        <label className="flex min-h-11 flex-1 items-center gap-2.5 border-b border-foreground">
          <Search size={17} strokeWidth={1.75} className="shrink-0" />
          <input
            type="search"
            placeholder={t.evenements.searchPlaceholder}
            aria-label={t.evenements.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent font-display text-[22px] outline-none placeholder:text-muted-strong md:text-2xl"
          />
        </label>
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          aria-label={t.evenements.filtersButton}
          aria-expanded={filtersOpen}
          title={t.evenements.filtersButton}
          className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${
            filtersOpen
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-white text-foreground hover:border-foreground"
          }`}
        >
          <Filter size={17} strokeWidth={1.75} />
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-background bg-accent-secondary text-[10px] font-semibold text-accent-secondary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {!filtersOpen && activeFilterCount > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {types.map((v) => (
            <button key={v} onClick={() => setTypes((prev) => toggleValue(prev, v))} className={CHIP}>
              {t.eventTypeLabels[v]}
              <X size={12} strokeWidth={2} />
            </button>
          ))}
          {disciplines.map((d) => (
            <button key={d} onClick={() => setDisciplines((prev) => toggleValue(prev, d))} className={CHIP}>
              {t.disciplineLabels[d] ?? d}
              <X size={12} strokeWidth={2} />
            </button>
          ))}
          {cout && (
            <button onClick={() => setCout("")} className={CHIP}>
              {t.coutLabels[cout]}
              <X size={12} strokeWidth={2} />
            </button>
          )}
        </div>
      )}

      {filtersOpen && (
        <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-muted">
            {t.profil.ville}
          </p>
          <div className={ROW}>
            {VILLES.map((v) => (
              <button
                key={v}
                onClick={() => setVille(v)}
                aria-pressed={ville === v}
                className={`shrink-0 whitespace-nowrap ${pillClass(ville === v)}`}
              >
                {t.villeLabels[v]}
              </button>
            ))}
          </div>

          <div className={ROW}>
            <button
              onClick={() => setTypes([])}
              aria-pressed={types.length === 0}
              className={`shrink-0 whitespace-nowrap ${pillClass(types.length === 0)}`}
            >
              {t.evenements.tousTypes}
            </button>
            {Object.entries(t.eventTypeLabels).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTypes((prev) => toggleValue(prev, value as EventType))}
                aria-pressed={types.includes(value as EventType)}
                className={`shrink-0 whitespace-nowrap ${pillClass(types.includes(value as EventType))}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={ROW}>
            <button
              onClick={() => setDisciplines([])}
              aria-pressed={disciplines.length === 0}
              className={`shrink-0 whitespace-nowrap ${pillClass(disciplines.length === 0)}`}
            >
              {t.evenements.toutesDisciplines}
            </button>
            {DISCIPLINES.map((d) => (
              <button
                key={d}
                onClick={() => setDisciplines((prev) => toggleValue(prev, d))}
                aria-pressed={disciplines.includes(d)}
                className={`shrink-0 whitespace-nowrap ${pillClass(disciplines.includes(d))}`}
              >
                {t.disciplineLabels[d]}
              </button>
            ))}
          </div>

          <div className={ROW}>
            <button
              onClick={() => setCout("")}
              aria-pressed={cout === ""}
              className={`shrink-0 whitespace-nowrap ${pillClass(cout === "")}`}
            >
              {t.evenements.tousCouts}
            </button>
            {Object.entries(t.coutLabels).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setCout(value as CoutType)}
                aria-pressed={cout === value}
                className={`shrink-0 whitespace-nowrap ${pillClass(cout === value)}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
