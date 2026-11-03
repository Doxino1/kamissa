"use client";

import { BackLink, PageHeader } from "@/components/PageHeader";
import { useLocale } from "@/lib/i18n/context";

const BACK: Record<string, string> = { fr: "Retour", en: "Back", el: "Πίσω" };
const TITLE: Record<string, string> = {
  fr: "Politique de confidentialité",
  en: "Privacy policy",
  el: "Πολιτική απορρήτου",
};

function FR() {
  return (
    <>
      <section>
        <h2 className="font-display text-[28px] leading-tight md:text-[32px]">Responsable du traitement</h2>
        <p className="mt-2 text-text-soft">
          L&rsquo;éditeur du site (voir les Mentions légales) est responsable du traitement des données décrites
          ici.
          <br />
          Contact :{" "}
          <a href="mailto:contact@kamissa.app" className="underline hover:text-foreground">
            contact@kamissa.app
          </a>
        </p>
      </section>

      <section>
        <h2 className="font-display text-[28px] leading-tight md:text-[32px]">Données collectées et pourquoi</h2>
        <ul className="mt-2 flex flex-col gap-2 text-text-soft">
          <li>
            <strong className="text-foreground">Compte et profil</strong> — email, nom, ville, discipline(s), type
            de profil, bio, langue préférée : nécessaires pour créer ton compte et te montrer un contenu pertinent
            par ville et discipline.
          </li>
          <li>
            <strong className="text-foreground">Événements sauvegardés / « je viens »</strong> — pour afficher tes
            événements dans « Mes événements » et dans le résumé hebdomadaire.
          </li>
          <li>
            <strong className="text-foreground">Contenu que tu publies</strong> — événements ou boutiques soumis,
            posts, portfolio, messages dans le groupe communautaire et leurs réponses : affichés selon les
            réglages de visibilité que tu choisis (public/privé pour le portfolio et les posts).
          </li>
          <li>
            <strong className="text-foreground">Localisation des événements et boutiques</strong> — quand une
            adresse est renseignée à la soumission, elle est transformée en coordonnées via le service gratuit
            Nominatim/OpenStreetMap, uniquement pour l&rsquo;affichage sur la carte. Il s&rsquo;agit de
            l&rsquo;adresse du lieu, jamais de ta position personnelle : le site ne fait aucune géolocalisation de
            ses utilisateurs.
          </li>
          <li>
            <strong className="text-foreground">Réseaux sociaux (optionnel)</strong> — si tu renseignes tes
            identifiants Instagram/TikTok/Twitter, ils sont affichés sur ton profil public.
          </li>
          <li>
            <strong className="text-foreground">Signalements et blocages</strong> — si tu signales ou bloques un
            autre utilisateur, ces informations sont conservées pour la modération.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-[28px] leading-tight md:text-[32px]">Base légale</h2>
        <p className="mt-2 text-text-soft">
          Le traitement repose sur l&rsquo;exécution du service que tu utilises en créant un compte (fonctionnement
          du site, mise en relation, communauté). L&rsquo;email hebdomadaire est envoyé par défaut aux comptes
          actifs ; tu peux le désactiver à tout moment dans Réglages.
        </p>
      </section>

      <section>
        <h2 className="font-display text-[28px] leading-tight md:text-[32px]">Qui a accès à ces données</h2>
        <ul className="mt-2 flex flex-col gap-2 text-text-soft">
          <li>
            <strong className="text-foreground">Supabase</strong> — hébergement de la base de données, de
            l&rsquo;authentification et des fichiers (images).
          </li>
          <li>
            <strong className="text-foreground">Resend</strong> — envoi de l&rsquo;email hebdomadaire (reçoit ton
            adresse email et son contenu).
          </li>
          <li>
            <strong className="text-foreground">Vercel</strong> — hébergement du site (voir Mentions légales).
          </li>
          <li>
            <strong className="text-foreground">Nominatim / OpenStreetMap</strong> — géocodage des adresses
            d&rsquo;événements et de boutiques (reçoit uniquement l&rsquo;adresse saisie, pas de donnée
            personnelle).
          </li>
        </ul>
        <p className="mt-2 text-text-soft">Ces données ne sont ni vendues, ni utilisées à des fins publicitaires.</p>
      </section>

      <section>
        <h2 className="font-display text-[28px] leading-tight md:text-[32px]">Durée de conservation</h2>
        <p className="mt-2 text-text-soft">
          Tes données sont conservées tant que ton compte existe. À la suppression de ton compte, ton profil et
          tout ton contenu privé (posts, portfolio, bibliothèque, messages, tags, abonnements) sont supprimés
          définitivement. Les événements que tu as publiés restent visibles (ils ont déjà été partagés avec la
          communauté) mais ne sont plus rattachés à ton compte.
        </p>
      </section>

      <section>
        <h2 className="font-display text-[28px] leading-tight md:text-[32px]">Tes droits</h2>
        <p className="mt-2 text-text-soft">
          Conformément au RGPD, tu disposes d&rsquo;un droit d&rsquo;accès, de rectification, d&rsquo;effacement et
          de portabilité de tes données.
        </p>
        <ul className="mt-2 flex flex-col gap-1 text-text-soft">
          <li>
            <strong className="text-foreground">Rectification</strong> — modifie ton profil directement dans
            Réglages.
          </li>
          <li>
            <strong className="text-foreground">Portabilité</strong> — télécharge une copie de tes données au
            format JSON depuis Réglages → Télécharger mes données.
          </li>
          <li>
            <strong className="text-foreground">Effacement</strong> — supprime définitivement ton compte depuis
            Réglages → Supprimer mon compte.
          </li>
          <li>
            <strong className="text-foreground">Autre demande</strong> — écris à{" "}
            <a href="mailto:contact@kamissa.app" className="underline hover:text-foreground">
              contact@kamissa.app
            </a>
            .
          </li>
        </ul>
      </section>
    </>
  );
}

function EN() {
  return (
    <>
      <section>
        <h2 className="font-display text-[28px] leading-tight md:text-[32px]">Data controller</h2>
        <p className="mt-2 text-text-soft">
          The site&rsquo;s publisher (see the Legal Notice) is responsible for the processing of the data
          described here.
          <br />
          Contact:{" "}
          <a href="mailto:contact@kamissa.app" className="underline hover:text-foreground">
            contact@kamissa.app
          </a>
        </p>
      </section>

      <section>
        <h2 className="font-display text-[28px] leading-tight md:text-[32px]">Data collected and why</h2>
        <ul className="mt-2 flex flex-col gap-2 text-text-soft">
          <li>
            <strong className="text-foreground">Account and profile</strong> — email, name, city, discipline(s),
            profile type, bio, preferred language: needed to create your account and show you relevant content by
            city and discipline.
          </li>
          <li>
            <strong className="text-foreground">Saved events / &ldquo;going&rdquo;</strong> — to show your events
            in &ldquo;My events&rdquo; and in the weekly digest.
          </li>
          <li>
            <strong className="text-foreground">Content you publish</strong> — submitted events or shops, posts,
            portfolio, messages in the community group and their replies: shown according to the visibility
            settings you choose (public/private for portfolio and posts).
          </li>
          <li>
            <strong className="text-foreground">Location of events and shops</strong> — when an address is
            entered on submission, it&rsquo;s converted into coordinates via the free Nominatim/OpenStreetMap
            service, only for display on the map. This is the venue&rsquo;s address, never your personal
            location: the site never geolocates its users.
          </li>
          <li>
            <strong className="text-foreground">Social links (optional)</strong> — if you fill in your
            Instagram/TikTok/Twitter handles, they&rsquo;re shown on your public profile.
          </li>
          <li>
            <strong className="text-foreground">Reports and blocks</strong> — if you report or block another user,
            that information is kept for moderation.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-[28px] leading-tight md:text-[32px]">Legal basis</h2>
        <p className="mt-2 text-text-soft">
          Processing is based on performing the service you use by creating an account (running the site,
          matching, community). The weekly email is sent by default to active accounts; you can turn it off at
          any time in Settings.
        </p>
      </section>

      <section>
        <h2 className="font-display text-[28px] leading-tight md:text-[32px]">Who has access to this data</h2>
        <ul className="mt-2 flex flex-col gap-2 text-text-soft">
          <li>
            <strong className="text-foreground">Supabase</strong> — hosts the database, authentication, and files
            (images).
          </li>
          <li>
            <strong className="text-foreground">Resend</strong> — sends the weekly email (receives your email
            address and its content).
          </li>
          <li>
            <strong className="text-foreground">Vercel</strong> — hosts the site (see Legal Notice).
          </li>
          <li>
            <strong className="text-foreground">Nominatim / OpenStreetMap</strong> — geocodes event and shop
            addresses (only receives the address entered, no personal data).
          </li>
        </ul>
        <p className="mt-2 text-text-soft">This data is never sold or used for advertising.</p>
      </section>

      <section>
        <h2 className="font-display text-[28px] leading-tight md:text-[32px]">Retention period</h2>
        <p className="mt-2 text-text-soft">
          Your data is kept for as long as your account exists. When you delete your account, your profile and
          all your private content (posts, portfolio, library, messages, tags, follows) are permanently deleted.
          Events you&rsquo;ve published stay visible (they&rsquo;ve already been shared with the community) but
          are no longer linked to your account.
        </p>
      </section>

      <section>
        <h2 className="font-display text-[28px] leading-tight md:text-[32px]">Your rights</h2>
        <p className="mt-2 text-text-soft">
          Under the GDPR, you have the right to access, rectify, erase, and port your data.
        </p>
        <ul className="mt-2 flex flex-col gap-1 text-text-soft">
          <li>
            <strong className="text-foreground">Rectification</strong> — edit your profile directly in Settings.
          </li>
          <li>
            <strong className="text-foreground">Portability</strong> — download a copy of your data in JSON format
            from Settings → Download my data.
          </li>
          <li>
            <strong className="text-foreground">Erasure</strong> — permanently delete your account from Settings
            → Delete my account.
          </li>
          <li>
            <strong className="text-foreground">Other request</strong> — write to{" "}
            <a href="mailto:contact@kamissa.app" className="underline hover:text-foreground">
              contact@kamissa.app
            </a>
            .
          </li>
        </ul>
      </section>
    </>
  );
}

function EL() {
  return (
    <>
      <section>
        <h2 className="font-display text-[28px] leading-tight md:text-[32px]">Υπεύθυνος επεξεργασίας</h2>
        <p className="mt-2 text-text-soft">
          Ο εκδότης του ιστότοπου (δες τις Νομικές Σημειώσεις) είναι υπεύθυνος για την επεξεργασία των δεδομένων
          που περιγράφονται εδώ.
          <br />
          Επικοινωνία:{" "}
          <a href="mailto:contact@kamissa.app" className="underline hover:text-foreground">
            contact@kamissa.app
          </a>
        </p>
      </section>

      <section>
        <h2 className="font-display text-[28px] leading-tight md:text-[32px]">Δεδομένα που συλλέγονται και γιατί</h2>
        <ul className="mt-2 flex flex-col gap-2 text-text-soft">
          <li>
            <strong className="text-foreground">Λογαριασμός και προφίλ</strong> — email, όνομα, πόλη,
            ειδικότητα/ες, τύπος προφίλ, βιογραφικό, προτιμώμενη γλώσσα: απαραίτητα για τη δημιουργία του
            λογαριασμού σου και για να σου δείχνουμε σχετικό περιεχόμενο ανά πόλη και ειδικότητα.
          </li>
          <li>
            <strong className="text-foreground">Αποθηκευμένες εκδηλώσεις / «θα πάω»</strong> — για να εμφανίζονται
            οι εκδηλώσεις σου στο «Οι εκδηλώσεις μου» και στην εβδομαδιαία σύνοψη.
          </li>
          <li>
            <strong className="text-foreground">Περιεχόμενο που δημοσιεύεις</strong> — εκδηλώσεις ή καταστήματα
            που υποβάλλεις, posts, portfolio, μηνύματα στην ομάδα κοινότητας και οι απαντήσεις τους: εμφανίζονται
            ανάλογα με τις ρυθμίσεις ορατότητας που επιλέγεις (δημόσιο/ιδιωτικό για το portfolio και τα posts).
          </li>
          <li>
            <strong className="text-foreground">Τοποθεσία εκδηλώσεων και καταστημάτων</strong> — όταν καταχωρείται
            μια διεύθυνση κατά την υποβολή, μετατρέπεται σε συντεταγμένες μέσω της δωρεάν υπηρεσίας
            Nominatim/OpenStreetMap, μόνο για εμφάνιση στον χάρτη. Πρόκειται για τη διεύθυνση του χώρου, ποτέ για
            την προσωπική σου τοποθεσία: ο ιστότοπος δεν εντοπίζει ποτέ τη θέση των χρηστών του.
          </li>
          <li>
            <strong className="text-foreground">Κοινωνικά δίκτυα (προαιρετικό)</strong> — αν συμπληρώσεις τα
            στοιχεία σου στο Instagram/TikTok/Twitter, εμφανίζονται στο δημόσιο προφίλ σου.
          </li>
          <li>
            <strong className="text-foreground">Αναφορές και αποκλεισμοί</strong> — αν αναφέρεις ή αποκλείσεις
            έναν άλλο χρήστη, αυτές οι πληροφορίες διατηρούνται για τον έλεγχο περιεχομένου.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-[28px] leading-tight md:text-[32px]">Νομική βάση</h2>
        <p className="mt-2 text-text-soft">
          Η επεξεργασία βασίζεται στην εκτέλεση της υπηρεσίας που χρησιμοποιείς δημιουργώντας λογαριασμό
          (λειτουργία του ιστότοπου, αντιστοίχιση, κοινότητα). Το εβδομαδιαίο email αποστέλλεται από προεπιλογή σε
          ενεργούς λογαριασμούς· μπορείς να το απενεργοποιήσεις ανά πάσα στιγμή από τις Ρυθμίσεις.
        </p>
      </section>

      <section>
        <h2 className="font-display text-[28px] leading-tight md:text-[32px]">Ποιος έχει πρόσβαση σε αυτά τα δεδομένα</h2>
        <ul className="mt-2 flex flex-col gap-2 text-text-soft">
          <li>
            <strong className="text-foreground">Supabase</strong> — φιλοξενία της βάσης δεδομένων, της
            ταυτοποίησης χρηστών και των αρχείων (εικόνες).
          </li>
          <li>
            <strong className="text-foreground">Resend</strong> — αποστολή του εβδομαδιαίου email (λαμβάνει τη
            διεύθυνση email σου και το περιεχόμενό του).
          </li>
          <li>
            <strong className="text-foreground">Vercel</strong> — φιλοξενία του ιστότοπου (δες τις Νομικές
            Σημειώσεις).
          </li>
          <li>
            <strong className="text-foreground">Nominatim / OpenStreetMap</strong> — γεωκωδικοποίηση διευθύνσεων
            εκδηλώσεων και καταστημάτων (λαμβάνει μόνο τη διεύθυνση που καταχωρήθηκε, χωρίς προσωπικά δεδομένα).
          </li>
        </ul>
        <p className="mt-2 text-text-soft">
          Αυτά τα δεδομένα δεν πωλούνται ούτε χρησιμοποιούνται για διαφημιστικούς σκοπούς.
        </p>
      </section>

      <section>
        <h2 className="font-display text-[28px] leading-tight md:text-[32px]">Διάρκεια διατήρησης</h2>
        <p className="mt-2 text-text-soft">
          Τα δεδομένα σου διατηρούνται όσο υπάρχει ο λογαριασμός σου. Με τη διαγραφή του λογαριασμού σου, το
          προφίλ σου και όλο το ιδιωτικό σου περιεχόμενο (posts, portfolio, βιβλιοθήκη, μηνύματα, ετικέτες,
          ακολουθήσεις) διαγράφονται οριστικά. Οι εκδηλώσεις που έχεις δημοσιεύσει παραμένουν ορατές (έχουν ήδη
          μοιραστεί με την κοινότητα) αλλά δεν συνδέονται πλέον με τον λογαριασμό σου.
        </p>
      </section>

      <section>
        <h2 className="font-display text-[28px] leading-tight md:text-[32px]">Τα δικαιώματά σου</h2>
        <p className="mt-2 text-text-soft">
          Σύμφωνα με τον ΓΚΠΔ, έχεις δικαίωμα πρόσβασης, διόρθωσης, διαγραφής και φορητότητας των δεδομένων σου.
        </p>
        <ul className="mt-2 flex flex-col gap-1 text-text-soft">
          <li>
            <strong className="text-foreground">Διόρθωση</strong> — επεξεργάσου το προφίλ σου απευθείας στις
            Ρυθμίσεις.
          </li>
          <li>
            <strong className="text-foreground">Φορητότητα</strong> — κατέβασε αντίγραφο των δεδομένων σου σε
            μορφή JSON από Ρυθμίσεις → Λήψη των δεδομένων μου.
          </li>
          <li>
            <strong className="text-foreground">Διαγραφή</strong> — διάγραψε οριστικά τον λογαριασμό σου από
            Ρυθμίσεις → Διαγραφή λογαριασμού.
          </li>
          <li>
            <strong className="text-foreground">Άλλο αίτημα</strong> — γράψε στο{" "}
            <a href="mailto:contact@kamissa.app" className="underline hover:text-foreground">
              contact@kamissa.app
            </a>
            .
          </li>
        </ul>
      </section>
    </>
  );
}

export function ConfidentialiteContent() {
  const { locale } = useLocale();

  return (
    <div className="pb-16">
      <PageHeader compact title={TITLE[locale]} eyebrow={<BackLink href="/">{BACK[locale]}</BackLink>} />

      <div className="mx-auto flex max-w-[1360px] flex-col px-4 pt-4 text-[15px] leading-relaxed md:px-10 [&>section]:max-w-[760px] [&>section]:border-b [&>section]:border-border [&>section]:py-6">
        {locale === "fr" && <FR />}
        {locale === "en" && <EN />}
        {locale === "el" && <EL />}
      </div>
    </div>
  );
}
