// Accent terre par catégorie de boutique (carré de la liste et repère de la
// carte), d'après la maquette Racines ; taupe pour les catégories sans couleur.
const SHOP_CATEGORY_COLORS: Record<string, string> = {
  Peinture: "var(--cat-vernissage)",
  Sculpture: "var(--cat-atelier)",
  Performance: "var(--cat-residence)",
  Multidisciplinaire: "var(--cat-expo)",
};

export function shopCategoryColor(discipline: string | null) {
  return (discipline && SHOP_CATEGORY_COLORS[discipline]) || "var(--cat-annonce)";
}
