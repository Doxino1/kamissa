import type { NextConfig } from "next";

// En-têtes de sécurité (audit du 05/11) : pas d'affichage du site dans un
// cadre d'un autre site (anti-clickjacking), pas de devinette du type des
// fichiers, adresse de provenance réduite au domaine pour les liens sortants,
// HTTPS imposé, et caméra/micro/position fermés (l'app ne s'en sert pas ;
// l'envoi de photos passe par le sélecteur de fichiers, non concerné).
// Pas de Content-Security-Policy complète : Leaflet, les tuiles CARTO,
// Supabase et les scripts de Next demanderaient une liste fine à maintenir.
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
