"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload";
import { useT } from "@/lib/i18n/context";

interface PortfolioItem {
  id: string;
  titre: string;
  technique: string | null;
  annee: number | null;
  image_url: string | null;
}

export default function PortfolioPage() {
  const t = useT();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<PortfolioItem[] | null>(null);

  const [titre, setTitre] = useState("");
  const [technique, setTechnique] = useState("");
  const [annee, setAnnee] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(uid: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("portfolio_items")
      .select("id, titre, technique, annee, image_url")
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
      const { url, error: uploadError } = await uploadImage(userId, "portfolio", file);
      if (uploadError) {
        setSaving(false);
        setError(uploadError);
        return;
      }
      imageUrl = url;
    }

    const supabase = createClient();
    const { error: insertError } = await supabase.from("portfolio_items").insert({
      user_id: userId,
      titre,
      technique: technique || null,
      annee: annee ? Number(annee) : null,
      image_url: imageUrl,
    });

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setTitre("");
    setTechnique("");
    setAnnee("");
    setFile(null);
    load(userId);
  }

  async function handleDelete(id: string) {
    if (!userId) return;
    const supabase = createClient();
    await supabase.from("portfolio_items").delete().eq("id", id);
    load(userId);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-xl font-black">{t.portfolio.title}</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium text-foreground-muted">{t.portfolio.addTitle}</h2>
        <input
          type="text"
          required
          placeholder={t.portfolio.titre}
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
        />
        <input
          type="text"
          placeholder={t.portfolio.technique}
          value={technique}
          onChange={(e) => setTechnique(e.target.value)}
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
        />
        <input
          type="number"
          placeholder={t.portfolio.annee}
          value={annee}
          onChange={(e) => setAnnee(e.target.value)}
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-foreground-muted file:mr-3 file:cursor-pointer file:rounded-full file:border file:border-border file:bg-surface file:px-4 file:py-2 file:text-sm file:font-bold file:text-foreground hover:file:bg-background"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "…" : t.portfolio.add}
        </button>
      </form>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items !== null && items.length === 0 && (
          <p className="col-span-full text-sm text-foreground-muted">{t.portfolio.empty}</p>
        )}
        {(items ?? []).map((item) => (
          <div key={item.id} className="rounded-lg border border-border p-2">
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
            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              className="mt-1 text-xs text-red-600 hover:underline"
            >
              {t.portfolio.delete}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
