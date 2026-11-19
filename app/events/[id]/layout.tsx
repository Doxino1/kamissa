import type { Metadata } from "next";
import { getPublicEvent, publicEventDates } from "@/lib/public-event";

// La page est un composant client : les balises de partage (titre, date, lieu)
// sont posées ici, côté serveur, pour que WhatsApp & co affichent un aperçu.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = await getPublicEvent(id);
  if (!event) return {};

  const description = [publicEventDates(event), event.lieu ?? event.ville].join(" · ");
  return {
    title: `${event.titre} · Kamissa`,
    description,
    openGraph: { title: event.titre, description, type: "article", siteName: "Kamissa", locale: "fr_FR" },
    twitter: { card: "summary_large_image", title: event.titre, description },
  };
}

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return children;
}
