# Team Fate Shiny Tracker

## Overview

Full-stack Pokemon shiny tracking website for Team Fate — a shiny hunting community. Members log shiny catches, track bounties, and view upcoming events.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/team-fate) at previewPath `/`
- **API framework**: Express 5 (artifacts/api-server) at `/api`
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Pages

- `/` — Guild Hall home (stats, latest catches, bounties, next event)
- `/shiny-dex` — Shiny Dex sprite grid with filters
- `/showcase` — Latest shiny catches feed
- `/about` — Team info + roster + recruitment
- `/admin` — Secure admin panel (password gate)

## Admin Access

Default password: `teamfate2025`
Set `ADMIN_PASSWORD` environment variable to change it.

## Database Tables

- `members` — Team members
- `shiny_types` — 10 shiny type categories (Normal, Shalpha, Egg, Secret, Safari, etc.)
- `shinies` — Shiny catch records
- `bounties` — Monthly bounty challenges
- `events` — Next event (single row)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/team-fate run dev` — run frontend locally

## Features

- Pokemon sprites from PokeAPI (shiny sprites)
- Shiny Dex with owned/missing status, filters by region/alpha/secret
- 10 shiny types with custom emoji + image upload support
- Admin panel: manage members, shinies, types, bounties, events
- File upload for bounty images, event images, shiny type icons
- Time-range filters (This Week / Last Week / All Time)
- Dashboard stats (members, total shinies, shiny points)

## File Uploads

Uploaded files are stored in `artifacts/api-server/uploads/` and served at `/api/uploads/{filename}`.
