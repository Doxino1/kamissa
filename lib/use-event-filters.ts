"use client";

import { useMemo, useState } from "react";
import { ArtEvent, CoutType, EventType, Ville } from "./types";

// Filtres partagés entre la page Événements et la page Calendrier — même
// état, même logique de filtrage, pour que les deux vues restent toujours
// cohérentes entre elles sans dupliquer le code.
export function useEventFilters(allEvents: ArtEvent[], now: number) {
  const [ville, setVille] = useState<Ville>("Paris");
  const [types, setTypes] = useState<EventType[]>([]);
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [cout, setCout] = useState<CoutType | "">("");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = types.length + disciplines.length + (cout ? 1 : 0);

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

  return {
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
    events,
  };
}

export type EventFilters = ReturnType<typeof useEventFilters>;
