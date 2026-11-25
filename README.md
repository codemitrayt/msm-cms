# MSM Unify CMS — Prototype

Single React (Vite) project with a **Website ⇄ Dashboard** toggle (pill at the bottom).
No backend: all data is dummy (`src/data/seed.ts`) kept in a zustand store persisted
to localStorage, so a change in the Dashboard shows on the Website instantly.
The ↺ button on the toggle resets the demo data.

```bash
nvm use 22
npm install
npm run dev        # http://localhost:5190
npm run build      # static build in dist/ (hash routing, works from any folder)
```

Dashboard login: any listed demo email (any password) — e.g. admin@msmunify.com
(Super Admin), writer@msmunify.com (Content Writer — cannot publish/delete).
Website login: any 10-digit phone, OTP 1234.

Structure:
- `src/website/core` — layout, home, college listings/rankings, college pages, compare, bookmarks, profile
- `src/website/explore` — exams, predictors, blog, author, company pages
- `src/dashboard/content` — institutions (all tabs), courses, base courses, partner institutes
- `src/dashboard/publishing` — exams + segments + predictor setup, blog, landing pages, exam listings, events, updates, uploads, press, careers
- `src/dashboard/system` — overview, leads, students, FAQs, tags, authors, media, users, roles, config, SEO templates, link status, MCP
