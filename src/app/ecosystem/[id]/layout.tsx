import type { Metadata } from "next";
import { ECOSYSTEMS } from "@/lib/ecosystems.config";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ecosystem = ECOSYSTEMS.find((e) => e.id === id);
  if (!ecosystem) return { title: "Ecosystem" };
  return { title: `${ecosystem.name} Issues` };
}

export default function EcosystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
