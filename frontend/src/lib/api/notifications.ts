import { http } from "./http";
import { USE_MOCK } from "./client";
import { mockNotificationApi } from "./mock/notifications";

export type NotificationType = "visit" | "contact" | "property" | "review" | "system";

export interface NotificationItem {
  id: string;
  userId: string;
  role?: "tenant" | "landlord" | "admin";
  title: string;
  titleBn: string;
  message: string;
  messageBn: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface NotificationApi {
  getNotifications(userId?: string): Promise<NotificationItem[]>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(userId?: string): Promise<void>;
  getUnreadCount(userId?: string): Promise<number>;
}

export const realNotificationApi: NotificationApi = {
  async getNotifications(_userId?: string): Promise<NotificationItem[]> {
    const res = await http.get<{
      data: Array<{
        id: number | string;
        userId?: number | string;
        user_id?: number | string;
        role?: "tenant" | "landlord" | "admin" | null;
        type: string;
        title: string;
        titleBn?: string | null;
        title_bn?: string | null;
        message: string;
        messageBn?: string | null;
        message_bn?: string | null;
        link?: string | null;
        read?: boolean;
        read_at?: string | null;
        createdAt?: string | null;
        created_at?: string | null;
      }>;
    }>("/notifications");

    return (res.data || []).map((n) => {
      let type: NotificationType = "system";
      if (n.type === "visit") type = "visit";
      else if (n.type === "contact" || n.type === "message") type = "contact";
      else if (n.type === "property") type = "property";
      else if (n.type === "review") type = "review";

      const rawUserId = n.userId ?? n.user_id;
      const rawDate = n.createdAt ?? n.created_at;
      const validDate = rawDate && !isNaN(Date.parse(rawDate)) ? rawDate : "";

      return {
        id: String(n.id),
        userId: rawUserId !== undefined && rawUserId !== null ? String(rawUserId) : "",
        role: n.role ?? undefined,
        title: n.title,
        titleBn: n.titleBn || n.title_bn || n.title,
        message: n.message,
        messageBn: n.messageBn || n.message_bn || n.message,
        type,
        read: Boolean(n.read ?? n.read_at),
        link: n.link || undefined,
        createdAt: validDate,
      };
    });
  },

  async markAsRead(id: string): Promise<void> {
    await http.patch(`/notifications/${encodeURIComponent(id)}/read`);
  },

  async markAllAsRead(_userId?: string): Promise<void> {
    await http.post("/notifications/mark-all-read");
  },

  async getUnreadCount(_userId?: string): Promise<number> {
    const res = await http.get<{ count?: number; unread_count?: number }>(
      "/notifications/unread-count",
    );
    if (typeof res?.count === "number" && Number.isFinite(res.count)) {
      return res.count;
    }
    if (typeof res?.unread_count === "number" && Number.isFinite(res.unread_count)) {
      return res.unread_count;
    }
    return 0;
  },
};

export const notificationApi: NotificationApi = USE_MOCK
  ? mockNotificationApi
  : realNotificationApi;
