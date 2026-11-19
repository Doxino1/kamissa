"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Users, User, ShieldCheck } from "lucide-react";
import { useT } from "@/lib/i18n/context";

export function BottomNav({ show, isModerator = false }: { show: boolean; isModerator?: boolean }) {
  const t = useT();
  const pathname = usePathname();

  if (!show) return null;

  const items = [
    { href: "/", label: t.nav.evenements, Icon: Home },
    { href: "/communaute", label: t.nav.communaute, Icon: Users },
    { href: "/calendrier", label: t.calendar.tab, Icon: Calendar },
    ...(isModerator ? [{ href: "/moderation", label: t.nav.moderation, Icon: ShieldCheck }] : []),
    { href: "/profil", label: t.nav.profil, Icon: User },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-border bg-background md:hidden">
      {items.map(({ href, label, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 px-0.5 py-1 transition ${
              active ? "text-foreground" : "text-foreground-muted"
            }`}
          >
            <Icon size={20} strokeWidth={1.75} />
            {/* Cinq onglets pour un modérateur : lettres moins espacées pour tenir en 375 px. */}
            <span
              className={`max-w-full truncate text-[10px] font-semibold uppercase underline-offset-4 ${
                items.length > 4 ? "tracking-[0.02em]" : "tracking-[0.08em]"
              } ${active ? "underline" : ""}`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
