# deploy (vercel)

how to ship slopmark as a public read-only MVP — challenge gallery, realshot BYOK, docs.

---

## phase 1 — what works without any env vars

| route | needs keys? |
|---|---|
| `/challenges` | no |
| `/challenge/niche-sprint-v1` | no |
| `/realshot` | user BYOK in browser |
| `/bench` paste mode | no |
| `/docs` | no |

challenge results are read from committed `data/challenges/*/results.json` via [`lib/challenges/store-json.ts`](../lib/challenges/store-json.ts) — no sqlite on serverless.

---

## vercel setup

1. import repo: [github.com/nothariharan/benchmark](https://github.com/nothariharan/benchmark)
2. framework: **Next.js**
3. root directory: repo root
4. build command: `npm run build` (default)
5. deploy

no environment variables required for the minimal deploy.

---

## optional environment variables

| variable | required? | purpose |
|---|---|---|
| `AIMLAPI_KEY` | optional | host-funded live `/bench` runs via `aiml/` slugs |
| `OPENROUTER_API_KEY` | optional | host-funded live `/bench` via openrouter slugs |
| `NEXT_PUBLIC_SUPABASE_URL` | optional | login UI + session refresh |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | optional | login UI + session refresh |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | optional | postgres eval persistence |

middleware skips supabase session refresh when `NEXT_PUBLIC_SUPABASE_*` are unset — deploy won't crash.

---

## post-deploy smoke test

- `/challenges` — lists **Niche Sprint v1**
- `/challenge/niche-sprint-v1` — infographic + 6 models
- `/realshot` — duel form loads, test connection with your key
- `/docs/challenges` — challenge docs render
- `GET /api/challenges` — returns `{ challenges: [...] }`
- `GET /api/challenges/niche-sprint-v1` — returns 60 runs

---

## local production check

```bash
npm run build
npm run start
```

then hit `http://localhost:3000/api/challenges`.

---

## operator workflow (not on vercel)

run new challenges locally with your key:

```bash
npm run challenge
```

writes sqlite (`data/local.db`) + exports `data/challenges/{slug}/results.json`. commit the json to ship updated results.

---

## roadmap (later phases)

| phase | feature |
|---|---|
| 2 | BYOK solo eval on `/bench` |
| 3 | user-created challenges + supabase |
| 4 | background jobs + redis rate limits |

see [benchmark challenges](/docs/challenges) for challenge system details.
