import Link from "next/link";

// Visible uniquement aux visiteurs non connectés — une fois connecté, ces
// liens vivent dans Réglages plutôt que dans un pied de page permanent qui
// entrerait en conflit visuel avec la barre de navigation du bas.
export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-border px-4 py-4">
      <div className="mx-auto flex w-full max-w-2xl flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/50">
        <Link href="/mentions-legales" className="hover:text-foreground">
          Mentions légales
        </Link>
        <Link href="/confidentialite" className="hover:text-foreground">
          Confidentialité
        </Link>
        <Link href="/cgu" className="hover:text-foreground">
          CGU
        </Link>
      </div>
    </footer>
  );
}
