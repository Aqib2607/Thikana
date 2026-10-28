import { useState, useEffect, useCallback, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import { mockLandlordApi } from "@/lib/api/mock/landlord";
import { toBnNumber } from "@/lib/i18n";
import type { ConversationItem } from "@/lib/api/tenant";
import {
  MessageSquare,
  Send,
  User,
  Building2,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/landlord/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Landlord Portal — Thikana" },
      {
        name: "description",
        content: "Communicate directly with approved prospective tenants regarding your listings.",
      },
    ],
  }),
  component: LandlordMessagesPage,
});

function LandlordMessagesPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const data = await mockLandlordApi.getConversations(user.id);
      setConversations(data);
      const first = data[0];
      if (first && !activeConvId) {
        setActiveConvId(first.id);
      }
    } finally {
      setLoading(false);
    }
  }, [user, activeConvId]);

  useEffect(() => {
    loadConversations();
    const handleUpdated = () => loadConversations();
    window.addEventListener("thikana.conversations.updated", handleUpdated);
    return () => window.removeEventListener("thikana.conversations.updated", handleUpdated);
  }, [loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeConvId]);

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConvId || !user) return;

    setSending(true);
    try {
      await mockLandlordApi.sendMessage(activeConvId, user.id, user.name, replyText.trim());
      setReplyText("");
      await loadConversations();
    } finally {
      setSending(false);
    }
  };

  return (
    <RoleLayout
      requiredRole="landlord"
      title={t("landlord.messagesTitle")}
      subtitle={t("landlord.messagesSubtitle")}
      activeTab="messages"
    >
      {loading ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">
            {t("landlord.loadingMessages")}
          </p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-40" />
          <h3 className="mt-4 text-base font-bold text-foreground">
            {t("landlord.noConversationsTitle")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            {t("landlord.noConversationsDesc")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 rounded-2xl border border-border bg-surface shadow-sm overflow-hidden min-h-[560px]">
          {/* Left: Conversation list */}
          <div className="border-b md:border-b-0 md:border-r border-border p-4 space-y-2 overflow-y-auto max-h-[600px]">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("landlord.conversationsHeader")}
              </span>
              <span className="text-xs rounded-full bg-secondary px-2 py-0.5 font-semibold text-foreground">
                {toBnNumber(conversations.length, i18n.language)}
              </span>
            </div>

            {conversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full text-left rounded-xl p-3.5 transition-all flex flex-col gap-1 ${
                    isActive
                      ? "bg-primary/10 border border-primary/30 text-foreground"
                      : "hover:bg-muted/50 border border-transparent text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm flex items-center gap-1.5 truncate">
                      <User className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      {conv.tenantName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <Building2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span className="truncate">{conv.propertyTitle}</span>
                  </p>

                  <p className="text-xs text-foreground/80 line-clamp-1 italic mt-0.5">
                    "{conv.lastMessage}"
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right: Message Thread */}
          <div className="md:col-span-2 flex flex-col justify-between p-4 sm:p-6 bg-background/50">
            {activeConversation ? (
              <>
                {/* Thread Header */}
                <div className="border-b border-border pb-4 mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                      <span>{activeConversation.tenantName}</span>
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {t("landlord.tenantRoleBadge")}
                      </span>
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Building2 className="h-3 w-3" aria-hidden="true" />
                      <span>{activeConversation.propertyTitle}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t("landlord.verifiedChatBadge")}</span>
                  </div>
                </div>

                {/* Message Bubble Feed */}
                <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[380px] pr-2 mb-4">
                  {activeConversation.messages.map((msg) => {
                    const isLandlord = msg.senderRole === "landlord";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isLandlord ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl p-3.5 text-sm shadow-sm ${
                            isLandlord
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-surface border border-border text-foreground rounded-bl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1 px-1">
                          {isLandlord
                            ? t("landlord.youLandlord")
                            : msg.senderName}{" "}
                          •{" "}
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2 pt-3 border-t border-border"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={t("landlord.replyPlaceholder")}
                    className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || sending}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:opacity-95 disabled:opacity-50 transition-all"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span>{t("landlord.sendBtn")}</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <MessageSquare className="h-10 w-10 opacity-40 mb-2" />
                <p className="text-sm">
                  {t("landlord.selectConversation")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </RoleLayout>
  );
}
