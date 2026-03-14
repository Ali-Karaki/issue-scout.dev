import type { Metadata } from "next";
import { PROJECTS } from "@/lib/projects.config";

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
  };
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
