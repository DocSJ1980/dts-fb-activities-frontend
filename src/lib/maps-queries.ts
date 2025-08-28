import pool from "./database";
import {
  TableName,
  FilterLayer,
  MapMarker,
  FilterOption,
  UCCentroid,
} from "@/types/maps";

// Function to normalize UC names for better matching
function normalizeUCName(ucName: string): string {
  return ucName.toLowerCase().replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

// Build WHERE clause for table-specific filters
function buildWhereClause(
  table: TableName,
  filters: Record<string, any>,
  startParamIndex: number = 1
): { clause: string; values: any[] } {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = startParamIndex;

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      conditions.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  return {
    clause: conditions.length > 0 ? ` AND ${conditions.join(" AND ")}` : "",
    values,
  };
}

// Get date field name for each table
function getDateField(table: TableName): string {
  switch (table) {
    case TableName.DENGUE_SIMPLE_ACTIVITIES:
    case TableName.DTS_SURV_ACTIVITIES:
      return "activity_datetime";
    case TableName.DTS_PATIENT_ACTIVITIES:
      return "activity_submission_datetime";
    case TableName.DTS_CASE_RESPONSE_ACTIVITIES:
      return "submission_date";
    case TableName.DTS_TPV_ACTIVITIES:
      return "tpv_activity_date_time";
    default:
      return "created_at";
  }
}

// Check if table has coordinates
function hasCoordinates(table: TableName): boolean {
  return ![
    TableName.DTS_CASE_RESPONSE_ACTIVITIES,
    TableName.DTS_TPV_ACTIVITIES,
  ].includes(table);
}

// Get primary key field name for each table
function getPrimaryKeyField(table: TableName): string {
  switch (table) {
    case TableName.DTS_TPV_ACTIVITIES:
    case TableName.DTS_CASE_RESPONSE_ACTIVITIES:
      return "sr";
    default:
      return "id";
  }
}

// Query data for a single layer
export async function queryLayerData(
  layer: FilterLayer,
  uc: string
): Promise<MapMarker[]> {
  const dateField = getDateField(layer.table);
  const hasCoords = hasCoordinates(layer.table);
  const primaryKey = getPrimaryKeyField(layer.table);

  let baseQuery: string;
  let values: any[] = [uc];
  let paramIndex = 2;

  if (hasCoords) {
    // Tables with coordinates - use fuzzy UC matching
    baseQuery = `
      SELECT
        ${primaryKey} as id,
        latitude,
        longitude,
        district,
        town,
        uc,
        ${dateField} as date_field,
        *
      FROM ${layer.table}
      WHERE (
        LOWER(REPLACE(uc, '-', ' ')) = LOWER(REPLACE($1, '-', ' '))
        OR LOWER(uc) = LOWER($1)
        OR uc = $1
      )
    `;
  } else {
    // Tables without coordinates - use UC centroids (fallback to default coordinates)
    baseQuery = `
      SELECT
        t.${primaryKey} as id,
        33.6844 as latitude,
        73.0479 as longitude,
        t.district,
        t.town,
        t.uc,
        t.${dateField} as date_field,
        t.*
      FROM ${layer.table} t
      WHERE (
        LOWER(REPLACE(t.uc, '-', ' ')) = LOWER(REPLACE($1, '-', ' '))
        OR LOWER(t.uc) = LOWER($1)
        OR t.uc = $1
      )
    `;
  }

  // Add date filters
  if (layer.dateStart) {
    baseQuery += ` AND ${dateField} >= $${paramIndex}`;
    values.push(layer.dateStart);
    paramIndex++;
  }

  if (layer.dateEnd) {
    baseQuery += ` AND ${dateField} <= $${paramIndex}`;
    values.push(layer.dateEnd);
    paramIndex++;
  }

  // Add table-specific filters
  const { clause: whereClause, values: filterValues } = buildWhereClause(
    layer.table,
    layer.filters,
    paramIndex
  );
  baseQuery += whereClause;

  // Add filter values to the main values array
  values.push(...filterValues);

  baseQuery += " ORDER BY " + dateField + " DESC LIMIT 10000"; // Limit for performance

  try {
    console.log(`Querying ${layer.table} for UC: ${uc}`);
    console.log("Query:", baseQuery);
    console.log("Values:", values);

    const result = await pool.query(baseQuery, values);

    console.log(
      `Found ${result.rows.length} rows for ${layer.table} in UC ${uc}`
    );

    return result.rows.map(
      (row): MapMarker => ({
        id: `${layer.table}_${row.id}`,
        layerId: layer.id,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        color: layer.color,
        tableType: layer.table,
        popupData: {
          table: layer.table,
          date: row.date_field,
          district: row.district,
          town: row.town,
          uc: row.uc,
          ...row, // Include all fields for popup display
        },
      })
    );
  } catch (error) {
    console.error(`Error querying ${layer.table} for UC ${uc}:`, error);
    console.error("Query was:", baseQuery);
    console.error("Values were:", values);
    return [];
  }
}

// Get filter options for a specific table and field
export async function getFilterOptions(
  table: TableName,
  field: string,
  uc?: string
): Promise<FilterOption[]> {
  let query = `
    SELECT ${field} as value, COUNT(*) as count
    FROM ${table}
    WHERE ${field} IS NOT NULL AND ${field} != ''
  `;

  const values: any[] = [];
  if (uc) {
    query += " AND uc = $1";
    values.push(uc);
  }

  query += `
    GROUP BY ${field}
    ORDER BY count DESC, ${field}
    LIMIT 100
  `;

  try {
    const result = await pool.query(query, values);
    return result.rows.map((row) => ({
      value: row.value,
      label: row.value,
      count: parseInt(row.count),
    }));
  } catch (error) {
    console.error(`Error getting filter options for ${table}.${field}:`, error);
    return [];
  }
}

// Get UC centroids (for tables without coordinates)
export async function getUCCentroids(): Promise<UCCentroid[]> {
  const query = `
    SELECT uc, town, latitude, longitude
    FROM uc_centroids
    ORDER BY town, uc
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error getting UC centroids:", error);
    // Fallback: calculate centroids from tables with coordinates
    return calculateUCCentroidsFromData();
  }
}

// Fallback: Calculate UC centroids from existing data
async function calculateUCCentroidsFromData(): Promise<UCCentroid[]> {
  const query = `
    SELECT 
      uc,
      town,
      AVG(latitude) as latitude,
      AVG(longitude) as longitude
    FROM (
      SELECT DISTINCT uc, town, latitude, longitude FROM dengue_simple_activities
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      UNION
      SELECT DISTINCT uc, town, latitude, longitude FROM dts_patient_activities
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      UNION
      SELECT DISTINCT uc, town, latitude, longitude FROM dts_surv_activities
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    ) combined
    GROUP BY uc, town
    ORDER BY town, uc
  `;

  try {
    const result = await pool.query(query);
    return result.rows.map((row) => ({
      uc: row.uc,
      town: row.town,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
    }));
  } catch (error) {
    console.error("Error calculating UC centroids:", error);
    return [];
  }
}
