import type { Metadata } from "next";
import { ECOSYSTEMS } from "@/lib/ecosystems.config";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ecosystem = ECOSYSTEMS.find((e) => e.id === id);
  if (!ecosystem)
    return { title: "Project not found" };
  return {
    title: `${ecosystem.name} Issues`,
    description: ecosystem.description,
    openGraph: {
      title: `${ecosystem.name} Issues`,
      description: ecosystem.description,
    },
  };
}

export default function EcosystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
