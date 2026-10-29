"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload";
import { useT } from "@/lib/i18n/context";

interface Post {
  id: string;
  image: string | null;
  legende: string | null;
}

export default function MesPostsPage() {
  const t = useT();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[] | null>(null);

  const [legende, setLegende] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(uid: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("posts")
      .select("id, image, legende")
      .eq("user_id", uid)
      .order("date", { ascending: false });
    setPosts(data ?? []);
  }

  useEffect(() => {
    let active = true;
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (!active) return;
        if (!user) {
          router.push("/login");
          return;
        }
        setUserId(user.id);
        load(user.id);
      });
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !file) return;
    setSaving(true);
    setError(null);

    const { url, error: uploadError } = await uploadImage(userId, "posts", file);
    if (uploadError || !url) {
      setSaving(false);
      setError(uploadError ?? "Upload failed");
      return;
    }

    const supabase = createClient();
    const { error: insertError } = await supabase.from("posts").insert({
      user_id: userId,
      image: url,
      legende: legende || null,
    });

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setLegende("");
    setFile(null);
    load(userId);
  }

  async function handleDelete(id: string) {
    if (!userId) return;
    const supabase = createClient();
    await supabase.from("posts").delete().eq("id", id);
    load(userId);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:max-w-none md:px-10 md:pb-10 md:pt-7">
      <h1 className="text-xl font-black">{t.posts.title}</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 rounded-lg border border-border p-4 md:max-w-[480px]">
        <input
          type="file"
          accept="image/*"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-foreground-muted file:mr-3 file:cursor-pointer file:rounded-full file:border file:border-border file:bg-surface file:px-4 file:py-2 file:text-sm file:font-bold file:text-foreground hover:file:bg-background"
        />
        <textarea
          placeholder={t.posts.legende}
          value={legende}
          onChange={(e) => setLegende(e.target.value)}
          rows={2}
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "…" : t.posts.publish}
        </button>
      </form>

      <div className="mt-6 grid grid-cols-3 gap-1 md:gap-[14px] min-[75rem]:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
        {posts !== null && posts.length === 0 && (
          <p className="col-span-full text-sm text-foreground-muted">{t.posts.empty}</p>
        )}
        {(posts ?? []).map((post) => (
          <div key={post.id} className="group relative aspect-square">
            <Link href={`/posts/${post.id}`}>
              {post.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.image} alt={post.legende ?? ""} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-foreground/5" />
              )}
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(post.id)}
              className="absolute right-1 top-1 rounded-full bg-background/80 px-2 py-0.5 text-xs text-red-600 opacity-0 transition group-hover:opacity-100"
            >
              {t.posts.delete}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
