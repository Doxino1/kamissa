"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/i18n/context";

const BACK: Record<string, string> = { fr: "Retour", en: "Back", el: "Πίσω" };
const TITLE: Record<string, string> = {
  fr: "Mentions légales",
  en: "Legal notice",
  el: "Νομική σημείωση",
};

function FR() {
  return (
    <>
      <section>
        <h2 className="font-medium">Éditeur du site</h2>
        <p className="mt-2 text-foreground-muted">
          Le site Kamissa est édité à titre non professionnel, personnel et bénévole, par une
          personne physique désignée par le pseudonyme <strong className="text-foreground">Doxino</strong>.
        </p>
        <p className="mt-2 text-foreground-muted">
          Conformément à l&rsquo;article 6-III-2° de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans
          l&rsquo;économie numérique (LCEN), l&rsquo;éditeur d&rsquo;un site à titre non professionnel peut
          conserver l&rsquo;anonymat vis-à-vis du public, à condition d&rsquo;avoir communiqué ses éléments
          d&rsquo;identification à son hébergeur. Ces éléments peuvent être communiqués à toute autorité
          judiciaire qui en ferait la demande.
        </p>
        <p className="mt-2 text-foreground-muted">
          Contact éditeur :{" "}
          <a href="mailto:dotian.diarra@aliecom.com" className="underline hover:text-foreground">
            dotian.diarra@aliecom.com
          </a>
        </p>
      </section>

      <section>
        <h2 className="font-medium">Hébergement</h2>
        <p className="mt-2 text-foreground-muted">
          Le site est hébergé par :
          <br />
          Vercel Inc.
          <br />
          440 N Barranca Ave #4133
          <br />
          Covina, CA 91723 — États-Unis
          <br />
          <a href="https://vercel.com" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
            vercel.com
          </a>
        </p>
        <p className="mt-2 text-foreground-muted">
          La base de données, l&rsquo;authentification et le stockage des fichiers sont gérés par Supabase. Voir
          la Politique de confidentialité pour le détail des sous-traitants et des données traitées.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Propriété intellectuelle</h2>
        <p className="mt-2 text-foreground-muted">
          La structure, le design et les textes propres au site sont la propriété de l&rsquo;éditeur, sauf
          mention contraire. Le contenu publié par les utilisateurs (événements, boutiques, posts, portfolio,
          messages) reste la propriété de leurs auteurs respectifs, qui en conservent l&rsquo;entière
          responsabilité — voir les Conditions générales d&rsquo;utilisation.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Responsabilité</h2>
        <p className="mt-2 text-foreground-muted">
          L&rsquo;éditeur s&rsquo;efforce d&rsquo;assurer l&rsquo;exactitude des informations diffusées sur le
          site, sans garantie. Le site repose en partie sur du contenu soumis par ses utilisateurs (événements,
          annonces, boutiques, messages) ; ce contenu fait l&rsquo;objet d&rsquo;une modération mais ne peut être
          vérifié de façon exhaustive avant publication. Voir les Conditions générales d&rsquo;utilisation pour le
          détail du fonctionnement de la modération et du signalement.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Droit applicable</h2>
        <p className="mt-2 text-foreground-muted">Les présentes mentions légales sont soumises au droit français.</p>
      </section>
    </>
  );
}

function EN() {
  return (
    <>
      <section>
        <h2 className="font-medium">Site publisher</h2>
        <p className="mt-2 text-foreground-muted">
          The site Kamissa is published on a non-professional, personal, voluntary
          basis by an individual identified by the pseudonym <strong className="text-foreground">Doxino</strong>.
        </p>
        <p className="mt-2 text-foreground-muted">
          Under Article 6-III-2° of French law no. 2004-575 of 21 June 2004 for confidence in the digital economy
          (LCEN), the publisher of a non-professional site may remain anonymous to the public, provided they have
          given their identifying details to their host. These details may be disclosed to any judicial authority
          that requests them.
        </p>
        <p className="mt-2 text-foreground-muted">
          Publisher contact:{" "}
          <a href="mailto:dotian.diarra@aliecom.com" className="underline hover:text-foreground">
            dotian.diarra@aliecom.com
          </a>
        </p>
      </section>

      <section>
        <h2 className="font-medium">Hosting</h2>
        <p className="mt-2 text-foreground-muted">
          The site is hosted by:
          <br />
          Vercel Inc.
          <br />
          440 N Barranca Ave #4133
          <br />
          Covina, CA 91723 — United States
          <br />
          <a href="https://vercel.com" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
            vercel.com
          </a>
        </p>
        <p className="mt-2 text-foreground-muted">
          The database, authentication, and file storage are managed by Supabase. See the Privacy Policy for
          details on subprocessors and the data handled.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Intellectual property</h2>
        <p className="mt-2 text-foreground-muted">
          The site&rsquo;s structure, design, and original text are the property of the publisher, unless stated
          otherwise. Content published by users (events, shops, posts, portfolio, messages) remains the property
          of its respective authors, who retain full responsibility for it — see the Terms of Use.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Liability</h2>
        <p className="mt-2 text-foreground-muted">
          The publisher strives to ensure the accuracy of the information published on the site, without
          guarantee. The site partly relies on content submitted by its users (events, listings, shops, messages);
          this content is moderated but cannot be exhaustively checked before publication. See the Terms of Use
          for details on how moderation and reporting work.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Applicable law</h2>
        <p className="mt-2 text-foreground-muted">This legal notice is governed by French law.</p>
      </section>
    </>
  );
}

function EL() {
  return (
    <>
      <section>
        <h2 className="font-medium">Εκδότης του ιστότοπου</h2>
        <p className="mt-2 text-foreground-muted">
          Ο ιστότοπος Kamissa εκδίδεται σε μη επαγγελματική, προσωπική και εθελοντική βάση από
          φυσικό πρόσωπο που αναφέρεται με το ψευδώνυμο <strong className="text-foreground">Doxino</strong>.
        </p>
        <p className="mt-2 text-foreground-muted">
          Σύμφωνα με το άρθρο 6-III-2° του γαλλικού νόμου αρ. 2004-575 της 21ης Ιουνίου 2004 για την εμπιστοσύνη
          στην ψηφιακή οικονομία (LCEN), ο εκδότης ενός ιστότοπου σε μη επαγγελματική βάση μπορεί να παραμείνει
          ανώνυμος έναντι του κοινού, υπό την προϋπόθεση ότι έχει κοινοποιήσει τα στοιχεία ταυτοποίησής του στον
          πάροχο φιλοξενίας. Αυτά τα στοιχεία μπορούν να κοινοποιηθούν σε κάθε δικαστική αρχή που τα ζητήσει.
        </p>
        <p className="mt-2 text-foreground-muted">
          Επικοινωνία εκδότη:{" "}
          <a href="mailto:dotian.diarra@aliecom.com" className="underline hover:text-foreground">
            dotian.diarra@aliecom.com
          </a>
        </p>
      </section>

      <section>
        <h2 className="font-medium">Φιλοξενία</h2>
        <p className="mt-2 text-foreground-muted">
          Ο ιστότοπος φιλοξενείται από:
          <br />
          Vercel Inc.
          <br />
          440 N Barranca Ave #4133
          <br />
          Covina, CA 91723 — Ηνωμένες Πολιτείες
          <br />
          <a href="https://vercel.com" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
            vercel.com
          </a>
        </p>
        <p className="mt-2 text-foreground-muted">
          Η βάση δεδομένων, η ταυτοποίηση χρηστών και η αποθήκευση αρχείων διαχειρίζονται από τη Supabase. Δες
          την Πολιτική Απορρήτου για λεπτομέρειες σχετικά με τους υπεργολάβους και τα δεδομένα που επεξεργάζονται.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Πνευματική ιδιοκτησία</h2>
        <p className="mt-2 text-foreground-muted">
          Η δομή, ο σχεδιασμός και τα πρωτότυπα κείμενα του ιστότοπου ανήκουν στον εκδότη, εκτός αν αναφέρεται
          διαφορετικά. Το περιεχόμενο που δημοσιεύουν οι χρήστες (εκδηλώσεις, καταστήματα, posts, portfolio,
          μηνύματα) παραμένει ιδιοκτησία των αντίστοιχων δημιουργών του, οι οποίοι διατηρούν την πλήρη ευθύνη —
          δες τους Όρους Χρήσης.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Ευθύνη</h2>
        <p className="mt-2 text-foreground-muted">
          Ο εκδότης καταβάλλει προσπάθεια για την ακρίβεια των πληροφοριών που δημοσιεύονται στον ιστότοπο, χωρίς
          εγγύηση. Ο ιστότοπος βασίζεται εν μέρει σε περιεχόμενο που υποβάλλουν οι χρήστες του (εκδηλώσεις,
          αγγελίες, καταστήματα, μηνύματα)· αυτό το περιεχόμενο υπόκειται σε έλεγχο αλλά δεν μπορεί να
          επαληθευτεί εξαντλητικά πριν από τη δημοσίευση. Δες τους Όρους Χρήσης για λεπτομέρειες σχετικά με τη
          λειτουργία του ελέγχου και της αναφοράς.
        </p>
      </section>

      <section>
        <h2 className="font-medium">Εφαρμοστέο δίκαιο</h2>
        <p className="mt-2 text-foreground-muted">Η παρούσα νομική σημείωση διέπεται από το γαλλικό δίκαιο.</p>
      </section>
    </>
  );
}

export function MentionsLegalesContent() {
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
