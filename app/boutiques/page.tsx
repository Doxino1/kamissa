"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/toast-context";
import { useMinimumLoading } from "@/lib/use-minimum-loading";
import { useT } from "@/lib/i18n/context";
import { Ville } from "@/lib/types";
import { AddShopModal } from "@/components/AddShopModal";
import { CardSkeleton } from "@/components/CardSkeleton";

const ShopMap = dynamic(() => import("@/components/ShopMap").then((m) => m.ShopMap), {
  ssr: false,
});

type ShopStatut = "en_attente" | "publie";

export interface Shop {
  id: string;
  nom: string;
  ville: string;
  adresse: string | null;
  description: string | null;
  lien: string | null;
  discipline: string | null;
  lat: number | null;
  lng: number | null;
  statut: ShopStatut;
  soumis_par: string | null;
}

const VILLES: Ville[] = ["Paris", "Athènes"];
const PAGE_SIZE = 6;
type Tab = "liste" | "carte";

function pillClass(active: boolean) {
  return `rounded-lg border px-4 py-1.5 text-sm transition ${
    active
      ? "border-accent bg-accent text-accent-foreground"
      : "border-foreground/20 hover:border-foreground/40"
  }`;
}

export const SHOP_SELECT = "id, nom, ville, adresse, description, lien, discipline, lat, lng, statut, soumis_par";

export default function BoutiquesPage() {
  const t = useT();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("liste");
  const [ville, setVille] = useState<Ville>("Paris");
  const [shops, setShops] = useState<Shop[] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isModerator, setIsModerator] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loadingShown = useMinimumLoading(shops === null);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("shops").select(SHOP_SELECT).order("nom");
    setShops(data ?? []);
  }

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function fetchShops() {
      const { data } = await supabase.from("shops").select(SHOP_SELECT).order("nom");
      if (active) setShops(data ?? []);
    }

    fetchShops();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!active || !user) return;
      setUserId(user.id);
      const { data } = await supabase.from("profiles").select("is_moderator").eq("id", user.id).single();
      if (active) setIsModerator(data?.is_moderator === true);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function sync() {
      setVisibleCount(PAGE_SIZE);
    }
    sync();
  }, [ville, query, category]);

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("shops").delete().eq("id", id);
    load();
  }

  function handleShare(id: string) {
    const url = `${window.location.origin}/boutiques?shop=${id}`;
    navigator.clipboard.writeText(url).then(() => showToast(t.toast.linkCopied));
  }

  const byVille = (shops ?? [])
    .filter((s) => s.ville === ville)
    .filter((s) => s.statut === "publie" || s.soumis_par === userId);

  const categories = useMemo(
    () => Array.from(new Set(byVille.map((s) => s.discipline).filter((d): d is string => !!d))),
    [byVille]
  );

  const filtered = byVille
    .filter((s) => !category || s.discipline === category)
    .filter((s) => !query.trim() || s.nom.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold">{t.shops.title}</h1>

      <div className="mb-6 mt-6 flex gap-2">
        <button onClick={() => setTab("liste")} className={pillClass(tab === "liste")}>
          {t.shops.tabList}
        </button>
        <button onClick={() => setTab("carte")} className={pillClass(tab === "carte")}>
          {t.shops.tabMap}
        </button>
      </div>

      <div className="mb-6 flex gap-2">
        {VILLES.map((v) => (
          <button key={v} onClick={() => setVille(v)} className={pillClass(ville === v)}>
            {t.villeLabels[v]}
          </button>
        ))}
      </div>

      {tab === "liste" && (
        <>
          <input
            type="search"
            placeholder={t.shops.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mb-3 w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
          />

          <div className="mb-6 flex flex-wrap gap-2">
            <button onClick={() => setCategory("")} className={pillClass(category === "")}>
              {t.shops.allCategories}
            </button>
            {categories.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={pillClass(category === c)}>
                {t.disciplineLabels[c] ?? c}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {loadingShown && <CardSkeleton />}
            {!loadingShown && shops !== null && filtered.length === 0 && (
              <p className="text-sm text-foreground-muted">{t.shops.empty}</p>
            )}
            {!loadingShown &&
              filtered.slice(0, visibleCount).map((shop) => (
                <div key={shop.id} className="rounded-lg bg-surface p-4 shadow-soft">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium">{shop.nom}</h3>
                    {shop.statut === "en_attente" && (
                      <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-foreground-muted">
                        {t.evenements.statutEnAttente}
                      </span>
                    )}
                  </div>
                  {shop.discipline && (
                    <p className="mt-0.5 text-xs text-foreground-muted">
                      {t.disciplineLabels[shop.discipline] ?? shop.discipline}
                    </p>
                  )}
                  {shop.adresse && <p className="mt-1 text-sm text-foreground-muted">{shop.adresse}</p>}
                  {shop.description && <p className="mt-1 text-sm">{shop.description}</p>}
                  {shop.lien && (
                    <a
                      href={shop.lien}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-sm underline hover:text-foreground"
                    >
                      {shop.lien}
                    </a>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleShare(shop.id)}
                      className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
                    >
                      <Share2 size={13} strokeWidth={1.75} />
                      {t.common.share}
                    </button>
                    {isModerator && (
                      <button
                        type="button"
                        onClick={() => handleDelete(shop.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        {t.shops.delete}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            {!loadingShown && filtered.length > visibleCount && (
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="self-center rounded-lg border border-foreground/20 px-4 py-2 text-sm hover:border-foreground/40"
              >
                {t.common.loadMore}
              </button>
            )}
          </div>

          {!userId && (
            <p className="mt-6 text-sm text-foreground-muted">
              <Link href="/login" className="underline hover:text-foreground">
                {t.evenements.loginLink}
              </Link>{" "}
              {t.shops.loginToPropose}
            </p>
          )}
        </>
      )}

      {tab === "carte" && <ShopMap key={ville} shops={filtered} ville={ville} />}

      {userId && (
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          aria-label={t.shops.addShop}
          title={t.shops.addShop}
          className="fixed bottom-24 right-4 z-[1000] flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-medium text-accent-foreground shadow-soft transition hover:opacity-90 md:bottom-8 md:right-8"
        >
          {t.shops.addShop}
        </button>
      )}

      {showAddModal && (
        <AddShopModal
          ville={ville}
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}
