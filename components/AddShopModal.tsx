"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { createClient } from "@/lib/supabase/client";
import { geocode } from "@/lib/geocode";
import { useToast } from "@/lib/toast-context";
import { useT } from "@/lib/i18n/context";
import { DISCIPLINES, Ville } from "@/lib/types";

export function AddShopModal({
  ville,
  onClose,
  onAdded,
}: {
  ville: Ville;
  onClose: () => void;
  onAdded: () => void;
}) {
  const t = useT();
  const { showToast } = useToast();
  const [nom, setNom] = useState("");
  const [shopVille, setShopVille] = useState<Ville>(ville);
  const [adresse, setAdresse] = useState("");
  const [description, setDescription] = useState("");
  const [lien, setLien] = useState("");
  const [discipline, setDiscipline] = useState<string>(DISCIPLINES[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    // Géocodage best-effort (Nominatim/OSM, gratuit, sans clé) — un échec ne
    // bloque pas l'ajout, la boutique reste listée sans pin carte.
    const coords = adresse ? await geocode(`${adresse}, ${shopVille}`) : null;

    const { error: insertError } = await supabase.from("shops").insert({
      nom,
      ville: shopVille,
      adresse: adresse || null,
      description: description || null,
      lien: lien || null,
      discipline: discipline || null,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      soumis_par: user.id,
    });

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    showToast(t.toast.shopAdded);
    onAdded();
  }

  return (
    <Modal title={t.modal.addShopTitle} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          required
          placeholder={t.shops.nom}
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
        />
        <select
          value={shopVille}
          onChange={(e) => setShopVille(e.target.value as Ville)}
          className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm"
        >
          {(["Paris", "Athènes"] as Ville[]).map((v) => (
            <option key={v} value={v}>
              {t.villeLabels[v]}
            </option>
          ))}
        </select>
        <select
          aria-label={t.shops.disciplineLabel}
          value={discipline}
          onChange={(e) => setDiscipline(e.target.value)}
          className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm"
        >
          {DISCIPLINES.map((d) => (
            <option key={d} value={d}>
              {t.disciplineLabels[d]}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder={t.shops.adresse}
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
        />
        <textarea
          placeholder={t.shops.description}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
        />
        <input
          type="url"
          placeholder={t.shops.lien}
          value={lien}
          onChange={(e) => setLien(e.target.value)}
          className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "…" : t.shops.add}
        </button>
      </form>
    </Modal>
  );
}
