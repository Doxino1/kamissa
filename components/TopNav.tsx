"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, User } from "lucide-react";
import { useT } from "@/lib/i18n/context";
import { NotificationBell } from "./NotificationBell";

export function TopNav({ show, userId }: { show: boolean; userId: string | null }) {
  const t = useT();
  const pathname = usePathname();

  if (!show) return null;

  const items = [
    { href: "/", label: t.nav.evenements },
    { href: "/communaute", label: t.nav.communaute },
    { href: "/calendrier", label: t.calendar.tab },
  ];

  return (
    <header className="sticky top-0 z-40 hidden h-[72px] border-b border-border bg-background md:block">
      <div className="flex h-full items-center justify-between px-8">
        <Link href="/" className="font-display text-2xl font-black">
          Kamissa
        </Link>

        <nav className="flex items-center gap-2">
          {items.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-4 py-2.5 text-[15px] font-semibold transition ${
                  active ? "bg-badge-open-call-bg text-accent" : "text-foreground-muted hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5">
          <NotificationBell userId={userId} />
          <Link
            href="/boutiques"
            aria-label={t.shops.title}
            title={t.shops.title}
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:bg-surface"
          >
            <Store size={19} strokeWidth={2} />
          </Link>
          <Link
            href="/profil"
            aria-label={t.nav.profil}
            title={t.nav.profil}
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:bg-surface"
          >
            <User size={19} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </header>
  );
}
