# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Full-stack fitness tracking app with AI-powered food calorie detection.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: In-memory (activities + food logs persist for server lifetime)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Mobile**: Expo (React Native)
- **AI**: Google Gemini 1.5 Flash (food calorie detection)
- **Auth**: JWT for admin routes

## Artifacts

### Mobile App (`artifacts/fitness-tracker`)
Expo React Native app with:
- Dashboard showing steps, calories burned, calories consumed + goals progress
- Activity tracker (log steps + calories burned)
- Food scanner — upload photo → Gemini AI identifies food + estimates calories
- Profile screen with goal setting + dark mode toggle
- Admin login and dashboard

### API Server (`artifacts/api-server`)
Express backend with:
- `GET/POST /api/activity` — activity tracking
- `GET /api/activity/summary` — aggregated dashboard data
- `GET/PUT /api/activity/goals` — user goals
- `POST /api/food/analyze` — Gemini AI food analysis (base64 image)
- `POST/GET /api/food/log` — log food items
- `POST /api/admin/login` — admin auth (JWT)
- `GET /api/admin/dashboard` — admin overview (protected)
- `GET/DELETE /api/admin/activities` — manage activities (protected)
- `GET/DELETE /api/admin/food-logs` — manage food logs (protected)

## Environment Variables / Secrets Required

- `GEMINI_API_KEY` — Google Gemini API key for food detection
- `ADMIN_USERNAME` — Admin dashboard username
- `ADMIN_PASSWORD` — Admin dashboard password
- `SESSION_SECRET` — JWT signing secret

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/fitness-tracker run dev` — run Expo app

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
