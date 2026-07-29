# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

This repo mixes a real application (repo root) with standalone Web programming course exercises kept in their own folders. They do not share a build/run process:

- **Repo root** (`server.js`, `prisma/`, `package.json`) — 慶應教科書売買アプリ (Keio textbook marketplace), the active app. Everything below refers to this.
- `03-web/` — standalone exercise using Node's raw `http` module (`server.js`), serves files from `03-web/public/`. Run directly with `node 03-web/server.js`.
- `html-css/`, `js-ts/`, `command/` — static HTML/CSS/JS lesson exercises, no server, open the HTML files directly or via a static server.

## Commands

- `npm start` — run the app (`node server.js`), listens on `process.env.PORT` (default 3000).
- `npx prisma generate` — regenerate the Prisma Client into `node_modules/@prisma/client`. Runs automatically via `postinstall` because Render's build step only runs `npm ci`.
- `npx prisma migrate dev --name <name>` — create + apply a migration against the dev database (see gotcha below).
- `npx prisma migrate deploy` — apply existing migrations without touching migration history/shadow DB; use this when `migrate dev` fails on the hosted DB (see below).
- `npx prisma migrate status` — check whether the DB matches `prisma/migrations/`.
- `npx prisma studio` — GUI browser for the DB, at `http://localhost:5555` (or another port if busy).
- No test suite is configured (`npm test` is a stub that exits 1) and no linter/formatter is set up.

## Architecture

- **Single-file server**: all routes live in `server.js` (CommonJS, no framework beyond Express). HTML is rendered inline via template literals — there is no view engine/templating library. Any user-supplied string interpolated into HTML must go through the local `escapeHtml()` helper to avoid XSS.
- **Prisma Client instantiation requires a driver adapter.** Prisma 7 no longer connects from a bare connection string — `server.js` builds a `PrismaPg` adapter (`@prisma/adapter-pg` + `pg`) from `process.env.DATABASE_URL` and passes it into `new PrismaClient({ adapter })`. The generator in `prisma/schema.prisma` is the classic `prisma-client-js` (not the newer `prisma-client` generator), chosen specifically because it outputs plain JS to `node_modules/@prisma/client` that a CommonJS app can `require()` directly, with no build step.
- **No auth yet — seller identity is free text.** `Item.sellerId` is an *optional* FK to `User`; there is no login flow, so listings carry `sellerName`/`sellerContact` as plain strings entered on the form instead of a real user relation. When login is eventually built, the intent is to populate `sellerId` for logged-in sellers and treat `sellerName`/`sellerContact` as the fallback/legacy path — don't assume every `Item` has a `seller`.
- **Data model** (`prisma/schema.prisma`): `User` (id, email, name, passwordHash, createdAt), `Item` (seller info, courseName, title, description, price, `type`/`status` as free-form strings — `type` is `"fixed"` today with `"auction"` planned later, not an enum), `Message` (itemId, senderId, content). `Message` is defined but not yet wired into any route.
- **Env/config**: `DATABASE_URL` lives in `.env` (gitignored, never commit it) and must include `?sslmode=require` for the Render Postgres instance. `prisma.config.ts` (not `schema.prisma`) is what wires `DATABASE_URL` into the Prisma CLI via `dotenv/config`.
- **Deployment**: Render Web Service at `webpro-ygpb.onrender.com`. Render's Build Command is `npm ci` and Start Command is `npm start`; `DATABASE_URL` is set directly in the Render dashboard, not from a committed file.

### Known gotcha: `migrate dev` vs Render Postgres

`prisma migrate dev` can intermittently fail against the Render database with:

```
Error: ERROR: permission denied to terminate process
DETAIL: Only roles with the SUPERUSER attribute may terminate processes of roles with the SUPERUSER attribute.
```

This happens because Render's app DB role isn't a superuser and `migrate dev`'s dev-diagnostics step tries to terminate backend connections as part of shadow-database validation. When this happens, don't fight it — just hand-apply the already-generated migration SQL under `prisma/migrations/` with `npx prisma migrate deploy`, which doesn't require the shadow database at all.
