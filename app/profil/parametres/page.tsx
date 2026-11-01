"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/context";
import { LOCALE_LABELS, LOCALES } from "@/lib/i18n/dictionary";
import { DISCIPLINES, MATCHING_TAGS, MatchingTag, PROFILE_TYPES, ProfileType, Ville } from "@/lib/types";
import { SignOutButton } from "@/components/SignOutButton";
import { pillClass } from "@/components/EventFilterBar";
import { PageHeader, TAB_NUMBER, tabNumber } from "@/components/PageHeader";

const VILLES: Ville[] = ["Paris", "Athènes"];

// Formulaire Racines : libellés en petites capitales, champs soulignés saisis
// en serif, sections séparées par des filets.
const SECTION = "scroll-mt-28 border-b border-border pb-8 pt-7";
const SECTION_TITLE = "mb-[18px] font-display text-[34px] leading-none md:text-[40px]";
const FIELD = "flex flex-col gap-1";
const LABEL = "text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-muted";
const INPUT =
  "min-h-[46px] w-full border-0 border-b border-foreground bg-transparent font-display text-[26px] text-foreground outline-none placeholder:text-muted-strong focus:border-b-2";
const SWITCH_ROW = "flex min-h-[60px] items-center justify-between gap-3 border-b border-border";
const SWITCH_LABEL = "text-[13px] font-semibold uppercase tracking-[0.08em]";

export default function ParametresPage() {
  const { locale, setLocale, t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [nom, setNom] = useState("");
  const [ville, setVille] = useState<Ville>("Paris");
  const [typeProfil, setTypeProfil] = useState<ProfileType>("amateur");
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [emailContact, setEmailContact] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [matchingTags, setMatchingTags] = useState<MatchingTag[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isModerator, setIsModerator] = useState(false);
  const [recoitEmailHebdo, setRecoitEmailHebdo] = useState(true);
  const [notifFollowers, setNotifFollowers] = useState(true);
  const [notifMatching, setNotifMatching] = useState(true);
  const [notifComments, setNotifComments] = useState(true);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserEmail(user.email ?? null);
      setUserId(user.id);

      const [{ data, error: fetchError }, { data: tags, error: tagsError }] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "nom, ville, disciplines, type_profil, bio, email_contact, instagram_handle, tiktok_handle, twitter_handle, is_moderator, recoit_email_hebdo, notif_followers, notif_matching, notif_comments"
          )
          .eq("id", user.id)
          .single(),
        supabase.from("matching_tags").select("tag").eq("user_id", user.id),
      ]);

      if (!active) return;

      if (fetchError) {
        setError(fetchError.message);
      } else if (data) {
        setNom(data.nom ?? "");
        setVille((data.ville as Ville) || "Paris");
        setTypeProfil(data.type_profil as ProfileType);
        setDisciplines(data.disciplines ?? []);
        setBio(data.bio ?? "");
        setEmailContact(data.email_contact ?? "");
        setInstagramHandle(data.instagram_handle ?? "");
        setTiktokHandle(data.tiktok_handle ?? "");
        setTwitterHandle(data.twitter_handle ?? "");
        setIsModerator(data.is_moderator === true);
        setRecoitEmailHebdo(data.recoit_email_hebdo !== false);
        setNotifFollowers(data.notif_followers !== false);
        setNotifMatching(data.notif_matching !== false);
        setNotifComments(data.notif_comments !== false);
      }
      if (!tagsError && tags) {
        setMatchingTags(tags.map((row) => row.tag as MatchingTag));
      }
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleToggleEmailHebdo(value: boolean) {
    if (!userId) return;
    setRecoitEmailHebdo(value);
    const supabase = createClient();
    await supabase.from("profiles").update({ recoit_email_hebdo: value }).eq("id", userId);
  }

  async function handleToggleNotifPref(
    column: "notif_followers" | "notif_matching" | "notif_comments",
    setter: (value: boolean) => void,
    value: boolean
  ) {
    if (!userId) return;
    setter(value);
    const supabase = createClient();
    await supabase.from("profiles").update({ [column]: value }).eq("id", userId);
  }

  function toggleDiscipline(d: string) {
    setDisciplines((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  function toggleMatchingTag(tag: MatchingTag) {
    setMatchingTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        nom,
        ville,
        type_profil: typeProfil,
        disciplines,
        bio,
        email_contact: emailContact || null,
        instagram_handle: instagramHandle || null,
        tiktok_handle: tiktokHandle || null,
        twitter_handle: twitterHandle || null,
      })
      .eq("id", user.id);

    if (updateError) {
      setSaving(false);
      setError(updateError.message);
      return;
    }

    const { error: deleteTagsError } = await supabase
      .from("matching_tags")
      .delete()
      .eq("user_id", user.id);

    if (!deleteTagsError && matchingTags.length > 0) {
      await supabase
        .from("matching_tags")
        .insert(matchingTags.map((tag) => ({ user_id: user.id, tag })));
    }

    setSaving(false);
    if (deleteTagsError) {
      setError(deleteTagsError.message);
      return;
    }
    setMessage(t.profil.saved);
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 py-10 md:px-10">
        <p className="text-sm text-foreground-muted">{t.common.loading}</p>
      </div>
    );
  }

  const sections: [string, string][] = [
    ["p-profil", t.nav.profil],
    ["p-contact", t.profil.contactSectionTitle],
    ["p-langue", t.profil.languageLabel],
    ["p-email", t.profil.weeklyEmailTitle],
    ["p-notifs", t.notifications.prefsTitle],
    ["p-compte", t.profil.accountSectionTitle],
    ["p-legal", t.profil.legalLinksTitle],
  ];

  return (
    <div className="pb-16">
      <PageHeader
        title={t.profil.settingsTitle}
        eyebrow={
          <Link
            href="/profil"
            className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-foreground-muted hover:text-foreground"
          >
            ‹ {t.nav.profil}
          </Link>
        }
      />

      <main className="mx-auto flex max-w-[1280px] flex-wrap gap-x-14 px-4 md:px-10">
        <nav className="hidden flex-[1_1_200px] flex-col gap-0.5 pt-7 md:flex md:max-w-[240px]">
          <div className="sticky top-[104px] flex flex-col gap-0.5">
            {sections.map(([id, label], i) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex min-h-10 items-baseline gap-2.5 font-display text-2xl text-foreground-muted transition hover:text-foreground"
              >
                <span className={TAB_NUMBER}>{tabNumber(i + 1)}</span>
                {label}
              </a>
            ))}
          </div>
        </nav>

        <div className="min-w-0 flex-[999_1_560px]">
          <form onSubmit={handleSubmit}>
            <section id="p-profil" className={SECTION}>
              <h2 className={SECTION_TITLE}>{t.nav.profil}</h2>
              <div className="grid gap-x-8 gap-y-[22px] md:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
                <label className={FIELD}>
                  <span className={LABEL}>{t.profil.nom}</span>
                  <input type="text" required value={nom} onChange={(e) => setNom(e.target.value)} className={INPUT} />
                </label>
                <label className={FIELD}>
                  <span className={LABEL}>{t.profil.ville}</span>
                  <select value={ville} onChange={(e) => setVille(e.target.value as Ville)} className={INPUT}>
                    {VILLES.map((v) => (
                      <option key={v} value={v}>
                        {t.villeLabels[v]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={FIELD}>
                  <span className={LABEL}>{t.profil.typeProfil}</span>
                  <select
                    value={typeProfil}
                    onChange={(e) => setTypeProfil(e.target.value as ProfileType)}
                    className={INPUT}
                  >
                    {PROFILE_TYPES.map((pt) => (
                      <option key={pt} value={pt}>
                        {t.profileTypeLabels[pt]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-7 flex flex-col gap-2.5">
                <span className={LABEL}>{t.profil.disciplines}</span>
                <div className="flex flex-wrap gap-2">
                  {DISCIPLINES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDiscipline(d)}
                      aria-pressed={disciplines.includes(d)}
                      className={pillClass(disciplines.includes(d))}
                    >
                      {t.disciplineLabels[d]}
                    </button>
                  ))}
                </div>
              </div>

              <label className={`${FIELD} mt-7`}>
                <span className={LABEL}>{t.profil.bio}</span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="border border-border bg-transparent px-3 py-2.5 font-display text-[22px] leading-snug outline-none focus:border-foreground"
                />
              </label>

              <div className="mt-7 flex flex-col gap-2.5">
                <span className={LABEL}>{t.profil.jeCherche}</span>
                <div className="flex flex-wrap gap-2">
                  {MATCHING_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleMatchingTag(tag)}
                      aria-pressed={matchingTags.includes(tag)}
                      className={pillClass(matchingTags.includes(tag))}
                    >
                      {t.matchingTagLabels[tag]}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section id="p-contact" className={SECTION}>
              <h2 className={SECTION_TITLE}>{t.profil.contactSectionTitle}</h2>
              <div className="grid gap-x-8 gap-y-[22px] md:grid-cols-2">
                <label className={FIELD}>
                  <span className={LABEL}>
                    {t.profil.emailContact}{" "}
                    <span className="normal-case tracking-normal text-muted-strong">{t.profil.emailContactHint}</span>
                  </span>
                  <input
                    type="email"
                    value={emailContact}
                    onChange={(e) => setEmailContact(e.target.value)}
                    placeholder={t.profil.emailContactPlaceholder}
                    className={INPUT}
                  />
                </label>
                <label className={FIELD}>
                  <span className={LABEL}>{t.profil.instagramLabel}</span>
                  <input
                    type="text"
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value.replace(/^@/, ""))}
                    placeholder={t.profil.socialPlaceholder}
                    className={INPUT}
                  />
                </label>
                <label className={FIELD}>
                  <span className={LABEL}>{t.profil.tiktokLabel}</span>
                  <input
                    type="text"
                    value={tiktokHandle}
                    onChange={(e) => setTiktokHandle(e.target.value.replace(/^@/, ""))}
                    placeholder={t.profil.socialPlaceholder}
                    className={INPUT}
                  />
                </label>
                <label className={FIELD}>
                  <span className={LABEL}>{t.profil.twitterLabel}</span>
                  <input
                    type="text"
                    value={twitterHandle}
                    onChange={(e) => setTwitterHandle(e.target.value.replace(/^@/, ""))}
                    placeholder={t.profil.socialPlaceholder}
                    className={INPUT}
                  />
                </label>
              </div>

              {error && <p className="mt-5 text-sm font-semibold text-danger">{error}</p>}
              {message && <p className="mt-5 text-sm font-semibold text-accent-secondary">{message}</p>}

              <button
                type="submit"
                disabled={saving}
                className="mt-7 min-h-12 rounded-full bg-foreground px-[26px] text-xs font-semibold uppercase tracking-[0.12em] text-background transition hover:bg-accent-hover disabled:opacity-50"
              >
                {saving ? "…" : t.profil.save}
              </button>
            </section>
          </form>

          <section id="p-langue" className={SECTION}>
            <h2 className={SECTION_TITLE}>{t.profil.languageLabel}</h2>
            <div role="radiogroup" aria-label={t.profil.languageLabel} className="flex flex-wrap gap-2">
              {LOCALES.map((l) => (
                <button
                  key={l}
                  role="radio"
                  aria-checked={locale === l}
                  onClick={() => setLocale(l)}
                  className={`min-h-11 rounded-full border px-[18px] font-display text-xl transition ${
                    locale === l
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-transparent text-foreground hover:border-foreground"
                  }`}
                >
                  {LOCALE_LABELS[l]}
                </button>
              ))}
            </div>
          </section>

          <section id="p-email" className={SECTION}>
            <h2 className={SECTION_TITLE}>{t.profil.weeklyEmailTitle}</h2>
            <div className="border-l border-foreground pl-5">
              <p className="text-xs uppercase tracking-[0.1em] text-foreground-muted">
                {t.weeklyEmail.subject(3, t.villeLabels[ville])}
              </p>
              <p className="mt-3 font-display text-2xl">{t.weeklyEmail.greeting(nom || "…")}</p>
              <p className="mt-2 text-sm text-text-soft">{t.weeklyEmail.intro(t.villeLabels[ville])}</p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {t.onboarding.step5ExampleEvents.map((line) => (
                  <li key={line} className="text-sm">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`${SWITCH_ROW} mt-5 border-t`}>
              <span className={SWITCH_LABEL}>{t.profil.weeklyEmailToggle}</span>
              <Switch checked={recoitEmailHebdo} onChange={handleToggleEmailHebdo} />
            </div>
          </section>

          <section id="p-notifs" className={SECTION}>
            <h2 className={SECTION_TITLE}>{t.notifications.prefsTitle}</h2>
            <div className="grid md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] md:gap-x-12">
              {(
                [
                  ["notif_followers", t.notifications.prefsFollowers, notifFollowers, setNotifFollowers],
                  ["notif_matching", t.notifications.prefsMatching, notifMatching, setNotifMatching],
                  ["notif_comments", t.notifications.prefsComments, notifComments, setNotifComments],
                ] as const
              ).map(([column, label, checked, setter]) => (
                <div key={column} className={SWITCH_ROW}>
                  <span className={SWITCH_LABEL}>{label}</span>
                  <Switch checked={checked} onChange={(v) => handleToggleNotifPref(column, setter, v)} />
                </div>
              ))}
            </div>
          </section>

          <section id="p-compte" className={SECTION}>
            <h2 className={SECTION_TITLE}>{t.profil.accountSectionTitle}</h2>
            <p className="font-display text-2xl">{userEmail}</p>
            {isModerator && (
              <Link
                href="/moderation"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] underline underline-offset-4"
              >
                <ShieldCheck size={15} strokeWidth={1.75} />
                {t.nav.moderation}
              </Link>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <SignOutButton />
              <Link
                href="/profil/bloques"
                className="text-xs font-semibold uppercase tracking-[0.1em] underline underline-offset-4"
              >
                {t.safety.blockedUsersTitle}
              </Link>
            </div>

            <div className="mt-8">
              <p className={LABEL}>{t.account.exportData}</p>
              <p className="mt-1 text-sm text-foreground-muted">{t.account.exportHint}</p>
              <a
                href="/api/account/export"
                className="mt-3 inline-flex min-h-11 items-center rounded-full border border-foreground px-5 text-xs font-semibold uppercase tracking-[0.1em] transition hover:bg-surface-hover"
              >
                {t.account.exportButton}
              </a>
            </div>

            <Link
              href="/profil/supprimer"
              className="mt-8 inline-flex min-h-11 items-center text-xs font-semibold uppercase tracking-[0.1em] text-danger underline underline-offset-[5px]"
            >
              {t.account.deleteAccount}
            </Link>
          </section>

          <section id="p-legal" className={`${SECTION} border-b-0`}>
            <h2 className={SECTION_TITLE}>{t.profil.legalLinksTitle}</h2>
            <div className="flex flex-col">
              {(
                [
                  ["/mentions-legales", t.profil.mentionsLegales],
                  ["/confidentialite", t.profil.confidentialite],
                  ["/cgu", t.profil.cgu],
                ] as const
              ).map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="flex min-h-11 items-center justify-between border-b border-border text-sm hover:bg-surface-hover"
                >
                  {label}
                  <span aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-[30px] w-[52px] shrink-0 rounded-full border transition ${
        checked ? "border-foreground bg-foreground" : "border-toggle-off bg-transparent"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full transition-[left] ${
          checked ? "left-[25px] bg-background" : "left-1 bg-toggle-off"
        }`}
      />
    </button>
  );
}
