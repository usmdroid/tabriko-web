# TabrikO Web

Landing page for [TabrikO](https://tabriko.uz) — the platform for ordering personalized video and audio greetings from celebrities.

## Getting started

```bash
npm install
cp .env.local.example .env.local
# Edit .env.local with your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE` | No | Backend API base URL. Default: `https://api.tabriko.uz/api/v1` |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN for client-side error tracking |
| `SENTRY_DSN` | No | Sentry DSN for server/edge error tracking |
| `NEXT_PUBLIC_APP_STORE_URL` | No | App Store download link |
| `NEXT_PUBLIC_PLAY_STORE_URL` | No | Google Play download link |

## Scripts

```bash
npm run dev     # Development server
npm run build   # Production build
npm run start   # Start production server
npm run lint    # ESLint check
```

## Stack

- **Next.js 16.2.9** — App Router
- **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** — `@theme` tokens in `globals.css`
- **next-intl** — uz / ru / en (default: uz), client-side locale via `LocaleCtx`
- **next-themes** — light / dark / system
- **lucide-react** — icons
- **@sentry/nextjs** — error tracking
