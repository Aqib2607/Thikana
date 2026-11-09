import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { tenantApi, type ConversationItem, type ContactRequestItem } from "@/lib/api/tenant";
import {
  Send,
  Lock,
  CheckCircle,
  Clock,
  User,
  Building,
  Info,
  MessageSquare,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/tenant/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Thikana" },
      {
        name: "description",
        content: "Internal messaging with landlords following approved contact requests.",
      },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ],
  }),
  component: TenantMessagesPage,
});

export function TenantMessagesPage() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const queryClient = useQueryClient();

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [selectedContactRequestId, setSelectedContactRequestId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Poll conversation list every 15 seconds
  const {
    data: conversations = [],
    isLoading: isLoadingConvs,
    isError: isErrorConvs,
    refetch: refetchConvs,
  } = useQuery<ConversationItem[]>({
    queryKey: ["conversations"],
    queryFn: () => tenantApi.getConversations(),
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });

  // Poll contact requests
  const { data: contactRequests = [] } = useQuery<ContactRequestItem[]>({
    queryKey: ["tenantContactRequests"],
    queryFn: () => tenantApi.getContactRequests(),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!activeConvId && !selectedContactRequestId && conversations.length > 0) {
      const first = conversations[0];
      if (first) {
        setActiveConvId(first.id);
      }
    }
  }, [activeConvId, selectedContactRequestId, conversations]);

  // Poll active conversation every 5 seconds; do NOT keep previous data across ID switch
  const {
    data: activeConv,
    isLoading: isLoadingActiveConv,
    isError: isErrorActiveConv,
    refetch: refetchActiveConv,
  } = useQuery<ConversationItem>({
    queryKey: ["conversation", activeConvId],
    queryFn: () => tenantApi.getConversation(activeConvId!),
    enabled: Boolean(activeConvId),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  const selectedCr = contactRequests.find((cr) => cr.id === selectedContactRequestId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const messageText = inputText.trim();
    setIsSending(true);
    setSendError(null);

    try {
      if (activeConvId) {
        await tenantApi.sendMessage(activeConvId, messageText);
        setInputText(""); // Only clear on success
        queryClient.invalidateQueries({ queryKey: ["conversation", activeConvId] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({ queryKey: ["tenantDashboardStats"] });
      } else if (selectedContactRequestId) {
        await tenantApi.startConversation(selectedContactRequestId, messageText);
        setInputText(""); // Only clear on success
        const updatedConvs = await queryClient.fetchQuery({
          queryKey: ["conversations"],
          queryFn: () => tenantApi.getConversations(),
        });
        queryClient.invalidateQueries({ queryKey: ["tenantDashboardStats"] });
        const matched = updatedConvs.find(
          (c) =>
            selectedCr &&
            String(c.propertyId) === String(selectedCr.propertyId) &&
            String(c.landlordId) === String(selectedCr.landlordId),
        );
        if (matched) {
          setActiveConvId(matched.id);
        } else if (updatedConvs[0]) {
          setActiveConvId(updatedConvs[0].id);
        }
        setSelectedContactRequestId(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : null;
      setSendError(
        msg ||
          (isBn
            ? "বার্তা পাঠাতে সমস্যা হয়েছে। আপনার বার্তাটি নিচে অক্ষত রয়েছে।"
            : "Failed to send message. Your draft has been preserved."),
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <RoleLayout
      requiredRole="tenant"
      title={t("tenant.messagesTitle")}
      subtitle={
        isBn
          ? "যোগাযোগের আবেদন (Contact Request) অনুমোদিত হওয়ার পর বাড়িওয়ালার সাথে সরাসরি মেসেজিং সুবিধা।"
          : "API-based secure internal messaging with landlords following approved contact requests."
      }
      activeTab="messages"
    >
      {/* Contact Policy Alert */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="font-semibold text-foreground">{t("tenant.messagingGateTitle")}</p>
          <p className="mt-0.5">{t("tenant.messagingGateDesc")}</p>
        </div>
      </div>

      {sendError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{sendError}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12 min-h-[540px]">
        {/* Left Column: Conversations and Pending Contact Requests */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("tenant.activeConversations")}
              </h2>
              {isErrorConvs && (
                <button
                  type="button"
                  onClick={() => refetchConvs()}
                  className="text-[11px] text-destructive hover:underline inline-flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" aria-hidden="true" />
                  <span>{isBn ? "পুনরায় লোড" : "Retry"}</span>
                </button>
              )}
            </div>

            {isLoadingConvs ? (
              <div className="space-y-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 rounded-xl bg-secondary/40 animate-pulse" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                {t("tenant.noActiveConversations")}
              </p>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => {
                  const isActive = conv.id === activeConvId;
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => {
                        setActiveConvId(conv.id);
                        setSelectedContactRequestId(null);
                        setSendError(null);
                      }}
                      className={`w-full rounded-xl p-3 text-left transition-colors ${
                        isActive
                          ? "border border-primary bg-primary/10 text-foreground"
                          : "border border-transparent bg-secondary/40 hover:bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground truncate">
                          {conv.landlordName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(conv.lastMessageAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-primary truncate font-medium mt-0.5">
                        {conv.propertyTitle}
                      </p>
                      <p className="text-xs truncate text-muted-foreground mt-1">
                        {conv.lastMessage}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Contact Requests Widget */}
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              {t("tenant.contactRequestStatus")}
            </h2>
            <div className="space-y-2.5">
              {contactRequests.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  {isBn ? "কোনো যোগাযোগের আবেদন নেই" : "No contact requests"}
                </p>
              ) : (
                contactRequests.map((cr) => {
                  const isAccepted = cr.status === "Accepted";
                  const isSelected = selectedContactRequestId === cr.id;
                  return (
                    <div
                      key={cr.id}
                      onClick={() => {
                        if (isAccepted) {
                          const match = conversations.find(
                            (c) =>
                              String(c.propertyId) === String(cr.propertyId) &&
                              String(c.landlordId) === String(cr.landlordId),
                          );
                          if (match) {
                            setActiveConvId(match.id);
                            setSelectedContactRequestId(null);
                          } else {
                            setSelectedContactRequestId(cr.id);
                            setActiveConvId(null);
                          }
                          setSendError(null);
                        }
                      }}
                      className={`rounded-xl border p-3 text-xs space-y-1 transition-colors ${
                        isAccepted
                          ? "cursor-pointer hover:border-primary/50 bg-secondary/30"
                          : "border-border/80 bg-secondary/20"
                      } ${isSelected ? "ring-1 ring-primary border-primary" : "border-border/80"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground truncate">
                          {cr.landlordName}
                        </span>
                        {isAccepted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="h-3 w-3" aria-hidden="true" />
                            <span>{t("tenant.statusAccepted")}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            <span>{t("tenant.statusPending")}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{cr.propertyTitle}</p>
                      {isAccepted &&
                        !conversations.some(
                          (c) =>
                            String(c.propertyId) === String(cr.propertyId) &&
                            String(c.landlordId) === String(cr.landlordId),
                        ) && (
                          <p className="text-[10px] text-primary font-medium pt-1">
                            {isBn ? "মেসেজ পাঠাতে ক্লিক করুন" : "Click to start conversation"}
                          </p>
                        )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Chat Window */}
        <div className="lg:col-span-8 flex flex-col rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
          {activeConvId && isLoadingActiveConv && !activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-secondary/60" />
              <div className="h-4 w-40 rounded bg-secondary/60" />
            </div>
          ) : activeConvId && isErrorActiveConv ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-3">
              <AlertCircle className="h-10 w-10 text-destructive/60" aria-hidden="true" />
              <p className="text-xs font-semibold text-destructive">
                {isBn ? "কথোপকথন লোড করতে ব্যর্থ হয়েছে।" : "Failed to load conversation."}
              </p>
              <button
                type="button"
                onClick={() => refetchActiveConv()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isBn ? "পুনরায় চেষ্টা" : "Retry"}</span>
              </button>
            </div>
          ) : activeConv ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-border bg-secondary/30 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span>{activeConv.landlordName}</span>
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {t("tenant.landlordRole")}
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Building className="h-3 w-3 text-primary shrink-0" aria-hidden="true" />
                    <span>{activeConv.propertyTitle}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                  <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t("tenant.messagingUnlocked")}</span>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[420px]">
                {activeConv.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground text-xs">
                    <p>{isBn ? "এখনো কোনো বার্তা আদান-প্রদান হয়নি।" : "No messages exchanged yet."}</p>
                  </div>
                ) : (
                  activeConv.messages.map((m) => {
                    const isMe = m.senderRole === "tenant";
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                          <span className="font-semibold">{m.senderName}</span>
                          <span>•</span>
                          <span>
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div
                          className={`max-w-md rounded-2xl px-4 py-2.5 text-xs ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-xs"
                              : "bg-secondary text-foreground rounded-bl-xs"
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className="border-t border-border p-4 bg-surface flex items-center gap-3"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isBn
                      ? "আপনার বার্তা লিখুন (বাসা বা পরিদর্শনের বিষয়ে)..."
                      : "Type your message regarding the property..."
                  }
                  className="flex-1 rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={isSending || !inputText.trim()}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t("tenant.send")}</span>
                </button>
              </form>
            </>
          ) : selectedCr ? (
            <>
              {/* Start New Conversation Header */}
              <div className="border-b border-border bg-secondary/30 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span>{selectedCr.landlordName}</span>
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {t("tenant.landlordRole")}
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Building className="h-3 w-3 text-primary shrink-0" aria-hidden="true" />
                    <span>{selectedCr.propertyTitle}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                  <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{isBn ? "অনুরোধ গৃহীত" : "Request Accepted"}</span>
                </div>
              </div>

              {/* Prompt to start conversation */}
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <MessageSquare className="h-12 w-12 text-primary/60 mb-3" aria-hidden="true" />
                <h3 className="text-base font-bold text-foreground">
                  {isBn ? "নতুন কথোপকথন শুরু করুন" : "Start Conversation"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  {isBn
                    ? "আপনার যোগাযোগের আবেদন অনুমোদিত হয়েছে। বাড়িওয়ালাকে আপনার প্রথম মেসেজ পাঠান।"
                    : "Your contact request has been accepted. Send your first message to begin direct messaging with the landlord."}
                </p>
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className="border-t border-border p-4 bg-surface flex items-center gap-3"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isBn
                      ? "আপনার প্রথম বার্তা লিখুন..."
                      : "Type your first message to the landlord..."
                  }
                  className="flex-1 rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={isSending || !inputText.trim()}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t("tenant.send")}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <Lock className="h-12 w-12 text-muted-foreground/40 mb-3" aria-hidden="true" />
              <h3 className="text-base font-bold text-foreground">
                {t("tenant.noChatSelected")}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {t("tenant.selectChatPrompt")}
              </p>
            </div>
          )}
        </div>
      </div>
    </RoleLayout>
  );
}
