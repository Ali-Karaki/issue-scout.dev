export interface EcosystemConfig {
  id: string;
  name: string;
  description: string;
  repos: string[];
}

export const ECOSYSTEMS: EcosystemConfig[] = [
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
    name: "Vercel / Next.js",
    description: "Next.js and Vercel ecosystem",
    repos: ["vercel/next.js", "vercel/ai", "vercel/turborepo"],
  },
];
