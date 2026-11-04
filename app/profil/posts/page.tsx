"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  POST_MEDIA_ACCEPT,
  isVideoFile,
  removeUploadedFile,
  uploadErrorMessage,
  uploadImage,
  uploadVideo,
  videoErrorMessage,
} from "@/lib/upload";
import { PostThumb } from "@/components/PostMedia";
import { useT } from "@/lib/i18n/context";
import { BackLink, PageHeader } from "@/components/PageHeader";
import {
  FIELD,
  FIELD_HINT,
  FIELD_LABEL,
  FIELD_TEXTAREA,
  FILE_INPUT,
  PRIMARY_BUTTON,
  SECTION,
  SECTION_TITLE,
} from "@/lib/form-styles";

interface Post {
  id: string;
  image: string | null;
  video: string | null;
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
  // Avancement de l'envoi d'une vidéo, en % (null hors envoi).
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Change après chaque publication pour vider le champ fichier.
  const [formKey, setFormKey] = useState(0);

  async function load(uid: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("posts")
      .select("id, image, video, legende")
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

    const video = isVideoFile(file);
    let url: string | null;
    if (video) {
      setVideoProgress(0);
      const result = await uploadVideo(userId, file, setVideoProgress);
      setVideoProgress(null);
      url = result.url;
      if (!url) {
        setSaving(false);
        setError(videoErrorMessage(t, result.errorCode, result.error));
        return;
      }
    } else {
      const result = await uploadImage(userId, "posts", file);
      url = result.url;
      if (!url) {
        setSaving(false);
        setError(uploadErrorMessage(t, result.errorCode, result.error));
        return;
      }
    }

    const supabase = createClient();
    const { error: insertError } = await supabase.from("posts").insert({
      user_id: userId,
      image: video ? null : url,
      video: video ? url : null,
      legende: legende || null,
    });

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setLegende("");
    setFile(null);
    setFormKey((k) => k + 1);
    load(userId);
  }

  async function handleDelete(post: Post) {
    if (!userId) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("posts").delete().eq("id", post.id);
    if (!deleteError) await removeUploadedFile(post.video ?? post.image);
    load(userId);
  }

  return (
    <div className="pb-16">
      <PageHeader title={t.posts.title} eyebrow={<BackLink href="/profil">{t.nav.profil}</BackLink>} />

      <main className="mx-auto flex max-w-[1280px] flex-wrap gap-x-14 px-4 md:px-10">
        <form
          key={formKey}
          onSubmit={handleSubmit}
          className={`${SECTION} flex min-w-0 flex-[1_1_320px] flex-col gap-[22px] self-start md:max-w-[420px]`}
        >
          <h2 className={`${SECTION_TITLE} mb-0`}>{t.posts.publish}</h2>
          <label className={FIELD}>
            <span className={FIELD_LABEL}>{t.posts.media}</span>
            <input
              type="file"
              accept={POST_MEDIA_ACCEPT}
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className={`${FILE_INPUT} mt-2`}
            />
            <span className={`${FIELD_HINT} mt-1.5`}>{t.posts.mediaHint}</span>
          </label>
          <label className={FIELD}>
            <span className={FIELD_LABEL}>{t.posts.legende}</span>
            <textarea value={legende} onChange={(e) => setLegende(e.target.value)} rows={3} className={FIELD_TEXTAREA} />
          </label>
          {videoProgress !== null && (
            <div className="flex flex-col gap-2" role="status">
              <div className="h-[3px] w-full bg-border">
                <div className="h-full bg-foreground transition-[width]" style={{ width: `${videoProgress}%` }} />
              </div>
              <p className={FIELD_HINT}>{t.posts.videoUploading}</p>
            </div>
          )}
          {error && <p className="text-sm font-semibold text-danger">{error}</p>}
          <button type="submit" disabled={saving} className={`${PRIMARY_BUTTON} self-start`}>
            {videoProgress !== null ? `${videoProgress} %` : saving ? "…" : t.posts.publish}
          </button>
        </form>

        <div className="mt-7 grid min-w-0 flex-[999_1_560px] grid-cols-3 content-start gap-1.5 md:gap-[14px] min-[75rem]:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
          {posts !== null && posts.length === 0 && (
            <p className="col-span-full font-display text-2xl text-foreground-muted">{t.posts.empty}</p>
          )}
          {(posts ?? []).map((post) => (
            <div key={post.id} className="group relative aspect-square">
              <Link href={`/posts/${post.id}`} className="block h-full">
                <PostThumb post={post} />
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(post)}
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
