# Contributing to IssueScout

Thanks for your interest in contributing. This document covers how to set up the project and submit changes.

---

## 1. Setup

1. **Prerequisites:** Node.js 18+ and pnpm

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Environment:** Copy `.env.example` to `.env.local` and configure:

   - `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — required for caching (from [Upstash Console](https://console.upstash.com) or Vercel Upstash integration)
   - `GITHUB_TOKEN` — optional for local; required in production for the refresh job
   - `CRON_SECRET` — optional for local; required to call `/api/cron/refresh` (e.g. to populate cache before testing)

4. **Run the dev server:**

   ```bash
   pnpm dev
   ```

---

## 2. Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start the development server |
| `pnpm build` | Build for production |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript check |
| `pnpm test` | Run unit tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm test:e2e` | Run E2E tests (starts dev server automatically) |
| `pnpm test:e2e:ui` | Run E2E tests with Playwright UI |

---

## 3. CI

The CI workflow runs on push and pull requests. For E2E tests to pass, add these repository secrets in **GitHub Settings → Secrets and variables → Actions:**

| Secret | Source |
|--------|--------|
| `GITHUB_TOKEN` | Provided by GitHub Actions (or add your own) |
| `UPSTASH_REDIS_REST_URL` | [Upstash Console](https://console.upstash.com) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Console |

For the **Refresh cache** workflow (scheduled every 6h), add `CRON_SECRET` (generate with `openssl rand -hex 32`, same as Vercel). The site URL is read from [config/site.json](config/site.json).

---

## 4. Pull Request Process

1. Create a branch from `main`
2. Make your changes
3. Ensure `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass
4. Submit a PR with a clear description of the changes
5. Address any review feedback

---

## 5. Adding Projects

To add or modify projects, edit [src/lib/projects.config.ts](src/lib/projects.config.ts). Each project has an `id`, `name`, `description`, and list of `repos` (e.g. `"owner/repo"`).

---

## 6. Code Style

- Follow existing patterns in the codebase
- Use TypeScript strictly
- Prefer functional components and hooks
- Keep components focused and composable
