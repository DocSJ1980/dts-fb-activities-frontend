# Project Context for dts-fb-activities-frontend

This document provides an overview of the `dts-fb-activities-frontend` project for use in future interactions and development tasks.

## Project Overview

This is a Next.js 15 application designed to serve as a frontend for visualizing and managing field activities related to dengue prevention for the District Health Authority Rawalpindi. It integrates with a PostgreSQL database to fetch and display different types of dengue surveillance and response activities.

### Key Features

1.  **Supervision Dashboard** (`/supervision-dashboard`)
    - Fetches submissions from a self-hosted KoboToolbox instance to display field team supervision data.
    - Renders a list page (`/supervision-dashboard/details`) showing submission cards with key insights.
    - Provides a detail page (`/supervision-dashboard/details/[id]`) for viewing complete submission information and attachments.
    - Analyzes submission data to assess team performance and supervisory quality, assigning grades (A-F) and identifying risk flags.
    - Uses a server-side API route (`/api/supervision`) to securely fetch data from KoboToolbox.
    - Includes a fallback mechanism using a local `sample_response.json` file.

2.  **Indoor Vector Surveillance** (`/indoor-surveillance`)
    - Displays indoor surveillance activities based on data fetched from the local PostgreSQL database.
    - Features filtering capabilities by date, town, and union council (UC).
    - Shows field worker performance cards and allows filtering by specific workers.
    - Implements a map view (`DynamicSurveillanceMap`) to visualize activity locations.
    - Provides a feed view (`SurveillanceFeed`) to list activities.
    - Calculates and displays summary statistics (houses checked, houses positive, containers checked, containers positive).
    - Uses a server-side API route (`/api/indoor-surveillance`) to fetch data from the database with efficient filtering.

3.  **Comprehensive Maps Dashboard** (`/maps`)
    - Offers a multi-layer map visualization for all types of dengue activities.
    - Allows users to select multiple Union Councils (UCs) and enable/disable different data layers.
    - Supports various activity types including simple dengue activities, patient activities, surveillance activities, container data, case response activities, and TPV activities.
    - Configurable layer settings (color, clustering, dots display).
    - Uses a server-side API route (`/api/maps/data`) to fetch map marker data based on selected filters.
    - Implements caching for map data to improve performance.

### Main Technologies

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: React, with custom components for cards, maps, feeds, and filters.
- **Data Fetching**: `fetch` API (both server-side in routes and client-side).
- **Database**: PostgreSQL (accessed via server-side API routes)
- **Mapping**: Leaflet.js with React Leaflet for map visualizations.
- **Dependencies**: Key libraries include `next`, `react`, `react-dom`, `tailwindcss`, `lucide-react` for icons, `leaflet` and `react-leaflet` for maps, and `axios` for API calls.

## Building and Running

### Prerequisites

- Node.js (version compatible with Next.js 15)
- pnpm package manager

### Setup and Development

1.  **Install Dependencies**:
    ```bash
    pnpm install
    ```
2.  **Environment Configuration**:
    - For KoboToolbox integration (used by Supervision Dashboard), create a `.env.local` file in the project root and add the following variables:
      ```bash
      KFKOBO_BASE_URL=https://kf.mydomain.com # Your KoboToolbox instance URL
      KFKOBO_ASSET_ID=my_form_id             # Your KoboToolbox form asset ID
      KFKOBO_TOKEN=Token my_kobo_token       # Your KoboToolbox API token (including the 'Token ' prefix)
      KFKOBO_DJANGO_LANG=en                  # Language setting
      ```
    - Optionally, set `NEXT_PUBLIC_BASE_PATH` if the app is hosted under a subpath.
    - Database connection details (used by all database-related features) are configured in `src/lib/database.ts`.
3.  **Start Development Server**:
    ```bash
    pnpm dev
    ```
    This starts the Next.js development server, typically on `http://localhost:3000`.
4.  **Access Application**:
    Navigate to `http://localhost:3000` to view the main dashboard. From there, you can access:
    - Indoor Vector Surveillance: `http://localhost:3000/indoor-surveillance`
    - Maps Dashboard: `http://localhost:3000/maps`
    - Supervision Dashboard: `http://localhost:3000/supervision-dashboard/details`

### Production Build

1.  **Build the Application**:
    ```bash
    pnpm build
    ```
2.  **Start Production Server**:
    ```bash
    pnpm start
    ```
    This command starts the server on port `4000` as defined in `package.json`.

### Linting

Run the linter with:
```bash
pnpm lint
```

## Development Conventions

- **Architecture**: Follows the Next.js 15 App Router structure with `src/app` for routes, `src/components` for UI components, `src/types` for TypeScript definitions, `src/utils` for helper functions, and `src/lib` for database queries and API integrations.
- **Data Fetching**:
  - Server-only routes (`src/app/api/*`) are used for external API calls (like KoboToolbox) and database queries to protect sensitive data and encapsulate business logic.
  - Pages use `fetch` with appropriate caching strategies (`cache: 'no-store'` for dynamic data) to ensure fresh data is displayed when needed.
- **Type Safety**: Strong emphasis on TypeScript types for all data structures, API responses, and component props.
- **UI Components**: Built with React and Tailwind CSS for a responsive and styled interface. Components are modular and reusable.
- **Utilities**: Parsing, data analysis, and utility functions are encapsulated in `src/utils/`. Database queries are in `src/lib/`.
- **Performance**: The indoor surveillance page implements local filtering and memoization to optimize performance. The maps dashboard uses caching for API responses.