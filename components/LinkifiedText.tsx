// Texte saisi par les utilisateurs (descriptions d'événements) : les URL y
// deviennent des liens, sans jamais interpréter de HTML. La ponctuation finale
// (« … voir https://site.fr. ») reste hors du lien.
const URL_PATTERN = /(https?:\/\/[^\s<>"]+)/g;
const TRAILING_PUNCTUATION = /[.,;:!?)\]»”'"]+$/;

export function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(URL_PATTERN);

  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return part;
        const trailing = part.match(TRAILING_PUNCTUATION)?.[0] ?? "";
        const url = trailing ? part.slice(0, -trailing.length) : part;
        return (
          <span key={i}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all underline decoration-1 underline-offset-4 hover:text-foreground-muted"
            >
              {url}
            </a>
            {trailing}
          </span>
        );
      })}
    </>
  );
}
