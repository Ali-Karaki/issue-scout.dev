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

   - `GITHUB_TOKEN` — required for GitHub API rate limits
   - `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — required for caching (from [Upstash Console](https://console.upstash.com) or Vercel Upstash integration)

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
| `GITHUB_TOKEN` | Provided by GitHub Actions |
| `UPSTASH_REDIS_REST_URL` | [Upstash Console](https://console.upstash.com) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Console |

---

## 4. Pull Request Process

1. Create a branch from `main`
2. Make your changes
3. Ensure `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass
4. Submit a PR with a clear description of the changes
5. Address any review feedback

---

## 5. Adding Ecosystems

To add or modify ecosystems, edit [src/lib/ecosystems.config.ts](src/lib/ecosystems.config.ts). Each ecosystem has an `id`, `name`, `description`, and list of `repos` (e.g. `"owner/repo"`).

---

## 6. Code Style

- Follow existing patterns in the codebase
- Use TypeScript strictly
- Prefer functional components and hooks
- Keep components focused and composable
