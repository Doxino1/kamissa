import { createClient } from "@/lib/supabase/client";
import { NotificationType } from "@/lib/use-notifications";

const PREF_COLUMN: Record<NotificationType, "notif_followers" | "notif_matching" | "notif_comments"> = {
  follower: "notif_followers",
  match: "notif_matching",
  comment: "notif_comments",
};

// Envoie une notification en respectant la préférence du destinataire pour
// cette catégorie — un envoi silencieusement ignoré si désactivé.
export async function sendNotification(params: {
  userId: string;
  actorId: string;
  type: NotificationType;
  postId?: string;
}) {
  if (params.userId === params.actorId) return;

  const supabase = createClient();
  const prefColumn = PREF_COLUMN[params.type];
  const { data } = await supabase.from("profiles").select(prefColumn).eq("id", params.userId).single();
  if (data && (data as Record<string, boolean>)[prefColumn] === false) return;

  await supabase.from("notifications").insert({
    user_id: params.userId,
    actor_id: params.actorId,
    type: params.type,
    post_id: params.postId ?? null,
  });
}
