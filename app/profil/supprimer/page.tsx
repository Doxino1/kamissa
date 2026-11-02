"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/context";
import { BackLink, PageHeader } from "@/components/PageHeader";
import { FIELD, FIELD_INPUT, FIELD_LABEL } from "@/lib/form-styles";

export default function SupprimerComptePage() {
  const t = useT();
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText.trim() === t.account.deleteConfirmWord;

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    setError(null);

    const res = await fetch("/api/account/delete", { method: "POST" });

    if (!res.ok) {
      setDeleting(false);
      setError(t.account.deleteError);
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="pb-16">
      <PageHeader
        title={t.account.deleteAccount}
        eyebrow={<BackLink href="/profil/parametres">{t.profil.settingsTitle}</BackLink>}
      />

      <main className="mx-auto max-w-[1280px] px-4 md:px-10">
        <div className="mt-7 flex max-w-[560px] flex-col gap-[22px] border-l-2 border-danger pl-5">
          <p className="font-display text-2xl leading-snug text-text-soft">{t.account.deleteWarning}</p>

          <label className={FIELD}>
            <span className={FIELD_LABEL}>{t.account.deleteConfirmLabel(t.account.deleteConfirmWord)}</span>
            <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className={FIELD_INPUT} />
          </label>

          {error && <p className="text-sm font-semibold text-danger">{error}</p>}

          <button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete || deleting}
            className="min-h-14 self-start rounded-full bg-danger px-8 text-[13px] font-semibold uppercase tracking-[0.12em] text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {deleting ? "…" : t.account.deleteButton}
          </button>
        </div>
      </main>
    </div>
  );
}
