"use client";

import { useEffect, useMemo, useState } from "react";
import { eventEndTime, eventSortTime } from "./event-dates";
import { ArtEvent, CoutType, EventType, Ville } from "./types";

// Les filtres survivent au retour depuis une fiche d'événement (stockage de
// session, propre à l'onglet) ; la ville est en plus retenue d'une visite à
// l'autre (stockage local), pour qu'un artiste d'Athènes n'ait pas à
// rebasculer depuis Paris à chaque fois.
const SESSION_KEY = "kamissa_event_filters";
const VILLE_KEY = "kamissa_ville";
const VILLES: Ville[] = ["Paris", "Athènes"];

type Saved = { ville?: Ville; types?: EventType[]; disciplines?: string[]; cout?: CoutType | ""; query?: string };

function readSaved(): Saved {
  try {
    const session = JSON.parse(window.sessionStorage.getItem(SESSION_KEY) ?? "{}") as Saved;
    const ville = window.localStorage.getItem(VILLE_KEY) as Ville | null;
    return { ...session, ville: session.ville ?? ville ?? undefined };
  } catch {
    return {};
  }
}

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
  // État (et non ref) : la sauvegarde attend le rendu qui suit la restauration,
  // sinon elle écrirait d’abord les valeurs par défaut (« Paris ») par-dessus.
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    function restore() {
      const saved = readSaved();
      if (saved.ville && VILLES.includes(saved.ville)) setVille(saved.ville);
      if (Array.isArray(saved.types)) setTypes(saved.types);
      if (Array.isArray(saved.disciplines)) setDisciplines(saved.disciplines);
      if (saved.cout === "gratuit" || saved.cout === "payant") setCout(saved.cout);
      if (typeof saved.query === "string") setQuery(saved.query);
      setRestored(true);
    }
    restore();
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ville, types, disciplines, cout, query }));
      window.localStorage.setItem(VILLE_KEY, ville);
    } catch {
      // Stockage indisponible (navigation privée…) : les filtres repartent à zéro.
    }
  }, [restored, ville, types, disciplines, cout, query]);

  const activeFilterCount = types.length + disciplines.length + (cout ? 1 : 0);

  const events = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allEvents
      .filter((e) => eventEndTime(e) >= now)
      .filter((e) => e.ville === ville)
      .filter((e) => types.length === 0 || types.includes(e.type))
      .filter((e) => disciplines.length === 0 || disciplines.includes(e.discipline))
      // Filtre strict : un événement sans prix renseigné n'apparaît ni dans
      // « Gratuit » ni dans « Payant », pour ne jamais annoncer gratuite une
      // entrée qui ne l'est pas.
      .filter((e) => !cout || e.coutType === cout)
      .filter(
        (e) =>
          !q ||
          e.titre.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      )
      .sort((a, b) => eventSortTime(a, now) - eventSortTime(b, now));
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
