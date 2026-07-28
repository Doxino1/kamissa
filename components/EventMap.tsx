"use client";

import Link from "next/link";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ArtEvent, Ville } from "@/lib/types";
import { formatInVille } from "@/lib/timezone";
import { localizedTitle } from "@/lib/localize-event";
import { TILE_URL, TILE_SUBDOMAINS, TILE_ATTRIBUTION } from "@/lib/map-tiles";
import { useLocale } from "@/lib/i18n/context";

// Petits points pleins plutôt que la grosse épingle par défaut de Leaflet —
// plusieurs événements proches restent lisibles au lieu de se chevaucher.
const DOT_STYLE = { color: "#ffffff", weight: 1.5, fillColor: "#c4622d", fillOpacity: 0.9 };

const CITY_CENTER: Record<Ville, [number, number]> = {
  Paris: [48.8566, 2.3522],
  Athènes: [37.9838, 23.7275],
};

export function EventMap({ events, ville }: { events: ArtEvent[]; ville: Ville }) {
  const { locale, t } = useLocale();
  const withCoords = events.filter(
    (e): e is ArtEvent & { lat: number; lng: number } => e.lat != null && e.lng != null
  );
  const withoutCoords = events.length - withCoords.length;

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-foreground/10" style={{ height: 420 }}>
        <MapContainer center={CITY_CENTER[ville]} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} subdomains={TILE_SUBDOMAINS} />
          {withCoords.map((event) => (
            <CircleMarker key={event.id} center={[event.lat, event.lng]} radius={7} pathOptions={DOT_STYLE}>
              <Popup>
                <Link href={`/events/${event.id}`}>{localizedTitle(event, locale)}</Link>
                <br />
                {formatInVille(
                  event.date,
                  event.ville,
                  { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" },
                  locale
                )}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      {withoutCoords > 0 && (
        <p className="mt-2 text-xs text-foreground/50">{t.map.noCoordinates(withoutCoords, "events")}</p>
      )}
    </div>
  );
}
