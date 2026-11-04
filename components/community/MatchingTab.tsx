"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/context";
import { ContactLinks } from "@/components/ContactLinks";
import { sendNotification } from "@/lib/notify";
import { MatchingTag, Ville } from "@/lib/types";

interface Suggestion {
  id: string;
  nom: string;
  disciplines: string[];
  bio: string;
  sharedTags: MatchingTag[];
  email: string | null;
  instagram: string | null;
  tiktok: string | null;
  twitter: string | null;
}

// Suggestions façon LinkedIn, sans accord mutuel : même ville, une discipline
// et un tag « je cherche » en commun. On contacte la personne par email ou sur
// ses réseaux ; « Proposer un échange » la prévient par une notification.
export function MatchingTab() {
  const t = useT();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myTags, setMyTags] = useState<MatchingTag[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [proposed, setProposed] = useState<Set<string>>(new Set());
  const [ville, setVille] = useState<Ville | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const [{ data: me, error: meError }, { data: myTagRows }, { data: sent }, { data: blocks }] = await Promise.all([
        supabase.from("profiles").select("ville, disciplines").eq("id", user.id).single(),
        supabase.from("matching_tags").select("tag").eq("user_id", user.id),
        supabase.from("matching_proposals").select("to_user_id").eq("from_user_id", user.id),
        supabase.from("blocks").select("blocker_id, blocked_id"),
      ]);

      if (!active) return;

      if (meError || !me) {
        setError(meError?.message ?? t.common.profileNotFound);
        setLoading(false);
        return;
      }
      setVille(me.ville as Ville);
      setProposed(new Set((sent ?? []).map((row) => row.to_user_id)));

      const mine = (myTagRows ?? []).map((row) => row.tag as MatchingTag);
      setMyTags(mine);

      const blockedIds = new Set<string>();
      for (const row of blocks ?? []) {
        if (row.blocker_id === user.id) blockedIds.add(row.blocked_id);
        if (row.blocked_id === user.id) blockedIds.add(row.blocker_id);
      }

      const [{ data: candidates, error: candidatesError }, { data: allTags }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, nom, disciplines, bio, email_contact, instagram_handle, tiktok_handle, twitter_handle")
          .eq("ville", me.ville)
          .neq("id", user.id),
        supabase.from("matching_tags").select("user_id, tag"),
      ]);

      if (!active) return;

      if (candidatesError) {
        setError(candidatesError.message);
        setLoading(false);
        return;
      }

      const tagsByUser = new Map<string, MatchingTag[]>();
      for (const row of allTags ?? []) {
        const list = tagsByUser.get(row.user_id) ?? [];
        list.push(row.tag as MatchingTag);
        tagsByUser.set(row.user_id, list);
      }

      const results: Suggestion[] = [];
      for (const c of candidates ?? []) {
        if (blockedIds.has(c.id)) continue;
        const candidateDisciplines: string[] = c.disciplines ?? [];
        const candidateTags = tagsByUser.get(c.id) ?? [];
        const sharedDisciplines = candidateDisciplines.filter((d) => me.disciplines.includes(d));
        const sharedTags = candidateTags.filter((tag) => mine.includes(tag));

        if (sharedDisciplines.length > 0 && sharedTags.length > 0) {
          results.push({
            id: c.id,
            nom: c.nom,
            disciplines: candidateDisciplines,
            bio: c.bio ?? "",
            sharedTags,
            email: c.email_contact,
            instagram: c.instagram_handle,
            tiktok: c.tiktok_handle,
            twitter: c.twitter_handle,
          });
        }
      }

      // Les profils qui partagent le plus de tags d'abord.
      results.sort((a, b) => b.sharedTags.length - a.sharedTags.length);
      setSuggestions(results);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handlePropose(candidateId: string) {
    if (!userId || proposed.has(candidateId)) return;

    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("matching_proposals")
      .insert({ from_user_id: userId, to_user_id: candidateId });
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setProposed((prev) => new Set(prev).add(candidateId));
    sendNotification({ userId: candidateId, actorId: userId, type: "match" }).catch(() => {});
  }

  if (loading) {
    return <p className="pt-7 text-sm text-foreground-muted">{t.common.loading}</p>;
  }

  return (
    <div className="pt-7">
      <p className="font-display text-[26px] leading-tight md:text-[34px]">{t.matching.subtitle}</p>

      {error && <p className="mt-6 text-sm text-danger">{error}</p>}

      {!error && myTags.length === 0 && (
        <p className="mt-10 font-display text-2xl italic text-foreground-muted">{t.matching.needTag}</p>
      )}

      {!error && myTags.length > 0 && suggestions.length === 0 && (
        <p className="mt-10 font-display text-2xl italic text-foreground-muted">{t.matching.noResults}</p>
      )}

      {suggestions.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-7 sm:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
          {suggestions.map((s) => {
            const isProposed = proposed.has(s.id);
            const hasContact = s.email || s.instagram || s.tiktok || s.twitter;
            return (
              <article key={s.id} className="flex flex-col gap-2.5 border-t border-foreground pt-[18px]">
                <div className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/artistes/${s.id}`}
                    className="font-display text-[30px] leading-none underline-offset-4 hover:underline"
                  >
                    {s.nom}
                  </Link>
                  {ville && <span className="shrink-0 text-xs text-foreground-muted">{t.villeLabels[ville]}</span>}
                </div>
                {s.disciplines.length > 0 && (
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-secondary">
                    {s.disciplines.map((d) => t.disciplineLabels[d] ?? d).join(", ")}
                  </p>
                )}
                {s.bio && <p className="font-display text-[22px] italic leading-[1.2]">{s.bio}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {s.sharedTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
                    >
                      {t.matchingTagLabels[tag]}
                    </span>
                  ))}
                </div>
                {hasContact ? (
                  <ContactLinks email={s.email} instagram={s.instagram} tiktok={s.tiktok} twitter={s.twitter} />
                ) : (
                  <p className="text-xs text-foreground-muted">{t.matching.noContact}</p>
                )}
                <button
                  type="button"
                  onClick={() => handlePropose(s.id)}
                  disabled={isProposed}
                  className="mt-1.5 min-h-11 self-start rounded-full border border-foreground px-[22px] text-xs font-semibold uppercase tracking-[0.1em] transition hover:bg-surface-hover disabled:border-border disabled:text-foreground-muted disabled:hover:bg-transparent"
                >
                  {isProposed ? t.matching.proposed : t.matching.propose}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
