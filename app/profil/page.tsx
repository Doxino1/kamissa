"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/context";
import { portfolioPdfUrl } from "@/lib/upload";
import { Toggle } from "@/components/Toggle";
import { serifTabClass, tabLabelClass, TAB_NUMBER } from "@/components/PageHeader";
import { ProfileType, Ville } from "@/lib/types";

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

const tabClass = (active: boolean) => serifTabClass(active, "md:text-[40px]");

// Tons terre des cases du portfolio sans photo (dégradés de la maquette).
const PORTFOLIO_TONES = [
  "from-cat-expo to-[#3f5761]",
  "from-cat-atelier to-[#a87b3e]",
  "from-cat-residence to-accent-secondary",
  "from-cat-annonce to-[#7d6f5a]",
  "from-cat-vernissage to-[#86695f]",
  "from-cat-open-call to-[#245d63]",
];

export default function ProfilPage() {
  const t = useT();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [nom, setNom] = useState("");
  const [typeProfil, setTypeProfil] = useState<ProfileType>("amateur");
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [ville, setVille] = useState<Ville | null>(null);
  const [portfolioPublic, setPortfolioPublic] = useState(true);
  const [postsPublic, setPostsPublic] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

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
          .select("nom, ville, disciplines, type_profil, bio, portfolio_public, posts_public, portfolio_pdf")
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
        setVille((data.ville as Ville) ?? null);
        setPortfolioPublic(data.portfolio_public);
        setPostsPublic(data.posts_public);
        if (data.portfolio_pdf) {
          const url = await portfolioPdfUrl(data.portfolio_pdf);
          if (active) setPdfUrl(url);
        }
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
      <div className="mx-auto w-full max-w-[1240px] px-4 py-10 md:px-10">
        <p className="text-sm text-foreground-muted">{t.common.loading}</p>
      </div>
    );
  }

  const disciplineLabels = disciplines.map((d) => t.disciplineLabels[d] ?? d);
  const subtitle = [disciplineLabels.join(", ").toLowerCase(), ville ? t.villeLabels[ville] : null]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="pb-16">
      {/* Identité : nom en très grand, avatar posé dessus, carrés de couleur en décor. */}
      <section className="relative mx-auto max-w-[1240px] px-4 pb-10 pt-8 text-center md:px-10 md:pt-14">
        <div className="relative pt-[96px] md:min-h-[380px] md:pt-[92px]">
          <div aria-hidden="true" className="hidden md:block">
            <span className="absolute left-[4%] top-[30px] h-[110px] w-[150px] bg-gradient-to-br from-cat-expo to-[#3f5761]" />
            <span className="absolute left-[16%] top-[230px] h-[150px] w-[120px] bg-gradient-to-br from-cat-atelier to-[#a87b3e]" />
            <span className="absolute right-[6%] top-[10px] h-20 w-[110px] bg-gradient-to-br from-cat-annonce to-[#7d6f5a]" />
            <span className="absolute right-[12%] top-[210px] h-[130px] w-[170px] bg-gradient-to-br from-cat-residence to-accent-secondary" />
          </div>
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-0 flex h-[104px] w-[104px] -translate-x-1/2 items-center justify-center rounded-full border-[6px] border-background bg-cat-vernissage font-display text-5xl text-background md:h-[132px] md:w-[132px] md:text-[64px]"
          >
            {initials(nom)}
          </div>
          <h1 className="relative mt-6 break-words font-display text-[clamp(3.5rem,15vw,13.75rem)] uppercase leading-[0.82] tracking-[-0.02em] md:mt-[110px]">
            {nom}
          </h1>
          {subtitle && (
            <p className="relative mt-1.5 font-display text-[clamp(1.75rem,5.5vw,4.75rem)] italic leading-none">
              {subtitle}
            </p>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-full border border-foreground px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em]">
            {t.profileTypeLabels[typeProfil]}
          </span>
          {disciplineLabels.map((d) => (
            <span
              key={d}
              className="rounded-full bg-accent-secondary px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-accent-secondary-foreground"
            >
              {d}
            </span>
          ))}
        </div>
      </section>

      {/* Chiffres, bio, accès aux paramètres. */}
      <section className="mx-auto grid max-w-[1240px] gap-x-10 border-t border-border px-4 pb-14 pt-6 md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] md:px-10">
        <dl className="grid grid-cols-3 gap-3 pt-7">
          {[
            [t.profil.postsLabel, posts.length],
            [t.profil.followersLabel, followerCount],
            [t.profil.followingLabel, followingCount],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col-reverse">
              <dt className="text-xs uppercase tracking-[0.1em] text-foreground-muted">{label}</dt>
              <dd className="font-display text-[56px] leading-none md:text-[64px]">{value}</dd>
            </div>
          ))}
        </dl>
        {bio && (
          <div className="pt-7">
            <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-foreground-muted">
              {t.profil.bio}
            </h2>
            <p className="font-display text-2xl leading-[1.2] md:text-[28px]">{bio}</p>
          </div>
        )}
        <div className="flex items-start pt-7">
          <Link
            href="/profil/parametres"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-[22px] text-[13px] font-semibold uppercase tracking-[0.06em] text-background transition hover:bg-accent-hover"
          >
            <Settings size={15} strokeWidth={1.75} />
            {t.profil.settingsLink}
          </Link>
        </div>
      </section>

      {/* Œuvres : onglets numérotés ; la bibliothèque privée reste une page à part. */}
      <section className="mx-auto max-w-[1240px] px-4 md:px-10">
        <div
          role="tablist"
          className="flex flex-wrap gap-x-10 gap-y-2 border-b border-t border-b-border border-t-foreground py-[22px]"
        >
          <button role="tab" aria-selected={tab === "posts"} onClick={() => setTab("posts")} className={tabClass(tab === "posts")}>
            <span className={TAB_NUMBER}>( 01 )</span>
            <span className={tabLabelClass(tab === "posts")}>{t.profil.postsLabel}</span>
          </button>
          <button
            role="tab"
            aria-selected={tab === "portfolio"}
            onClick={() => setTab("portfolio")}
            className={tabClass(tab === "portfolio")}
          >
            <span className={TAB_NUMBER}>( 02 )</span>
            <span className={tabLabelClass(tab === "portfolio")}>{t.artiste.portfolio}</span>
          </button>
          <Link href="/profil/bibliotheque" className={tabClass(false)}>
            <span className={TAB_NUMBER}>( 03 )</span>
            <Lock size={20} strokeWidth={1.5} className="self-center" />
            {t.library.title}
          </Link>
        </div>

        {tab === "posts" && (
          <div className="mt-9">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="font-display text-[28px] leading-tight md:text-[34px]">{t.profil.postsSubtitle}</p>
              <Toggle checked={postsPublic} onChange={(v) => setVisibility("posts_public", v)} />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] md:gap-7">
              <Link
                href="/profil/posts"
                className="flex aspect-[4/5] flex-col items-center justify-center gap-2 border border-dashed border-foreground font-display text-[26px] transition hover:bg-surface-hover"
              >
                +
              </Link>
              {posts.map((post) => (
                <Link key={post.id} href={`/posts/${post.id}`} className="aspect-[4/5]">
                  {post.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.image} alt={post.legende ?? ""} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-placeholder" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {tab === "portfolio" && (
          <div className="mt-9">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="font-display text-[28px] leading-tight md:text-[34px]">{t.profil.portfolioSubtitle}</p>
              <Toggle checked={portfolioPublic} onChange={(v) => setVisibility("portfolio_public", v)} />
            </div>

            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex min-h-11 items-center rounded-full bg-foreground px-[22px] text-xs font-semibold uppercase tracking-[0.1em] text-background transition hover:bg-accent-hover"
              >
                {t.portfolio.pdfView}
              </a>
            )}

            <div className="mt-6 grid grid-cols-1 gap-x-7 gap-y-10 sm:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
              {portfolio.map((item, i) => (
                <figure key={item.id} className="flex flex-col gap-3">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt={item.titre}
                      className={`w-full object-cover ${i % 2 === 0 ? "aspect-[4/5]" : "aspect-square"}`}
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className={`w-full bg-gradient-to-br ${PORTFOLIO_TONES[i % PORTFOLIO_TONES.length]} ${
                        i % 2 === 0 ? "aspect-[4/5]" : "aspect-square"
                      }`}
                    />
                  )}
                  <figcaption className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-[26px] leading-tight">{item.titre}</span>
                    <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-muted">
                      {[item.technique, item.annee].filter(Boolean).join(" · ")}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <Link
              href="/profil/portfolio"
              className="mt-10 inline-flex min-h-11 items-center rounded-full border border-foreground px-[22px] text-xs font-semibold uppercase tracking-[0.1em] transition hover:bg-surface-hover"
            >
              + {t.portfolio.addPiece}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
