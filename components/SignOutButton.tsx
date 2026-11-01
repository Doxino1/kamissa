"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resetSavedEventsCache } from "@/lib/use-saved-events";
import { useT } from "@/lib/i18n/context";

export function SignOutButton() {
  const router = useRouter();
  const t = useT();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    resetSavedEventsCache();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="inline-flex min-h-12 items-center rounded-full border border-foreground px-[26px] text-xs font-semibold uppercase tracking-[0.1em] text-foreground transition hover:bg-surface-hover"
    >
      {t.nav.deconnexion}
    </button>
  );
}
