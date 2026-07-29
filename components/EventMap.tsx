"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import type { CircleMarker as LeafletCircleMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArtEvent, Ville } from "@/lib/types";
import { formatInVille } from "@/lib/timezone";
import { localizedTitle } from "@/lib/localize-event";
import { TILE_URL, TILE_SUBDOMAINS, TILE_ATTRIBUTION } from "@/lib/map-tiles";
import { useLocale } from "@/lib/i18n/context";

// Petits points pleins plutôt que la grosse épingle par défaut de Leaflet —
// plusieurs événements proches restent lisibles au lieu de se chevaucher. Le
// marqueur survolé (depuis la carte ou depuis la liste) grossit légèrement
// pour confirmer visuellement la correspondance liste <-> carte.
const DOT_STYLE = { color: "#ffffff", weight: 1.5, fillColor: "#c4622d", fillOpacity: 0.9 };
const DOT_STYLE_HOVERED = { color: "#ffffff", weight: 2, fillColor: "#c4622d", fillOpacity: 1 };
const RADIUS = 7;
const RADIUS_HOVERED = 10;

const CITY_CENTER: Record<Ville, [number, number]> = {
  Paris: [48.8566, 2.3522],
  Athènes: [37.9838, 23.7275],
};

export function EventMap({
  events,
  ville,
  hoveredEventId,
  onHoverEvent,
}: {
  events: ArtEvent[];
  ville: Ville;
  hoveredEventId?: string | null;
  onHoverEvent?: (id: string | null) => void;
}) {
  const { locale, t } = useLocale();
  const withCoords = events.filter(
    (e): e is ArtEvent & { lat: number; lng: number } => e.lat != null && e.lng != null
  );
  const withoutCoords = events.length - withCoords.length;

  // react-leaflet ne réapplique pas radius/pathOptions de façon réactive une
  // fois le CircleMarker monté — on pilote le style survolé directement sur
  // l'instance Leaflet plutôt que de compter sur ses props.
  const layerRefs = useRef(new Map<string, LeafletCircleMarker>());

  useEffect(() => {
    for (const [id, layer] of layerRefs.current) {
      const isHovered = id === hoveredEventId;
      layer.setRadius(isHovered ? RADIUS_HOVERED : RADIUS);
      layer.setStyle(isHovered ? DOT_STYLE_HOVERED : DOT_STYLE);
    }
  }, [hoveredEventId]);

  return (
    <div className="h-full">
      <div className="h-[420px] overflow-hidden rounded-lg md:h-full md:rounded-none">
        <MapContainer center={CITY_CENTER[ville]} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} subdomains={TILE_SUBDOMAINS} />
          {withCoords.map((event) => (
            <CircleMarker
              key={event.id}
              ref={(layer) => {
                if (layer) layerRefs.current.set(event.id, layer);
                else layerRefs.current.delete(event.id);
              }}
              center={[event.lat, event.lng]}
              radius={RADIUS}
              pathOptions={DOT_STYLE}
              eventHandlers={{
                mouseover: () => onHoverEvent?.(event.id),
                mouseout: () => onHoverEvent?.(null),
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <div className="text-xs">
                  <div className="font-medium">{localizedTitle(event, locale)}</div>
                  <div className="text-foreground-muted">
                    {formatInVille(
                      event.date,
                      event.ville,
                      { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" },
                      locale
                    )}
                  </div>
                </div>
              </Tooltip>
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
