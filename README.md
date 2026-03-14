# IssueScout

Find OSS issues that don't appear to have an open PR referencing them. Live at [issuescout.dev](https://issuescout.dev). Browse issues across multiple ecosystems (TanStack, Vercel, etc.) and filter by status, readiness, and labels.

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

   For preview deployments, set `NEXT_PUBLIC_SITE_URL` to your deployment URL so Open Graph and metadata use the correct domain.

## Scripts

- `pnpm dev` — Start the development server
- `pnpm build` — Build for production
- `pnpm start` — Start the production server
- `pnpm lint` — Run ESLint
- `pnpm typecheck` — Run TypeScript check
- `pnpm test` — Run tests
- `pnpm test:watch` — Run tests in watch mode
- `pnpm test:coverage` — Run tests with coverage

## Architecture

- **Config:** [src/lib/ecosystems.config.ts](src/lib/ecosystems.config.ts) defines ecosystems and their repos.
- **API:** `GET /api/issues` and `GET /api/issues/[ecosystem]` fetch and cache issues via [src/lib/api/fetch-issues.ts](src/lib/api/fetch-issues.ts), which calls [src/lib/github.ts](src/lib/github.ts) to fetch from the GitHub REST API.
- **Analysis:** Raw issues are normalized in [src/lib/analysis/normalize.ts](src/lib/analysis/normalize.ts), which uses [status.ts](src/lib/analysis/status.ts) (likely_unclaimed, possible_wip, stale) and [readiness.ts](src/lib/analysis/readiness.ts) (high/medium/low scoring).
- **Client:** [src/app/issues/page.tsx](src/app/issues/page.tsx) and [src/app/ecosystem/[id]/page.tsx](src/app/ecosystem/[id]/page.tsx) fetch from the API, apply filters from [src/lib/filters.ts](src/lib/filters.ts), and render issue cards. Filters are persisted in the URL.

## Adding Ecosystems

Edit [src/lib/ecosystems.config.ts](src/lib/ecosystems.config.ts) to add or modify ecosystems. Each ecosystem has an `id`, `name`, `description`, and list of `repos` (e.g. `"tanstack/query"`).
