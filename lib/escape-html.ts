// Échappe le HTML injecté dans les popups/tooltips Leaflet — ces contenus
// sont construits via des chaînes HTML brutes (bindPopup/bindTooltip),
// hors du rendu React, donc sans protection JSX automatique contre l'injection.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
