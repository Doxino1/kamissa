"use client";

import { Filter, X } from "lucide-react";
import { useT } from "@/lib/i18n/context";
import { CoutType, DISCIPLINES, EventType, Ville } from "@/lib/types";
import type { EventFilters } from "@/lib/use-event-filters";

const VILLES: Ville[] = ["Paris", "Athènes"];

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
      <div className={`flex items-center gap-2 ${activeFilterCount > 0 || filtersOpen ? "mb-2" : "mb-6"}`}>
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
    </>
  );
}
