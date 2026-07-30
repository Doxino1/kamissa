import type { Metadata } from "next";
import { Fraunces, Noto_Serif } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { TopNav } from "@/components/TopNav";
import { PublicFooter } from "@/components/PublicFooter";
import { LocaleProvider } from "@/lib/i18n/context";
import { ToastProvider } from "@/lib/toast-context";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

// Un seul font pour toute l'app (titres + corps), pas de pairing serif/sans —
// Fraunces (serif variable, optical sizing) pour un rendu plus éditorial.
// Fraunces ne couvre pas le grec (subset absent chez Google Fonts) : Noto
// Serif complète la pile pour les caractères grecs, avec un rendu de corps
// de texte serif proche plutôt qu'un retour silencieux au sans-serif système.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  weight: "variable",
});
const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
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
    <html lang="fr" className={`${fraunces.variable} ${notoSerif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <LocaleProvider>
          <ToastProvider>
            <TopNav show={!!user} userId={user?.id ?? null} />
            <div className={`flex-1 ${user ? "pb-24 md:pb-0" : ""}`}>{children}</div>
            <BottomNav show={!!user} />
            {!user && <PublicFooter />}
          </ToastProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
