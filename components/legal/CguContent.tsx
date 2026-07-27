"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/i18n/context";

const BACK: Record<string, string> = { fr: "Retour", en: "Back", el: "Πίσω" };
const TITLE: Record<string, string> = {
  fr: "Conditions générales d'utilisation",
  en: "Terms of use",
  el: "Όροι χρήσης",
};

function FR() {
  return (
    <>
      <section>
        <h2 className="font-medium">Objet</h2>
        <p className="mt-2 text-foreground-muted">
          Kamissa est un service gratuit qui centralise la découverte d&rsquo;événements
          artistiques, la mise en relation entre artistes et une communauté locale, à Paris et à Athènes.
          L&rsquo;utilisation du site implique l&rsquo;acceptation pleine et entière des présentes conditions.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Compte</h2>
        <p className="mt-2 text-foreground-muted">
          La création d&rsquo;un compte est gratuite et nécessite une adresse email valide. Tu es responsable de
          la confidentialité de tes identifiants et de l&rsquo;activité effectuée depuis ton compte.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Contenu publié par les utilisateurs</h2>
        <p className="mt-2 text-foreground-muted">
          Tu restes seul·e responsable du contenu que tu publies (événements, boutiques, posts, portfolio,
          messages, commentaires). Ce contenu doit rester pertinent pour la communauté (art, événements, matériel,
          échanges entre artistes) et respecter la loi ainsi que les droits d&rsquo;autrui.
        </p>
        <p className="mt-2 text-foreground-muted">Sont notamment interdits :</p>
        <ul className="mt-2 list-disc pl-5 text-foreground-muted">
          <li>le spam, la publicité non sollicitée et le contenu hors sujet ;</li>
          <li>le harcèlement, les propos discriminatoires ou l&rsquo;usurpation d&rsquo;identité ;</li>
          <li>le contenu illégal ou portant atteinte aux droits d&rsquo;un tiers.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-medium">Modération</h2>
        <p className="mt-2 text-foreground-muted">
          Les événements et boutiques soumis passent par une validation avant publication (automatique pour les
          contributeurs de confiance, manuelle sinon). Tout contenu — y compris les posts et messages — peut être
          signalé par la communauté et retiré par un modérateur en cas de non-respect de ces conditions.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Annonces et transactions entre utilisateurs</h2>
        <p className="mt-2 text-foreground-muted">
          Le type d&rsquo;événement « Annonce » (œuvre, matériel ou atelier à partager) permet de mettre en
          relation des utilisateurs, mais le site n&rsquo;intervient à aucun moment dans la transaction : aucun
          paiement n&rsquo;est géré, facilité ou garanti par la plateforme. Tout échange (vente, don, partage
          d&rsquo;atelier) se fait directement entre les personnes concernées, sous leur seule responsabilité.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Suspension et suppression de compte</h2>
        <p className="mt-2 text-foreground-muted">
          En cas de non-respect manifeste de ces conditions, un compte peut être suspendu ou supprimé. Tu peux à
          tout moment supprimer ton propre compte depuis Réglages.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Évolution du service</h2>
        <p className="mt-2 text-foreground-muted">
          Le site est un projet personnel et évolutif ; ses fonctionnalités peuvent changer. Ces conditions
          peuvent être mises à jour, la version en vigueur est toujours celle publiée sur cette page.
        </p>
      </section>
    </>
  );
}

function EN() {
  return (
    <>
      <section>
        <h2 className="font-medium">Purpose</h2>
        <p className="mt-2 text-foreground-muted">
          Kamissa is a free service that centralizes the discovery of art events,
          connects artists with each other, and hosts a local community, in Paris and Athens. Using the site
          means fully accepting these terms.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Account</h2>
        <p className="mt-2 text-foreground-muted">
          Creating an account is free and requires a valid email address. You are responsible for keeping your
          credentials confidential and for the activity carried out from your account.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Content published by users</h2>
        <p className="mt-2 text-foreground-muted">
          You remain solely responsible for the content you publish (events, shops, posts, portfolio, messages,
          comments). This content must stay relevant to the community (art, events, supplies, exchanges between
          artists) and comply with the law and the rights of others.
        </p>
        <p className="mt-2 text-foreground-muted">In particular, the following are prohibited:</p>
        <ul className="mt-2 list-disc pl-5 text-foreground-muted">
          <li>spam, unsolicited advertising, and off-topic content;</li>
          <li>harassment, discriminatory remarks, or impersonation;</li>
          <li>illegal content or content infringing on a third party&rsquo;s rights.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-medium">Moderation</h2>
        <p className="mt-2 text-foreground-muted">
          Submitted events and shops go through validation before publication (automatic for trusted
          contributors, manual otherwise). Any content — including posts and messages — can be reported by the
          community and removed by a moderator if it doesn&rsquo;t comply with these terms.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Listings and transactions between users</h2>
        <p className="mt-2 text-foreground-muted">
          The &ldquo;Listing&rdquo; event type (artwork, supplies, or a workshop spot to share) lets users connect
          with each other, but the site never takes part in the transaction: no payment is handled, facilitated,
          or guaranteed by the platform. Any exchange (sale, gift, sharing a workshop spot) happens directly
          between the people involved, at their own sole responsibility.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Suspension and account deletion</h2>
        <p className="mt-2 text-foreground-muted">
          In case of a clear breach of these terms, an account may be suspended or deleted. You can delete your
          own account at any time from Settings.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Changes to the service</h2>
        <p className="mt-2 text-foreground-muted">
          The site is a personal, evolving project; its features may change. These terms may be updated — the
          version in force is always the one published on this page.
        </p>
      </section>
    </>
  );
}

function EL() {
  return (
    <>
      <section>
        <h2 className="font-medium">Αντικείμενο</h2>
        <p className="mt-2 text-foreground-muted">
          Το Kamissa είναι μια δωρεάν υπηρεσία που συγκεντρώνει την ανακάλυψη καλλιτεχνικών
          εκδηλώσεων, τη σύνδεση μεταξύ καλλιτεχνών και μια τοπική κοινότητα, στο Παρίσι και την Αθήνα. Η χρήση
          του ιστότοπου συνεπάγεται την πλήρη αποδοχή των παρόντων όρων.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Λογαριασμός</h2>
        <p className="mt-2 text-foreground-muted">
          Η δημιουργία λογαριασμού είναι δωρεάν και απαιτεί έγκυρη διεύθυνση email. Είσαι υπεύθυνος/η για την
          εμπιστευτικότητα των στοιχείων σύνδεσής σου και για τη δραστηριότητα που πραγματοποιείται από τον
          λογαριασμό σου.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Περιεχόμενο που δημοσιεύουν οι χρήστες</h2>
        <p className="mt-2 text-foreground-muted">
          Παραμένεις αποκλειστικά υπεύθυνος/η για το περιεχόμενο που δημοσιεύεις (εκδηλώσεις, καταστήματα, posts,
          portfolio, μηνύματα, σχόλια). Αυτό το περιεχόμενο πρέπει να παραμένει σχετικό με την κοινότητα (τέχνη,
          εκδηλώσεις, υλικά, ανταλλαγές μεταξύ καλλιτεχνών) και να σέβεται τον νόμο καθώς και τα δικαιώματα
          τρίτων.
        </p>
        <p className="mt-2 text-foreground-muted">Απαγορεύονται ιδίως:</p>
        <ul className="mt-2 list-disc pl-5 text-foreground-muted">
          <li>το spam, η ανεπιθύμητη διαφήμιση και το εκτός θέματος περιεχόμενο·</li>
          <li>η παρενόχληση, τα διακριτικά σχόλια ή η υποδυόμενη ταυτότητα·</li>
          <li>το παράνομο περιεχόμενο ή αυτό που προσβάλλει τα δικαιώματα τρίτων.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-medium">Έλεγχος περιεχομένου</h2>
        <p className="mt-2 text-foreground-muted">
          Οι εκδηλώσεις και τα καταστήματα που υποβάλλονται περνούν από έγκριση πριν τη δημοσίευση (αυτόματη για
          τους έμπιστους συνεισφέροντες, χειροκίνητη σε άλλη περίπτωση). Κάθε περιεχόμενο — συμπεριλαμβανομένων
          των posts και μηνυμάτων — μπορεί να αναφερθεί από την κοινότητα και να αφαιρεθεί από κάποιον
          συντονιστή σε περίπτωση μη τήρησης αυτών των όρων.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Αγγελίες και συναλλαγές μεταξύ χρηστών</h2>
        <p className="mt-2 text-foreground-muted">
          Ο τύπος εκδήλωσης «Αγγελία» (έργο, υλικό ή θέση σε εργαστήριο προς διαμοιρασμό) επιτρέπει τη σύνδεση
          χρηστών μεταξύ τους, αλλά ο ιστότοπος δεν εμπλέκεται σε καμία στιγμή στη συναλλαγή: καμία πληρωμή δεν
          διαχειρίζεται, διευκολύνεται ή εγγυάται από την πλατφόρμα. Κάθε ανταλλαγή (πώληση, δωρεά, διαμοιρασμός
          θέσης εργαστηρίου) πραγματοποιείται απευθείας μεταξύ των εμπλεκόμενων προσώπων, με αποκλειστική δική
          τους ευθύνη.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Αναστολή και διαγραφή λογαριασμού</h2>
        <p className="mt-2 text-foreground-muted">
          Σε περίπτωση εμφανούς μη τήρησης αυτών των όρων, ένας λογαριασμός μπορεί να ανασταλεί ή να διαγραφεί.
          Μπορείς ανά πάσα στιγμή να διαγράψεις τον δικό σου λογαριασμό από τις Ρυθμίσεις.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Εξέλιξη της υπηρεσίας</h2>
        <p className="mt-2 text-foreground-muted">
          Ο ιστότοπος είναι ένα προσωπικό και εξελισσόμενο έργο· οι λειτουργίες του μπορεί να αλλάξουν. Αυτοί οι
          όροι μπορεί να ενημερώνονται· η ισχύουσα έκδοση είναι πάντα αυτή που δημοσιεύεται σε αυτή τη σελίδα.
        </p>
      </section>
    </>
  );
}

export function CguContent() {
  const { locale } = useLocale();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link href="/" className="flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground">
        <ArrowLeft size={14} strokeWidth={1.75} />
        {BACK[locale]}
      </Link>

      <h1 className="font-display mt-4 text-xl font-semibold">{TITLE[locale]}</h1>

      <div className="mt-6 flex flex-col gap-6 text-sm leading-relaxed">
        {locale === "fr" && <FR />}
        {locale === "en" && <EN />}
        {locale === "el" && <EL />}
      </div>
    </div>
  );
}
