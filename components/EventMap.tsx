"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import type { CircleMarker as LeafletCircleMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { ArtEvent, Ville } from "@/lib/types";
import { formatInVille } from "@/lib/timezone";
import { localizedTitle } from "@/lib/localize-event";
import { escapeHtml } from "@/lib/escape-html";
import { TILE_URL, TILE_SUBDOMAINS, TILE_ATTRIBUTION } from "@/lib/map-tiles";
import { useLocale } from "@/lib/i18n/context";
import { Locale } from "@/lib/i18n/dictionary";

// Petits points pleins plutôt que la grosse épingle par défaut de Leaflet —
// plusieurs événements proches restent lisibles au lieu de se chevaucher. Le
// marqueur survolé (depuis la carte ou depuis la liste) grossit légèrement
// pour confirmer visuellement la correspondance liste <-> carte.
const DOT_STYLE = { color: "#ffffff", weight: 1.5, fillColor: "#b0451c", fillOpacity: 0.9 };
const DOT_STYLE_HOVERED = { color: "#ffffff", weight: 2, fillColor: "#b0451c", fillOpacity: 1 };
const RADIUS = 7;
const RADIUS_HOVERED = 10;

const CITY_CENTER: Record<Ville, [number, number]> = {
  Paris: [48.8566, 2.3522],
  Athènes: [37.9838, 23.7275],
};

type EventWithCoords = ArtEvent & { lat: number; lng: number };

function ClusterLayer({
  events,
  locale,
  layerRefs,
  onHoverEvent,
}: {
  events: EventWithCoords[];
  locale: Locale;
  layerRefs: React.RefObject<Map<string, LeafletCircleMarker>>;
  onHoverEvent?: (id: string | null) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const clusterGroup = L.markerClusterGroup({ maxClusterRadius: 40 });
    const refs = layerRefs.current;

    for (const event of events) {
      const marker = L.circleMarker([event.lat, event.lng], { radius: RADIUS, ...DOT_STYLE });
      const dateStr = formatInVille(
        event.date,
        event.ville,
        { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" },
        locale
      );
      const titre = escapeHtml(localizedTitle(event, locale));
      const dateHtml = escapeHtml(dateStr);

      marker.bindTooltip(
        `<div class="text-xs"><div class="font-medium">${titre}</div><div class="text-foreground-muted">${dateHtml}</div></div>`,
        { direction: "top", offset: [0, -8], opacity: 1 }
      );
      marker.bindPopup(`<a href="/events/${event.id}">${titre}</a><br/>${dateHtml}`);
      marker.on("mouseover", () => onHoverEvent?.(event.id));
      marker.on("mouseout", () => onHoverEvent?.(null));

      refs.set(event.id, marker);
      clusterGroup.addLayer(marker);
    }

    map.addLayer(clusterGroup);
    return () => {
      map.removeLayer(clusterGroup);
      refs.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, map, locale]);

  return null;
}

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
    (e): e is EventWithCoords => e.lat != null && e.lng != null
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
          <ClusterLayer events={withCoords} locale={locale} layerRefs={layerRefs} onHoverEvent={onHoverEvent} />
        </MapContainer>
      </div>
      {withoutCoords > 0 && (
        <p className="mt-2 text-xs text-foreground/50">{t.map.noCoordinates(withoutCoords, "events")}</p>
      )}
    </div>
  );
}
