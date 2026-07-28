"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Ville } from "@/lib/types";
import { TILE_URL, TILE_SUBDOMAINS, TILE_ATTRIBUTION } from "@/lib/map-tiles";
import { useT } from "@/lib/i18n/context";

// Petits points pleins plutôt que la grosse épingle par défaut de Leaflet —
// plusieurs boutiques proches restent lisibles au lieu de se chevaucher.
const DOT_STYLE = { color: "#ffffff", weight: 1.5, fillColor: "#c4622d", fillOpacity: 0.9 };

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

export function ShopMap({ shops, ville }: { shops: Shop[]; ville: Ville }) {
  const t = useT();
  const withCoords = shops.filter(
    (s): s is Shop & { lat: number; lng: number } => s.lat != null && s.lng != null
  );
  const withoutCoords = shops.length - withCoords.length;

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-foreground/10" style={{ height: 420 }}>
        <MapContainer center={CITY_CENTER[ville]} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} subdomains={TILE_SUBDOMAINS} />
          {withCoords.map((shop) => (
            <CircleMarker key={shop.id} center={[shop.lat, shop.lng]} radius={7} pathOptions={DOT_STYLE}>
              <Popup>
                <strong>{shop.nom}</strong>
                {shop.adresse && (
                  <>
                    <br />
                    {shop.adresse}
                  </>
                )}
                {shop.lien && (
                  <>
                    <br />
                    <a href={shop.lien} target="_blank" rel="noreferrer">
                      {shop.lien}
                    </a>
                  </>
                )}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      {withoutCoords > 0 && (
        <p className="mt-2 text-xs text-foreground/50">{t.map.noCoordinates(withoutCoords, "shops")}</p>
      )}
    </div>
  );
}
