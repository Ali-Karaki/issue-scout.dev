import { SITE_URL } from "@/lib/constants";

const schema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "IssueScout",
  url: SITE_URL,
  description:
    "Find OSS issues that don't appear to have an open PR referencing them",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/issues?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
