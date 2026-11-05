// N'accepte qu'un chemin interne, pour ne pas servir de redirection ouverte :
// « //site.com », « \\site.com » ou « @site.com » mèneraient hors de l'app.
export function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}
