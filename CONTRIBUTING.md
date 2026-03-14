# Contributing to IssueScout

Thanks for your interest in contributing. This document covers how to set up the project and submit changes.

## Setup

1. **Prerequisites:** Node.js 18+ and pnpm

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Environment:** Copy `.env.example` to `.env.local` and add your GitHub token:
   ```
   GITHUB_TOKEN=your_github_personal_access_token
   ```
   A token is required to avoid GitHub API rate limits.

4. **Run the dev server:**
   ```bash
   pnpm dev
   ```

## Scripts

- `pnpm dev` — Start the development server
- `pnpm build` — Build for production
- `pnpm lint` — Run ESLint
- `pnpm typecheck` — Run TypeScript check
- `pnpm test` — Run unit tests
- `pnpm test:watch` — Run tests in watch mode
- `pnpm test:coverage` — Run tests with coverage
- `pnpm test:e2e` — Run E2E tests (starts dev server automatically)
- `pnpm test:e2e:ui` — Run E2E tests with Playwright UI

## Pull Request Process

1. Create a branch from `main`
2. Make your changes
3. Ensure `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass
4. Submit a PR with a clear description of the changes
5. Address any review feedback

## Adding Ecosystems

To add or modify ecosystems, edit [src/lib/ecosystems.config.ts](src/lib/ecosystems.config.ts). Each ecosystem has an `id`, `name`, `description`, and list of `repos` (e.g. `"owner/repo"`).

## Code Style

- Follow existing patterns in the codebase
- Use TypeScript strictly
- Prefer functional components and hooks
- Keep components focused and composable
