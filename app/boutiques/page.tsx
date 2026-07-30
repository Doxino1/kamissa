"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Search, Share2, Map as MapIcon, List } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/toast-context";
import { useMediaQuery } from "@/lib/use-media-query";
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
type MobileView = "liste" | "carte";

function pillClass(active: boolean) {
  return `rounded-full border px-4 py-2 text-sm font-bold transition ${
    active
      ? "border-transparent bg-accent text-accent-foreground"
      : "border-border bg-transparent text-foreground"
  }`;
}

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

  const categories = useMemo(
    () => Array.from(new Set(byVille.map((s) => s.discipline).filter((d): d is string => !!d))),
    [byVille]
  );

  const filtered = byVille
    .filter((s) => !category || s.discipline === category)
    .filter((s) => !query.trim() || s.nom.toLowerCase().includes(query.trim().toLowerCase()));

  const showList = isDesktop || mobileView === "liste";
  const showMap = isDesktop || mobileView === "carte";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:max-w-none md:px-6 md:py-4">
      <div className="md:flex md:h-[calc(100vh-6.5rem)] md:flex-col md:overflow-hidden md:rounded-2xl md:border md:border-border md:shadow-soft">
        <div className="px-1 py-1 md:px-6 md:py-5">
          <h1 className="text-xl font-black md:text-[22px]">{t.shops.title}</h1>

          <div className="mt-3 flex gap-2">
            {VILLES.map((v) => (
              <button key={v} onClick={() => setVille(v)} className={pillClass(ville === v)}>
                {t.villeLabels[v]}
              </button>
            ))}
          </div>

          <div className="mt-3 flex max-w-[400px] items-center gap-2.5 rounded-full border border-border bg-background/70 px-[18px] py-3">
            <Search size={16} strokeWidth={2} className="shrink-0 text-foreground-muted" />
            <input
              type="search"
              placeholder={t.shops.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <div className="mt-2.5 flex flex-wrap gap-2">
            <button onClick={() => setCategory("")} className={pillClass(category === "")}>
              {t.shops.allCategories}
            </button>
            {categories.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={pillClass(category === c)}>
                {t.disciplineLabels[c] ?? c}
              </button>
            ))}
          </div>
        </div>

        <div className="relative md:flex md:min-h-0 md:flex-1 md:items-stretch md:gap-5 md:px-6 md:pb-6">
          {showList && (
            <div className="mt-4 md:mt-0 md:h-full md:w-[42%] md:shrink-0 md:overflow-y-auto">
              <div className="flex flex-col gap-3">
                {loadingShown && <CardSkeleton />}
                {!loadingShown && shops !== null && filtered.length === 0 && (
                  <p className="text-sm text-foreground-muted">{t.shops.empty}</p>
                )}
                {!loadingShown &&
                  filtered.slice(0, visibleCount).map((shop) => (
                    <div
                      key={shop.id}
                      className="rounded-lg border border-border bg-surface px-5 py-[18px] transition hover:border-accent-secondary/40 hover:shadow-shop-hover"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-bold">{shop.nom}</h3>
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
                      {shop.adresse && <p className="mt-1.5 text-sm">{shop.adresse}</p>}
                      {shop.description && <p className="mt-1.5 text-sm">{shop.description}</p>}
                      {shop.lien && (
                        <a
                          href={shop.lien}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1.5 inline-block text-sm text-accent-secondary"
                        >
                          {shop.lien}
                        </a>
                      )}
                      <div className="mt-2 flex items-center gap-4">
                        {isModerator && (
                          <button
                            type="button"
                            onClick={() => handleDelete(shop.id)}
                            className="text-xs text-badge-open-call-fg"
                          >
                            {t.shops.delete}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleShare(shop.id)}
                          className="flex items-center gap-1 text-xs text-foreground-muted"
                        >
                          <Share2 size={13} strokeWidth={2} />
                          {t.common.share}
                        </button>
                      </div>
                    </div>
                  ))}
                {!loadingShown && filtered.length > visibleCount && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="self-center rounded-full border border-border px-[22px] py-2.5 text-sm font-bold"
                  >
                    {t.common.loadMore}
                  </button>
                )}
              </div>

              {!userId && (
                <p className="mt-6 text-sm text-foreground-muted">
                  <Link href="/login" className="font-bold text-accent">
                    {t.evenements.loginLink}
                  </Link>{" "}
                  {t.shops.loginToPropose}
                </p>
              )}
            </div>
          )}

          {showMap && (
            <div className="relative mt-4 md:mt-0 md:h-full md:flex-1">
              <ShopMap key={ville} shops={filtered} ville={ville} />
              {userId && (
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  aria-label={t.shops.addShop}
                  title={t.shops.addShop}
                  className="absolute bottom-6 right-6 z-[1000] flex items-center gap-2 rounded-full bg-accent px-[22px] py-3.5 text-sm font-bold text-accent-foreground shadow-shop-hover transition hover:bg-accent-hover"
                >
                  {t.shops.addShop}
                </button>
              )}
            </div>
          )}

          {!isDesktop && (
            <button
              type="button"
              onClick={() => setMobileView((v) => (v === "liste" ? "carte" : "liste"))}
              className="fixed bottom-20 left-1/2 z-[500] flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-[22px] py-3 text-sm font-bold text-background shadow-modal"
            >
              {mobileView === "liste" ? (
                <>
                  <MapIcon size={16} strokeWidth={2} />
                  {t.shops.tabMap}
                </>
              ) : (
                <>
                  <List size={16} strokeWidth={2} />
                  {t.shops.tabList}
                </>
              )}
            </button>
          )}
        </div>
      </div>

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
