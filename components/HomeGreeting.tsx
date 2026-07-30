"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/context";
import { formatInVille } from "@/lib/timezone";
import { localizedTitle } from "@/lib/localize-event";
import { ArtEvent, Ville } from "@/lib/types";

interface NewMatch {
  id: string;
  nom: string;
}

interface MatchingTagRow {
  tag: string;
  created_at: string;
}

// Détecte une suggestion de matching "récente" avec la même logique que le
// résumé hebdomadaire (lib/weekly-email.ts countNewMatches) : soit le profil
// candidat vient d'être créé, soit le tag partagé (le sien ou celui du
// candidat) a été ajouté dans les 7 derniers jours.
async function findNewMatch(userId: string, ville: Ville, myDisciplines: string[]): Promise<NewMatch | null> {
  const supabase = createClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: myTagRows } = await supabase
    .from("matching_tags")
    .select("tag, created_at")
    .eq("user_id", userId);

  const myTags = (myTagRows ?? []) as MatchingTagRow[];
  if (myTags.length === 0) return null;

  const [{ data: candidates }, { data: allTagRows }] = await Promise.all([
    supabase.from("profiles").select("id, nom, disciplines, created_at").eq("ville", ville).neq("id", userId),
    supabase.from("matching_tags").select("user_id, tag, created_at"),
  ]);

  const tagsByUser = new Map<string, MatchingTagRow[]>();
  for (const row of allTagRows ?? []) {
    const list = tagsByUser.get(row.user_id) ?? [];
    list.push(row);
    tagsByUser.set(row.user_id, list);
  }

  const myTagValues = myTags.map((t) => t.tag);

  for (const c of candidates ?? []) {
    const candidateDisciplines: string[] = c.disciplines ?? [];
    if (candidateDisciplines.filter((d) => myDisciplines.includes(d)).length === 0) continue;

    const candidateTags = tagsByUser.get(c.id) ?? [];
    const sharedTags = candidateTags.filter((row) => myTagValues.includes(row.tag));
    if (sharedTags.length === 0) continue;

    const candidateIsNew = c.created_at >= sevenDaysAgo;
    const sharedTagIsNew =
      sharedTags.some((row) => row.created_at >= sevenDaysAgo) ||
      myTags.some((row) => sharedTags.some((st) => st.tag === row.tag) && row.created_at >= sevenDaysAgo);

    if (candidateIsNew || sharedTagIsNew) {
      return { id: c.id, nom: c.nom };
    }
  }

  return null;
}

export function HomeGreeting({
  userId,
  ville,
  eventsThisWeekCount,
  nextGoingEvent,
}: {
  userId: string;
  ville: Ville;
  eventsThisWeekCount: number;
  nextGoingEvent: ArtEvent | null;
}) {
  const { locale, t } = useLocale();
  const [nom, setNom] = useState<string | null>(null);
  const [newMatch, setNewMatch] = useState<NewMatch | null>(null);
  const [hour, setHour] = useState(() => new Date().getHours());

  // La salutation dépend de l'heure — sans ça, un onglet resté ouvert
  // n'affiche jamais "Bonsoir" une fois le soir venu.
  useEffect(() => {
    const interval = setInterval(() => setHour(new Date().getHours()), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function load() {
      const { data: me } = await supabase.from("profiles").select("nom, disciplines").eq("id", userId).single();
      if (!active || !me) return;
      setNom(me.nom);

      const match = await findNewMatch(userId, ville, me.disciplines ?? []);
      if (active) setNewMatch(match);
    }

    load();
    return () => {
      active = false;
    };
  }, [userId, ville]);

  if (nom === null) return null;

  const hasHighlights = eventsThisWeekCount > 0 || nextGoingEvent !== null || newMatch !== null;

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl bg-surface p-5">
      <svg
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 opacity-60"
        viewBox="-100 -100 200 200"
        aria-hidden="true"
      >
        <path
          fill="#f1e6fa"
          d="M46.5,-58.5C59.5,-50.5,68.5,-33.5,71.5,-15.5C74.5,2.5,71.5,21.5,61.5,36.5C51.5,51.5,34.5,62.5,15.5,66.5C-3.5,70.5,-24.5,67.5,-40.5,56.5C-56.5,45.5,-67.5,26.5,-69.5,6.5C-71.5,-13.5,-64.5,-34.5,-50.5,-47.5C-36.5,-60.5,-15.5,-65.5,3.5,-69.5C22.5,-73.5,33.5,-66.5,46.5,-58.5Z"
        />
      </svg>
      <svg
        className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 opacity-50"
        viewBox="-100 -100 200 200"
        aria-hidden="true"
      >
        <path
          fill="#dff4ef"
          d="M43.1,-53.5C54.4,-45.6,60.5,-29.9,63.4,-13.6C66.3,2.7,66,19.6,58.2,32.7C50.4,45.8,35.1,55.1,18.5,60.6C1.9,66.1,-16,67.8,-31.9,61.9C-47.8,56,-61.7,42.5,-67.9,26.1C-74.1,9.7,-72.6,-9.7,-64.8,-25.4C-57,-41.1,-42.9,-53.1,-27.9,-60.2C-12.9,-67.3,3,-69.5,17.9,-65.8C32.8,-62.1,43.1,-53.5,43.1,-53.5Z"
        />
      </svg>

      <div className="relative">
        <p className="font-display text-lg font-black">{t.evenements.greeting(hour, nom)}</p>

        {hasHighlights && (
          <div className="mt-2 flex flex-col gap-1 text-sm text-foreground-muted">
            {eventsThisWeekCount > 0 && <p>{t.evenements.highlightThisWeek(eventsThisWeekCount, t.villeLabels[ville])}</p>}
            {nextGoingEvent && (
              <p>
                {t.evenements.highlightGoing(
                  localizedTitle(nextGoingEvent, locale),
                  formatInVille(
                    nextGoingEvent.date,
                    nextGoingEvent.ville,
                    { day: "numeric", month: "short" },
                    locale
                  )
                )}
              </p>
            )}
            {newMatch && (
              <p>
                {t.evenements.highlightMatch}{" "}
                <Link href={`/artistes/${newMatch.id}`} className="text-foreground underline hover:no-underline">
                  {newMatch.nom}
                </Link>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
