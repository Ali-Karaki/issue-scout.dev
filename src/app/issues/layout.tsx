import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Issues",
  description:
    "Browse open-source issues that likely aren't already being worked on. Filter by project, status, and labels.",
  openGraph: {
    title: "Issues | IssueScout",
    description:
      "Browse open-source issues that likely aren't already being worked on.",
    url: `${SITE_URL}/issues`,
  },
  alternates: {
    canonical: `${SITE_URL}/issues`,
  },
};

export default function IssuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
