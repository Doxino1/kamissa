"use client";

import { Mail } from "lucide-react";
import { InstagramIcon, TikTokIcon, XIcon } from "./SocialIcons";

interface ContactLinksProps {
  email?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
}

// N'affiche que les moyens de contact réellement renseignés — jamais les
// quatre icônes par défaut si seuls un ou deux champs sont remplis.
export function ContactLinks({ email, instagram, tiktok, twitter }: ContactLinksProps) {
  const items: { key: string; href: string; label: string; icon: React.ReactNode }[] = [];

  if (email) {
    items.push({ key: "email", href: `mailto:${email}`, label: email, icon: <Mail size={16} strokeWidth={1.75} /> });
  }
  if (instagram) {
    items.push({
      key: "instagram",
      href: `https://instagram.com/${instagram}`,
      label: `Instagram : ${instagram}`,
      icon: <InstagramIcon size={16} />,
    });
  }
  if (tiktok) {
    items.push({
      key: "tiktok",
      href: `https://tiktok.com/@${tiktok}`,
      label: `TikTok : @${tiktok}`,
      icon: <TikTokIcon size={16} />,
    });
  }
  if (twitter) {
    items.push({
      key: "twitter",
      href: `https://x.com/${twitter}`,
      label: `X : @${twitter}`,
      icon: <XIcon size={16} />,
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="flex gap-2">
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target={item.key === "email" ? undefined : "_blank"}
          rel={item.key === "email" ? undefined : "noreferrer"}
          title={item.label}
          className="rounded-lg border border-border p-1.5 text-foreground/70 transition hover:border-foreground/40 hover:text-foreground"
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}
