# Arena

Open AI model evaluation arena. Two models answer the same prompt, you vote blind, ELO updates, cost and latency get logged.

Built for [Hack Club Macondo](https://macondo.hackclub.com).

## Setup

You need Node 20+ and an [OpenRouter](https://openrouter.ai/) API key.

```bash
npm install
cp .env.example .env.local
```

Add your key to `.env.local`:

```
OPENROUTER_API_KEY=sk-or-...
```

Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

- `/` landing
- `/battle` head to head streaming battle
- `/leaderboard` model ELO and cost columns

## Supabase (optional)

Battles work in memory without a database. For persistence:

1. Create a Supabase project
2. Run `supabase/schema.sql` then `supabase/seed.sql`
3. Fill in the Supabase env vars in `.env.local`

## Docs

Project research and roadmap live in [`docs/PLAN.md`](docs/PLAN.md).

## Scripts

- `npm run dev` local dev server
- `npm run build` production build
- `npm run lint` eslint
