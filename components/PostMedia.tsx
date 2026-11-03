import { Play } from "lucide-react";

interface PostMediaSource {
  image: string | null;
  video?: string | null;
  legende?: string | null;
}

// Vignette d'un post dans les grilles (profil, page d'artiste, mes posts).
// Pour une vidéo, on affiche sa première image (« #t=0.1 » : Safari sur
// iPhone n'en montre aucune sans ce repère) avec une icône de lecture.
export function PostThumb({ post }: { post: PostMediaSource }) {
  if (post.video) {
    return (
      <span className="relative block h-full w-full bg-placeholder">
        <video
          src={`${post.video}#t=0.1`}
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="pointer-events-none h-full w-full object-cover"
        />
        <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground">
          <Play size={14} strokeWidth={1.75} className="ml-0.5" />
        </span>
      </span>
    );
  }
  if (post.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={post.image} alt={post.legende ?? ""} className="h-full w-full object-cover" />;
  }
  return <span className="block h-full w-full bg-placeholder" />;
}

// Photo ou vidéo en grand, sur la page du post.
export function PostMedia({ post }: { post: PostMediaSource }) {
  if (post.video) {
    return (
      <video
        src={post.video}
        controls
        playsInline
        preload="metadata"
        className="max-h-[80vh] w-full bg-foreground object-contain"
      />
    );
  }
  if (post.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={post.image} alt={post.legende ?? ""} className="max-h-[80vh] w-full object-contain object-left-top" />;
  }
  return <div className="aspect-[4/5] w-full bg-placeholder" />;
}
