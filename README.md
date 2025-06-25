# DTS - Dengue Tracking System Frontend

A modern Next.js frontend application for the Dengue Tracking System (DTS) that provides surveillance and monitoring capabilities for dengue vector control activities.

## Features

🦟 **Vector Surveillance Dashboard**

- Interactive map visualization of surveillance activities
- Real-time activity feed with Facebook-like interface
- Advanced filtering by date, town, and union council (UC)
- Detailed activity cards with photos and metadata

📊 **Data Visualization**

- Interactive Leaflet maps with custom markers
- Activity statistics and summaries
- Responsive design for mobile and desktop

🔍 **Search & Filter**

- Search activities by multiple criteria
- Sort by date, location, or submitter
- Filter by town and UC with cascading dropdowns

## Tech Stack

- **Framework**: Next.js 15.3.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Maps**: React Leaflet
- **HTTP Client**: Axios
- **Icons**: Heroicons & Emojis

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Backend API running on `http://localhost:8000`

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd dts-fb-activities-frontend
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and configure your API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── surveillance/      # Surveillance dashboard
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   │   ├── Dropdown.tsx  # Custom dropdown
│   │   └── PostCard.tsx  # Activity card
│   ├── FilterPanel.tsx   # Filter controls
│   ├── SurveillanceMap.tsx # Map component
│   └── SurveillanceFeed.tsx # Activity feed
├── services/             # API services
│   └── api.ts           # API client
├── types/               # TypeScript definitions
│   └── surveillance.ts  # Data interfaces
└── utils/               # Utility functions
    └── constants.ts     # App constants
```

## API Integration

The frontend expects the following API endpoints:

- `GET /towns` - List all towns
- `GET /towns/{townCode}/ucs` - List UCs for a town
- `GET /surveillance-data` - Get surveillance activities with filters

### API Parameters

**Surveillance Data Endpoint:**

- `date` (required): Date in YYYY-MM-DD format
- `town_code` (optional): Filter by town
- `uc_code` (optional): Filter by UC

## Features Overview

### Landing Page

- Modern dashboard with feature cards
- Quick navigation to surveillance activities
- Statistics overview

### Surveillance Dashboard

- **Filter Panel**: Date, town, and UC selection
- **Interactive Map**: Leaflet map with activity markers
- **Activity Feed**: Facebook-style feed with search and sort
- **Statistics**: Real-time counts and summaries

### Activity Cards

- User avatar with initials
- Activity details and metadata
- Photo display with error handling
- Location coordinates
- Timestamp and submitter info

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API base URL
- `NODE_ENV` - Environment (development/production)

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Manual Deployment

```bash
npm run build
npm run start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Dengue Tracking System for public health surveillance.
