"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useT } from "@/lib/i18n/context";
import { AppNotification, useNotifications } from "@/lib/use-notifications";

function notificationHref(n: AppNotification): string {
  if (n.type === "comment" && n.postId) return `/posts/${n.postId}`;
  if (n.actorId) return `/artistes/${n.actorId}`;
  return "/profil";
}

export function NotificationBell({ userId }: { userId: string | null }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAllRead } = useNotifications(userId);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!userId) return null;

  function label(n: AppNotification): string {
    const nom = n.actorNom ?? "";
    if (n.type === "follower") return t.notifications.typeFollower(nom);
    if (n.type === "match") return t.notifications.typeMatch(nom);
    return t.notifications.typeComment(nom);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t.notifications.title}
        title={t.notifications.title}
        className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:bg-surface"
      >
        <Bell size={19} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-[9px] w-[9px] rounded-full border-2 border-background bg-badge-open-call-fg" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-[1050] mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-background shadow-modal">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3.5">
            <span className="text-sm font-bold">{t.notifications.title}</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-bold text-accent-secondary"
              >
                {t.notifications.markAllRead}
              </button>
            )}
          </div>

          {notifications.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-foreground-muted">{t.notifications.empty}</p>
          )}

          <div className="flex max-h-80 flex-col overflow-y-auto">
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={notificationHref(n)}
                onClick={() => setOpen(false)}
                className={`border-b border-border px-4 py-3 text-[13px] transition hover:bg-surface ${
                  n.read ? "" : "bg-badge-open-call-bg/20"
                }`}
              >
                {label(n)}
              </Link>
            ))}
          </div>

          <Link
            href="/profil/parametres"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-xs font-bold"
          >
            {t.notifications.prefsTitle}
          </Link>
        </div>
      )}
    </div>
  );
}
