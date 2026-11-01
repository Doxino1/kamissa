"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/context";
import { BlockReportActions } from "@/components/BlockReportActions";
import { pillClass } from "@/components/EventFilterBar";
import { Ville } from "@/lib/types";

interface Message {
  id: string;
  texte: string;
  date: string;
  user_id: string;
  parent_id: string | null;
  profiles: { nom: string } | null;
}

interface ReplyTarget {
  id: string;
  nom: string;
}

const VILLES: Ville[] = ["Paris", "Athènes"];
const BCP47_TAGS: Record<string, string> = { fr: "fr-FR", en: "en-US", el: "el-GR" };

const ACTION = "min-h-8 text-xs font-semibold uppercase tracking-[0.1em]";

export function CommunityChatTab() {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [ville, setVille] = useState<Ville | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [texte, setTexte] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ReplyTarget | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString(BCP47_TAGS[locale] ?? "fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const loadMessages = useCallback(async (group: string) => {
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("group_messages")
      .select("id, texte, date, user_id, parent_id, profiles(nom)")
      .eq("group_id", group)
      .order("date", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      return;
    }
    setMessages((data ?? []) as unknown as Message[]);
  }, []);

  const loadBlocked = useCallback(async (uid: string) => {
    const supabase = createClient();
    const { data } = await supabase.from("blocks").select("blocker_id, blocked_id");
    const ids = new Set<string>();
    for (const row of data ?? []) {
      if (row.blocker_id === uid) ids.add(row.blocked_id);
      if (row.blocked_id === uid) ids.add(row.blocker_id);
    }
    setBlockedIds(ids);
  }, []);

  // Récupère l'utilisateur une seule fois et initialise la ville affichée sur
  // sa ville de profil — ensuite l'utilisateur peut basculer librement sur
  // l'autre ville sans que ça touche à son profil.
  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      if (!active) return;
      setUserId(user.id);
      await loadBlocked(user.id);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("ville")
        .eq("id", user.id)
        .single();

      if (!active) return;
      if (profileError || !profile) {
        setError(profileError?.message ?? t.common.profileNotFound);
        setLoading(false);
        return;
      }

      setVille(profile.ville as Ville);
    }

    init();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, loadBlocked]);

  // Recharge le groupe + les messages à chaque changement de ville affichée —
  // c'est cette dépendance qui manquait, la ville du profil n'était lue
  // qu'une fois au montage donc changer de ville ne rechargeait jamais rien.
  useEffect(() => {
    if (!ville) return;
    let active = true;
    const supabase = createClient();

    async function loadGroup() {
      setLoading(true);
      setError(null);

      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("id")
        .eq("ville", ville)
        .single();

      if (!active) return;
      if (groupError || !group) {
        setError(groupError?.message ?? t.communaute.groupNotFound);
        setLoading(false);
        return;
      }

      setGroupId(group.id);
      await loadMessages(group.id);
      if (active) setLoading(false);
    }

    loadGroup();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ville, loadMessages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!groupId || !texte.trim()) return;

    setSending(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error: insertError } = await supabase.from("group_messages").insert({
      group_id: groupId,
      user_id: user.id,
      texte: texte.trim(),
      parent_id: replyingTo?.id ?? null,
    });

    setSending(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setTexte("");
    if (replyingTo) {
      setExpandedThreads((prev) => new Set(prev).add(replyingTo.id));
      setReplyingTo(null);
    }
    await loadMessages(groupId);
  }

  function toggleThread(id: string) {
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visibleMessages = messages.filter((m) => !blockedIds.has(m.user_id));
  const topLevel = visibleMessages.filter((m) => !m.parent_id);
  const repliesByParent = new Map<string, Message[]>();
  for (const m of visibleMessages) {
    if (!m.parent_id) continue;
    const list = repliesByParent.get(m.parent_id) ?? [];
    list.push(m);
    repliesByParent.set(m.parent_id, list);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 pt-6">
        <h2 className="font-display text-[clamp(1.75rem,4vw,2.25rem)] italic leading-tight">
          {t.communaute.title(ville ? (t.villeLabels[ville] ?? ville) : "")}
        </h2>
        <div className="flex gap-2">
          {VILLES.map((v) => (
            <button key={v} onClick={() => setVille(v)} aria-pressed={ville === v} className={pillClass(ville === v)}>
              {t.villeLabels[v]}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="mt-6 text-sm text-foreground-muted">{t.common.loading}</p>}
      {error && <p className="mt-6 text-sm text-danger">{error}</p>}

      {!loading && (
        <>
          <div className="mt-4 flex flex-col border-t border-border">
            {topLevel.length === 0 && !error && (
              <p className="py-14 text-center font-display text-[26px] italic text-foreground-muted md:text-[32px]">
                {t.communaute.noMessages}
              </p>
            )}
            {topLevel.map((m) => {
              const replies = repliesByParent.get(m.id) ?? [];
              const nom = m.profiles?.nom || t.communaute.anonyme;
              return (
                <article key={m.id} className="border-b border-border py-[26px]">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link
                      href={`/artistes/${m.user_id}`}
                      className="text-xs font-bold uppercase tracking-[0.12em] underline-offset-4 hover:underline"
                    >
                      {nom}
                    </Link>
                    <span className="text-xs text-foreground-muted">{formatDate(m.date)}</span>
                  </div>
                  <p className="mt-2 break-words font-display text-[26px] leading-[1.1] md:text-[34px]">« {m.texte} »</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
                    <button
                      type="button"
                      onClick={() => setReplyingTo({ id: m.id, nom })}
                      className={`${ACTION} text-accent-secondary`}
                    >
                      {t.communaute.reply}
                    </button>
                    {userId && m.user_id !== userId && (
                      <BlockReportActions
                        targetUserId={m.user_id}
                        targetName={nom}
                        onBlocked={() => setBlockedIds((prev) => new Set(prev).add(m.user_id))}
                      />
                    )}
                  </div>

                  {replies.length > 0 && (
                    <div className="mt-1">
                      <button
                        type="button"
                        onClick={() => toggleThread(m.id)}
                        aria-expanded={expandedThreads.has(m.id)}
                        className={`${ACTION} flex items-center gap-1 text-[#8a6532]`}
                      >
                        {t.communaute.repliesToggle(replies.length)}
                        <ChevronDown
                          size={14}
                          strokeWidth={2}
                          className={`transition-transform ${expandedThreads.has(m.id) ? "rotate-180" : ""}`}
                        />
                      </button>
                      {expandedThreads.has(m.id) && (
                        <div className="ml-4 mt-3 flex flex-col gap-3.5 border-l border-foreground pl-[18px] md:ml-8">
                          {replies.map((r) => {
                            const replyNom = r.profiles?.nom || t.communaute.anonyme;
                            return (
                              <div key={r.id}>
                                <div className="flex items-baseline gap-2">
                                  <Link
                                    href={`/artistes/${r.user_id}`}
                                    className="text-xs font-bold uppercase tracking-[0.12em] underline-offset-4 hover:underline"
                                  >
                                    {replyNom}
                                  </Link>
                                  <span className="text-xs text-foreground-muted">· {formatDate(r.date)}</span>
                                </div>
                                <p className="mt-1 break-words font-display text-2xl leading-tight">{r.texte}</p>
                                {userId && r.user_id !== userId && (
                                  <BlockReportActions
                                    targetUserId={r.user_id}
                                    targetName={replyNom}
                                    onBlocked={() => setBlockedIds((prev) => new Set(prev).add(r.user_id))}
                                    className="mt-1.5"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {replyingTo && (
            <div className="mt-6 flex items-center justify-between gap-2 border-b border-border py-2 text-xs uppercase tracking-[0.1em] text-foreground-muted">
              <span>{t.communaute.replyingTo(replyingTo.nom)}</span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                aria-label={t.common.cancel}
                className="flex h-8 w-8 items-center justify-center hover:text-foreground"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className={`flex items-center gap-3 ${replyingTo ? "mt-2" : "mt-6"}`}>
            <input
              type="text"
              required
              placeholder={t.communaute.placeholder}
              aria-label={t.communaute.placeholder}
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              className="min-h-[52px] min-w-0 flex-1 border-b border-foreground bg-transparent font-display text-[22px] outline-none placeholder:text-muted-strong md:text-2xl"
            />
            <button
              type="submit"
              disabled={sending}
              className="min-h-12 shrink-0 rounded-full bg-foreground px-[26px] text-xs font-semibold uppercase tracking-[0.1em] text-background transition hover:bg-accent-hover disabled:opacity-50"
            >
              {sending ? "…" : t.communaute.send}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
