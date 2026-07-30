import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { TopNav } from "@/components/TopNav";
import { PublicFooter } from "@/components/PublicFooter";
import { LocaleProvider } from "@/lib/i18n/context";
import { ToastProvider } from "@/lib/toast-context";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

// Un seul font rond et chaleureux pour toute l'app (titres + corps), pas de
// pairing serif/sans — Comfortaa est le seul candidat "bubbly" à couvrir le
// grec, nécessaire pour la cohérence typographique des titres en langue EL.
const comfortaa = Comfortaa({
  variable: "--font-sans",
  subsets: ["latin", "greek"],
  weight: "variable",
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
    <html lang="fr" className={`${comfortaa.variable} h-full antialiased`}>
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
