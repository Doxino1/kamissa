"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/context";
import { BlockReportActions } from "@/components/BlockReportActions";
import { sendNotification } from "@/lib/notify";

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
      <div className="mx-auto w-full max-w-md px-4 py-8">
        <p className="text-sm text-foreground-muted">{t.common.loading}</p>
      </div>
    );
  }

  if (post === null) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-8">
        <p className="text-sm text-red-600">404</p>
      </div>
    );
  }

  const visibleComments = comments.filter((c) => !blockedIds.has(c.user_id));

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      {post.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.image} alt={post.legende ?? ""} className="w-full rounded-lg object-cover" />
      )}
      <p className="mt-3 text-sm">
        <Link href={`/artistes/${post.user_id}`} className="font-medium hover:underline">
          {post.profiles?.nom}
        </Link>{" "}
        {post.legende}
      </p>
      {userId && post.user_id !== userId && (
        <BlockReportActions
          targetUserId={post.user_id}
          targetName={post.profiles?.nom || ""}
          onBlocked={() => router.push("/")}
          className="mt-1.5"
        />
      )}

      <h2 className="mt-6 text-sm font-medium text-foreground-muted">{t.posts.comments}</h2>
      <div className="mt-3 flex flex-col gap-2">
        {visibleComments.map((c) => (
          <div key={c.id} className="text-sm">
            <p>
              <span className="font-medium">{c.profiles?.nom}</span> {c.texte}
            </p>
            {userId && c.user_id !== userId && (
              <BlockReportActions
                targetUserId={c.user_id}
                targetName={c.profiles?.nom || ""}
                onBlocked={() => setBlockedIds((prev) => new Set(prev).add(c.user_id))}
                className="mt-0.5"
              />
            )}
          </div>
        ))}
      </div>

      {userId && (
        <form onSubmit={handleComment} className="mt-4 flex gap-2">
          <input
            type="text"
            required
            placeholder={t.posts.addComment}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            className="flex-1 rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
          >
            {sending ? "…" : t.posts.send}
          </button>
        </form>
      )}
    </div>
  );
}
