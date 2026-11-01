import L from "leaflet";

// Repère « Racines » : carré plein à la couleur de la catégorie, numéroté
// comme la ligne correspondante de la liste ( 01 ), ( 02 )… Le style vit
// dans globals.css (.kamissa-pin) ; le survol ajoute .kamissa-pin--active.
const PIN_SIZE = 34;

export function makePinIcon(label: number, color: string) {
  return L.divIcon({
    className: "",
    html: `<span class="kamissa-pin" style="background:${color}">${label}</span>`,
    iconSize: [PIN_SIZE, PIN_SIZE],
    iconAnchor: [PIN_SIZE / 2, PIN_SIZE / 2],
    tooltipAnchor: [0, -PIN_SIZE / 2],
    popupAnchor: [0, -PIN_SIZE / 2],
  });
}

export function setPinActive(marker: L.Marker, active: boolean) {
  marker.getElement()?.querySelector(".kamissa-pin")?.classList.toggle("kamissa-pin--active", active);
  marker.setZIndexOffset(active ? 1000 : 0);
}
