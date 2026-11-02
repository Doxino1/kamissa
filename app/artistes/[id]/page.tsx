"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/context";
import { portfolioPdfUrl } from "@/lib/upload";
import { BlockReportActions } from "@/components/BlockReportActions";
import { ContactLinks } from "@/components/ContactLinks";
import { sendNotification } from "@/lib/notify";
import { ProfileType } from "@/lib/types";
import { TAB_NUMBER } from "@/components/PageHeader";

function initials(nom: string) {
  const parts = nom.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

interface PublicProfile {
  id: string;
  nom: string;
  bio: string | null;
  ville: string;
  disciplines: string[];
  type_profil: ProfileType;
  portfolio_public: boolean;
  posts_public: boolean;
  verified: boolean;
  email_contact: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  twitter_handle: string | null;
  portfolio_pdf: string | null;
}

interface PortfolioItem {
  id: string;
  titre: string;
  technique: string | null;
  annee: number | null;
  image_url: string | null;
}

interface Post {
  id: string;
  image: string | null;
}

export default function ArtisteProfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const router = useRouter();
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null | undefined>(undefined);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      setViewerId(user?.id ?? null);

      const [{ data: prof }, { data: items }, { data: userPosts }, { count: followers }, { count: follows }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id, nom, bio, ville, disciplines, type_profil, portfolio_public, posts_public, verified, email_contact, instagram_handle, tiktok_handle, twitter_handle, portfolio_pdf"
            )
            .eq("id", id)
            .single(),
          supabase
            .from("portfolio_items")
            .select("id, titre, technique, annee, image_url")
            .eq("user_id", id)
            .order("created_at", { ascending: false }),
          supabase
            .from("posts")
            .select("id, image")
            .eq("user_id", id)
            .order("date", { ascending: false }),
          supabase.from("follows").select("*", { count: "exact", head: true }).eq("followed_id", id),
          supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", id),
        ]);

      if (!active) return;
      setProfile((prof as PublicProfile) ?? null);
      setPortfolio(items ?? []);
      setPosts(userPosts ?? []);
      setFollowerCount(followers ?? 0);
      setFollowingCount(follows ?? 0);

      // URL signée refusée par le stockage si le portfolio est privé.
      if (prof?.portfolio_pdf) {
        const url = await portfolioPdfUrl(prof.portfolio_pdf);
        if (active) setPdfUrl(url);
      }

      if (user) {
        const { data: existing } = await supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", user.id)
          .eq("followed_id", id)
          .maybeSingle();
        if (active) setFollowing(!!existing);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [id]);

  async function toggleFollow() {
    if (!viewerId) return;
    const supabase = createClient();
    if (following) {
      await supabase.from("follows").delete().eq("follower_id", viewerId).eq("followed_id", id);
      setFollowing(false);
      setFollowerCount((c) => c - 1);
    } else {
      await supabase.from("follows").insert({ follower_id: viewerId, followed_id: id });
      setFollowing(true);
      setFollowerCount((c) => c + 1);
      sendNotification({ userId: id, actorId: viewerId, type: "follower" }).catch(() => {});
    }
  }

  if (profile === undefined) {
    return (
      <div className="mx-auto w-full max-w-[1240px] px-4 py-10 md:px-10">
        <p className="text-sm text-foreground-muted">{t.common.loading}</p>
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="mx-auto w-full max-w-[1240px] px-4 py-10 md:px-10">
        <p className="text-sm text-danger">{t.artiste.notFound}</p>
      </div>
    );
  }

  const isOwn = viewerId === profile.id;
  const disciplineLabels = profile.disciplines.map((d) => t.disciplineLabels[d] ?? d);
  const ville = t.villeLabels[profile.ville as "Paris" | "Athènes"] ?? profile.ville;
  const subtitle = [disciplineLabels.join(", ").toLowerCase(), ville].filter(Boolean).join(", ");
  const showPortfolio = profile.portfolio_public || isOwn;
  const showPosts = profile.posts_public || isOwn;

  return (
    <div className="pb-16">
      {/* Identité : même composition que /profil (nom en très grand, avatar posé dessus). */}
      <section className="relative mx-auto max-w-[1240px] px-4 pb-10 pt-8 text-center md:px-10 md:pt-14">
        <div className="relative pt-[96px] md:min-h-[340px] md:pt-[92px]">
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
            {initials(profile.nom)}
          </div>
          <h1 className="relative mt-6 break-words font-display text-[clamp(3.5rem,15vw,13.75rem)] uppercase leading-[0.82] tracking-[-0.02em] md:mt-[110px]">
            {profile.nom}
            {profile.verified && (profile.type_profil === "galerie" || profile.type_profil === "institution") && (
              <span title={t.artiste.verified} className="ml-3 inline-block align-top">
                <BadgeCheck strokeWidth={1.5} className="h-[0.3em] w-[0.3em] text-accent-secondary" />
              </span>
            )}
          </h1>
          {subtitle && (
            <p className="relative mt-1.5 font-display text-[clamp(1.75rem,5.5vw,4.75rem)] italic leading-none">
              {subtitle}
            </p>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-full border border-foreground px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em]">
            {t.profileTypeLabels[profile.type_profil]}
          </span>
        </div>
      </section>

      {/* Chiffres, bio, suivi et contact. */}
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
        {profile.bio && (
          <div className="pt-7">
            <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-foreground-muted">
              {t.profil.bio}
            </h2>
            <p className="font-display text-2xl leading-[1.2] md:text-[28px]">{profile.bio}</p>
          </div>
        )}
        <div className="flex flex-col items-start gap-4 pt-7">
          {!isOwn && viewerId && (
            <button
              type="button"
              onClick={toggleFollow}
              className={`inline-flex min-h-11 items-center rounded-full px-[22px] text-[13px] font-semibold uppercase tracking-[0.06em] transition ${
                following
                  ? "border border-foreground hover:bg-surface-hover"
                  : "bg-foreground text-background hover:bg-accent-hover"
              }`}
            >
              {following ? t.artiste.unfollow : t.artiste.follow}
            </button>
          )}
          <ContactLinks
            email={profile.email_contact}
            instagram={profile.instagram_handle}
            tiktok={profile.tiktok_handle}
            twitter={profile.twitter_handle}
          />
          {!isOwn && viewerId && (
            <BlockReportActions
              targetUserId={profile.id}
              targetName={profile.nom}
              onBlocked={() => router.push("/artistes")}
            />
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 md:px-10">
        <h2 className="flex items-baseline gap-2.5 border-t border-foreground py-[22px] font-display text-[28px] md:text-[40px]">
          <span className={TAB_NUMBER}>( 01 )</span>
          {t.artiste.portfolio}
        </h2>
        {showPortfolio ? (
          <>
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-6 inline-flex min-h-11 items-center rounded-full bg-foreground px-[22px] text-xs font-semibold uppercase tracking-[0.1em] text-background transition hover:bg-accent-hover"
              >
                {t.portfolio.pdfView}
              </a>
            )}
            <div className="grid grid-cols-1 gap-x-7 gap-y-10 sm:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
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
                    <div className={`w-full bg-placeholder ${i % 2 === 0 ? "aspect-[4/5]" : "aspect-square"}`} />
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
          </>
        ) : (
          <p className="flex items-center gap-2 font-display text-2xl text-foreground-muted">
            <Lock size={18} strokeWidth={1.5} />
            {t.portfolio.private}
          </p>
        )}

        <h2 className="mt-14 flex items-baseline gap-2.5 border-t border-foreground py-[22px] font-display text-[28px] md:text-[40px]">
          <span className={TAB_NUMBER}>( 02 )</span>
          {t.artiste.posts}
        </h2>
        {showPosts ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] md:gap-7">
            {posts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="aspect-[4/5]">
                {post.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-placeholder" />
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="flex items-center gap-2 font-display text-2xl text-foreground-muted">
            <Lock size={18} strokeWidth={1.5} />
            {t.posts.private}
          </p>
        )}
      </section>
    </div>
  );
}
