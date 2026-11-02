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
import { BackLink, PageHeader } from "@/components/PageHeader";
import {
  DANGER_ACTION,
  FIELD,
  FIELD_INPUT,
  FIELD_LABEL,
  FILE_INPUT,
  META,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  SECTION,
  SECTION_TITLE,
} from "@/lib/form-styles";

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
    <div className="pb-16">
      <PageHeader title={t.portfolio.title} eyebrow={<BackLink href="/profil">{t.nav.profil}</BackLink>} />

      <main className="mx-auto flex max-w-[1280px] flex-wrap gap-x-14 px-4 md:px-10">
        <div className="min-w-0 flex-[1_1_320px] md:max-w-[420px]">
          <section className={SECTION}>
            <h2 className={SECTION_TITLE}>{t.portfolio.pdfTitle}</h2>
            <p className="text-sm text-text-soft">{t.portfolio.pdfHint}</p>
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block font-display text-2xl underline decoration-1 underline-offset-[6px] hover:italic"
              >
                {t.portfolio.pdfView}
              </a>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <label className={`${SECONDARY_BUTTON} cursor-pointer ${pdfSaving ? "pointer-events-none opacity-50" : ""}`}>
                {pdfSaving ? "…" : pdfPath ? t.portfolio.pdfReplace : t.portfolio.pdfUpload}
                <input type="file" accept={PDF_ACCEPT} onChange={handlePdfChange} disabled={pdfSaving} className="sr-only" />
              </label>
              {pdfPath && (
                <button type="button" onClick={handlePdfRemove} disabled={pdfSaving} className={DANGER_ACTION}>
                  {t.portfolio.pdfRemove}
                </button>
              )}
            </div>
            {pdfError && <p className="mt-3 text-sm font-semibold text-danger">{pdfError}</p>}
          </section>

          <form onSubmit={handleSubmit} className={`${SECTION} flex flex-col gap-[22px]`}>
            <h2 className={`${SECTION_TITLE} mb-0`}>{t.portfolio.addTitle}</h2>
            <label className={FIELD}>
              <span className={FIELD_LABEL}>{t.portfolio.titre}</span>
              <input type="text" required value={titre} onChange={(e) => setTitre(e.target.value)} className={FIELD_INPUT} />
            </label>
            <div className="grid grid-cols-[1fr_120px] gap-x-6">
              <label className={FIELD}>
                <span className={FIELD_LABEL}>{t.portfolio.technique}</span>
                <input type="text" value={technique} onChange={(e) => setTechnique(e.target.value)} className={FIELD_INPUT} />
              </label>
              <label className={FIELD}>
                <span className={FIELD_LABEL}>{t.portfolio.annee}</span>
                <input type="number" value={annee} onChange={(e) => setAnnee(e.target.value)} className={FIELD_INPUT} />
              </label>
            </div>
            <label className={FIELD}>
              <span className={FIELD_LABEL}>{t.portfolio.image}</span>
              <input
                type="file"
                accept={IMAGE_ACCEPT}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className={`${FILE_INPUT} mt-2`}
              />
            </label>
            {error && <p className="text-sm font-semibold text-danger">{error}</p>}
            <button type="submit" disabled={saving} className={`${PRIMARY_BUTTON} self-start`}>
              {saving ? "…" : t.portfolio.add}
            </button>
          </form>
        </div>

        <div className="mt-7 grid min-w-0 flex-[999_1_560px] grid-cols-1 content-start gap-x-7 gap-y-10 sm:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
          {items !== null && items.length === 0 && (
            <p className="col-span-full font-display text-2xl text-foreground-muted">{t.portfolio.empty}</p>
          )}
          {(items ?? []).map((item, i) => (
            <figure key={item.id} className="flex flex-col gap-3">
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt={item.titre}
                  className={`w-full object-cover ${i % 2 === 0 ? "aspect-[4/5]" : "aspect-square"}`}
                />
              ) : (
                <div className={`w-full bg-placeholder ${i % 2 === 0 ? "aspect-[4/5]" : "aspect-square"}`} />
              )}
              <figcaption className="flex flex-col gap-1">
                <span className="font-display text-[26px] leading-tight">{item.titre}</span>
                <span className="flex items-center justify-between gap-3">
                  <span className={META}>{[item.technique, item.annee].filter(Boolean).join(" · ")}</span>
                  <button type="button" onClick={() => handleDelete(item.id)} className={DANGER_ACTION}>
                    {t.portfolio.delete}
                  </button>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </main>
    </div>
  );
}
