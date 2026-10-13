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
  getNotifications(userId: string): Promise<NotificationItem[]>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
}
