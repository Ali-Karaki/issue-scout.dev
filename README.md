# IssueScout

Find OSS issues that don't appear to have an open PR referencing them. Browse issues across multiple ecosystems (TanStack, Vercel, etc.) and filter by status, readiness, and labels.

## Prerequisites

- Node.js 18+
- pnpm

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create `.env.local` with your GitHub token:

   ```
   GITHUB_TOKEN=your_github_personal_access_token
   ```

   Or use `PAT` as the env variable name. A token is required to avoid GitHub API rate limits.

## Scripts

- `pnpm dev` — Start the development server
- `pnpm build` — Build for production
- `pnpm start` — Start the production server
- `pnpm lint` — Run ESLint

## Adding Ecosystems

Edit [src/lib/ecosystems.config.ts](src/lib/ecosystems.config.ts) to add or modify ecosystems. Each ecosystem has an `id`, `name`, `description`, and list of `repos` (e.g. `"tanstack/query"`).
