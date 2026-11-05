"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  IMAGE_ACCEPT,
  libraryImageUrls,
  removeLibraryImage,
  uploadErrorMessage,
  uploadLibraryImage,
} from "@/lib/upload";
import { useT } from "@/lib/i18n/context";
import { BackLink, PageHeader } from "@/components/PageHeader";
import { DANGER_ACTION, FIELD, FIELD_INPUT, FIELD_LABEL, FIELD_TEXTAREA, FILE_INPUT, PRIMARY_BUTTON, SECTION } from "@/lib/form-styles";

interface LibraryItem {
  id: string;
  titre: string;
  contenu: string | null;
  image_url: string | null;
}

export default function BibliothequePage() {
  const t = useT();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<LibraryItem[] | null>(null);

  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // URL signées des images, par chemin dans le bucket privé.
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  async function load(uid: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("library_items")
      .select("id, titre, contenu, image_url")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setItems(data ?? []);
    setImageUrls(await libraryImageUrls((data ?? []).flatMap((item) => item.image_url ?? [])));
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
    if (!userId) return;
    setSaving(true);
    setError(null);

    let imageUrl: string | null = null;
    if (file) {
      const { path, error: uploadError, errorCode } = await uploadLibraryImage(userId, file);
      if (!path) {
        setSaving(false);
        setError(uploadErrorMessage(t, errorCode, uploadError));
        return;
      }
      imageUrl = path;
    }

    const supabase = createClient();
    const { error: insertError } = await supabase.from("library_items").insert({
      user_id: userId,
      titre,
      contenu: contenu || null,
      image_url: imageUrl,
    });

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setTitre("");
    setContenu("");
    setFile(null);
    load(userId);
  }

  async function handleDelete(item: LibraryItem) {
    if (!userId) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("library_items").delete().eq("id", item.id);
    if (!deleteError && item.image_url) await removeLibraryImage(item.image_url);
    load(userId);
  }

  return (
    <div className="pb-16">
      <PageHeader
        title={t.library.title}
        subtitle={t.library.subtitle}
        eyebrow={<BackLink href="/profil">{t.nav.profil}</BackLink>}
      />

      <main className="mx-auto flex max-w-[1280px] flex-wrap gap-x-14 px-4 md:px-10">
        <form
          onSubmit={handleSubmit}
          className={`${SECTION} flex min-w-0 flex-[1_1_320px] flex-col gap-[22px] self-start md:max-w-[420px]`}
        >
          <label className={FIELD}>
            <span className={FIELD_LABEL}>{t.library.titre}</span>
            <input type="text" required value={titre} onChange={(e) => setTitre(e.target.value)} className={FIELD_INPUT} />
          </label>
          <label className={FIELD}>
            <span className={FIELD_LABEL}>{t.library.contenu}</span>
            <textarea value={contenu} onChange={(e) => setContenu(e.target.value)} rows={4} className={FIELD_TEXTAREA} />
          </label>
          <label className={FIELD}>
            <span className={FIELD_LABEL}>{t.library.image}</span>
            <input
              type="file"
              accept={IMAGE_ACCEPT}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className={`${FILE_INPUT} mt-2`}
            />
          </label>
          {error && <p className="text-sm font-semibold text-danger">{error}</p>}
          <button type="submit" disabled={saving} className={`${PRIMARY_BUTTON} self-start`}>
            {saving ? "…" : t.library.add}
          </button>
        </form>

        <div className="mt-7 min-w-0 flex-[999_1_560px] border-t border-foreground">
          {items !== null && items.length === 0 && (
            <p className="py-6 font-display text-2xl text-foreground-muted">{t.library.empty}</p>
          )}
          {(items ?? []).map((item) => (
            <article key={item.id} className="flex flex-wrap gap-x-6 gap-y-3 border-b border-border py-6">
              {item.image_url && imageUrls[item.image_url] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrls[item.image_url]}
                  alt={item.titre}
                  className="aspect-square w-[140px] shrink-0 object-cover"
                />
              )}
              <div className="min-w-0 flex-[1_1_240px]">
                <h3 className="font-display text-[28px] leading-tight">{item.titre}</h3>
                {item.contenu && <p className="mt-2 whitespace-pre-line text-sm text-text-soft">{item.contenu}</p>}
                <button type="button" onClick={() => handleDelete(item)} className={`${DANGER_ACTION} mt-3`}>
                  {t.library.delete}
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
