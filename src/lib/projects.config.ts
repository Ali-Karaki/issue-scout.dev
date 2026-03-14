export interface ProjectConfig {
  id: string;
  name: string;
  description: string;
  repos: string[];
}

export const PROJECTS: ProjectConfig[] = [
  {
    id: "tanstack",
    name: "TanStack",
    description: "TypeScript libraries for React",
    repos: [
      "tanstack/router",
      "tanstack/query",
      "tanstack/table",
      "tanstack/db",
      "tanstack/store",
      "tanstack/form",
      "tanstack/virtual",
      "tanstack/hotkeys",
      "tanstack/pacer",
      "tanstack/ai",
      "tanstack/devtools",
      "tanstack/cli",
      "tanstack/config",
      "tanstack/intent",
      "tanstack/tanstack.com",
    ],
  },
  {
    id: "vercel",
    name: "Vercel",
    description: "Vercel projects",
    repos: ["vercel/next.js", "vercel/ai", "vercel/turborepo"],
  },
];
