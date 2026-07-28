"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Users, User } from "lucide-react";
import { useT } from "@/lib/i18n/context";

export function BottomNav({ show }: { show: boolean }) {
  const t = useT();
  const pathname = usePathname();

  if (!show) return null;

  const items = [
    { href: "/", label: t.nav.evenements, Icon: Home },
    { href: "/communaute", label: t.nav.communaute, Icon: Users },
    { href: "/calendrier", label: t.calendar.tab, Icon: Calendar },
    { href: "/profil", label: t.nav.profil, Icon: User },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 md:hidden">
      <nav className="flex items-center gap-1 rounded-full bg-surface p-1.5 shadow-soft">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition ${
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              <Icon size={18} strokeWidth={1.75} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
