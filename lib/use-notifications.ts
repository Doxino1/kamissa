"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type NotificationType = "follower" | "match" | "comment";

export interface AppNotification {
  id: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  actorNom: string | null;
  actorId: string | null;
  postId: string | null;
}

const NOTIFICATION_SELECT = "id, type, read, created_at, actor_id, post_id, profiles!notifications_actor_id_fkey(nom)";

interface NotificationRow {
  id: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
  actor_id: string | null;
  post_id: string | null;
  profiles: { nom: string } | null;
}

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  async function load() {
    if (!userId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select(NOTIFICATION_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    setNotifications(
      ((data ?? []) as unknown as NotificationRow[]).map((row) => ({
        id: row.id,
        type: row.type,
        read: row.read,
        createdAt: row.created_at,
        actorId: row.actor_id,
        actorNom: row.profiles?.nom ?? null,
        postId: row.post_id,
      }))
    );
  }

  useEffect(() => {
    let active = true;

    async function fetchNotifications() {
      if (!userId) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("notifications")
        .select(NOTIFICATION_SELECT)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!active) return;
      setNotifications(
        ((data ?? []) as unknown as NotificationRow[]).map((row) => ({
          id: row.id,
          type: row.type,
          read: row.read,
          createdAt: row.created_at,
          actorId: row.actor_id,
          actorNom: row.profiles?.nom ?? null,
          postId: row.post_id,
        }))
      );
    }

    fetchNotifications();
    return () => {
      active = false;
    };
  }, [userId]);

  async function markAllRead() {
    if (!userId || notifications.every((n) => n.read)) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, markAllRead, reload: load };
}
