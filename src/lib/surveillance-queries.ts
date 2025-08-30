import pool from "./database";
import {
  SurveillanceActivity,
  ContainerData,
  User,
  SurveillanceFilters,
  SurveillanceResponse,
} from "@/types/surveillance";

/*
 * Database schema requirements:
 * 
 * -- Table: public.town_data
 * CREATE TABLE IF NOT EXISTS public.town_data (
 *   id integer NOT NULL DEFAULT nextval('town_data_id_seq'::regclass),
 *   town text COLLATE pg_catalog."default" NOT NULL,
 *   ddho_id integer
 * );
 * 
 * -- Table: public.uc_data
 * CREATE TABLE IF NOT EXISTS public.uc_data (
 *   id integer NOT NULL DEFAULT nextval('uc_data_id_seq'::regclass),
 *   uc_sort integer NOT NULL,
 *   tracking_db_uc character varying(255),
 *   surveillance_db_uc character varying(255),
 *   population_2021 integer,
 *   population_2022 integer,
 *   uc_type character varying(255),
 *   houses integer,
 *   spots integer,
 *   kobo_uc character varying(255),
 *   town_id integer REFERENCES town_data(id)
 * );
 * 
 * -- Table: public.employee_data
 * CREATE TABLE IF NOT EXISTS public.employee_data (
 *   id serial4 NOT NULL,
 *   name text NULL,
 *   fh_name text NULL,
 *   cnic text NULL,
 *   personal_no text NULL,
 *   designation text NULL,
 *   contact_no text NULL,
 *   activity_type text NULL,
 *   username text NULL,
 *   new_username text NULL,
 *   town text NULL,
 *   town_id int4 NULL,
 *   CONSTRAINT employee_data_pkey PRIMARY KEY (id),
 *   CONSTRAINT fk_employee_town_id FOREIGN KEY (town_id) REFERENCES public.town_data(id)
 * );
 */

/**
 * Query surveillance activities from the database with filters
 */
export async function querySurveillanceActivities(
  filters: SurveillanceFilters
): Promise<SurveillanceActivity[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  // Base query for indoor surveillance activities
  let baseQuery = `
    SELECT 
      id,
      activity_id,
      name_of_family_head,
      shop_house,
      address,
      locality,
      district,
      town,
      uc,
      report_type,
      submitted_by,
      activity_datetime,
      picture_url,
      latitude,
      longitude
    FROM dts_surv_activities
    WHERE report_type = 'indoor'
  `;

  // Add date filter
  if (filters.date) {
    conditions.push(`DATE(activity_datetime) = $${paramIndex}`);
    values.push(filters.date);
    paramIndex++;
  }

  // Add town filter if specified
  if (filters.townCode) {
    // Join with town_data to get the town name for filtering
    conditions.push(`EXISTS (
      SELECT 1 FROM town_data td 
      WHERE td.id = $${paramIndex} 
      AND td.town = dts_surv_activities.town
    )`);
    values.push(filters.townCode);
    paramIndex++;
  }

  // Add UC filter if specified
  if (filters.ucCode) {
    // Join with uc_data to get the UC name for filtering
    conditions.push(`EXISTS (
      SELECT 1 FROM uc_data ud 
      WHERE ud.id = $${paramIndex} 
      AND ud.surveillance_db_uc = dts_surv_activities.uc
    )`);
    values.push(filters.ucCode);
    paramIndex++;
  }

  // Add conditions to query
  if (conditions.length > 0) {
    baseQuery += ` AND ${conditions.join(" AND ")}`;
  }

  baseQuery += ` ORDER BY activity_datetime DESC`;

  try {
    console.log("Querying surveillance activities:", baseQuery);
    console.log("Values:", values);

    const result = await pool.query(baseQuery, values);
    
    console.log(`Found ${result.rows.length} surveillance activities`);

    return result.rows.map((row): SurveillanceActivity => ({
      id: row.id,
      activity_id: row.activity_id,
      name_of_family_head: row.name_of_family_head || "",
      shop_house: row.shop_house || "",
      address: row.address || "",
      locality: row.locality || "",
      district: row.district || "",
      town: row.town || "",
      uc: row.uc || "",
      report_type: row.report_type || "",
      submitted_by: row.submitted_by || "",
      activity_datetime: row.activity_datetime?.toISOString() || "",
      picture_url: row.picture_url || "",
      latitude: parseFloat(row.latitude) || 0,
      longitude: parseFloat(row.longitude) || 0,
      // Legacy mappings for backward compatibility
      Sr_No: row.id?.toString(),
      Activity_ID: row.activity_id,
      Name_of_Family_Head: row.name_of_family_head || "",
      Shop_House: row.shop_house || "",
      Address: row.address || "",
      Locality: row.locality || "",
      District: row.district || "",
      Town: row.town || "",
      UC: row.uc || "",
      Tag: row.submitted_by || "",
      Submitted_by: row.submitted_by || "",
      Activity_DateTime: row.activity_datetime?.toISOString() || "",
      Picture: row.picture_url || "",
      Latitude: parseFloat(row.latitude) || 0,
      Longitude: parseFloat(row.longitude) || 0,
    }));
  } catch (error) {
    console.error("Error querying surveillance activities:", error);
    throw error;
  }
}

/**
 * Query outdoor surveillance activities from the database with filters
 */
export async function queryOutdoorSurveillanceActivities(
  filters: SurveillanceFilters
): Promise<SurveillanceActivity[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  // Base query for outdoor surveillance activities
  let baseQuery = `
    SELECT 
      id,
      activity_id,
      name_of_family_head,
      shop_house,
      address,
      locality,
      district,
      town,
      uc,
      report_type,
      submitted_by,
      activity_datetime,
      picture_url,
      latitude,
      longitude
    FROM dts_surv_activities
    WHERE report_type = 'outdoor'
  `;

  // Add date filter
  if (filters.date) {
    conditions.push(`DATE(activity_datetime) = $${paramIndex}`);
    values.push(filters.date);
    paramIndex++;
  }

  // Add town filter if specified
  if (filters.townCode) {
    // Join with town_data to get the town name for filtering
    conditions.push(`EXISTS (
      SELECT 1 FROM town_data td 
      WHERE td.id = $${paramIndex} 
      AND td.town = dts_surv_activities.town
    )`);
    values.push(filters.townCode);
    paramIndex++;
  }

  // Add UC filter if specified
  if (filters.ucCode) {
    // Join with uc_data to get the UC name for filtering
    conditions.push(`EXISTS (
      SELECT 1 FROM uc_data ud 
      WHERE ud.id = $${paramIndex} 
      AND ud.surveillance_db_uc = dts_surv_activities.uc
    )`);
    values.push(filters.ucCode);
    paramIndex++;
  }

  // Add conditions to query
  if (conditions.length > 0) {
    baseQuery += ` AND ${conditions.join(" AND ")}`;
  }

  baseQuery += ` ORDER BY activity_datetime DESC`;

  try {
    console.log("Querying outdoor surveillance activities:", baseQuery);
    console.log("Values:", values);

    const result = await pool.query(baseQuery, values);
    
    console.log(`Found ${result.rows.length} outdoor surveillance activities`);

    return result.rows.map((row): SurveillanceActivity => ({
      id: row.id,
      activity_id: row.activity_id,
      name_of_family_head: row.name_of_family_head || "",
      shop_house: row.shop_house || "",
      address: row.address || "",
      locality: row.locality || "",
      district: row.district || "",
      town: row.town || "",
      uc: row.uc || "",
      report_type: row.report_type || "",
      submitted_by: row.submitted_by || "",
      activity_datetime: row.activity_datetime?.toISOString() || "",
      picture_url: row.picture_url || "",
      latitude: parseFloat(row.latitude) || 0,
      longitude: parseFloat(row.longitude) || 0,
      // Legacy mappings for backward compatibility
      Sr_No: row.id?.toString(),
      Activity_ID: row.activity_id,
      Name_of_Family_Head: row.name_of_family_head || "",
      Shop_House: row.shop_house || "",
      Address: row.address || "",
      Locality: row.locality || "",
      District: row.district || "",
      Town: row.town || "",
      UC: row.uc || "",
      Tag: row.submitted_by || "",
      Submitted_by: row.submitted_by || "",
      Activity_DateTime: row.activity_datetime?.toISOString() || "",
      Picture: row.picture_url || "",
      Latitude: parseFloat(row.latitude) || 0,
      Longitude: parseFloat(row.longitude) || 0,
    }));
  } catch (error) {
    console.error("Error querying outdoor surveillance activities:", error);
    throw error;
  }
}

/**
 * Query container data for surveillance activities
 */
export async function queryContainerData(
  activityIds: string[]
): Promise<ContainerData[]> {
  if (activityIds.length === 0) {
    return [];
  }

  const placeholders = activityIds.map((_, index) => `$${index + 1}`).join(", ");
  
  const query = `
    SELECT 
      id,
      activity_id,
      container_tag,
      checked,
      positive
    FROM dts_containers
    WHERE activity_id IN (${placeholders})
    ORDER BY activity_id, container_tag
  `;

  try {
    console.log("Querying container data for activities:", activityIds);
    
    const result = await pool.query(query, activityIds);
    
    console.log(`Found ${result.rows.length} container records`);

    return result.rows.map((row): ContainerData => ({
      id: row.id,
      activity_id: row.activity_id,
      container_tag: row.container_tag || "",
      checked: parseInt(row.checked) || 0,
      positive: parseInt(row.positive) || 0,
      // Legacy mappings for backward compatibility
      Activity_ID: row.activity_id,
      Container_Tag: row.container_tag || "",
      Checked: parseInt(row.checked) || 0,
      Positive: parseInt(row.positive) || 0,
    }));
  } catch (error) {
    console.error("Error querying container data:", error);
    throw error;
  }
}

/**
 * Query unique users from surveillance activities with employee data
 */
export async function queryUsers(filters: SurveillanceFilters): Promise<User[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  let baseQuery = `
    SELECT DISTINCT 
      dsa.submitted_by as username,
      dsa.submitted_by as full_name,
      ed.name,
      ed.fh_name,
      ed.cnic,
      ed.personal_no,
      ed.designation,
      ed.activity_type,
      ed.new_username,
      ed.town,
      ed.town_id
    FROM dts_surv_activities dsa
    LEFT JOIN employee_data ed ON (
      dsa.submitted_by = ed.username OR 
      dsa.submitted_by = ed.new_username
    )
    WHERE dsa.report_type = 'indoor'
    AND dsa.submitted_by IS NOT NULL
    AND dsa.submitted_by != ''
  `;

  // Add same filters as activities to ensure consistency
  if (filters.date) {
    conditions.push(`DATE(dsa.activity_datetime) = $${paramIndex}`);
    values.push(filters.date);
    paramIndex++;
  }

  if (filters.townCode) {
    conditions.push(`EXISTS (
      SELECT 1 FROM town_data td 
      WHERE td.id = $${paramIndex} 
      AND td.town = dsa.town
    )`);
    values.push(filters.townCode);
    paramIndex++;
  }

  if (filters.ucCode) {
    conditions.push(`EXISTS (
      SELECT 1 FROM uc_data ud 
      WHERE ud.id = $${paramIndex} 
      AND ud.surveillance_db_uc = dsa.uc
    )`);
    values.push(filters.ucCode);
    paramIndex++;
  }

  if (conditions.length > 0) {
    baseQuery += ` AND ${conditions.join(" AND ")}`;
  }

  baseQuery += ` ORDER BY dsa.submitted_by`;

  try {
    console.log("Querying users with employee data:", baseQuery);
    console.log("Values:", values);

    const result = await pool.query(baseQuery, values);
    
    console.log(`Found ${result.rows.length} unique users`);

    return result.rows.map((row): User => ({
      username: row.username,
      full_name: row.full_name,
      // Employee data fields
      name: row.name,
      fh_name: row.fh_name,
      cnic: row.cnic,
      personal_no: row.personal_no,
      designation: row.designation,
      // contact_no removed for privacy protection
      activity_type: row.activity_type,
      new_username: row.new_username,
      town: row.town,
      town_id: row.town_id,
    }));
  } catch (error) {
    console.error("Error querying users:", error);
    throw error;
  }
}

/**
 * Query unique users from outdoor surveillance activities with employee data
 */
export async function queryOutdoorUsers(filters: SurveillanceFilters): Promise<User[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  let baseQuery = `
    SELECT DISTINCT 
      dsa.submitted_by as username,
      dsa.submitted_by as full_name,
      ed.name,
      ed.fh_name,
      ed.cnic,
      ed.personal_no,
      ed.designation,
      ed.activity_type,
      ed.new_username,
      ed.town,
      ed.town_id
    FROM dts_surv_activities dsa
    LEFT JOIN employee_data ed ON (
      dsa.submitted_by = ed.username OR 
      dsa.submitted_by = ed.new_username
    )
    WHERE dsa.report_type = 'outdoor'
    AND dsa.submitted_by IS NOT NULL
    AND dsa.submitted_by != ''
  `;

  // Add same filters as activities to ensure consistency
  if (filters.date) {
    conditions.push(`DATE(dsa.activity_datetime) = $${paramIndex}`);
    values.push(filters.date);
    paramIndex++;
  }

  if (filters.townCode) {
    conditions.push(`EXISTS (
      SELECT 1 FROM town_data td 
      WHERE td.id = $${paramIndex} 
      AND td.town = dsa.town
    )`);
    values.push(filters.townCode);
    paramIndex++;
  }

  if (filters.ucCode) {
    conditions.push(`EXISTS (
      SELECT 1 FROM uc_data ud 
      WHERE ud.id = $${paramIndex} 
      AND ud.surveillance_db_uc = dsa.uc
    )`);
    values.push(filters.ucCode);
    paramIndex++;
  }

  if (conditions.length > 0) {
    baseQuery += ` AND ${conditions.join(" AND ")}`;
  }

  baseQuery += ` ORDER BY dsa.submitted_by`;

  try {
    console.log("Querying outdoor users with employee data:", baseQuery);
    console.log("Values:", values);

    const result = await pool.query(baseQuery, values);
    
    console.log(`Found ${result.rows.length} unique outdoor users`);

    return result.rows.map((row): User => ({
      username: row.username,
      full_name: row.full_name,
      // Employee data fields
      name: row.name,
      fh_name: row.fh_name,
      cnic: row.cnic,
      personal_no: row.personal_no,
      designation: row.designation,
      // contact_no removed for privacy protection
      activity_type: row.activity_type,
      new_username: row.new_username,
      town: row.town,
      town_id: row.town_id,
    }));
  } catch (error) {
    console.error("Error querying outdoor users:", error);
    throw error;
  }
}

/**
 * Get complete surveillance data (activities, containers, users) with filters
 */
export async function getSurveillanceData(
  filters: SurveillanceFilters
): Promise<SurveillanceResponse> {
  try {
    console.log("Getting surveillance data with filters:", filters);

    // Query activities
    const activities = await querySurveillanceActivities(filters);
    
    // Extract activity IDs for container query
    const activityIds = activities.map(activity => activity.activity_id);
    
    // Query containers and users in parallel
    const [containerData, users] = await Promise.all([
      queryContainerData(activityIds),
      queryUsers(filters),
    ]);

    const response: SurveillanceResponse = {
      combined_data: activities,
      container_data: containerData,
      users,
      total_records: activities.length,
    };

    console.log("Surveillance data query complete:", {
      activities: activities.length,
      containers: containerData.length,
      users: users.length,
    });

    return response;
  } catch (error) {
    console.error("Error getting surveillance data:", error);
    throw error;
  }
}

/**
 * Get complete outdoor surveillance data (activities, containers, users) with filters
 */
export async function getOutdoorSurveillanceData(
  filters: SurveillanceFilters
): Promise<SurveillanceResponse> {
  try {
    console.log("Getting outdoor surveillance data with filters:", filters);

    // Query outdoor activities
    const activities = await queryOutdoorSurveillanceActivities(filters);
    
    // Extract activity IDs for container query
    const activityIds = activities.map(activity => activity.activity_id);
    
    // Query containers and users in parallel
    const [containerData, users] = await Promise.all([
      queryContainerData(activityIds),
      queryOutdoorUsers(filters),
    ]);

    const response: SurveillanceResponse = {
      combined_data: activities,
      container_data: containerData,
      users,
      total_records: activities.length,
    };

    console.log("Outdoor surveillance data query complete:", {
      activities: activities.length,
      containers: containerData.length,
      users: users.length,
    });

    return response;
  } catch (error) {
    console.error("Error getting outdoor surveillance data:", error);
    throw error;
  }
}

/**
 * Get available towns from town_data table
 */
export async function getTowns(): Promise<Array<{ town_name: string; town_code: number }>> {
  const query = `
    SELECT 
      id as town_code,
      town as town_name
    FROM town_data
    ORDER BY town
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error querying towns:", error);
    throw error;
  }
}

/**
 * Get available UCs for a specific town from uc_data table  
 */
export async function getUCs(townId: number): Promise<Array<{ uc_name: string; uc_code: number; town_code: number }>> {
  const query = `
    SELECT 
      id as uc_code,
      surveillance_db_uc as uc_name,
      town_id as town_code
    FROM uc_data
    WHERE town_id = $1
    AND surveillance_db_uc IS NOT NULL
    AND surveillance_db_uc != ''
    ORDER BY uc_sort, id
  `;

  try {
    console.log(`Querying UCs for town_id: ${townId}`);
    const result = await pool.query(query, [townId]);
    console.log(`Found ${result.rows.length} UCs for town_id ${townId}`);
    return result.rows;
  } catch (error) {
    console.error("Error querying UCs:", error);
    throw error;
  }
}