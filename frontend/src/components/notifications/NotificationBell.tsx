import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Bell,
  Check,
  ExternalLink,
  Calendar,
  MessageSquare,
  Building2,
  Star,
  Info,
} from "lucide-react";
import { mockNotificationApi } from "@/lib/api/mock/notifications";
import type { NotificationItem, NotificationType } from "@/lib/api/notifications";
import { useAuth } from "@/lib/auth";

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "visit":
      return Calendar;
    case "contact":
      return MessageSquare;
    case "property":
      return Building2;
    case "review":
      return Star;
    default:
      return Info;
  }
}

export function NotificationBell() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isBn = i18n.language === "bn";

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const items = await mockNotificationApi.getNotifications(user.id);
      setNotifications(items);
      const count = await mockNotificationApi.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleMarkAsRead = async (id: string) => {
    await mockNotificationApi.markAsRead(id);
    await loadNotifications();
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await mockNotificationApi.markAllAsRead(user.id);
    await loadNotifications();
  };

  if (!user) return null;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) {
            loadNotifications();
          }
        }}
        aria-label={t("notifications.bellLabel")}
        aria-expanded={open}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            data-testid="unread-badge"
            className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("notifications.title")}
          className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-xl border border-border bg-surface shadow-lg outline-none overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                {t("notifications.title")}
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-primary">
                  {unreadCount} {t("notifications.unread")}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring rounded"
              >
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-border/60">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                {t("notifications.empty")}
              </div>
            ) : (
              notifications.map((item) => {
                const Icon = getNotificationIcon(item.type);
                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3.5 transition-colors hover:bg-secondary/40 ${
                      !item.read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        !item.read
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {isBn ? item.titleBn : item.title}
                        </p>
                        {!item.read && (
                          <span
                            className="h-2 w-2 rounded-full bg-primary shrink-0"
                            title={t("notifications.unreadDot")}
                          />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-snug line-clamp-2">
                        {isBn ? item.messageBn : item.message}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString(isBn ? "bn-BD" : "en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          {!item.read && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsRead(item.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                              title={t("notifications.markRead")}
                            >
                              <Check className="h-3 w-3" />
                              <span className="hidden sm:inline">
                                {t("notifications.markRead")}
                              </span>
                            </button>
                          )}
                          {item.link && (
                            <Link
                              to={item.link}
                              onClick={() => {
                                handleMarkAsRead(item.id);
                                setOpen(false);
                              }}
                              className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary hover:underline"
                            >
                              <span>{t("notifications.view")}</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
