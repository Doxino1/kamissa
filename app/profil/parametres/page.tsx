"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/context";
import { LOCALE_LABELS, LOCALES } from "@/lib/i18n/dictionary";
import { DISCIPLINES, MATCHING_TAGS, MatchingTag, PROFILE_TYPES, ProfileType, Ville } from "@/lib/types";
import { SignOutButton } from "@/components/SignOutButton";

const VILLES: Ville[] = ["Paris", "Athènes"];

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
      <div className="mx-auto w-full max-w-sm px-4 py-8">
        <p className="text-sm text-foreground-muted">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-8">
      <Link href="/profil" className="flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground">
        <ArrowLeft size={14} strokeWidth={1.75} />
        {t.nav.profil}
      </Link>

      <h1 className="font-display mt-4 text-xl font-medium">{t.profil.settingsTitle}</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <label className="text-sm text-foreground-muted">
          {t.profil.nom}
          <input
            type="text"
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="mt-1 w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
          />
        </label>

        <label className="text-sm text-foreground-muted">
          {t.profil.ville}
          <select
            value={ville}
            onChange={(e) => setVille(e.target.value as Ville)}
            className="mt-1 w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm"
          >
            {VILLES.map((v) => (
              <option key={v} value={v}>
                {t.villeLabels[v]}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-foreground-muted">
          {t.profil.typeProfil}
          <select
            value={typeProfil}
            onChange={(e) => setTypeProfil(e.target.value as ProfileType)}
            className="mt-1 w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm"
          >
            {PROFILE_TYPES.map((pt) => (
              <option key={pt} value={pt}>
                {t.profileTypeLabels[pt]}
              </option>
            ))}
          </select>
        </label>

        <div className="text-sm text-foreground-muted">
          {t.profil.disciplines}
          <div className="mt-1 flex flex-wrap gap-2">
            {DISCIPLINES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDiscipline(d)}
                className={`rounded-lg border px-3 py-1 text-sm transition ${
                  disciplines.includes(d)
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-foreground/20 hover:border-foreground/40"
                }`}
              >
                {t.disciplineLabels[d]}
              </button>
            ))}
          </div>
        </div>

        <label className="text-sm text-foreground-muted">
          {t.profil.bio}
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
          />
        </label>

        <div className="text-sm text-foreground-muted">
          {t.profil.jeCherche}
          <div className="mt-1 flex flex-wrap gap-2">
            {MATCHING_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleMatchingTag(tag)}
                className={`rounded-lg border px-3 py-1 text-sm transition ${
                  matchingTags.includes(tag)
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-foreground/20 hover:border-foreground/40"
                }`}
              >
                {t.matchingTagLabels[tag]}
              </button>
            ))}
          </div>
        </div>

        <h2 className="mt-2 text-sm font-medium text-foreground-muted">{t.profil.contactSectionTitle}</h2>
        <label className="text-sm text-foreground-muted">
          {t.profil.emailContact} <span className="text-foreground/40">{t.profil.emailContactHint}</span>
          <input
            type="email"
            value={emailContact}
            onChange={(e) => setEmailContact(e.target.value)}
            placeholder={t.profil.emailContactPlaceholder}
            className="mt-1 w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
          />
        </label>
        <label className="text-sm text-foreground-muted">
          {t.profil.instagramLabel}
          <input
            type="text"
            value={instagramHandle}
            onChange={(e) => setInstagramHandle(e.target.value.replace(/^@/, ""))}
            placeholder={t.profil.socialPlaceholder}
            className="mt-1 w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
          />
        </label>
        <label className="text-sm text-foreground-muted">
          {t.profil.tiktokLabel}
          <input
            type="text"
            value={tiktokHandle}
            onChange={(e) => setTiktokHandle(e.target.value.replace(/^@/, ""))}
            placeholder={t.profil.socialPlaceholder}
            className="mt-1 w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
          />
        </label>
        <label className="text-sm text-foreground-muted">
          {t.profil.twitterLabel}
          <input
            type="text"
            value={twitterHandle}
            onChange={(e) => setTwitterHandle(e.target.value.replace(/^@/, ""))}
            placeholder={t.profil.socialPlaceholder}
            className="mt-1 w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "…" : t.profil.save}
        </button>
      </form>

      <div className="mt-8 border-t border-foreground/10 pt-4">
        <h2 className="text-sm font-medium text-foreground-muted">{t.profil.languageLabel}</h2>
        <div className="mt-2 flex gap-2">
          {LOCALES.map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                locale === l
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-foreground/20 hover:border-foreground/40"
              }`}
            >
              {LOCALE_LABELS[l]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 border-t border-foreground/10 pt-4">
        <h2 className="text-sm font-medium text-foreground-muted">{t.profil.weeklyEmailTitle}</h2>
        <div className="mt-3 rounded-lg bg-surface p-4 shadow-soft">
          <p className="text-xs text-foreground/50">{t.weeklyEmail.subject(3, t.villeLabels[ville])}</p>
          <p className="mt-3 text-sm font-medium">{t.weeklyEmail.greeting(nom || "…")}</p>
          <p className="mt-2 text-sm text-foreground/70">{t.weeklyEmail.intro(t.villeLabels[ville])}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {t.onboarding.step5ExampleEvents.map((line) => (
              <li key={line} className="text-sm text-foreground/80">
                {line}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-sm text-foreground-muted">{t.profil.weeklyEmailToggle}</span>
          <button
            type="button"
            role="switch"
            aria-checked={recoitEmailHebdo}
            onClick={() => handleToggleEmailHebdo(!recoitEmailHebdo)}
            className={`relative h-[18px] w-8 shrink-0 rounded-full transition ${
              recoitEmailHebdo ? "bg-accent" : "bg-foreground/20"
            }`}
          >
            <span
              className={`absolute top-0.5 h-[14px] w-[14px] rounded-full bg-background transition ${
                recoitEmailHebdo ? "left-[16px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="mt-8 border-t border-foreground/10 pt-4">
        <h2 className="text-sm font-medium text-foreground-muted">{t.notifications.prefsTitle}</h2>
        <div className="mt-3 flex flex-col gap-3">
          {(
            [
              ["notif_followers", t.notifications.prefsFollowers, notifFollowers, setNotifFollowers],
              ["notif_matching", t.notifications.prefsMatching, notifMatching, setNotifMatching],
              ["notif_comments", t.notifications.prefsComments, notifComments, setNotifComments],
            ] as const
          ).map(([column, label, checked, setter]) => (
            <div key={column} className="flex items-center justify-between gap-2">
              <span className="text-sm text-foreground-muted">{label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => handleToggleNotifPref(column, setter, !checked)}
                className={`relative h-[18px] w-8 shrink-0 rounded-full transition ${
                  checked ? "bg-accent" : "bg-foreground/20"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-[14px] w-[14px] rounded-full bg-background transition ${
                    checked ? "left-[16px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 border-t border-foreground/10 pt-4">
        <h2 className="text-sm font-medium text-foreground-muted">{t.profil.accountSectionTitle}</h2>
        <p className="mt-2 text-sm text-foreground-muted">{userEmail}</p>
        {isModerator && (
          <Link
            href="/moderation"
            className="mt-2 flex items-center gap-1.5 text-sm text-accent hover:opacity-80"
          >
            <ShieldCheck size={15} strokeWidth={1.75} />
            {t.nav.moderation}
          </Link>
        )}
        <div className="mt-3">
          <SignOutButton />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 text-sm">
        <Link href="/profil/bloques" className="text-foreground/70 underline hover:text-foreground">
          {t.safety.blockedUsersTitle}
        </Link>
      </div>

      <div className="mt-8 border-t border-foreground/10 pt-4">
        <h2 className="text-sm font-medium text-foreground-muted">{t.account.exportData}</h2>
        <p className="mt-1 text-xs text-foreground/50">{t.account.exportHint}</p>
        <a
          href="/api/account/export"
          className="mt-2 inline-block rounded-lg border border-foreground/20 px-4 py-2 text-sm hover:border-foreground/40"
        >
          {t.account.exportButton}
        </a>
      </div>

      <div className="mt-4">
        <Link href="/profil/supprimer" className="text-sm text-red-600 underline hover:text-red-700">
          {t.account.deleteAccount}
        </Link>
      </div>

      <div className="mt-8 border-t border-foreground/10 pt-4">
        <h2 className="text-sm font-medium text-foreground-muted">{t.profil.legalLinksTitle}</h2>
        <div className="mt-2 flex flex-col gap-1.5 text-sm">
          <Link href="/mentions-legales" className="text-foreground/70 underline hover:text-foreground">
            {t.profil.mentionsLegales}
          </Link>
          <Link href="/confidentialite" className="text-foreground/70 underline hover:text-foreground">
            {t.profil.confidentialite}
          </Link>
          <Link href="/cgu" className="text-foreground/70 underline hover:text-foreground">
            {t.profil.cgu}
          </Link>
        </div>
      </div>
    </div>
  );
}
