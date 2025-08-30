# Project Context for `dts-fb-activities-frontend`

This project is a Next.js 15 application designed to visualize and analyze various dengue prevention and field activity data for the District Health Authority Rawalpindi. It integrates with multiple data sources to present information through different dashboards.

## Core Functionality

### 1. Supervision Dashboard (KoboToolbox Integration)
1.  **Data Fetching:**
    *   A server-side API route (`/api/supervision`) fetches data from a KoboToolbox asset endpoint.
    *   It uses an Authorization token (from environment variables) for secure access to the KoboToolbox API.
    *   If the API call fails or the token is not configured, it falls back to a local `sample_response.json` file for offline development.
2.  **Supervision Dashboard:**
    *   **List View (`/supervision-dashboard/details`):**
        *   Displays a grid of cards, one for each Kobo submission.
        *   Each card shows key summary information (Town, UC, Visit Date/Time, Team Info, Area Address).
        *   It calculates and displays a "Health Settings Count" (number of houses/spots visited) and "Risk Flags" (e.g., Larvae Found, Fake Work Detected) based on the submission data.
        *   Two performance grades (Team Performance 'T:' and Supervisory Quality 'S:') are calculated and shown on the card using color-coded badges.
        *   Clicking a card navigates to the detail view for that submission.
    *   **Detail View (`/supervision-dashboard/details/[id]`):**
        *   Shows comprehensive information for a single submission identified by its `_id`.
        *   Displays General Information and Team Information.
        *   Presents detailed data for up to 5 "House/Spot Verified" entries (HS 1-5), including questions, answers, and associated images.
        *   Features a performance analysis section that provides detailed grades and feedback for both the field team's work and the supervisor's quality of verification. This analysis is based on specific answers within the submission (e.g., checking if larvae were found, if work was fake, inspection completeness).
        *   Integrates a Leaflet map (`SubmissionMap` component) to visualize the geographical locations of the verified houses/spots from the submission.
        *   Lists all attachments (images) associated with the submission.

### 2. Indoor Vector Surveillance Dashboard (`/indoor-surveillance`)
1.  **Data Source:** Fetches data from a custom backend API (likely a Node.js/Express or similar service) via `axios`.
2.  **API Endpoint:** `/api/v1/surveillance-data` (configured via `NEXT_PUBLIC_API_URL` environment variable).
3.  **Data Types:**
    *   `SurveillanceActivity`: Represents a single surveillance activity record with details like family head name, address, location coordinates, submitted by user, and a picture.
    *   `ContainerData`: Details about containers checked during an activity, including whether they were positive for larvae.
    *   `User`: Information about field workers/users who submitted the data.
4.  **Functionality:**
    *   Allows filtering data by date, town, and UC.
    *   Displays a summary of key metrics: Houses Checked, Houses Positive, Containers Checked, Containers Positive.
    *   Shows a map (`DynamicSurveillanceMap`) of activity locations.
    *   Provides a feed (`SurveillanceFeed`) of individual activity records with their container details.
    *   Groups activities by field worker using `FieldWorkerCards`, allowing filtering by a specific worker.
    *   Uses client-side state management (`useState`, `useEffect`) for filtering and displaying data.

### 3. Comprehensive Maps Dashboard (`/maps`)
1.  **Data Source:** Fetches data directly from a PostgreSQL database using `pg` (node-postgres) within a Next.js API route (`/api/maps/data`).
2.  **Data Types:**
    *   Multiple database tables are represented:
        *   `DengueSimpleActivity`: Basic dengue-related activities.
        *   `DtsPatientActivity`: Patient-related activities.
        *   `DtsSurvActivity`: Surveillance activities.
        *   `DtsContainer`: Container inspection data linked to surv activities.
        *   `DtsCaseResponseActivity`: Case response activities.
        *   `DtsTpvActivity`: TPV (Third Party Verification) activities.
3.  **Functionality:**
    *   Allows complex filtering with "layers". Each layer represents a specific query configuration:
        *   Selects a database table.
        *   Applies date range filters.
        *   Applies table-specific filters (e.g., report type, larvae presence).
        *   Configures visualization options (color, clustering, dots).
    *   Users can select multiple UCs (Union Councils) to focus the map.
    *   Fetches data for all enabled layers and selected UCs via a single POST request to `/api/maps/data`.
    *   Displays data points from different layers on a single interactive map (`MultiLayerMap`), using different colors for each layer.
    *   Provides layer toggling and summary counts for each layer.
    *   Uses server-side database queries (`lib/maps-queries.ts`) to fetch and format data into `MapMarker` objects.
    *   Implements basic caching (`lib/maps-cache.ts`) for API responses to improve performance.
    *   Dynamically imports the map component to avoid SSR issues.

## Key Technologies & Libraries

*   **Framework:** Next.js 15 (App Router, React Server Components)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Data Fetching:**
    *   Native `fetch` API (server-side for KoboToolbox)
    *   `axios` (client-side for backend API)
    *   `pg` (node-postgres for direct database access)
*   **Maps:** Leaflet, React-Leaflet, Leaflet.markercluster
*   **UI Components:** Custom components (e.g., `SupervisionCard`, `SupervisionDetail`, `SubmissionMap`, `FilterPanel`, `FieldWorkerCards`, `DynamicSurveillanceMap`, `SurveillanceFeed`, `MapsFilterPanel`, `MultiLayerMap`)
*   **Utilities:** Custom utility functions (e.g., in `src/utils/kobo.ts` for Kobo data processing and analysis).

## Development & Build Process

*   **Package Manager:** `pnpm`
*   **Key Scripts:**
    *   `pnpm dev`: Starts the Next.js development server.
    *   `pnpm build`: Builds the application for production.
    *   `pnpm start`: Starts the production server (on port 4000 as configured).
    *   `pnpm lint`: Runs the Next.js linter.
*   **Environment Variables:**
    *   `KFKOBO_BASE_URL`, `KFKOBO_ASSET_ID`, `KFKOBO_TOKEN`, `KFKOBO_DJANGO_LANG`: Used for connecting to the KoboToolbox API. `.env.local` should be created for these.
    *   `NEXT_PUBLIC_BASE_PATH`: Optional, for hosting the app behind a subpath.
    *   `NEXT_PUBLIC_API_URL`: Base URL for the backend API used by the Indoor Surveillance dashboard.
    *   `DATABASE_URL`: Connection string for the PostgreSQL database used by the Maps dashboard.

## Important Conventions & Notes

*   **Security:**
    *   KoboToolbox API tokens (`KFKOBO_TOKEN`) must only be used on the server side (e.g., in `route.ts` files). Never expose them in client-side code.
    *   Database connections and queries are handled server-side within API routes.
*   **Data Handling:**
    *   The application relies on specific field names from the KoboToolbox form (defined in `src/types/kobo.ts`).
    *   Backend API data structures are defined in `src/types/surveillance.ts`.
    *   Database table structures and map layer configurations are defined in `src/types/maps.ts`.
    *   Changes in data source schemas would require updates to corresponding types and data processing logic.
*   **Performance:**
    *   Server routes and pages that fetch data use `dynamic = 'force-dynamic'` and `cache: 'no-store'` to ensure fresh data is retrieved on every request where necessary.
    *   Maps dashboard implements basic caching for database query results.
    *   Server-side database queries are limited to prevent excessive load.
*   **Images:** Next.js `remotePatterns` in `next.config.ts` are configured to allow loading images from KoboToolbox instances.
*   **Analysis Logic:** The core logic for evaluating team performance and supervisory quality for Kobo data resides in `src/utils/kobo.ts` (`analyzeSupervisoryQuality` function).

## File Structure (Key Files)

*   `src/app/api/supervision/route.ts`: Server-side endpoint to fetch Kobo data.
*   `src/app/supervision-dashboard/details/page.tsx`: List view of Kobo submissions.
*   `src/app/supervision-dashboard/details/[id]/page.tsx`: Detailed view of a single Kobo submission.
*   `src/app/indoor-surveillance/page.tsx`: Main page for the Indoor Surveillance dashboard.
*   `src/app/maps/page.tsx`: Main page for the Comprehensive Maps dashboard.
*   `src/app/api/maps/data/route.ts`: Server-side endpoint to fetch map data from the database.
*   `src/lib/database.ts`: PostgreSQL connection pool configuration.
*   `src/lib/maps-queries.ts`: Functions to query database tables and format data for the map.
*   `src/services/api.ts`: `axios` instance and functions to interact with the backend API for surveillance data.
*   `src/components/supervision/`: Contains reusable UI components for the Kobo dashboard.
*   `src/components/maps/`: Contains reusable UI components for the Maps dashboard.
*   `src/components/`: Other shared components like filters and feeds.
*   `src/utils/kobo.ts`: Utility functions for Kobo data processing and analysis.
*   `src/types/`: TypeScript interfaces for all data types used across different dashboards.
*   `sample_response.json`: Local sample data for KoboToolbox integration offline development/testing.