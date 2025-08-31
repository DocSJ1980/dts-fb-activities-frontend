# Project Context for dts-fb-activities-frontend

This document provides a comprehensive overview of the `dts-fb-activities-frontend` project for development and maintenance tasks.

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

3.  **Outdoor Vector Surveillance** (`/outdoor-surveillance`)
    - Displays outdoor surveillance activities performed by male staff based on data fetched from the local PostgreSQL database.
    - Identical functionality to indoor surveillance but filters activities with `report_type = 'outdoor'`.
    - Features the same filtering capabilities by date, town, and union council (UC).
    - Shows field worker performance cards specific to outdoor activities.
    - Implements the same map view and feed view components for outdoor activity visualization.
    - Calculates and displays the same summary statistics for outdoor activities.
    - Uses a dedicated server-side API route (`/api/outdoor-surveillance`) to fetch outdoor-specific data.
    - Uses orange-themed branding (🌿 icon) to distinguish from indoor surveillance (🦟 blue theme).

4.  **Comprehensive Maps Dashboard** (`/maps`)
    - Offers a multi-layer map visualization for all types of dengue activities.
    - Allows users to select multiple Union Councils (UCs) and enable/disable different data layers.
    - Supports various activity types including simple dengue activities, patient activities, surveillance activities, container data, case response activities, and TPV activities.
    - Configurable layer settings (color, clustering, dots display).
    - **Advanced Patient Activity Visualization**: Patient Activities with `tag_name = 'Patient'` are displayed as special 500m diameter circles with color-coded visualization:
      - 🔴 **Red circles** for `patient_place = 'residence'`
      - 🔵 **Blue circles** for `patient_place = 'workplace'`
      - 🟣 **Purple circles** for `patient_place = 'permanent'`
      - All circles feature black borders for better visibility and are never clustered
      - **Center Markers**: Small center markers display the exact patient house location within each circle
    - **Enhanced Marker Display**: Dot markers are larger (16x16px) with black borders for improved visibility
    - **Full Screen Mode**: True full screen toggle button provides F11-style experience with only map and floating exit button
    - Uses a server-side API route (`/api/maps/data`) to fetch map marker data based on selected filters.
    - Implements caching for map data to improve performance.

5.  **Employee Performance Analytics** (`/employee-performance`)
    - Provides comprehensive individual employee performance tracking and analytics for dengue field activities.
    - Features employee search and selection with intelligent dropdown functionality.
    - **GitHub-style Contribution Grid**: Visual heatmap showing daily activity counts over time with color-coded intensity.
    - **Activity Summary Cards**: Interactive cards displaying counts for each activity type (surveillance, patient, case response, simple, TPV, larva detected).
    - **Interactive Map Visualization**: Dynamic map showing employee activity locations with activity type filtering.
    - **Complete Activity Feed**: Chronological list of all employee activities with detailed information cards.
    - **Advanced Filtering**: Date range selection (default 30 days), activity type filtering, and real-time data updates.
    - **Mobile Responsive Design**: Adaptive layout with tab navigation for mobile devices while maintaining full visibility on all screen sizes.
    - **Activity Type Customization**: Specialized display handling for case response activities (shown as "Larva Response" in tags).
    - **Data Integration**: Aggregates data from all activity tables (surveillance, patient, case response, simple dengue, TPV activities).
    - **Performance Metrics**: Real-time calculation of activity counts, success rates, and performance trends.
    - Uses a dedicated server-side API route (`/api/employee-performance`) to fetch comprehensive employee data.
    - Implements efficient data loading with support for large datasets (up to 2000 activities per request).

## Architecture and Technical Implementation

### Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS
- **UI Components**: React, with custom components for cards, maps, feeds, and filters
- **Data Fetching**: `fetch` API (both server-side in routes and client-side)
- **Database**: PostgreSQL (accessed via server-side API routes)
- **Mapping**: Leaflet.js with React Leaflet for map visualizations
- **Dependencies**: Key libraries include `next`, `react`, `react-dom`, `tailwindcss`, `lucide-react` for icons, `leaflet` and `react-leaflet` for maps, and `axios` for API calls

### System Architecture
- **Architecture Pattern**: Next.js App Router with Server Components and API Routes
- **Design Patterns**: Server Component pattern for data fetching, API Route pattern for backend integration, Component-based UI architecture
- **Data Flow**: Client components request data from server API route → Server route fetches from database/KoboToolbox → Data is rendered in UI components
- **Security**: Environment variable abstraction for secure credentials, server-only API routes

### Database Schema
The application integrates with several key database tables:
- **`dts_surv_activities`**: Core surveillance activities table with `activity_id` foreign key
- **`dts_containers`**: Container data linked via `activity_id`
- **`dts_patient_activities`**: Patient activity records with location and place information
- **`dengue_simple_activities`**: Simple dengue prevention activities
- **`dts_case_response_activities`**: Case response and investigation activities
- **`dts_tpv_activities`**: Third-party verification activities
- **`employee_data`**: Staff information with dual username matching support
- **`town_data` and `uc_data`**: Geographic hierarchy with foreign key relationships

### Key Technical Features

#### Map Visualization System
- **Multi-layer Support**: Handles 6 different activity types with independent layer controls
- **Smart Clustering**: Configurable marker clustering with custom styling
- **Enhanced Patient Visualization**: 500m radius circles for patient activities with location-based color coding
- **Performance Optimization**: Efficient data fetching with caching mechanisms
- **Interactive Elements**: Popups, filtering, and real-time layer toggling

#### Data Processing and Filtering
- **Local vs Server Filtering**: Optimized strategy using local filtering for performance-critical operations
- **Smart UC Filtering**: Database-level filtering using EXISTS subqueries across multiple UC name formats
- **Employee Integration**: Dual username matching with activity type-based name formatting
- **Coordinate Handling**: All tables contain proper coordinate columns with fallback mechanisms

#### User Interface Design
- **Responsive Design**: Tailwind CSS with mobile-first approach
- **Consistent Theming**: Color-coded sections (blue for indoor, orange for outdoor)
- **Interactive Dashboards**: Real-time filtering, sorting, and data visualization
- **Performance Cards**: Field worker performance metrics with contact information

## Development Setup and Operations

### Prerequisites
- Node.js (version compatible with Next.js 15)
- pnpm package manager
- PostgreSQL database
- TypeScript v5

### Environment Configuration
1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Environment Variables**:
   Create a `.env.local` file in the project root:
   ```bash
   # KoboToolbox Integration (for Supervision Dashboard)
   KFKOBO_BASE_URL=https://kf.mydomain.com
   KFKOBO_ASSET_ID=my_form_id
   KFKOBO_TOKEN=Token my_kobo_token
   KFKOBO_DJANGO_LANG=en
   
   # Optional: If hosted under a subpath
   NEXT_PUBLIC_BASE_PATH=/subpath
   ```
   Database connection details are configured in `src/lib/database.ts`.

3. **Development Server**:
   ```bash
   pnpm dev
   ```
   Access the application at `http://localhost:3000`

### Build and Deployment
- **Build**: `pnpm build`
- **Production Server**: `pnpm start` (runs on port 4000)
- **Linting**: `pnpm lint`
- **Deployment**: Compatible with Vercel or self-hosted Next.js environments

### Application Routes
- **Main Dashboard**: `http://localhost:3000`
- **Indoor Surveillance**: `http://localhost:3000/indoor-surveillance`
- **Outdoor Surveillance**: `http://localhost:3000/outdoor-surveillance`
- **Employee Performance**: `http://localhost:3000/employee-performance`
- **Maps Dashboard**: `http://localhost:3000/maps`
- **Supervision Dashboard**: `http://localhost:3000/supervision-dashboard/details`

## Project Structure and Development Conventions

### Directory Organization
The project follows Next.js 15 App Router structure:

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/                # Server-side API endpoints
│   │   ├── indoor-surveillance/
│   │   ├── outdoor-surveillance/
│   │   ├── employee-performance/
│   │   ├── maps/           # Maps data, filter-options, uc-centroids, etc.
│   │   └── supervision/
│   ├── indoor-surveillance/
│   ├── outdoor-surveillance/
│   ├── employee-performance/
│   ├── maps/
│   └── supervision-dashboard/
├── components/            # Reusable UI components
│   ├── maps/              # Map-specific components
│   ├── supervision/       # Supervision dashboard components
│   └── ui/                # Generic UI components
├── lib/                   # Database queries and utilities
├── services/              # API service layer
├── types/                 # TypeScript type definitions
└── utils/                 # Helper functions and constants
```

### Development Standards

#### Data Fetching Strategy
- **Server-side Routes**: Use `src/app/api/*` for database queries and external API calls
- **Security**: Sensitive operations (KoboToolbox authentication) remain server-only
- **Caching**: Use `cache: 'no-store'` for dynamic data, implement strategic caching for performance
- **Filtering**: Optimize with local filtering for UI interactions, server filtering for data-heavy operations

#### Code Organization
- **Type Safety**: Strong TypeScript typing for all data structures and API responses
- **Component Design**: Modular, reusable components with clear separation of concerns
- **Performance**: Local filtering and memoization for optimal user experience
- **Backward Compatibility**: Maintain legacy field support while introducing new features

#### Database Integration
- **Parameterized Queries**: Use `$${paramIndex}` syntax for PostgreSQL queries
- **Smart Filtering**: Implement EXISTS subqueries for efficient UC-based filtering
- **Employee Integration**: Support dual username matching (username/new_username)
- **Coordinate Handling**: All tables contain proper latitude/longitude columns

## Advanced Features and Specializations

### Surveillance System Integration

Both indoor and outdoor surveillance systems share core functionality while maintaining distinct operational focuses:

#### Common Features
- **Filtering Capabilities**: Date, town, and union council (UC) selection with cascading dropdowns
- **Field Worker Performance**: Interactive cards showing individual worker statistics and contact information
- **Map Visualization**: Dynamic map views with activity location plotting
- **Summary Statistics**: Real-time calculation of houses/containers checked and positive results
- **Employee Integration**: Enhanced user information display with formatted names and contact details

#### Indoor Surveillance Specifics
- **Data Source**: `report_type = 'indoor'` filtering from `dts_surv_activities` table
- **Target Focus**: General indoor surveillance activities
- **Branding**: Blue theme with 🦟 mosquito icon
- **API Endpoint**: `/api/indoor-surveillance`

#### Outdoor Surveillance Specifics
- **Data Source**: `report_type = 'outdoor'` filtering from `dts_surv_activities` table
- **Target Focus**: Activities performed by male staff in outdoor environments
- **Branding**: Orange theme with 🌿 plant icon
- **API Endpoint**: `/api/outdoor-surveillance`

### Maps Dashboard Advanced Capabilities

The comprehensive maps dashboard provides sophisticated visualization tools:

#### Multi-Layer Visualization
- **6 Activity Types**: Dengue simple activities, patient activities, surveillance activities, container data, case response activities, and TPV activities
- **Layer Management**: Independent enable/disable controls for each data layer
- **Custom Styling**: Configurable colors, clustering options, and display modes
- **UC Selection**: Multi-select Union Council filtering for targeted analysis

#### Patient Activity Specialization
- **Circle Visualization**: 500m diameter circles for `tag_name = 'Patient'` activities
- **Center Markers**: Small dot markers show exact patient house locations within the coverage circles
- **Location-Based Coloring**:
  - Red: `patient_place = 'residence'`
  - Blue: `patient_place = 'workplace'`
  - Purple: `patient_place = 'permanent'`
  - Gray: Unknown/empty values
- **Visual Enhancements**: Black borders, semi-transparent fills, non-clustered display
- **Interactive Features**: Detailed popups with patient place information
- **Full Screen Experience**: True full screen mode covering entire viewport with floating exit control

#### Performance Optimizations
- **Data Caching**: Strategic caching for map data to reduce server load
- **Smart Filtering**: Database-level filtering with EXISTS subqueries
- **Local Processing**: Client-side filtering for UI interactions
- **Efficient Rendering**: Optimized marker clustering and layer management

### Supervision Dashboard Integration

The supervision system provides comprehensive field team oversight:

#### KoboToolbox Integration
- **Secure Authentication**: Server-side token handling with environment variable protection
- **Data Analysis**: Automated assessment of team performance and supervisory quality
- **Grading System**: A-F grade assignment with risk flag identification
- **Fallback Mechanism**: Local sample data for development and testing

#### Performance Assessment
- **Team Evaluation**: Comprehensive analysis of submission quality and completeness
- **Supervisory Quality**: Assessment of supervision effectiveness and coverage
- **Risk Identification**: Automated flagging of potential issues or anomalies
- **Attachment Support**: Full support for viewing and analyzing submitted attachments

### Employee Performance Analytics System

The employee performance module provides comprehensive individual-level analytics and performance tracking:

#### Core Analytics Features
- **Individual Employee Tracking**: Detailed performance analysis for specific field workers across all activity types
- **Multi-Activity Integration**: Consolidates data from surveillance, patient, case response, simple dengue, and TPV activities
- **GitHub-style Contribution Grid**: Annual activity heatmap visualization showing daily activity patterns with intensity-based color coding
- **Activity Summary Dashboard**: Interactive cards showing activity type counts with click-to-filter functionality
- **Comprehensive Activity Feed**: Chronological timeline of all employee activities with detailed information display
- **Interactive Map Visualization**: Geographic plotting of employee activities with activity type filtering

#### Advanced Filtering and Search
- **Intelligent Employee Search**: Dropdown with real-time search across employee names and usernames
- **Flexible Date Range Selection**: Customizable date filtering with 30-day default range
- **Activity Type Filtering**: Real-time filtering by surveillance, patient, case response, simple, TPV, and larva detection activities
- **Cross-Component Synchronization**: Filter changes instantly update all dashboard components (map, feed, summary cards)

#### Data Processing and Performance
- **Optimized Data Loading**: Efficient handling of large datasets with support for up to 2000 activities per request
- **Smart Activity Aggregation**: Complex queries joining multiple activity tables with proper employee attribution
- **Real-time Calculations**: Dynamic computation of activity counts, success rates, and performance metrics
- **Larva Detection Analytics**: Special handling for surveillance activities with positive container findings
- **TPV Performance Integration**: Specialized scoring for third-party verification activities

#### Mobile-First Responsive Design
- **Adaptive Layout**: Tab-based navigation for mobile with full desktop functionality
- **Universal Visibility**: Activities feed visible by default on all screen sizes for immediate data access
- **Touch-Optimized Interface**: Mobile-friendly interactions for filtering and navigation
- **Responsive Grid System**: Contribution grid and summary cards adapt to screen size

#### Activity Type Specialization
- **Case Response Customization**: "Case Response Activities" displayed as "Larva Response" in tag contexts
- **Activity Type Icons**: Consistent iconography across all activity types for visual identification
- **Contextual Information Display**: Activity-specific data fields and metadata in feed cards
- **Performance Metrics**: Activity type-specific success rate calculations and performance indicators

#### Technical Implementation
- **Dedicated API Route**: `/api/employee-performance` with comprehensive data aggregation
- **Type-Safe Data Models**: Strong TypeScript typing for all employee performance data structures
- **Component Architecture**: Modular design with reusable components for different analytics views
- **Efficient State Management**: Optimized React state handling for complex filtering interactions
- **Error Handling**: Comprehensive error states and fallback mechanisms for data loading failures