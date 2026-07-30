"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/context";
import { BlockReportActions } from "@/components/BlockReportActions";
import { ContactLinks } from "@/components/ContactLinks";
import { sendNotification } from "@/lib/notify";
import { ProfileType } from "@/lib/types";

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
              "id, nom, bio, ville, disciplines, type_profil, portfolio_public, posts_public, verified, email_contact, instagram_handle, tiktok_handle, twitter_handle"
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
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <p className="text-sm text-foreground-muted">{t.common.loading}</p>
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <p className="text-sm text-red-600">{t.artiste.notFound}</p>
      </div>
    );
  }

  const isOwn = viewerId === profile.id;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-1.5 text-xl font-semibold">
            {profile.nom}
            {profile.verified && (profile.type_profil === "galerie" || profile.type_profil === "institution") && (
              <span title={t.artiste.verified}>
                <BadgeCheck size={18} strokeWidth={2} className="text-accent" />
              </span>
            )}
          </h1>
          <p className="text-sm text-foreground-muted">
            {t.profileTypeLabels[profile.type_profil]} · {t.villeLabels[profile.ville as "Paris" | "Athènes"]}
          </p>
        </div>
        {!isOwn && viewerId && (
          <button
            type="button"
            onClick={toggleFollow}
            className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition ${
              following
                ? "border-foreground/20 hover:border-foreground/40"
                : "border-accent bg-accent text-accent-foreground hover:opacity-90"
            }`}
          >
            {following ? t.artiste.unfollow : t.artiste.follow}
          </button>
        )}
      </div>

      <p className="mt-1 text-xs text-foreground/40">
        {t.artiste.followers(followerCount)} · {t.artiste.following(followingCount)}
      </p>

      {!isOwn && viewerId && (
        <BlockReportActions
          targetUserId={profile.id}
          targetName={profile.nom}
          onBlocked={() => router.push("/artistes")}
          className="mt-2"
        />
      )}

      {profile.bio && <p className="mt-4 text-sm">{profile.bio}</p>}
      <p className="mt-2 text-sm text-foreground-muted">
        {profile.disciplines.map((d) => t.disciplineLabels[d] ?? d).join(", ")}
      </p>

      <div className="mt-3">
        <ContactLinks
          email={profile.email_contact}
          instagram={profile.instagram_handle}
          tiktok={profile.tiktok_handle}
          twitter={profile.twitter_handle}
        />
      </div>

      <h2 className="mt-8 text-sm font-medium text-foreground-muted">{t.artiste.portfolio}</h2>
      {profile.portfolio_public || isOwn ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {portfolio.map((item) => (
            <div key={item.id} className="rounded-lg border border-foreground/10 p-2">
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image_url} alt={item.titre} className="aspect-square w-full rounded object-cover" />
              ) : (
                <div className="aspect-square w-full rounded bg-foreground/5" />
              )}
              <p className="mt-2 text-sm font-medium">{item.titre}</p>
              <p className="text-xs text-foreground-muted">
                {[item.technique, item.annee].filter(Boolean).join(" · ")}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-foreground/40">{t.portfolio.private}</p>
      )}

      <h2 className="mt-8 text-sm font-medium text-foreground-muted">{t.artiste.posts}</h2>
      {profile.posts_public || isOwn ? (
        <div className="mt-3 grid grid-cols-3 gap-1">
          {posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`} className="aspect-square">
              {post.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-foreground/5" />
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-foreground/40">{t.posts.private}</p>
      )}
    </div>
  );
}
