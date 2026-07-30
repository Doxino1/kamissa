"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload";
import { useT } from "@/lib/i18n/context";

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

  async function load(uid: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("library_items")
      .select("id, titre, contenu, image_url")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setItems(data ?? []);
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
      const { url, error: uploadError } = await uploadImage(userId, "bibliotheque", file);
      if (uploadError) {
        setSaving(false);
        setError(uploadError);
        return;
      }
      imageUrl = url;
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

  async function handleDelete(id: string) {
    if (!userId) return;
    const supabase = createClient();
    await supabase.from("library_items").delete().eq("id", id);
    load(userId);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-xl font-black">{t.library.title}</h1>
      <p className="mt-1 text-sm text-foreground-muted">{t.library.subtitle}</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 rounded-lg border border-foreground/10 p-4">
        <input
          type="text"
          required
          placeholder={t.library.titre}
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
        />
        <textarea
          placeholder={t.library.contenu}
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          rows={3}
          className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "…" : t.library.add}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-3">
        {items !== null && items.length === 0 && (
          <p className="text-sm text-foreground-muted">{t.library.empty}</p>
        )}
        {(items ?? []).map((item) => (
          <div key={item.id} className="rounded-lg border border-foreground/10 p-4">
            {item.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image_url} alt={item.titre} className="mb-2 max-h-48 rounded object-cover" />
            )}
            <h3 className="font-medium">{item.titre}</h3>
            {item.contenu && <p className="mt-1 text-sm text-foreground/70">{item.contenu}</p>}
            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              className="mt-2 text-xs text-red-600 hover:underline"
            >
              {t.library.delete}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
