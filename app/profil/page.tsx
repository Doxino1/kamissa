"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/context";
import { Toggle } from "@/components/Toggle";
import { ProfileType } from "@/lib/types";

type Tab = "posts" | "portfolio";

interface Post {
  id: string;
  image: string | null;
  legende: string | null;
}

interface PortfolioItem {
  id: string;
  titre: string;
  technique: string | null;
  annee: number | null;
  image_url: string | null;
}

function initials(nom: string) {
  const parts = nom.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function tabClass(active: boolean) {
  return `flex-1 flex items-center justify-center gap-1.5 border-b-[3px] py-2.5 text-sm font-bold transition ${
    active ? "border-accent text-foreground" : "border-transparent text-foreground-muted"
  }`;
}

export default function ProfilPage() {
  const t = useT();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [nom, setNom] = useState("");
  const [typeProfil, setTypeProfil] = useState<ProfileType>("amateur");
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [portfolioPublic, setPortfolioPublic] = useState(true);
  const [postsPublic, setPostsPublic] = useState(true);

  const [tab, setTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

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

      const [
        { data, error: fetchError },
        { data: userPosts },
        { data: items },
        { count: followers },
        { count: following },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("nom, ville, disciplines, type_profil, bio, portfolio_public, posts_public")
          .eq("id", user.id)
          .single(),
        supabase.from("posts").select("id, image, legende").eq("user_id", user.id).order("date", { ascending: false }),
        supabase
          .from("portfolio_items")
          .select("id, titre, technique, annee, image_url")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("followed_id", user.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
      ]);

      if (!active) return;

      if (!fetchError && data) {
        setNom(data.nom ?? "");
        setTypeProfil(data.type_profil as ProfileType);
        setDisciplines(data.disciplines ?? []);
        setBio(data.bio ?? "");
        setPortfolioPublic(data.portfolio_public);
        setPostsPublic(data.posts_public);
      }
      setPosts(userPosts ?? []);
      setPortfolio(items ?? []);
      setFollowerCount(followers ?? 0);
      setFollowingCount(following ?? 0);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [router]);

  async function setVisibility(field: "portfolio_public" | "posts_public", value: boolean) {
    if (!userId) return;
    if (field === "portfolio_public") setPortfolioPublic(value);
    else setPostsPublic(value);

    const supabase = createClient();
    await supabase.from("profiles").update({ [field]: value }).eq("id", userId);
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-sm px-4 py-8 md:max-w-2xl md:px-8 md:py-10">
        <p className="text-sm text-foreground-muted">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-8 md:max-w-2xl md:px-8 md:py-10">
      <div className="flex justify-end">
        <Link
          href="/profil/parametres"
          aria-label={t.profil.settingsLink}
          title={t.profil.settingsLink}
          className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-border"
        >
          <Settings size={17} strokeWidth={2} />
        </Link>
      </div>

      {/* En-tête */}
      <div className="flex flex-col items-center text-center">
        <div className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-accent font-display text-[30px] font-bold text-accent-foreground">
          {initials(nom)}
        </div>
        <p className="mt-1.5 text-xl font-black">{nom}</p>
        <span className="mt-1.5 rounded-full border border-border bg-surface px-3.5 py-1 text-xs font-bold text-foreground-muted">
          {t.profileTypeLabels[typeProfil]}
        </span>
        <p className="mt-1.5 text-sm font-bold text-accent-secondary">
          {disciplines.map((d) => t.disciplineLabels[d] ?? d).join(" · ")}
        </p>

        <div className="mt-[18px] flex gap-9">
          <div className="flex flex-col items-center gap-0.5">
            <p className="text-base font-bold">{posts.length}</p>
            <p className="text-xs text-foreground-muted">{t.profil.postsLabel}</p>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <p className="text-base font-bold">{followerCount}</p>
            <p className="text-xs text-foreground-muted">{t.profil.followersLabel}</p>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <p className="text-base font-bold">{followingCount}</p>
            <p className="text-xs text-foreground-muted">{t.profil.followingLabel}</p>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="mt-7 flex border-b border-border">
        <button onClick={() => setTab("posts")} className={tabClass(tab === "posts")}>
          {t.profil.postsLabel}
        </button>
        <button onClick={() => setTab("portfolio")} className={tabClass(tab === "portfolio")}>
          {t.artiste.portfolio}
        </button>
      </div>

      {tab === "posts" && (
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-foreground/50">{t.profil.postsSubtitle}</p>
            <Toggle checked={postsPublic} onChange={(v) => setVisibility("posts_public", v)} />
          </div>

          <div className="grid grid-cols-3 gap-1">
            <Link
              href="/profil/posts"
              className="flex aspect-square items-center justify-center rounded border-[1.5px] border-dashed border-foreground/25 text-foreground/40 hover:border-foreground/40"
            >
              <span className="text-xl leading-none">+</span>
            </Link>
            {posts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="aspect-square">
                {post.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.image} alt={post.legende ?? ""} className="h-full w-full rounded object-cover" />
                ) : (
                  <div className="h-full w-full rounded bg-foreground/5" />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {tab === "portfolio" && (
        <div className="mt-3">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-xs text-foreground/50">{t.profil.portfolioSubtitle}</p>
            <Toggle checked={portfolioPublic} onChange={(v) => setVisibility("portfolio_public", v)} />
          </div>

          <div className="flex flex-col gap-2">
            {portfolio.map((item) => (
              <div key={item.id} className="flex gap-2.5 rounded-lg border border-border bg-surface p-2.5">
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt={item.titre} className="h-[52px] w-[52px] shrink-0 rounded object-cover" />
                ) : (
                  <div className="h-[52px] w-[52px] shrink-0 rounded bg-foreground/10" />
                )}
                <div>
                  <p className="text-sm font-medium">{item.titre}</p>
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    {[item.technique, item.annee].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
            ))}
            <Link
              href="/profil/portfolio"
              className="rounded-lg border border-border py-2 text-center text-sm hover:border-foreground/40"
            >
              + {t.portfolio.addPiece}
            </Link>
          </div>
        </div>
      )}

      {/* Bibliothèque privée */}
      <Link
        href="/profil/bibliotheque"
        className="mt-5 flex items-center gap-3 rounded-lg border border-border bg-surface px-5 py-4 transition"
      >
        <Lock size={18} strokeWidth={2} className="shrink-0" />
        <span>
          <p className="text-sm font-bold">{t.library.title}</p>
          <p className="mt-0.5 text-xs text-foreground-muted">{t.library.subtitle}</p>
        </span>
      </Link>

      {/* Bio */}
      {bio && (
        <div className="mt-3.5 rounded-lg border border-border bg-surface px-5 py-4">
          <p className="text-sm font-bold">{t.profil.bio}</p>
          <p className="mt-1 text-sm text-foreground-muted">{bio}</p>
        </div>
      )}
    </div>
  );
}
