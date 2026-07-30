"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/context";

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
    <div className="mx-auto w-full max-w-sm px-4 py-8">
      <h1 className="text-xl font-black">{t.safety.blockedUsersTitle}</h1>

      <div className="mt-6 flex flex-col gap-2">
        {blocked === null && <p className="text-sm text-foreground-muted">{t.common.loading}</p>}
        {blocked !== null && blocked.length === 0 && (
          <p className="text-sm text-foreground-muted">{t.safety.noBlockedUsers}</p>
        )}
        {(blocked ?? []).map((b) => (
          <div
            key={b.blocked_id}
            className="flex items-center justify-between rounded-lg border border-foreground/10 p-3"
          >
            <span className="text-sm">{b.blocked_nom || "—"}</span>
            <button
              type="button"
              onClick={() => handleUnblock(b.blocked_id)}
              className="rounded-lg border border-foreground/20 px-3 py-1 text-xs hover:border-foreground/40"
            >
              {t.safety.unblock}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
