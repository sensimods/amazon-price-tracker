# Production Hardening & PWA Deployment — Technical Plan

## Current State Assessment

| Area | Status | Gaps |
|------|--------|------|
| Error Boundaries | ❌ Missing | No error.tsx, no global-error.tsx, no not-found.tsx |
| Loading UX | ❌ Missing | No loading.tsx skeletons anywhere |
| API Validation | ⚠️ Partial | 5/7 API routes use Zod; scrape route + webhook route missing |
| PWA | ❌ Missing | No manifest.json, no service worker, no icons |
| SEO | ⚠️ Partial | Only root layout has metadata; auth/public pages missing |
| Docker | ❌ Missing | No Dockerfile, no docker-compose for production |
| Secrets | ❌ Not configured | .env.local has placeholders for Resend, GitHub OAuth, Inngest |

## Execution Order

### Phase 1 — Production Hardening
- `error.tsx` at root + dashboard route group
- `loading.tsx` with shadcn skeleton components on all data pages
- Zod validation on scrape route and webhook route
- 404 pages at key route groups
- Harden next.config.ts (CSP headers, security)

### Phase 2 — PWA + SEO
- `public/manifest.json` with app icons
- Update `next.config.ts` with PWA headers + service worker
- SEO metadata for /login, /register, / dashboard pages
- `public/robots.txt`
- Offline fallback

### Phase 3 — Docker Infrastructure
- Multi-stage `Dockerfile` (build + production with Playwright Chromium)
- Production `docker-compose.yml` (app + Postgres + Traefik/Caddy)
- `.dockerignore`
- Health check endpoint

### Phase 4 — Deployment Guide
- `DEPLOYMENT.md` with full step-by-step instructions
- Missing service setup guide (GitHub OAuth, Resend, Inngest, Paddle webhook)
- Security checklist
