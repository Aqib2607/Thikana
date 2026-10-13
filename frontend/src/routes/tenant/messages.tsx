import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { mockTenantApi } from "@/lib/api/mock";
import type { ConversationItem, ContactRequestItem } from "@/lib/api/tenant";
import { MessageSquare, Send, Lock, CheckCircle, Clock, User, Building, Info } from "lucide-react";

export const Route = createFileRoute("/tenant/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Thikana" },
      {
        name: "description",
        content: "Internal messaging with landlords following approved contact requests.",
      },
    ],
  }),
  component: TenantMessagesPage,
});

function TenantMessagesPage() {
  const { i18n } = useTranslation();
  const isBn = i18n.language === "bn";

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequestItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const refreshData = async () => {
    const [convList, crList] = await Promise.all([
      mockTenantApi.getConversations(),
      mockTenantApi.getContactRequests(),
    ]);
    setConversations(convList);
    setContactRequests(crList);
  };

  useEffect(() => {
    mockTenantApi.getConversations().then((convList) => {
      setConversations(convList);
      if (convList.length > 0) {
        setActiveConvId((prev) => prev || convList[0].id);
      }
    });
    mockTenantApi.getContactRequests().then((crList) => {
      setContactRequests(crList);
    });
  }, []);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !inputText.trim() || isSending) return;

    setIsSending(true);
    try {
      await mockTenantApi.sendMessage(activeConvId, inputText.trim());
      setInputText("");
      await refreshData();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <RoleLayout
      requiredRole="tenant"
      title={isBn ? "অভ্যন্তরীণ মেসেজিং (Messages)" : "Landlord Messaging"}
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
          <p className="font-semibold text-foreground">
            {isBn ? "মেসেজিং ব্যবহারের নীতি ও নিরাপত্তা" : "Contact Request Interaction Gate"}
          </p>
          <p className="mt-0.5">
            {isBn
              ? "ঠিকানা প্ল্যাটফর্মে স্প্যাম ও মিথ্যা আলাপ বন্ধ করতে প্রথমে যোগাযোগের আবেদন পাঠাতে হয়। বাড়িওয়ালা আবেদন অনুমোদন করলে এই চ্যাট উইন্ডো স্বয়ংক্রিয়ভাবে সক্রিয় হবে।"
              : "To prevent spam and protect landlord privacy, messaging is only unlocked after the landlord accepts your contact request."}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 min-h-[540px]">
        {/* Left Column: Conversations and Pending Contact Requests */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              {isBn ? "চলমান কথোপকথন" : "Active Conversations"}
            </h2>

            {conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                {isBn ? "এখনো কোনো কথোপকথন সক্রিয় হয়নি।" : "No active conversations yet."}
              </p>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => {
                  const isActive = conv.id === activeConvId;
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setActiveConvId(conv.id)}
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
              {isBn ? "যোগাযোগের আবেদন স্ট্যাটাস" : "Contact Request Status"}
            </h2>
            <div className="space-y-2.5">
              {contactRequests.map((cr) => (
                <div
                  key={cr.id}
                  className="rounded-xl border border-border/80 bg-secondary/20 p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground truncate">
                      {cr.landlordName}
                    </span>
                    {cr.status === "Accepted" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-3 w-3" aria-hidden="true" />
                        <span>{isBn ? "অনুমোদিত" : "Accepted"}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        <span>{isBn ? "বিবেচনাধীন" : "Pending"}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{cr.propertyTitle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Chat Window */}
        <div className="lg:col-span-8 flex flex-col rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-border bg-secondary/30 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span>{activeConv.landlordName}</span>
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {isBn ? "বাড়িওয়ালা" : "Landlord"}
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Building className="h-3 w-3 text-primary shrink-0" aria-hidden="true" />
                    <span>{activeConv.propertyTitle}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                  <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{isBn ? "মেসেজিং সক্রিয়" : "Unlocked"}</span>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[420px]">
                {activeConv.messages.map((m) => {
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
                })}
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
                  <span>{isBn ? "পাঠান" : "Send"}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <Lock className="h-12 w-12 text-muted-foreground/40 mb-3" aria-hidden="true" />
              <h3 className="text-base font-bold text-foreground">
                {isBn ? "কোনো চ্যাট নির্বাচিত হয়নি" : "No Conversation Selected"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {isBn
                  ? "বাম পাশের তালিকা থেকে কথোপকথন বেছে নিন অথবা প্রপার্টি পেজ থেকে যোগাযোগের আবেদন পাঠান।"
                  : "Select an active thread from the left, or send a contact request from any listing details page."}
              </p>
            </div>
          )}
        </div>
      </div>
    </RoleLayout>
  );
}
