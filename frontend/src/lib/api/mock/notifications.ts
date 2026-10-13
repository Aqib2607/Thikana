import type { NotificationItem, NotificationApi } from "../notifications";

const NOTIFICATIONS_STORAGE_KEY = "thikana_notifications_v1";

export const SEED_NOTIFICATIONS: NotificationItem[] = [
  // Tenant Notifications
  {
    id: "notif-01",
    userId: "u-tenant",
    role: "tenant",
    title: "Visit Request Confirmed",
    titleBn: "পরিদর্শন অনুরোধ নিশ্চিত করা হয়েছে",
    message: "Landlord confirmed your visit for Modern Student Flat on 2026-10-18 at 03:00 PM.",
    messageBn:
      "বাড়িওয়ালা আধুনিক ছাত্র ফ্ল্যাটের জন্য ১৮ অক্টোবর ২০২৬ বিকাল ০৩:০০ টায় আপনার পরিদর্শন অনুমোদন করেছেন।",
    type: "visit",
    read: false,
    link: "/tenant/visits",
    createdAt: "2026-10-12T10:30:00Z",
  },
  {
    id: "notif-02",
    userId: "u-tenant",
    role: "tenant",
    title: "New Message from Landlord",
    titleBn: "বাড়িওয়ালার কাছ থেকে নতুন বার্তা",
    message: "Md. Rafiqul Islam sent you a message regarding Green View Boyra Bachelor Flat.",
    messageBn:
      "মো: রফিকুল ইসলাম গ্রীন ভিউ বয়রা ব্যাচেলর ফ্ল্যাট সংক্রান্ত একটি বার্তা পাঠিয়েছেন।",
    type: "contact",
    read: false,
    link: "/tenant/messages",
    createdAt: "2026-10-11T14:15:00Z",
  },
  {
    id: "notif-03",
    userId: "u-tenant",
    role: "tenant",
    title: "Review Published",
    titleBn: "রিভিউ প্রকাশিত হয়েছে",
    message: "Your verified tenant review for Modern Student Flat is now public.",
    messageBn: "আধুনিক ছাত্র ফ্ল্যাটের জন্য আপনার পরিদর্শিত রিভিউটি এখন প্রকাশ করা হয়েছে।",
    type: "review",
    read: true,
    link: "/tenant/reviews",
    createdAt: "2026-10-09T09:00:00Z",
  },

  // Landlord Notifications
  {
    id: "notif-04",
    userId: "u-landlord",
    role: "landlord",
    title: "New Contact Request",
    titleBn: "নতুন যোগাযোগের অনুরোধ",
    message: "Tanvir Ahmed sent a phone contact request for Modern Student Flat.",
    messageBn: "তানভীর আহমেদ আধুনিক ছাত্র ফ্ল্যাটের জন্য ফোন যোগাযোগের অনুরোধ পাঠিয়েছেন।",
    type: "contact",
    read: false,
    link: "/landlord/contact-requests",
    createdAt: "2026-10-13T08:00:00Z",
  },
  {
    id: "notif-05",
    userId: "u-landlord",
    role: "landlord",
    title: "Property Approved",
    titleBn: "লিস্টিং অনুমোদিত হয়েছে",
    message: "Your property 'Modern Student Flat' has been verified and published by admin.",
    messageBn: "আপনার প্রপার্টি 'আধুনিক ছাত্র ফ্ল্যাট' অ্যাডমিন কর্তৃক যাচাই ও প্রকাশ করা হয়েছে।",
    type: "property",
    read: true,
    link: "/landlord/properties",
    createdAt: "2026-10-10T11:20:00Z",
  },

  // Admin Notifications
  {
    id: "notif-06",
    userId: "u-admin",
    role: "admin",
    title: "New Listing Pending Approval",
    titleBn: "নতুন লিস্টিং অনুমোদনের অপেক্ষায়",
    message: "A new rental property in Choto Boyra was submitted by landlord and requires review.",
    messageBn: "ছোট বয়রায় একটি নতুন ভাড়ার লিস্টিং জমা হয়েছে যা রিভিউ প্রয়োজন।",
    type: "property",
    read: false,
    link: "/admin/properties/pending",
    createdAt: "2026-10-13T09:45:00Z",
  },
  {
    id: "notif-07",
    userId: "u-admin",
    role: "admin",
    title: "Listing Report Submitted",
    titleBn: "লিস্টিং রিপোর্ট জমা হয়েছে",
    message: "A tenant reported a property for inaccurate pricing or rental terms.",
    messageBn: "একজন ভাড়াটিয়া অসঠিক ভাড়ার তথ্যের জন্য একটি লিস্টিং রিপোর্ট করেছেন।",
    type: "system",
    read: false,
    link: "/admin/reports",
    createdAt: "2026-10-12T16:20:00Z",
  },
];

function getStoredNotifications(): NotificationItem[] {
  if (typeof window === "undefined") return [...SEED_NOTIFICATIONS];
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(SEED_NOTIFICATIONS));
      return [...SEED_NOTIFICATIONS];
    }
    return JSON.parse(raw);
  } catch {
    return [...SEED_NOTIFICATIONS];
  }
}

function saveNotifications(items: NotificationItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export const mockNotificationApi: NotificationApi = {
  async getNotifications(userId: string): Promise<NotificationItem[]> {
    const items = getStoredNotifications();
    return items
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async markAsRead(id: string): Promise<void> {
    const items = getStoredNotifications();
    const updated = items.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveNotifications(updated);
  },

  async markAllAsRead(userId: string): Promise<void> {
    const items = getStoredNotifications();
    const updated = items.map((n) => (n.userId === userId ? { ...n, read: true } : n));
    saveNotifications(updated);
  },

  async getUnreadCount(userId: string): Promise<number> {
    const items = getStoredNotifications();
    return items.filter((n) => n.userId === userId && !n.read).length;
  },
};
