"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/context";
import { ProfileType, Ville } from "@/lib/types";

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

function pillClass(active: boolean) {
  return `rounded-full border px-4 py-2 text-sm font-bold transition ${
    active
      ? "border-transparent bg-accent text-accent-foreground"
      : "border-border bg-transparent text-foreground"
  }`;
}

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
      <div className="mb-3 flex flex-wrap gap-2">
        <button onClick={() => setVilleFilter("")} className={pillClass(villeFilter === "")}>
          {t.common.allCities}
        </button>
        {VILLES.map((v) => (
          <button key={v} onClick={() => setVilleFilter(v)} className={pillClass(villeFilter === v)}>
            {t.villeLabels[v]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {artistes === null && <p className="text-sm text-foreground-muted">{t.common.loading}</p>}
        {artistes !== null && artistes.length === 0 && (
          <p className="text-sm text-foreground-muted">{t.evenements.noResults}</p>
        )}
        {(artistes ?? []).map((a) => {
          const followed = followedIds.has(a.id);
          return (
            <div key={a.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-badge-workshop-bg text-lg font-bold text-badge-workshop-fg">
                {a.nom.charAt(0).toUpperCase()}
              </div>
              <Link href={`/artistes/${a.id}`} className="mt-3 flex items-center gap-1 text-base font-bold">
                {a.nom}
                {a.verified && (a.type_profil === "galerie" || a.type_profil === "institution") && (
                  <span title={t.artiste.verified}>
                    <BadgeCheck size={15} strokeWidth={2} className="text-accent" />
                  </span>
                )}
              </Link>
              <p className="mt-0.5 text-xs text-foreground-muted">{t.villeLabels[a.ville]}</p>
              {a.disciplines.length > 0 && (
                <span className="mt-2.5 inline-block rounded-full bg-badge-workshop-bg px-3 py-1 text-xs font-bold text-badge-workshop-fg">
                  {a.disciplines.map((d) => t.disciplineLabels[d] ?? d).join(", ")}
                </span>
              )}
              {a.bio && <p className="mt-2.5 text-sm">{a.bio}</p>}
              {userId && userId !== a.id && (
                <button
                  type="button"
                  onClick={() => toggleFollow(a.id)}
                  className={`mt-3.5 w-full rounded-full border-[1.5px] border-accent-secondary py-2.5 text-sm font-bold transition ${
                    followed ? "bg-accent-secondary text-accent-secondary-foreground" : "bg-transparent text-accent-secondary"
                  }`}
                >
                  {followed ? t.artiste.unfollow : t.artiste.follow}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
