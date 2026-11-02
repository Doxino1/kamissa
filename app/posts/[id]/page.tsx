"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/context";
import { BlockReportActions } from "@/components/BlockReportActions";
import { sendNotification } from "@/lib/notify";
import { FIELD_INPUT, SECONDARY_BUTTON } from "@/lib/form-styles";

interface PostDetail {
  id: string;
  image: string | null;
  legende: string | null;
  user_id: string;
  profiles: { nom: string } | null;
}

interface Comment {
  id: string;
  texte: string;
  date: string;
  user_id: string;
  profiles: { nom: string } | null;
}

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [post, setPost] = useState<PostDetail | null | undefined>(undefined);
  const [comments, setComments] = useState<Comment[]>([]);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [texte, setTexte] = useState("");
  const [sending, setSending] = useState(false);

  async function loadComments() {
    const supabase = createClient();
    const { data } = await supabase
      .from("comments")
      .select("id, texte, date, user_id, profiles(nom)")
      .eq("post_id", id)
      .order("date", { ascending: true });
    setComments((data ?? []) as unknown as Comment[]);
  }

  async function loadBlocked(uid: string) {
    const supabase = createClient();
    const { data } = await supabase.from("blocks").select("blocker_id, blocked_id");
    const ids = new Set<string>();
    for (const row of data ?? []) {
      if (row.blocker_id === uid) ids.add(row.blocked_id);
      if (row.blocked_id === uid) ids.add(row.blocker_id);
    }
    setBlockedIds(ids);
  }

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      setUserId(user?.id ?? null);

      const { data } = await supabase
        .from("posts")
        .select("id, image, legende, user_id, profiles!posts_user_id_fkey(nom)")
        .eq("id", id)
        .single();
      if (!active) return;
      setPost((data as unknown as PostDetail) ?? null);

      await loadComments();
      if (user) await loadBlocked(user.id);
    }

    load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !texte.trim()) return;
    setSending(true);

    const supabase = createClient();
    await supabase.from("comments").insert({ post_id: id, user_id: userId, texte: texte.trim() });

    if (post) {
      sendNotification({ userId: post.user_id, actorId: userId, type: "comment", postId: id }).catch(() => {});
    }

    setSending(false);
    setTexte("");
    await loadComments();
  }

  if (post === undefined) {
    return (
      <div className="mx-auto w-full max-w-[1240px] px-4 py-10 md:px-10">
        <p className="text-sm text-foreground-muted">{t.common.loading}</p>
      </div>
    );
  }

  if (post === null) {
    return (
      <div className="mx-auto w-full max-w-[1240px] px-4 py-10 md:px-10">
        <p className="text-sm text-danger">404</p>
      </div>
    );
  }

  const visibleComments = comments.filter((c) => !blockedIds.has(c.user_id));

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-wrap gap-x-14 gap-y-8 px-4 pb-16 pt-8 md:px-10 md:pt-12">
      <div className="min-w-0 flex-[999_1_480px]">
        {post.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image} alt={post.legende ?? ""} className="max-h-[80vh] w-full object-contain object-left-top" />
        ) : (
          <div className="aspect-[4/5] w-full bg-placeholder" />
        )}
      </div>

      <div className="min-w-0 flex-[1_1_320px] md:max-w-[420px]">
        <Link
          href={`/artistes/${post.user_id}`}
          className="font-display text-[40px] uppercase leading-none hover:italic md:text-[52px]"
        >
          {post.profiles?.nom}
        </Link>
        {post.legende && <p className="mt-4 font-display text-2xl leading-snug">{post.legende}</p>}
        {userId && post.user_id !== userId && (
          <BlockReportActions
            targetUserId={post.user_id}
            targetName={post.profiles?.nom || ""}
            onBlocked={() => router.push("/")}
            className="mt-3"
          />
        )}

        <h2 className="mt-10 border-b border-foreground pb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-muted">
          {t.posts.comments}
        </h2>
        <div className="flex flex-col">
          {visibleComments.map((c) => (
            <div key={c.id} className="border-b border-border py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">{c.profiles?.nom}</p>
              <p className="mt-1 text-[15px] leading-relaxed text-text-soft">{c.texte}</p>
              {userId && c.user_id !== userId && (
                <BlockReportActions
                  targetUserId={c.user_id}
                  targetName={c.profiles?.nom || ""}
                  onBlocked={() => setBlockedIds((prev) => new Set(prev).add(c.user_id))}
                  className="mt-1"
                />
              )}
            </div>
          ))}
        </div>

        {userId && (
          <form onSubmit={handleComment} className="mt-6 flex items-end gap-4">
            <input
              type="text"
              required
              placeholder={t.posts.addComment}
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              className={`${FIELD_INPUT} flex-1 text-xl md:text-[22px]`}
            />
            <button type="submit" disabled={sending} className={SECONDARY_BUTTON}>
              {sending ? "…" : t.posts.send}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
