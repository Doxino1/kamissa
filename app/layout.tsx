import type { Metadata } from "next";
import { Hanken_Grotesk, Instrument_Serif, Noto_Sans, Noto_Serif } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { TopNav } from "@/components/TopNav";
import { PublicFooter } from "@/components/PublicFooter";
import { LocaleProvider } from "@/lib/i18n/context";
import { ToastProvider } from "@/lib/toast-context";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

// Pairing corps/titres de la direction « Racines » : Hanken Grotesk pour le
// corps de texte, Instrument Serif (une seule graisse, romain + italique) pour
// les titres. Ni l'un ni l'autre ne couvre le grec (subset absent chez Google
// Fonts) : Noto Sans complète la pile du corps et Noto Serif celle des titres,
// pour que les titres grecs restent à empattements.
const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin", "latin-ext"],
  weight: "variable",
});
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
});
const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin", "greek"],
  weight: ["400", "600", "700", "900"],
});
const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["greek"],
  weight: "400",
  style: ["normal", "italic"],
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
    <html lang="fr" className={`${hankenGrotesk.variable} ${instrumentSerif.variable} ${notoSans.variable} ${notoSerif.variable} h-full antialiased`}>
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
