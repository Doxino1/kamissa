import type { Metadata } from "next";
import { Figtree, Caprasimo, Noto_Sans } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { TopNav } from "@/components/TopNav";
import { PublicFooter } from "@/components/PublicFooter";
import { LocaleProvider } from "@/lib/i18n/context";
import { ToastProvider } from "@/lib/toast-context";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

// Pairing corps/titres façon prototype Claude Design : Figtree pour le corps
// de texte, Caprasimo (display, une seule graisse) pour les titres. Ni l'un
// ni l'autre ne couvre le grec (subset absent chez Google Fonts) : Noto Sans
// complète la pile pour ces caractères, aussi bien pour le corps que pour
// les titres (pas de version "display" grecque de Caprasimo disponible).
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin", "latin-ext"],
  weight: "variable",
});
const caprasimo = Caprasimo({
  variable: "--font-caprasimo",
  subsets: ["latin", "latin-ext"],
  weight: "400",
});
const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin", "greek"],
  weight: ["400", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "Kamissa",
  description: "Événements, matching et communauté pour artistes à Paris et Athènes",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="fr" className={`${figtree.variable} ${caprasimo.variable} ${notoSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <LocaleProvider>
          <ToastProvider>
            <TopNav show={!!user} userId={user?.id ?? null} />
            <div className={`flex-1 ${user ? "pb-16 md:pb-0" : ""}`}>{children}</div>
            <BottomNav show={!!user} />
            {!user && <PublicFooter />}
          </ToastProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
