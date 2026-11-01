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

// En-tête « Racines » de la page Événements : salutation entre parenthèses
// au-dessus du grand titre (passé en children), puis les rappels du moment
// (prochain événement où l'on va, nouvelle suggestion de matching).
export function HomeGreeting({
  userId,
  ville,
  nextGoingEvent,
  children,
}: {
  userId: string | null;
  ville: Ville;
  nextGoingEvent: ArtEvent | null;
  children: React.ReactNode;
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
    if (!userId) return;
    let active = true;
    const supabase = createClient();

    async function load(uid: string) {
      const { data: me } = await supabase.from("profiles").select("nom, disciplines").eq("id", uid).single();
      if (!active || !me) return;
      setNom(me.nom);

      const match = await findNewMatch(uid, ville, me.disciplines ?? []);
      if (active) setNewMatch(match);
    }

    load(userId);
    return () => {
      active = false;
    };
  }, [userId, ville]);

  const hasHighlights = userId !== null && (nextGoingEvent !== null || newMatch !== null);

  return (
    <div>
      {userId && nom !== null && (
        <p className="mb-2 text-xs uppercase tracking-[0.14em] text-foreground-muted md:text-[13px]">
          ( {t.evenements.greetingShort(hour, nom)} )
        </p>
      )}
      {children}
      {hasHighlights && (
        <div className="mt-3 flex flex-col gap-1 text-sm text-foreground-muted">
          {nextGoingEvent && (
            <p>
              {t.evenements.highlightGoing(
                localizedTitle(nextGoingEvent, locale),
                formatInVille(nextGoingEvent.date, nextGoingEvent.ville, { day: "numeric", month: "short" }, locale)
              )}
            </p>
          )}
          {newMatch && (
            <p>
              {t.evenements.highlightMatch}{" "}
              <Link href={`/artistes/${newMatch.id}`} className="font-semibold text-foreground underline underline-offset-4 hover:no-underline">
                {newMatch.nom}
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
