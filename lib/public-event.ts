import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { formatInVille } from "./timezone";
import { Ville } from "./types";

export type PublicEvent = {
  id: string;
  titre: string;
  lieu: string | null;
  ville: Ville;
  date: string;
  date_fin: string | null;
};

// Lecture anonyme (sans cookie de session) d'un événement publié, pour les
// aperçus de lien (balises Open Graph et vignette) : WhatsApp, Messages,
// Facebook… n'ont pas de session, ils ne voient que ce qui est public.
export const getPublicEvent = cache(async (id: string): Promise<PublicEvent | null> => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data } = await supabase
    .from("events")
    .select("id, titre, lieu, ville, date, date_fin")
    .eq("id", id)
    .eq("statut", "publie")
    .maybeSingle();
  return (data as PublicEvent | null) ?? null;
});

// « 12 novembre 2026 » ou « 12 novembre 2026 – 13 février 2027 ».
export function publicEventDates(event: PublicEvent): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  const start = formatInVille(event.date, event.ville, opts);
  if (!event.date_fin) return start;
  const end = formatInVille(event.date_fin, event.ville, opts);
  return end === start ? start : `${start} – ${end}`;
}
