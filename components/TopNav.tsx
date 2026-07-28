"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { useT } from "@/lib/i18n/context";

export function TopNav({ show }: { show: boolean }) {
  const t = useT();
  const pathname = usePathname();

  if (!show) return null;

  const items = [
    { href: "/", label: t.nav.evenements },
    { href: "/communaute", label: t.nav.communaute },
    { href: "/calendrier", label: t.calendar.tab },
  ];

  return (
    <header className="sticky top-0 z-40 hidden border-b border-foreground/10 bg-background/95 backdrop-blur md:block">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-display text-lg font-semibold">
            Kamissa
          </Link>
          <nav className="flex items-center gap-6">
            {items.map(({ href, label }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm font-medium transition ${
                    active ? "text-accent" : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center border-l border-foreground/10 pl-4">
          <Link
            href="/profil"
            aria-label={t.nav.profil}
            title={t.nav.profil}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
              pathname.startsWith("/profil")
                ? "bg-accent text-accent-foreground"
                : "border border-foreground/20 text-foreground-muted hover:text-foreground"
            }`}
          >
            <User size={18} strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </header>
  );
}
