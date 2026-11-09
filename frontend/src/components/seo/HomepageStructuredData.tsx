import { useTranslation } from "react-i18next";

const FAQ_IDS = ["faq_1", "faq_2", "faq_3", "faq_4", "faq_5", "faq_6", "faq_7", "faq_8"] as const;

export function HomepageStructuredData() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const langCode = isBn ? "bn-BD" : "en-US";

  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://thikana.com.bd/#website",
        url: "https://thikana.com.bd/",
        name: "Thikana",
        description: t("home.seoDescription"),
        inLanguage: langCode,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://thikana.com.bd/properties?search={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://thikana.com.bd/#organization",
        name: "Thikana",
        url: "https://thikana.com.bd/",
        logo: "https://thikana.com.bd/favicon.ico",
        description: t("home.seoDescription"),
        areaServed: {
          "@type": "AdministrativeArea",
          name: "Khulna",
        },
        knowsAbout: [
          "Residential Rental Housing",
          "Student Mess Accommodation",
          "Khulna Rental Housing Market",
          "Tenancy Agreements in Bangladesh",
        ],
      },
      {
        "@type": "WebApplication",
        "@id": "https://thikana.com.bd/#app",
        name: "Thikana",
        url: "https://thikana.com.bd/",
        applicationCategory: "RealEstateApplication",
        inLanguage: langCode,
        isPartOf: {
          "@id": "https://thikana.com.bd/#website",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://thikana.com.bd/#breadcrumb",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: isBn ? "হোম" : "Home",
            item: "https://thikana.com.bd/",
          },
        ],
      },
      {
        "@type": "WebPage",
        "@id": "https://thikana.com.bd/#webpage",
        url: "https://thikana.com.bd/",
        name: t("home.seoTitle"),
        description: t("home.seoDescription"),
        breadcrumb: {
          "@id": "https://thikana.com.bd/#breadcrumb",
        },
        isPartOf: {
          "@id": "https://thikana.com.bd/#website",
        },
        about: [
          {
            "@id": "https://thikana.com.bd/#organization",
          },
          {
            "@id": "https://thikana.com.bd/#app",
          },
        ],
        inLanguage: langCode,
      },
      {
        "@type": "FAQPage",
        "@id": "https://thikana.com.bd/#faq",
        isPartOf: {
          "@id": "https://thikana.com.bd/#webpage",
        },
        mainEntity: FAQ_IDS.map((id) => ({
          "@type": "Question",
          name: t(`home.faqItems.${id}.q`),
          acceptedAnswer: {
            "@type": "Answer",
            text: t(`home.faqItems.${id}.a`),
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemaGraph).replace(/</g, "\\u003c"),
      }}
    />
  );
}
