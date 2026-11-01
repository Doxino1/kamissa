"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/context";
import { ProfileType, Ville } from "@/lib/types";
import { pillClass } from "@/components/EventFilterBar";

interface ArtisteRow {
  id: string;
  nom: string;
  ville: Ville;
  type_profil: ProfileType;
  disciplines: string[];
  bio: string | null;
  verified: boolean;
}

const VILLES: Ville[] = ["Paris", "Athènes"];

// Avatars en accents terre, attribués à tour de rôle.
const AVATAR_TONES = [
  "bg-cat-expo",
  "bg-cat-atelier",
  "bg-cat-residence",
  "bg-cat-annonce",
  "bg-cat-vernissage",
  "bg-cat-open-call",
];

export function ArtistesTab() {
  const t = useT();
  const [villeFilter, setVilleFilter] = useState<Ville | "">("");
  const [artistes, setArtistes] = useState<ArtisteRow[] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    let query = supabase.from("profiles").select("id, nom, ville, type_profil, disciplines, bio, verified");
    if (villeFilter) query = query.eq("ville", villeFilter);
    query.order("nom").then(({ data }) => {
      if (active) setArtistes((data ?? []) as ArtisteRow[]);
    });

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!active || !user) return;
      setUserId(user.id);
      const { data } = await supabase.from("follows").select("followed_id").eq("follower_id", user.id);
      if (active) setFollowedIds(new Set((data ?? []).map((r) => r.followed_id)));
    });

    return () => {
      active = false;
    };
  }, [villeFilter]);

  async function toggleFollow(id: string) {
    if (!userId) return;
    const supabase = createClient();
    if (followedIds.has(id)) {
      await supabase.from("follows").delete().eq("follower_id", userId).eq("followed_id", id);
      setFollowedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      await supabase.from("follows").insert({ follower_id: userId, followed_id: id });
      setFollowedIds((prev) => new Set(prev).add(id));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 pt-6">
        <button onClick={() => setVilleFilter("")} aria-pressed={villeFilter === ""} className={pillClass(villeFilter === "")}>
          {t.common.allCities}
        </button>
        {VILLES.map((v) => (
          <button key={v} onClick={() => setVilleFilter(v)} aria-pressed={villeFilter === v} className={pillClass(villeFilter === v)}>
            {t.villeLabels[v]}
          </button>
        ))}
      </div>

      {artistes === null && <p className="mt-6 text-sm text-foreground-muted">{t.common.loading}</p>}
      {artistes !== null && artistes.length === 0 && (
        <p className="py-14 text-center font-display text-[26px] italic text-foreground-muted">{t.evenements.noResults}</p>
      )}
      <div className="mt-4 grid grid-cols-1 border-l border-t border-border sm:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
        {(artistes ?? []).map((a, i) => {
          const followed = followedIds.has(a.id);
          return (
            <article key={a.id} className="flex flex-col gap-2.5 border-b border-r border-border px-6 py-7">
              <span
                aria-hidden="true"
                className={`flex h-16 w-16 items-center justify-center rounded-full font-display text-[30px] text-white ${
                  AVATAR_TONES[i % AVATAR_TONES.length]
                }`}
              >
                {a.nom.charAt(0).toUpperCase()}
              </span>
              <Link
                href={`/artistes/${a.id}`}
                className="mt-1.5 flex items-center gap-1.5 font-display text-[30px] leading-none underline-offset-4 hover:underline"
              >
                {a.nom}
                {a.verified && (a.type_profil === "galerie" || a.type_profil === "institution") && (
                  <span title={t.artiste.verified}>
                    <BadgeCheck size={18} strokeWidth={1.75} className="text-accent-secondary" />
                  </span>
                )}
              </Link>
              <p className="text-xs uppercase tracking-[0.1em] text-foreground-muted">
                {t.villeLabels[a.ville]}
                {a.disciplines.length > 0 && (
                  <>
                    {" · "}
                    <span className="font-semibold text-accent-secondary">
                      {a.disciplines.map((d) => t.disciplineLabels[d] ?? d).join(", ")}
                    </span>
                  </>
                )}
              </p>
              {a.bio && <p className="text-sm leading-[1.45]">{a.bio}</p>}
              {userId && userId !== a.id && (
                <button
                  type="button"
                  onClick={() => toggleFollow(a.id)}
                  aria-pressed={followed}
                  className={`mt-auto min-h-11 rounded-full border border-accent-secondary text-xs font-semibold uppercase tracking-[0.1em] transition ${
                    followed ? "bg-accent-secondary text-accent-secondary-foreground" : "bg-transparent text-accent-secondary"
                  }`}
                >
                  {followed ? t.artiste.unfollow : t.artiste.follow}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
