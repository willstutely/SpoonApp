# Spoon Research

Prep engine for *Knives and Spoons*. See [SPEC.md](./SPEC.md) for the full product spec.

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in real values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See [.env.example](./.env.example) for the full list (database, Anthropic API key, Telegram bot token, CourtListener API key).

## Database

Schema lives in [src/db/schema.ts](./src/db/schema.ts) (Drizzle ORM, Postgres/Neon).

```bash
npm run db:generate   # generate a migration from schema changes
npm run db:migrate     # apply migrations
npm run db:studio      # browse the database
```

## SCOTUS calendar

[calendar.json](./calendar.json) is a manually maintained seed file (see SPEC.md §3) — amend it when the Court publishes term updates. Order days are derived at runtime, never hand-entered; see [src/lib/calendar.ts](./src/lib/calendar.ts).

## Model routing

Claude model strings are centralized in [src/lib/models.ts](./src/lib/models.ts) — verify against docs.claude.com before bumping.
