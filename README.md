# Supervision Dashboard (KoboToolbox) Integration

This project includes a Supervision Dashboard feature that fetches submissions from a self-hosted KoboToolbox instance and renders:

- A list page at `/supervision-dashboard/details` with per-submission cards and quick insights
- A detail page at `/supervision-dashboard/details/[id]` showing complete submission info and attachments

## Server Route

[`route.ts`](src/app/api/supervision/route.ts) exposes a server-only endpoint at `/api/supervision`. It:

- Fetches data from KoboToolbox using environment variables
- Falls back to local [`sample_response.json`](sample_response.json) if the remote request fails or the token is not configured

Security: The Authorization token must only be used on the server. Do not expose it in client-side code.

## Environment Variables

Create a `.env.local` in the project root and add:

```
KFKOBO_BASE_URL=https://kf.mydomain.com
KFKOBO_ASSET_ID=my_form_id
KFKOBO_TOKEN=Token my_kobo_token
KFKOBO_DJANGO_LANG=en
```

Notes:

- KFKOBO_TOKEN includes the `Token ` prefix (as provided by KoboToolbox).
- The app automatically falls back to `sample_response.json` if the token is missing or the API call fails.

Optional:

- `NEXT_PUBLIC_BASE_PATH` if the app is hosted behind a subpath. Otherwise omit it.

## Pages

- List page: [`page.tsx`](src/app/supervision-dashboard/details/page.tsx)

  - Fetches `/api/supervision` using a no-store fetch to avoid caching
  - Renders each item with a card showing town, UC, visit date/time, team info, area address, health-setting count, and risk flags
  - Click-through to detail page

- Detail page: [`page.tsx`](src/app/supervision-dashboard/details/[id]/page.tsx)
  - Fetches all submissions and displays the selected submission by `_id`
  - Shows General info, Team info, Health Settings 1–5 (location parsing and image), and full attachment list

## Utilities and Types

- Types: [`kobo.ts`](src/types/kobo.ts)
- Utilities: [`kobo.ts`](src/utils/kobo.ts)
  - `parseLocation()` parses Kobo location strings like `"33.6352407 73.0899091 469.5 17.992"`
  - `findAttachmentFor()` maps question XPath to its corresponding attachment
  - `getSubmissionInsights()` produces values used on cards (hs count, flags, etc.)

## UI Components

- Card component: [`SupervisionCard.tsx`](src/components/supervision/SupervisionCard.tsx)
- Detail component: [`SupervisionDetail.tsx`](src/components/supervision/SupervisionDetail.tsx)

## Running locally

1. Install deps and start dev server (using pnpm):

```
pnpm install
pnpm dev
```

2. Configure `.env.local` (see above). If not configured, the UI will render using [`sample_response.json`](sample_response.json) via the server fallback.

3. Navigate to:

- http://localhost:3000/supervision-dashboard/details
- Click a submission card to go to its detail page.

## Implementation Notes

- Server route sets `dynamic = 'force-dynamic'` and uses `cache: 'no-store'` to ensure fresh data.
- Attachment images are linked using the provided `download_*_url` fields. Thumbnails prefer small/medium sizes.
- Linting: `any` usage avoided; types use narrow string-indexed fields defined in the Kobo types file.
