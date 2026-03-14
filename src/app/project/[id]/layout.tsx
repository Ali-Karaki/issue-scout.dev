import type { Metadata } from "next";
import { PROJECTS } from "@/lib/projects.config";
import { SITE_URL } from "@/lib/constants";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = PROJECTS.find((e) => e.id === id);
  if (!project)
    return { title: "Project not found" };
  return {
    title: `${project.name} Issues`,
    description: project.description,
    openGraph: {
      title: `${project.name} Issues`,
      description: project.description,
    },
    alternates: {
      canonical: `${SITE_URL}/project/${id}`,
    },
  };
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
