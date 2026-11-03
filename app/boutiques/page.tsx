"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Search, Share2, Map as MapIcon, List, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/toast-context";
import { useMediaQuery } from "@/lib/use-media-query";
import { useMinimumLoading } from "@/lib/use-minimum-loading";
import { useT } from "@/lib/i18n/context";
import { SHOP_CATEGORIES, Ville } from "@/lib/types";
import { AddShopModal } from "@/components/AddShopModal";
import { CardSkeleton } from "@/components/CardSkeleton";
import { rowNumber } from "@/components/EventCard";
import { pillClass } from "@/components/EventFilterBar";
import { PageHeader } from "@/components/PageHeader";
import { shopCategoryColor } from "@/lib/shop-colors";

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
type MobileView = "liste" | "carte";

export const SHOP_SELECT = "id, nom, ville, adresse, description, lien, discipline, lat, lng, statut, soumis_par";

export default function BoutiquesPage() {
  const t = useT();
  const { showToast } = useToast();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [mobileView, setMobileView] = useState<MobileView>("liste");
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

  // Toutes les catégories, même sans boutique pour l'instant (sinon on ne
  // découvre jamais qu'on peut en ajouter une), plus d'éventuelles anciennes
  // valeurs encore présentes en base.
  const categories = useMemo(
    () =>
      Array.from(
        new Set<string>([...SHOP_CATEGORIES, ...byVille.map((s) => s.discipline).filter((d): d is string => !!d)])
      ),
    [byVille]
  );

  const filtered = byVille
    .filter((s) => !category || s.discipline === category)
    .filter((s) => !query.trim() || s.nom.toLowerCase().includes(query.trim().toLowerCase()));

  const showList = isDesktop || mobileView === "liste";
  const showMap = isDesktop || mobileView === "carte";

  return (
    <div className="relative pb-24 md:pb-12">
      <PageHeader title={t.shops.title}>
        <div className="flex gap-2 pb-1.5">
          {VILLES.map((v) => (
            <button key={v} onClick={() => setVille(v)} aria-pressed={ville === v} className={pillClass(ville === v)}>
              {t.villeLabels[v]}
            </button>
          ))}
        </div>
      </PageHeader>

      <section className="mx-auto flex max-w-[1360px] flex-wrap items-center gap-x-5 gap-y-3 border-b border-border px-4 py-[18px] md:px-10">
        <label className="flex min-h-11 flex-[1_1_280px] items-center gap-2.5 border-b border-foreground">
          <Search size={17} strokeWidth={1.75} className="shrink-0" />
          <input
            type="search"
            placeholder={t.shops.searchPlaceholder}
            aria-label={t.shops.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent font-display text-[22px] outline-none placeholder:text-muted-strong md:text-2xl"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCategory("")} aria-pressed={category === ""} className={pillClass(category === "")}>
            {t.shops.allCategories}
          </button>
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(c)} aria-pressed={category === c} className={pillClass(category === c)}>
              {t.disciplineLabels[c] ?? c}
            </button>
          ))}
        </div>
      </section>

      <main className="mx-auto max-w-[1360px] px-4 md:flex md:items-start md:gap-8 md:px-10">
        {showList && (
          <div className="min-w-0 md:w-[42%] md:max-w-[600px] md:shrink-0">
            <div className="flex flex-col">
              {loadingShown && <CardSkeleton />}
              {!loadingShown && shops !== null && filtered.length === 0 && (
                <p className="py-12 text-center font-display text-2xl italic text-foreground-muted md:text-[28px]">
                  {t.shops.empty}
                </p>
              )}
              {!loadingShown &&
                filtered.slice(0, visibleCount).map((shop, i) => (
                  <article key={shop.id} className="border-b border-border py-6 transition-colors hover:bg-surface-hover">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em]">
                        <span className="font-normal text-foreground-muted">{rowNumber(i + 1)}</span>
                        <span
                          aria-hidden="true"
                          className="h-[9px] w-[9px]"
                          style={{ background: shopCategoryColor(shop.discipline) }}
                        />
                        {shop.discipline ? (t.disciplineLabels[shop.discipline] ?? shop.discipline) : null}
                      </span>
                      {shop.statut === "en_attente" && (
                        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground-muted">
                          {t.evenements.statutEnAttente}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2.5 font-display text-[28px] leading-[1.05] md:text-[34px]">{shop.nom}</h3>
                    {shop.adresse && (
                      <p className="mt-1.5 text-[13px] tracking-[0.04em] text-foreground-muted">{shop.adresse}</p>
                    )}
                    {shop.description && (
                      <p className="mt-2 font-display text-[19px] italic leading-[1.25] md:text-[21px]">{shop.description}</p>
                    )}
                    <div className="mt-3.5 flex flex-wrap items-center gap-x-[18px] gap-y-2">
                      {shop.lien && (
                        <a
                          href={shop.lien}
                          target="_blank"
                          rel="noreferrer"
                          className="max-w-full truncate text-[13px] underline underline-offset-4"
                        >
                          {shop.lien}
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleShare(shop.id)}
                        className="flex min-h-10 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] underline underline-offset-4"
                      >
                        <Share2 size={13} strokeWidth={1.75} />
                        {t.common.share}
                      </button>
                      {isModerator && (
                        <button
                          type="button"
                          onClick={() => handleDelete(shop.id)}
                          className="min-h-10 text-xs font-semibold uppercase tracking-[0.1em] text-danger"
                        >
                          {t.shops.delete}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              {!loadingShown && filtered.length > visibleCount && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="mt-5 min-h-11 self-start rounded-full border border-foreground px-[22px] text-xs font-semibold uppercase tracking-[0.1em] transition hover:bg-surface-hover"
                >
                  {t.common.loadMore}
                </button>
              )}
            </div>

            {!userId && (
              <p className="mt-6 text-sm text-foreground-muted">
                <Link href="/login" className="font-bold text-foreground underline underline-offset-4">
                  {t.evenements.loginLink}
                </Link>{" "}
                {t.shops.loginToPropose}
              </p>
            )}
          </div>
        )}

        {showMap && (
          <div className="relative mt-4 md:sticky md:top-[104px] md:mt-6 md:h-[calc(100vh-128px)] md:min-h-[480px] md:flex-1">
            <ShopMap key={ville} shops={filtered} ville={ville} />
            <p className="pointer-events-none absolute bottom-4 left-5 z-[500] hidden text-xs uppercase tracking-[0.12em] text-foreground-muted md:block">
              ( {t.villeLabels[ville]} )
            </p>
            {userId && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                aria-label={t.shops.addShop}
                title={t.shops.addShop}
                className="absolute bottom-6 right-6 z-[1000] flex min-h-14 items-center gap-2.5 rounded-full bg-foreground px-[26px] text-[13px] font-semibold uppercase tracking-[0.1em] text-background transition hover:bg-accent-hover"
              >
                <Plus size={18} strokeWidth={2} />
                {t.shops.addShop}
              </button>
            )}
          </div>
        )}
      </main>

      {!isDesktop && (
        <button
          type="button"
          onClick={() => setMobileView((v) => (v === "liste" ? "carte" : "liste"))}
          className="fixed bottom-20 left-1/2 z-[500] flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-[22px] text-xs font-semibold uppercase tracking-[0.1em] text-background shadow-modal"
        >
          {mobileView === "liste" ? (
            <>
              <MapIcon size={16} strokeWidth={1.75} />
              {t.shops.tabMap}
            </>
          ) : (
            <>
              <List size={16} strokeWidth={1.75} />
              {t.shops.tabList}
            </>
          )}
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
