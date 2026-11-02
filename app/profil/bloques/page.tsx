"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/context";
import { BackLink, PageHeader } from "@/components/PageHeader";
import { SECONDARY_BUTTON } from "@/lib/form-styles";

interface BlockedUser {
  blocked_id: string;
  blocked_nom: string;
}

export default function UtilisateursBloquesPage() {
  const t = useT();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<BlockedUser[] | null>(null);

  async function load(uid: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("blocks")
      .select("blocked_id, blocked_nom")
      .eq("blocker_id", uid)
      .order("created_at", { ascending: false });
    setBlocked(data ?? []);
  }

  useEffect(() => {
    let active = true;
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (!active) return;
        if (!user) {
          router.push("/login");
          return;
        }
        setUserId(user.id);
        load(user.id);
      });
    return () => {
      active = false;
    };
  }, [router]);

  async function handleUnblock(blockedId: string) {
    if (!userId) return;
    const supabase = createClient();
    await supabase.from("blocks").delete().eq("blocker_id", userId).eq("blocked_id", blockedId);
    load(userId);
  }

  return (
    <div className="pb-16">
      <PageHeader
        title={t.safety.blockedUsersTitle}
        eyebrow={<BackLink href="/profil/parametres">{t.profil.settingsTitle}</BackLink>}
      />

      <main className="mx-auto max-w-[1280px] px-4 md:px-10">
        <div className="mt-7 max-w-[720px] border-t border-foreground">
          {blocked === null && <p className="py-6 text-sm text-foreground-muted">{t.common.loading}</p>}
          {blocked !== null && blocked.length === 0 && (
            <p className="py-6 font-display text-2xl text-foreground-muted">{t.safety.noBlockedUsers}</p>
          )}
          {(blocked ?? []).map((b) => (
            <div key={b.blocked_id} className="flex min-h-[68px] items-center justify-between gap-4 border-b border-border">
              <span className="font-display text-[26px] leading-tight">{b.blocked_nom || "—"}</span>
              <button type="button" onClick={() => handleUnblock(b.blocked_id)} className={SECONDARY_BUTTON}>
                {t.safety.unblock}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
