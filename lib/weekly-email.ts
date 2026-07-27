import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { formatInVille } from "./timezone.ts";
import { LOCALES, dictionaries } from "./i18n/dictionary.ts";
import type { Locale } from "./i18n/dictionary.ts";
import type { ArtEvent, Ville } from "./types.ts";
import { localizedTitle } from "./localize-event.ts";

interface ProfileRow {
  id: string;
  nom: string;
  ville: string;
  disciplines: string[];
  langue_preferee: string | null;
  created_at: string;
}

interface MatchingTagRow {
  user_id: string;
  tag: string;
  created_at: string;
}

interface GroupMessageRow {
  group_id: string;
  user_id: string;
}

interface EventRow {
  id: string;
  titre: string;
  description: string | null;
  type: ArtEvent["type"];
  discipline: string | null;
  ville: string;
  date: string;
  lieu: string | null;
  titre_en: string | null;
  titre_el: string | null;
  description_en: string | null;
  description_el: string | null;
}

function resolveLocale(langue: string | null): Locale {
  return langue && (LOCALES as string[]).includes(langue) ? (langue as Locale) : "fr";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function eventHtml(event: EventRow, locale: Locale, siteUrl: string | undefined): string {
  const t = dictionaries[locale];
  const date = formatInVille(
    event.date,
    event.ville as Ville,
    { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" },
    locale
  );
  const link = siteUrl ? `${siteUrl}/events/${event.id}` : null;
  const titreSafe = escapeHtml(
    localizedTitle({ titre: event.titre, titreEn: event.titre_en, titreEl: event.titre_el }, locale)
  );
  const titre = link ? `<a href="${escapeHtml(link)}">${titreSafe}</a>` : titreSafe;
  const lieu = event.lieu ? escapeHtml(event.lieu) : "";

  return `
    <li style="margin-bottom: 16px;">
      <div style="font-size: 12px; color: #666;">${t.eventTypeLabels[event.type]} · ${date}</div>
      <div style="font-weight: 600;">${titre}</div>
      <div style="font-size: 13px; color: #666;">${lieu}</div>
    </li>`;
}

function digestHtml(
  nom: string,
  ville: string,
  events: EventRow[],
  locale: Locale,
  siteUrl: string | undefined,
  communityLine: string | null
): string {
  const t = dictionaries[locale];
  return `
    <div style="font-family: sans-serif; max-width: 480px;">
      <p>${escapeHtml(t.weeklyEmail.greeting(nom || ""))}</p>
      <p>${escapeHtml(t.weeklyEmail.intro(ville))}</p>
      <ul style="list-style: none; padding: 0;">
        ${events.map((e) => eventHtml(e, locale, siteUrl)).join("")}
      </ul>
      ${communityLine ? `<p style="margin-top: 16px; color: #444;">${escapeHtml(communityLine)}</p>` : ""}
    </div>`;
}

// Une "nouvelle" correspondance = un·e candidat·e qui partage au moins une
// discipline et un tag "je cherche" avec le profil, et dont le match est
// apparu depuis la dernière semaine : soit le profil vient d'être créé, soit
// le tag partagé (le sien ou celui du profil) a été ajouté récemment.
function countNewMatches(
  profile: ProfileRow,
  allProfiles: ProfileRow[],
  tagsByUser: Map<string, MatchingTagRow[]>,
  since: Date
): number {
  const myTags = tagsByUser.get(profile.id) ?? [];
  if (myTags.length === 0) return 0;
  const myTagValues = myTags.map((t) => t.tag);

  let count = 0;
  for (const candidate of allProfiles) {
    if (candidate.id === profile.id || candidate.ville !== profile.ville) continue;

    const sharedDisciplines = candidate.disciplines.filter((d) => profile.disciplines.includes(d));
    if (sharedDisciplines.length === 0) continue;

    const candidateTags = tagsByUser.get(candidate.id) ?? [];
    const sharedCandidateTags = candidateTags.filter((row) => myTagValues.includes(row.tag));
    if (sharedCandidateTags.length === 0) continue;

    const candidateIsNew = new Date(candidate.created_at) >= since;
    const candidateTagIsNew = sharedCandidateTags.some((row) => new Date(row.created_at) >= since);
    const sharedTagValues = sharedCandidateTags.map((row) => row.tag);
    const myTagIsNew = myTags.some(
      (row) => sharedTagValues.includes(row.tag) && new Date(row.created_at) >= since
    );

    if (candidateIsNew || candidateTagIsNew || myTagIsNew) count += 1;
  }

  return count;
}

export interface SendWeeklyEmailsOptions {
  dryRun: boolean;
  onLog?: (line: string) => void;
}

export interface SendWeeklyEmailsResult {
  sent: number;
  skipped: number;
  dryRun: boolean;
}

export async function sendWeeklyEmails({ dryRun, onLog }: SendWeeklyEmailsOptions): Promise<SendWeeklyEmailsResult> {
  const log = onLog ?? (() => {});

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = `Kamissa <${process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"}>`;
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("Il manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.");
  }

  const effectiveDryRun = dryRun || !RESEND_API_KEY;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const past7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    { data: profiles, error: profilesError },
    { data: events, error: eventsError },
    { data: matchingTags, error: matchingTagsError },
    { data: groups, error: groupsError },
    { data: recentMessages, error: messagesError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nom, ville, disciplines, langue_preferee, created_at")
      .eq("recoit_email_hebdo", true),
    supabase
      .from("events")
      .select("id, titre, description, type, discipline, ville, date, lieu, titre_en, titre_el, description_en, description_el")
      .eq("statut", "publie")
      .gte("date", now.toISOString())
      .lt("date", in7Days.toISOString())
      .order("date", { ascending: true }),
    supabase.from("matching_tags").select("user_id, tag, created_at"),
    supabase.from("groups").select("id, ville"),
    supabase.from("group_messages").select("group_id, user_id").gte("date", past7Days.toISOString()),
  ]);

  if (profilesError) throw profilesError;
  if (eventsError) throw eventsError;
  if (matchingTagsError) throw matchingTagsError;
  if (groupsError) throw groupsError;
  if (messagesError) throw messagesError;

  const allProfiles = (profiles ?? []) as ProfileRow[];

  const tagsByUser = new Map<string, MatchingTagRow[]>();
  for (const row of (matchingTags ?? []) as MatchingTagRow[]) {
    const list = tagsByUser.get(row.user_id) ?? [];
    list.push(row);
    tagsByUser.set(row.user_id, list);
  }

  const villeByGroupId = new Map<string, string>();
  for (const g of groups ?? []) {
    villeByGroupId.set(g.id, g.ville);
  }

  // Total de messages récents par ville, et par (ville, auteur) — pour pouvoir
  // exclure les messages de la personne elle-même de son propre décompte.
  const messageCountByVille = new Map<string, number>();
  const messageCountByVilleAndUser = new Map<string, Map<string, number>>();
  for (const m of (recentMessages ?? []) as GroupMessageRow[]) {
    const ville = villeByGroupId.get(m.group_id);
    if (!ville) continue;
    messageCountByVille.set(ville, (messageCountByVille.get(ville) ?? 0) + 1);
    const byUser = messageCountByVilleAndUser.get(ville) ?? new Map<string, number>();
    byUser.set(m.user_id, (byUser.get(m.user_id) ?? 0) + 1);
    messageCountByVilleAndUser.set(ville, byUser);
  }

  const emailById = new Map<string, string>();
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    for (const user of data.users) {
      if (user.email) emailById.set(user.id, user.email);
    }
    if (data.users.length < 200) break;
    page += 1;
  }

  let sent = 0;
  let skipped = 0;

  for (const profile of (profiles ?? []) as ProfileRow[]) {
    const email = emailById.get(profile.id);
    if (!email) {
      skipped += 1;
      continue;
    }

    const relevant = (events ?? []).filter(
      (e): e is EventRow =>
        e.ville === profile.ville &&
        (profile.disciplines.length === 0 ||
          (e.discipline !== null && profile.disciplines.includes(e.discipline)))
    );

    if (relevant.length === 0) {
      skipped += 1;
      continue;
    }

    const newMatchCount = countNewMatches(profile, allProfiles, tagsByUser, past7Days);
    const totalCityMessages = messageCountByVille.get(profile.ville) ?? 0;
    const ownMessages = messageCountByVilleAndUser.get(profile.ville)?.get(profile.id) ?? 0;
    const newMessageCount = totalCityMessages - ownMessages;

    const locale = resolveLocale(profile.langue_preferee);
    const t = dictionaries[locale];
    const villeLabel = t.villeLabels[profile.ville as Ville] ?? profile.ville;
    const subject = t.weeklyEmail.subject(relevant.length, villeLabel);
    const communityLine =
      newMatchCount > 0 || newMessageCount > 0
        ? t.weeklyEmail.communityLine(newMatchCount, newMessageCount, villeLabel)
        : null;
    const html = digestHtml(profile.nom, villeLabel, relevant, locale, SITE_URL, communityLine);

    if (effectiveDryRun) {
      log(`[dry-run] ${email} (${locale}) — ${subject}${communityLine ? ` | ${communityLine}` : ""}`);
      sent += 1;
      continue;
    }

    const { error: sendError } = await resend!.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
    });

    if (sendError) {
      log(`Échec envoi à ${email}: ${sendError.message}`);
    } else {
      log(`Envoyé à ${email} — ${subject}`);
      sent += 1;
    }
  }

  log(
    `${effectiveDryRun ? "[dry-run] " : ""}${sent} email(s) ${effectiveDryRun ? "à envoyer" : "envoyés"}, ${skipped} utilisateur(s) sans événement pertinent ou sans email.`
  );

  return { sent, skipped, dryRun: effectiveDryRun };
}
