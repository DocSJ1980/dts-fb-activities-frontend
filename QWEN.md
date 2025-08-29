# Project Context for `dts-fb-activities-frontend`

This document provides an overview of the `dts-fb-activities-frontend` project for use by Qwen Code.

## Project Overview

This is a Next.js (v15) frontend application designed to integrate with a self-hosted KoboToolbox instance. Its primary feature is a **Supervision Dashboard** that fetches and displays field supervision submissions from KoboToolbox. The dashboard allows users to view a list of submissions and drill down into detailed views for each submission, including associated images and location data.

Key functionalities include:
- Fetching data from a KoboToolbox API endpoint via a Next.js server route (`/api/supervision`).
- Displaying a list of submissions with key insights (like House Spot count, risk flags) in card format on `/supervision-dashboard/details`.
- Showing detailed submission information, including team details, inspection data for up to 5 houses/spots, and attached images on `/supervision-dashboard/details/[id]`.
- Performing basic analysis of team performance and supervisory quality based on the submitted data.
- Rendering submission locations on a map using Leaflet.
- Handling offline development by falling back to a local `sample_response.json` file if the KoboToolbox API is unreachable or not configured.

## Technologies Used

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom components, `lucide-react` for icons
- **Maps:** `leaflet`, `react-leaflet`, `leaflet.markercluster`
- **Data Fetching:** Native `fetch` API
- **KoboToolbox Integration:** Custom API route and utility functions

## Project Structure

- `src/app/`: Next.js App Router structure.
  - `src/app/api/supervision/route.ts`: Server-side API route to fetch data from KoboToolbox or serve `sample_response.json`.
  - `src/app/supervision-dashboard/details/page.tsx`: Page component for the list of supervision submissions.
  - `src/app/supervision-dashboard/details/[id]/page.tsx`: Page component for the detailed view of a single submission.
- `src/components/`: Reusable UI components.
  - `src/components/supervision/SupervisionCard.tsx`: Component for rendering a submission card in the list view.
  - `src/components/supervision/SubmissionMap.tsx`: Client-side component for displaying submission locations on a map.
- `src/types/`: TypeScript type definitions, particularly for KoboToolbox data structures (`kobo.ts`).
- `src/utils/`: Utility functions for parsing Kobo data, finding attachments, and analyzing submission quality (`kobo.ts`).
- `public/`: Static assets.
- `sample_response.json`: Sample KoboToolbox API response for offline development/testing.

## Environment Variables

Configuration is handled via environment variables, primarily in `.env.local`:
- `KFKOBO_BASE_URL`: URL of the self-hosted KoboToolbox instance.
- `KFKOBO_ASSET_ID`: ID of the KoboToolbox form asset.
- `KFKOBO_TOKEN`: Authorization token for the KoboToolbox API (prefixed with "Token ").
- `KFKOBO_DJANGO_LANG`: Django language setting (e.g., "en").
- `NEXT_PUBLIC_BASE_PATH` (optional): Base path if the app is hosted under a subpath.

## Building and Running

1.  **Install dependencies:** `pnpm install`
2.  **Development server:** `pnpm dev`
3.  **Build for production:** `pnpm build`
4.  **Start production server:** `pnpm start` (runs on port 4000 as per `package.json`)

## Development Conventions

- Uses Next.js App Router with Server Components for data fetching.
- Leverages Tailwind CSS for styling with utility-first classes.
- Avoids `any` type in TypeScript, preferring specific interfaces.
- Implements server-side data fetching for the `/api/supervision` route and list/detail pages to ensure fresh data (`dynamic = 'force-dynamic'`, `cache: 'no-store'`).
- Uses utility functions for parsing Kobo-specific data formats (like location strings) and deriving insights.
- Handles image attachments from KoboToolbox using provided download URLs, preferring smaller sizes for thumbnails.
- Includes a fallback mechanism to load data from `sample_response.json` for development and error resilience.
- Security: Ensures the KoboToolbox authorization token is only used on the server side and never exposed to the client.

## Key Files

- `README.md`: Primary documentation for the Supervision Dashboard feature.
- `package.json`: Lists dependencies and defines scripts.
- `next.config.ts`: Configures Next.js, including `remotePatterns` for image optimization.
- `src/app/api/supervision/route.ts`: Core server-side data fetching logic.
- `src/app/supervision-dashboard/details/page.tsx` & `[id]/page.tsx`: Main UI pages.
- `src/utils/kobo.ts`: Essential logic for parsing, analyzing, and deriving insights from Kobo data.
- `src/types/kobo.ts`: Defines TypeScript interfaces for Kobo data structures.
- `sample_response.json`: Sample data for offline development.