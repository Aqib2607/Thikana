import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import { mockAdminApi } from "@/lib/api/mock/admin";
import type { AdminUserItem } from "@/lib/api/admin";
import {
  Users,
  Search,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  X,
  CheckCircle2,
} from "lucide-react";

export function AdminUsersPage() {
  const { t } = useTranslation();
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<"ALL" | "tenant" | "landlord" | "admin">("ALL");
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await mockAdminApi.getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleStatus = async (targetUser: AdminUserItem) => {
    if (!currentAdmin) return;
    if (targetUser.id === currentAdmin.id) {
      alert("নিজের অ্যাকাউন্ট স্থগিত করা যাবে না।");
      return;
    }

    const nextStatus = targetUser.status === "active" ? "suspended" : "active";
    setProcessingId(targetUser.id);
    try {
      const updated = await mockAdminApi.toggleUserStatus(
        targetUser.id,
        nextStatus,
        currentAdmin.id,
        currentAdmin.name || "Admin",
      );
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setNotice(
        `ব্যবহারকারী ${targetUser.name}-এর অ্যাকাউন্ট ${
          nextStatus === "suspended" ? "স্থগিত" : "পুনরায় সক্রিয়"
        } করা হয়েছে।`,
      );
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === "ALL" ? true : u.role === roleFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  return (
    <RoleLayout
      requiredRole="admin"
      title={t("dashboard.userManagement")}
      subtitle="প্ল্যাটফর্মের সকল ভাড়াটিয়া ও বাড়িওয়ালার অ্যাকাউন্ট সক্রিয়করণ ও তদারকি"
      activeTab="users"
    >
      {/* Notice */}
      {notice && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success"
        >
          {notice}
        </div>
      )}

      {/* Control Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Role Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-surface p-1">
          {(["ALL", "tenant", "landlord", "admin"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                roleFilter === r
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {r === "ALL"
                ? "সকল অ্যাকাউন্ট"
                : r === "tenant"
                  ? "ভাড়াটিয়া"
                  : r === "landlord"
                    ? "বাড়িওয়ালা"
                    : "প্রশাসক"}
              <span className="ml-1.5 opacity-75">
                ({r === "ALL" ? users.length : users.filter((u) => u.role === r).length})
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="নাম, ইমেইল বা ফোন নম্বর..."
            className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            ব্যবহারকারী লোড হচ্ছে...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <p className="mt-3 text-base font-semibold text-foreground">
              কোনো ব্যবহারকারী পাওয়া যায়নি
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              অনুসন্ধান শর্ত পরিবর্তন করে আবার চেষ্টা করুন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary/50 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3.5">
                    ব্যবহারকারী
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    ভূমিকা
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    যোগাযোগ
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    যাচাইকৃত অবস্থা
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    অ্যাকাউন্ট স্থিতি
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    অ্যাকশন
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => {
                  const isCurrentAdmin = u.id === currentAdmin?.id;
                  return (
                    <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-foreground">{u.name}</div>
                        <div className="text-xs text-muted-foreground">ID: {u.id}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                              : u.role === "landlord"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          }`}
                        >
                          {t(`roles.${u.role}`)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="text-xs text-foreground">{u.email}</div>
                        <div className="text-xs text-muted-foreground">{u.phone}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {u.verified ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                            <ShieldCheck className="h-4 w-4" />
                            <span>যাচাইকৃত</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <span>অযাচাইকৃত</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {u.status === "active" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>সক্রিয়</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                            <ShieldAlert className="h-3 w-3" />
                            <span>স্থগিত</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {isCurrentAdmin ? (
                          <span className="text-xs text-muted-foreground italic">বর্তমান সেশন</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            disabled={processingId === u.id}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                              u.status === "active"
                                ? "border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
                                : "bg-success text-white hover:opacity-90"
                            }`}
                          >
                            {u.status === "active" ? (
                              <>
                                <UserX className="h-3.5 w-3.5" />
                                <span>স্থগিত করুন</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>সক্রিয় করুন</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RoleLayout>
  );
}
