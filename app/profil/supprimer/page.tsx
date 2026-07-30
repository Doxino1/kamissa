"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/context";

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
    <div className="mx-auto w-full max-w-sm px-4 py-8">
      <h1 className="text-xl font-black text-red-600">{t.account.deleteAccount}</h1>
      <p className="mt-3 text-sm text-foreground/70">{t.account.deleteWarning}</p>

      <label className="mt-6 block text-sm text-foreground-muted">
        {t.account.deleteConfirmLabel(t.account.deleteConfirmWord)}
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="mt-1 w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
        />
      </label>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleDelete}
        disabled={!canDelete || deleting}
        className="mt-4 w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-40"
      >
        {deleting ? "…" : t.account.deleteButton}
      </button>
    </div>
  );
}
