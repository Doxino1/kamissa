// Fond de carte CARTO Voyager — couleurs douces cohérentes avec le reste du
// site. Depuis l'automne 2026, CARTO exige une clé (gratuite jusqu'à 5 M de
// requêtes/mois en non commercial, carto.com/basemaps/apikey) passée en
// paramètre `key` ; sans elle, chaque tuile affiche « API KEY REQUIRED ».
// La clé est publique par nature (elle part dans chaque requête du
// navigateur) mais reste hors du dépôt, dans l'environnement.
const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_KEY;

export const TILE_URL = `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${
  CARTO_KEY ? `?key=${encodeURIComponent(CARTO_KEY)}` : ""
}`;
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
