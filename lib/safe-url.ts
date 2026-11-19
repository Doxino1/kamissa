// Lien saisi par un utilisateur (site d'une boutique…) : on n'accepte et
// n'affiche que du http(s). Un « javascript:… » ou « data:… » passerait le
// champ <input type="url"> du navigateur et s'exécuterait au clic.
// « www.boutique.fr » sans protocole est complété en https://.
export function safeHttpUrl(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}
