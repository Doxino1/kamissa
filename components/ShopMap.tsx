"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { Ville } from "@/lib/types";
import { TILE_URL, TILE_ATTRIBUTION } from "@/lib/map-tiles";
import { escapeHtml } from "@/lib/escape-html";
import { makePinIcon } from "@/lib/map-pins";
import { shopCategoryColor } from "@/lib/shop-colors";
import { useT } from "@/lib/i18n/context";

// Repères carrés à la couleur de la catégorie, numérotés comme la liste.
const CITY_CENTER: Record<Ville, [number, number]> = {
  Paris: [48.8566, 2.3522],
  Athènes: [37.9838, 23.7275],
};

interface Shop {
  id: string;
  nom: string;
  adresse: string | null;
  lien: string | null;
  discipline: string | null;
  lat: number | null;
  lng: number | null;
}

type ShopWithCoords = Shop & { lat: number; lng: number; n: number };

function ClusterLayer({ shops }: { shops: ShopWithCoords[] }) {
  const map = useMap();

  useEffect(() => {
    const clusterGroup = L.markerClusterGroup({ maxClusterRadius: 40 });

    for (const shop of shops) {
      const marker = L.marker([shop.lat, shop.lng], { icon: makePinIcon(shop.n, shopCategoryColor(shop.discipline)) });
      const nom = escapeHtml(shop.nom);
      const adresse = shop.adresse ? `<br/>${escapeHtml(shop.adresse)}` : "";
      const lien = shop.lien
        ? `<br/><a href="${escapeHtml(shop.lien)}" target="_blank" rel="noreferrer">${escapeHtml(shop.lien)}</a>`
        : "";
      marker.bindPopup(`<strong>${nom}</strong>${adresse}${lien}`);
      clusterGroup.addLayer(marker);
    }

    map.addLayer(clusterGroup);
    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [shops, map]);

  return null;
}

export function ShopMap({ shops, ville }: { shops: Shop[]; ville: Ville }) {
  const t = useT();
  const withCoords = useMemo(
    () =>
      shops
        .map((s, i) => ({ ...s, n: i + 1 }))
        .filter((s): s is ShopWithCoords => s.lat != null && s.lng != null),
    [shops]
  );
  const withoutCoords = shops.length - withCoords.length;

  return (
    <div className="h-full">
      <div className="h-[420px] overflow-hidden bg-surface md:h-full">
        <MapContainer center={CITY_CENTER[ville]} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
          <ClusterLayer shops={withCoords} />
        </MapContainer>
      </div>
      {withoutCoords > 0 && (
        <p className="mt-2 text-xs text-foreground/50">{t.map.noCoordinates(withoutCoords, "shops")}</p>
      )}
    </div>
  );
}
