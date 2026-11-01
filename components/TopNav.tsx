"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, User } from "lucide-react";
import { useT } from "@/lib/i18n/context";
import { NotificationBell } from "./NotificationBell";
import { Logo } from "./Logo";

// Bouton rond de la barre : contour fin sur fond blanc, plein noir quand la
// page correspondante est ouverte.
function navIconClass(active: boolean) {
  return `flex h-11 w-11 items-center justify-center rounded-full transition ${
    active
      ? "bg-foreground text-background"
      : "border border-border bg-white text-foreground hover:bg-surface-hover"
  }`;
}

export function TopNav({ show, userId }: { show: boolean; userId: string | null }) {
  const t = useT();
  const pathname = usePathname();

  if (!show) return null;

  const items = [
    { href: "/", label: t.nav.evenements },
    { href: "/communaute", label: t.nav.communaute },
    { href: "/calendrier", label: t.calendar.tab },
  ];
  const onShops = pathname.startsWith("/boutiques");
  const onProfile = pathname.startsWith("/profil");

  return (
    <header className="sticky top-0 z-40 hidden bg-background md:block">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-6 px-10 py-6">
        <nav className="flex flex-wrap gap-7">
          {items.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground underline-offset-[6px] ${
                  active ? "underline" : "no-underline hover:underline"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <Link href="/" aria-label="Kamissa">
          <Logo />
        </Link>

        <div className="flex items-center justify-end gap-2.5">
          <NotificationBell userId={userId} />
          <Link
            href="/boutiques"
            aria-label={t.shops.title}
            title={t.shops.title}
            aria-current={onShops ? "page" : undefined}
            className={navIconClass(onShops)}
          >
            <Store size={17} strokeWidth={1.75} />
          </Link>
          <Link
            href="/profil"
            aria-label={t.nav.profil}
            title={t.nav.profil}
            aria-current={onProfile ? "page" : undefined}
            className={navIconClass(onProfile)}
          >
            <User size={17} strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </header>
  );
}
