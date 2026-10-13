import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import {
  Building2,
  PlusCircle,
  FileText,
  MessageSquare,
  CalendarCheck,
  Eye,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/landlord/dashboard")({
  head: () => ({
    meta: [
      { title: "Landlord Dashboard — Thikana" },
      {
        name: "description",
        content: "Manage your rental listings, incoming inquiries, and property visits.",
      },
    ],
  }),
  component: LandlordDashboard,
});

function LandlordDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const cards = [
    {
      title: t("dashboard.myProperties"),
      desc: "আপনার প্রকাশিত ও খসড়া বাসাগুলোর তথ্য, ভাড়া এবং প্রাপ্যতা (Available, Reserved, Rented) নিয়ন্ত্রণ করুন।",
      icon: Building2,
      href: "/landlord/properties",
      cta: "লিস্টিং পরিচালনা করুন",
    },
    {
      title: t("dashboard.newProperty"),
      desc: "সর্বোচ্চ ৫টি ছবি, বিস্তারিত অবস্থান এবং সুবিধাসমূহ দিয়ে নতুন লিস্টিং অনুমোদনের জন্য জমা দিন।",
      icon: PlusCircle,
      href: "/landlord/properties/new",
      cta: "নতুন বাসা যোগ করুন",
    },
    {
      title: t("dashboard.contactRequests"),
      desc: "ভাড়াটিয়াদের যোগাযোগের অনুরোধ পর্যালোচনা ও গ্রহণ করুন।",
      icon: FileText,
      href: "/landlord/contact-requests",
      cta: "অনুরোধ তালিকা দেখুন",
    },
    {
      title: t("dashboard.myMessages"),
      desc: "অনুমোদিত ভাড়াটিয়াদের সাথে বাসা সম্পর্কিত সরাসরি বার্তা আদান-প্রদান করুন।",
      icon: MessageSquare,
      href: "/landlord/messages",
      cta: "বার্তা ইনবক্স",
    },
    {
      title: t("dashboard.myVisits"),
      desc: "ভাড়াটিয়ার বাসা পরিদর্শনের তারিখ অনুমোদন বা বাতিল করুন (Pending, Accepted, Completed)।",
      icon: CalendarCheck,
      href: "/landlord/visits",
      cta: "পরিদর্শন শিডিউল",
    },
  ];

  return (
    <RoleLayout
      requiredRole="landlord"
      title={`${t("dashboard.welcome")}, ${user?.name || ""}`}
      subtitle={t("dashboard.landlordTitle")}
      activeTab="dashboard"
    >
      {/* Landlord policy banner */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
        <Eye className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
        <div className="text-sm">
          <p className="font-semibold text-foreground">যোগাযোগ ও গোপনীয়তা নিয়ন্ত্রণ</p>
          <p className="mt-0.5 text-muted-foreground">
            বাড়িওয়ালা হিসেবে আপনি প্রতিটি প্রপার্টিতে নির্বাচন করতে পারবেন আপনার যোগাযোগের তথ্য
            জনসম্মুখে প্রদর্শিত হবে কি না।
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <article
              key={c.href}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-border-strong hover:shadow-md"
            >
              <div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-foreground">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="mt-4 text-lg font-semibold">{c.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-border">
                <Link
                  to={c.href}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-link"
                >
                  <span>{c.cta}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </RoleLayout>
  );
}
