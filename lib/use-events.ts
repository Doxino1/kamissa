"use client";

import { useEffect, useState } from "react";
import { mapEventRow } from "./events";
import { createClient } from "./supabase/client";
import { ArtEvent } from "./types";

interface UseEventsResult {
  events: ArtEvent[];
  loading: boolean;
  error: string | null;
}

export function useEvents(): UseEventsResult {
  const [events, setEvents] = useState<ArtEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    supabase
      .from("events")
      .select(
        "id, titre, description, type, sous_type, discipline, ville, date, lieu, lat, lng, cout_type, cout_detail, titre_en, titre_el, description_en, description_el"
      )
      .eq("statut", "publie")
      .order("date", { ascending: true })
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) {
          setError(queryError.message);
        } else {
          setEvents((data ?? []).map(mapEventRow));
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { events, loading, error };
}
