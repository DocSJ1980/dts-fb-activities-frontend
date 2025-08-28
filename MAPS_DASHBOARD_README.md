# Comprehensive Maps Dashboard

## Overview

The Comprehensive Maps Dashboard is a powerful multi-layer mapping interface that allows users to visualize and analyze data from multiple dengue-related activity tables simultaneously. It provides advanced filtering capabilities, real-time data visualization, and performance optimizations for handling large datasets.

## Features

### 🗺️ Multi-Layer Map Visualization
- Display data from 6 different dengue activity tables on a single map
- Color-coded markers for easy layer identification
- Interactive popups with detailed information
- Responsive design for desktop and mobile devices

### 🔍 Advanced Filtering System
- **UC-based filtering**: All queries are filtered by selected Union Council
- **Dynamic layer management**: Add, remove, and configure multiple filter layers
- **Date range filtering**: Flexible date selection with "till date" option
- **Table-specific filters**: Customized filters for each data table
- **Real-time record counts**: See how many records match your filters

### 📊 Supported Data Tables

1. **Dengue Simple Activities** (`dengue_simple_activities`)
   - Fields: latitude, longitude, district, town, uc, activity_datetime, dengue_larvae, tag, submitted_by
   - Filters: tag, dengue_larvae, district, town, submitted_by

2. **Patient Activities** (`dts_patient_activities`)
   - Fields: latitude, longitude, district, town, uc, activity_submission_datetime, patient_name, category_name, tag_name
   - Filters: tag_name, category_name, district, town, submitted_by

3. **Surveillance Activities** (`dts_surv_activities`)
   - Fields: latitude, longitude, district, town, uc, activity_datetime, report_type, submitted_by, activity_id
   - Filters: report_type, district, town, submitted_by

4. **Container Data** (`dts_containers`)
   - Linked to surveillance activities via activity_id
   - Fields: activity_id, container_tag, checked, positive
   - Filters: container_tag

5. **Case Response Activities** (`dts_case_response_activities`)
   - Fields: district, town, uc, submission_date, larva_source, submitted_by
   - Filters: larva_source, district, town, submitted_by
   - **Note**: No coordinates - uses UC centroids

6. **TPV Activities** (`dts_tpv_activities`)
   - Fields: district, town, uc, tpv_activity_date_time, tpv_type, auditor
   - Filters: tpv_type, auditor, district, town
   - **Note**: No coordinates - uses UC centroids

## Usage Guide

### Getting Started

1. **Navigate to Maps Dashboard**
   - Go to `/maps` or click "Comprehensive Maps Dashboard" from the home page

2. **Select Union Council**
   - Choose a UC from the dropdown (required for all queries)
   - The dropdown shows UCs with their parent town names

3. **Add Filter Layers**
   - Click "Add Layer" to create a new filter layer
   - Configure each layer with:
     - Custom name for easy identification
     - Data table selection
     - Date range (start date and optional end date)
     - Table-specific filters
     - Color for map markers
     - Enable/disable toggle

4. **Apply Filters**
   - Click "Apply Filters" to execute queries and display results
   - View record counts for each layer
   - Toggle layers on/off in the map legend

### Example Use Cases

**Scenario 1: Indoor Surveillance Analysis**
```
Layer 1: "Indoor Surveillance August"
- Table: dts_surv_activities
- Date: 2024-08-01 to 2024-08-31
- Filters: report_type = "indoor"
- Color: Red

Layer 2: "Container Positives August"
- Table: dts_containers (linked to surveillance)
- Date: 2024-08-01 to 2024-08-31
- Filters: positive > 0
- Color: Orange
```

**Scenario 2: Multi-Activity Comparison**
```
Layer 1: "Patient Activities"
- Table: dts_patient_activities
- Date: 2024-01-01 to current
- Filters: tag_name = "Patient"
- Color: Blue

Layer 2: "Fogging Activities"
- Table: dengue_simple_activities
- Date: 2024-08-01 to current
- Filters: tag = "Fogging"
- Color: Green

Layer 3: "Case Response"
- Table: dts_case_response_activities
- Date: 2024-08-01 to current
- Color: Purple
```

## Technical Architecture

### Database Integration
- **PostgreSQL Connection**: Uses connection pooling for optimal performance
- **Optimized Queries**: Indexed queries with proper WHERE clauses
- **UC Centroids**: Fallback coordinates for tables without lat/lng data

### API Endpoints

#### `/api/maps/data` (POST)
- **Purpose**: Fetch map data for multiple layers
- **Input**: UC and array of filter layer configurations
- **Output**: GeoJSON-style markers with popup data and layer counts
- **Caching**: 2-minute cache for identical requests

#### `/api/maps/filter-options` (GET)
- **Purpose**: Get available filter options for dropdown menus
- **Parameters**: `table` (required), `uc` (optional)
- **Output**: Object with field names as keys and option arrays as values

#### `/api/maps/uc-centroids` (GET)
- **Purpose**: Get UC centroid coordinates for tables without coordinates
- **Output**: Array of UC objects with latitude/longitude

### Performance Optimizations

1. **Caching System**
   - In-memory cache with TTL (Time To Live)
   - Automatic cache cleanup for expired entries
   - Cache key generation from request parameters

2. **Query Optimization**
   - Parallel execution of layer queries
   - Limit of 10,000 records per layer for performance
   - Indexed database queries on commonly filtered fields

3. **Client-Side Optimizations**
   - Debounced filter updates
   - Dynamic component loading (no SSR for maps)
   - Efficient state management

## File Structure

```
src/
├── app/
│   ├── maps/
│   │   └── page.tsx                 # Main maps dashboard page
│   └── api/
│       └── maps/
│           ├── data/route.ts        # Data fetching endpoint
│           ├── filter-options/route.ts # Filter options endpoint
│           └── uc-centroids/route.ts   # UC centroids endpoint
├── components/
│   └── maps/
│       ├── MapsFilterPanel.tsx     # Filter panel component
│       └── MultiLayerMap.tsx       # Map visualization component
├── lib/
│   ├── database.ts                 # PostgreSQL connection
│   ├── maps-queries.ts             # Database query functions
│   └── maps-cache.ts               # Caching utilities
└── types/
    └── maps.ts                     # TypeScript interfaces
```

## Database Requirements

### Required Tables
Ensure the following tables exist in your PostgreSQL database:

1. `dengue_simple_activities`
2. `dts_patient_activities`
3. `dts_surv_activities`
4. `dts_containers`
5. `dts_case_response_activities`
6. `dts_tpv_activities`

### Optional Table
- `uc_centroids`: For tables without coordinates (auto-calculated if missing)

### Recommended Indexes
```sql
-- For performance optimization
CREATE INDEX idx_dengue_simple_uc_date ON dengue_simple_activities(uc, activity_datetime);
CREATE INDEX idx_patient_uc_date ON dts_patient_activities(uc, activity_submission_datetime);
CREATE INDEX idx_surv_uc_date ON dts_surv_activities(uc, activity_datetime);
CREATE INDEX idx_case_response_uc_date ON dts_case_response_activities(uc, submission_date);
CREATE INDEX idx_tpv_uc_date ON dts_tpv_activities(uc, tpv_activity_date_time);
```

## Environment Variables

Ensure these are set in your `.env.local`:

```env
DATABASE_URL=postgresql://username:password@host:port/database_name
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1  # For existing surveillance API
```

## Future Enhancements

### Planned Features
- **Marker Clustering**: For better performance with large datasets
- **Export Functionality**: CSV/GeoJSON export of filtered data
- **Layer Templates**: Save and load common filter configurations
- **Time Animation**: Animated visualization of data over time
- **Heatmap Visualization**: Density-based visualization option
- **Advanced Analytics**: Statistical analysis of filtered data

### Performance Improvements
- **Database Optimization**: Materialized views for common queries
- **Progressive Loading**: Load markers in batches
- **WebSocket Updates**: Real-time data updates
- **Service Worker Caching**: Offline capability

## Troubleshooting

### Common Issues

1. **No data showing on map**
   - Verify UC selection is made
   - Check if selected date ranges contain data
   - Ensure database connection is working

2. **Slow performance**
   - Check database indexes are in place
   - Reduce date range for large datasets
   - Clear cache if needed

3. **Filter options not loading**
   - Verify table names are correct
   - Check database permissions
   - Review API endpoint logs

### Debug Mode
Enable debug logging by checking browser console for API request/response details.

## Support

For technical support or feature requests, please refer to the project documentation or contact the development team.
