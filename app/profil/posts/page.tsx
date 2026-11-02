"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { IMAGE_ACCEPT, uploadErrorMessage, uploadImage } from "@/lib/upload";
import { useT } from "@/lib/i18n/context";
import { BackLink, PageHeader } from "@/components/PageHeader";
import { FIELD, FIELD_LABEL, FIELD_TEXTAREA, FILE_INPUT, PRIMARY_BUTTON, SECTION, SECTION_TITLE } from "@/lib/form-styles";

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

    const { url, error: uploadError, errorCode } = await uploadImage(userId, "posts", file);
    if (!url) {
      setSaving(false);
      setError(uploadErrorMessage(t, errorCode, uploadError));
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
    <div className="pb-16">
      <PageHeader title={t.posts.title} eyebrow={<BackLink href="/profil">{t.nav.profil}</BackLink>} />

      <main className="mx-auto flex max-w-[1280px] flex-wrap gap-x-14 px-4 md:px-10">
        <form
          onSubmit={handleSubmit}
          className={`${SECTION} flex min-w-0 flex-[1_1_320px] flex-col gap-[22px] self-start md:max-w-[420px]`}
        >
          <h2 className={`${SECTION_TITLE} mb-0`}>{t.posts.publish}</h2>
          <label className={FIELD}>
            <span className={FIELD_LABEL}>{t.portfolio.image}</span>
            <input
              type="file"
              accept={IMAGE_ACCEPT}
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className={`${FILE_INPUT} mt-2`}
            />
          </label>
          <label className={FIELD}>
            <span className={FIELD_LABEL}>{t.posts.legende}</span>
            <textarea value={legende} onChange={(e) => setLegende(e.target.value)} rows={3} className={FIELD_TEXTAREA} />
          </label>
          {error && <p className="text-sm font-semibold text-danger">{error}</p>}
          <button type="submit" disabled={saving} className={`${PRIMARY_BUTTON} self-start`}>
            {saving ? "…" : t.posts.publish}
          </button>
        </form>

        <div className="mt-7 grid min-w-0 flex-[999_1_560px] grid-cols-3 content-start gap-1.5 md:gap-[14px] min-[75rem]:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
          {posts !== null && posts.length === 0 && (
            <p className="col-span-full font-display text-2xl text-foreground-muted">{t.posts.empty}</p>
          )}
          {(posts ?? []).map((post) => (
            <div key={post.id} className="group relative aspect-square">
              <Link href={`/posts/${post.id}`}>
                {post.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.image} alt={post.legende ?? ""} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-placeholder" />
                )}
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(post.id)}
                className="absolute right-1.5 top-1.5 min-h-8 rounded-full bg-background px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-danger opacity-0 transition focus:opacity-100 group-hover:opacity-100"
              >
                {t.posts.delete}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
