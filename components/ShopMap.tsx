"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { Ville } from "@/lib/types";
import { TILE_URL, TILE_SUBDOMAINS, TILE_ATTRIBUTION } from "@/lib/map-tiles";
import { escapeHtml } from "@/lib/escape-html";
import { useT } from "@/lib/i18n/context";

// Petits points pleins plutôt que la grosse épingle par défaut de Leaflet —
// plusieurs boutiques proches restent lisibles au lieu de se chevaucher.
const DOT_STYLE = { color: "#ffffff", weight: 1.5, fillColor: "#c06722", fillOpacity: 0.9 };

const CITY_CENTER: Record<Ville, [number, number]> = {
  Paris: [48.8566, 2.3522],
  Athènes: [37.9838, 23.7275],
};

interface Shop {
  id: string;
  nom: string;
  adresse: string | null;
  lien: string | null;
  lat: number | null;
  lng: number | null;
}

type ShopWithCoords = Shop & { lat: number; lng: number };

function ClusterLayer({ shops }: { shops: ShopWithCoords[] }) {
  const map = useMap();

  useEffect(() => {
    const clusterGroup = L.markerClusterGroup({ maxClusterRadius: 40 });

    for (const shop of shops) {
      const marker = L.circleMarker([shop.lat, shop.lng], { radius: 7, ...DOT_STYLE });
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
  const withCoords = shops.filter(
    (s): s is ShopWithCoords => s.lat != null && s.lng != null
  );
  const withoutCoords = shops.length - withCoords.length;

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-border" style={{ height: 420 }}>
        <MapContainer center={CITY_CENTER[ville]} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} subdomains={TILE_SUBDOMAINS} />
          <ClusterLayer shops={withCoords} />
        </MapContainer>
      </div>
      {withoutCoords > 0 && (
        <p className="mt-2 text-xs text-foreground/50">{t.map.noCoordinates(withoutCoords, "shops")}</p>
      )}
    </div>
  );
}
