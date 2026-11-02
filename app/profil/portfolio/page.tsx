"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  IMAGE_ACCEPT,
  PDF_ACCEPT,
  portfolioPdfUrl,
  removePortfolioPdf,
  uploadErrorMessage,
  uploadImage,
  uploadPortfolioPdf,
} from "@/lib/upload";
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

  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfSaving, setPdfSaving] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  async function load(uid: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("portfolio_items")
      .select("id, titre, technique, annee, image_url")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setItems(data ?? []);
  }

  async function loadPdf(uid: string) {
    const { data } = await createClient().from("profiles").select("portfolio_pdf").eq("id", uid).single();
    const path = data?.portfolio_pdf ?? null;
    setPdfPath(path);
    setPdfUrl(path ? await portfolioPdfUrl(path) : null);
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
        loadPdf(user.id);
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
      const { url, error: uploadError, errorCode } = await uploadImage(userId, "portfolio", file);
      if (!url) {
        setSaving(false);
        setError(uploadErrorMessage(t, errorCode, uploadError));
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

  // Le nouveau fichier est envoyé et enregistré avant de retirer l'ancien :
  // un échec en cours de route laisse le profil sur un PDF valide.
  async function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!userId || !picked) return;
    setPdfSaving(true);
    setPdfError(null);

    const { path, error: uploadError, errorCode } = await uploadPortfolioPdf(userId, picked);
    if (!path) {
      setPdfSaving(false);
      setPdfError(
        errorCode === "not_pdf"
          ? t.portfolio.pdfInvalid
          : errorCode === "too_large"
            ? t.portfolio.pdfTooLarge
            : (uploadError ?? "Upload failed")
      );
      return;
    }

    const { error: updateError } = await createClient()
      .from("profiles")
      .update({ portfolio_pdf: path })
      .eq("id", userId);
    if (updateError) {
      await removePortfolioPdf(path);
      setPdfSaving(false);
      setPdfError(updateError.message);
      return;
    }
    if (pdfPath) await removePortfolioPdf(pdfPath);
    await loadPdf(userId);
    setPdfSaving(false);
  }

  async function handlePdfRemove() {
    if (!userId || !pdfPath) return;
    setPdfSaving(true);
    setPdfError(null);
    const { error: updateError } = await createClient()
      .from("profiles")
      .update({ portfolio_pdf: null })
      .eq("id", userId);
    if (updateError) {
      setPdfSaving(false);
      setPdfError(updateError.message);
      return;
    }
    await removePortfolioPdf(pdfPath);
    setPdfPath(null);
    setPdfUrl(null);
    setPdfSaving(false);
  }

  async function handleDelete(id: string) {
    if (!userId) return;
    const supabase = createClient();
    await supabase.from("portfolio_items").delete().eq("id", id);
    load(userId);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:max-w-none md:px-10 md:pb-10 md:pt-7">
      <h1 className="text-xl font-black">{t.portfolio.title}</h1>

      <section className="mt-6 flex flex-col gap-3 rounded-lg border border-border p-4 md:max-w-[480px]">
        <h2 className="text-sm font-medium text-foreground-muted">{t.portfolio.pdfTitle}</h2>
        <p className="text-sm text-foreground-muted">{t.portfolio.pdfHint}</p>
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium underline underline-offset-4"
          >
            {t.portfolio.pdfView}
          </a>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <label
            className={`inline-flex cursor-pointer items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover ${
              pdfSaving ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {pdfSaving ? "…" : pdfPath ? t.portfolio.pdfReplace : t.portfolio.pdfUpload}
            <input type="file" accept={PDF_ACCEPT} onChange={handlePdfChange} disabled={pdfSaving} className="sr-only" />
          </label>
          {pdfPath && (
            <button
              type="button"
              onClick={handlePdfRemove}
              disabled={pdfSaving}
              className="text-sm text-danger hover:underline disabled:opacity-50"
            >
              {t.portfolio.pdfRemove}
            </button>
          )}
        </div>
        {pdfError && <p className="text-sm text-danger">{pdfError}</p>}
      </section>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 rounded-lg border border-border p-4 md:max-w-[480px]">
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
          accept={IMAGE_ACCEPT}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-foreground-muted file:mr-3 file:cursor-pointer file:rounded-full file:border file:border-border file:bg-surface file:px-4 file:py-2 file:text-sm file:font-bold file:text-foreground hover:file:bg-background"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "…" : t.portfolio.add}
        </button>
      </form>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-[14px] min-[75rem]:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
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
              className="mt-1 text-xs text-danger hover:underline"
            >
              {t.portfolio.delete}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
