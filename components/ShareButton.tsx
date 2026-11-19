"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/context";
import { useToast } from "@/lib/toast-context";

type Target = { key: string; label: string; href: (url: string, text: string) => string };

const TARGETS: Target[] = [
  { key: "whatsapp", label: "WhatsApp", href: (u, t) => `https://wa.me/?text=${encodeURIComponent(`${t}\n${u}`)}` },
  { key: "facebook", label: "Facebook", href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  {
    key: "x",
    label: "X",
    href: (u, t) => `https://x.com/intent/post?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}`,
  },
  {
    key: "telegram",
    label: "Telegram",
    href: (u, t) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
  },
];

const ITEM =
  "flex min-h-10 w-full items-center px-4 text-left text-xs font-semibold uppercase tracking-[0.08em] transition hover:bg-surface-hover";

// Partage d'un lien Kamissa. Sur téléphone (écran tactile + Web Share API),
// ouvre directement la feuille de partage du système (WhatsApp, Instagram,
// Messages…). Ailleurs, un petit menu : réseaux, e-mail, copie du lien, et
// « Autres applications » si le navigateur sait partager.
export function ShareButton({
  path,
  title,
  className,
  children,
  ariaLabel,
  align = "right",
}: {
  path: string;
  title: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
  align?: "left" | "right";
}) {
  const { t } = useLocale();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function fullUrl() {
    return `${window.location.origin}${path}`;
  }

  function canNativeShare() {
    return typeof navigator !== "undefined" && typeof navigator.share === "function";
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, text: title, url: fullUrl() });
    } catch {
      // Partage annulé par l'utilisateur : rien à faire.
    }
  }

  function handleClick() {
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (touch && canNativeShare()) {
      nativeShare();
      return;
    }
    setOpen((o) => !o);
  }

  function copyLink() {
    navigator.clipboard.writeText(fullUrl()).then(() => showToast(t.toast.linkCopied));
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={handleClick}
        aria-label={ariaLabel}
        title={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        className={className}
      >
        {children}
      </button>
      {open && (
        <div
          role="menu"
          aria-label={t.shareMenu.label}
          className={`absolute z-[1100] mt-2 w-56 border border-foreground bg-background py-1.5 shadow-sm ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <p className="px-4 pb-1 pt-1.5 text-[11px] uppercase tracking-[0.1em] text-foreground-muted">
            {t.shareMenu.label}
          </p>
          {TARGETS.map((target) => (
            <a
              key={target.key}
              role="menuitem"
              href={target.href(fullUrl(), title)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className={ITEM}
            >
              {target.label}
            </a>
          ))}
          <a
            role="menuitem"
            href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n${fullUrl()}`)}`}
            onClick={() => setOpen(false)}
            className={ITEM}
          >
            {t.shareMenu.email}
          </a>
          <button type="button" role="menuitem" onClick={copyLink} className={`${ITEM} border-t border-border`}>
            {t.shareMenu.copyLink}
          </button>
          {canNativeShare() && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                nativeShare();
              }}
              className={ITEM}
            >
              {t.shareMenu.more}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
