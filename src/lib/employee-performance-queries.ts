import pool from "./database";
import {
  Employee,
  EmployeePerformanceFilters,
  DailyActivityCount,
  ActivitySummary,
  EmployeeActivity,
  EmployeePerformanceResponse,
  EmployeeActivitiesResponse,
  EmployeeSearchResponse,
  ContainerData,
} from "@/types/employee-performance";

/**
 * Get container data for surveillance activities
 */
export async function getContainerDataForActivities(
  activityIds: string[]
): Promise<{ [activityId: string]: ContainerData[] }> {
  try {
    if (activityIds.length === 0) {
      return {};
    }

    const query = `
      SELECT 
        id,
        activity_id,
        container_tag,
        checked,
        positive
      FROM dts_containers
      WHERE activity_id = ANY($1)
      ORDER BY activity_id, id
    `;

    const result = await pool.query(query, [activityIds]);

    // Group containers by activity_id
    const containersByActivity: { [activityId: string]: ContainerData[] } = {};

    result.rows.forEach((row) => {
      const activityId = row.activity_id;
      if (!containersByActivity[activityId]) {
        containersByActivity[activityId] = [];
      }

      containersByActivity[activityId].push({
        id: row.id,
        activity_id: row.activity_id,
        container_tag: row.container_tag,
        checked: parseInt(row.checked) || 0,
        positive: parseInt(row.positive) || 0,
      });
    });

    return containersByActivity;
  } catch (error) {
    console.error("Error getting container data:", error);
    throw error;
  }
}

/**
 * Check if an activity has positive containers (larva found)
 */
export function hasLarvaFound(containers: ContainerData[]): boolean {
  return containers.some((container) => container.positive > 0);
}

/**
 * Search employees by name or username
 */
export async function searchEmployees(
  searchTerm: string
): Promise<EmployeeSearchResponse> {
  try {
    const query = `
      SELECT
        id,
        name,
        fh_name,
        cnic,
        personal_no,
        designation,
        contact_no,
        username,
        new_username,
        town,
        town_id
      FROM employee_data
      WHERE (
        LOWER(name) LIKE LOWER($1) OR
        LOWER(username) LIKE LOWER($1) OR
        LOWER(new_username) LIKE LOWER($1)
      )
      ORDER BY name ASC
      LIMIT 50
    `;

    const result = await pool.query(query, [`%${searchTerm}%`]);

    const employees: Employee[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name || "",
      fh_name: row.fh_name,
      cnic: row.cnic,
      personal_no: row.personal_no,
      designation: row.designation,
      contact_no: row.contact_no,
      username: row.username || "",
      new_username: row.new_username,
      town: row.town,
      town_id: row.town_id,
    }));

    return {
      employees,
      total_count: employees.length,
    };
  } catch (error) {
    console.error("Error searching employees:", error);
    throw error;
  }
}

/**
 * Get employee by ID
 */
export async function getEmployeeById(
  employeeId: number
): Promise<Employee | null> {
  try {
    const query = `
      SELECT
        id,
        name,
        fh_name,
        cnic,
        personal_no,
        designation,
        contact_no,
        username,
        new_username,
        town,
        town_id
      FROM employee_data
      WHERE id = $1
    `;

    const result = await pool.query(query, [employeeId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name || "",
      fh_name: row.fh_name,
      cnic: row.cnic,
      personal_no: row.personal_no,
      designation: row.designation,
      contact_no: row.contact_no,
      username: row.username || "",
      new_username: row.new_username,
      town: row.town,
      town_id: row.town_id,
    };
  } catch (error) {
    console.error("Error getting employee by ID:", error);
    throw error;
  }
}

/**
 * Get daily activity counts for an employee within a date range
 */
export async function getDailyActivityCounts(
  filters: EmployeePerformanceFilters
): Promise<DailyActivityCount[]> {
  try {
    // Generate date series for the range
    const dateSeriesQuery = `
      SELECT generate_series($1::date, $2::date, '1 day'::interval)::date as date
    `;

    const userCondition = `
      (submitted_by = $3 OR submitted_by = $4)
    `;

    const tpvUserCondition = `
      (auditee = $3 OR auditee = $4)
    `;

    // Query all activity tables and union the results
    const activityQuery = `
      WITH date_series AS (
        ${dateSeriesQuery}
      ),
      surveillance_counts AS (
        SELECT 
          DATE(activity_datetime) as activity_date,
          COUNT(*) as count
        FROM dts_surv_activities
        WHERE DATE(activity_datetime) BETWEEN $1 AND $2
          AND ${userCondition}
        GROUP BY DATE(activity_datetime)
      ),
      simple_counts AS (
        SELECT 
          DATE(activity_datetime) as activity_date,
          COUNT(*) as count
        FROM dengue_simple_activities
        WHERE DATE(activity_datetime) BETWEEN $1 AND $2
          AND ${userCondition}
        GROUP BY DATE(activity_datetime)
      ),
      patient_counts AS (
        SELECT 
          DATE(activity_submission_datetime) as activity_date,
          COUNT(*) as count
        FROM dts_patient_activities
        WHERE DATE(activity_submission_datetime) BETWEEN $1 AND $2
          AND ${userCondition}
        GROUP BY DATE(activity_submission_datetime)
      ),
      case_response_counts AS (
        SELECT 
          DATE(submission_date) as activity_date,
          COUNT(*) as count
        FROM dts_case_response_activities
        WHERE DATE(submission_date) BETWEEN $1 AND $2
          AND ${userCondition}
        GROUP BY DATE(submission_date)
      ),
      tpv_counts AS (
        SELECT 
          DATE(tpv_activity_date_time) as activity_date,
          COUNT(*) as count
        FROM dts_tpv_activities
        WHERE DATE(tpv_activity_date_time) BETWEEN $1 AND $2
          AND ${tpvUserCondition}
        GROUP BY DATE(tpv_activity_date_time)
      )
      SELECT 
        ds.date::text as date,
        COALESCE(sc.count, 0) + COALESCE(smc.count, 0) + COALESCE(pc.count, 0) + 
        COALESCE(crc.count, 0) + COALESCE(tc.count, 0) as total_activities,
        COALESCE(sc.count, 0) as surveillance_activities,
        COALESCE(smc.count, 0) as simple_activities,
        COALESCE(pc.count, 0) as patient_activities,
        COALESCE(crc.count, 0) as case_response_activities,
        COALESCE(tc.count, 0) as tpv_activities
      FROM date_series ds
      LEFT JOIN surveillance_counts sc ON ds.date = sc.activity_date
      LEFT JOIN simple_counts smc ON ds.date = smc.activity_date
      LEFT JOIN patient_counts pc ON ds.date = pc.activity_date
      LEFT JOIN case_response_counts crc ON ds.date = crc.activity_date
      LEFT JOIN tpv_counts tc ON ds.date = tc.activity_date
      ORDER BY ds.date
    `;

    const employee = await getEmployeeById(filters.employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    const result = await pool.query(activityQuery, [
      filters.dateFrom,
      filters.dateTo,
      employee.username,
      employee.new_username || employee.username, // Use username as fallback if new_username is null
    ]);

    return result.rows.map(
      (row): DailyActivityCount => ({
        date: row.date,
        total_activities: parseInt(row.total_activities) || 0,
        surveillance_activities: parseInt(row.surveillance_activities) || 0,
        simple_activities: parseInt(row.simple_activities) || 0,
        patient_activities: parseInt(row.patient_activities) || 0,
        case_response_activities: parseInt(row.case_response_activities) || 0,
        tpv_activities: parseInt(row.tpv_activities) || 0,
      })
    );
  } catch (error) {
    console.error("Error getting daily activity counts:", error);
    throw error;
  }
}

/**
 * Get activity summary for an employee within a date range
 */
export async function getActivitySummary(
  filters: EmployeePerformanceFilters
): Promise<ActivitySummary[]> {
  try {
    const employee = await getEmployeeById(filters.employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    const userCondition = `
      (submitted_by = $3 OR submitted_by = $4)
    `;

    const tpvUserCondition = `
      (auditee = $3 OR auditee = $4)
    `;

    // Get counts from all activity tables
    const summaryQuery = `
      SELECT 
        'surveillance' as activity_type,
        'Indoor/Outdoor Surveillance' as activity_label,
        '🦟' as icon,
        'House and container inspections for dengue surveillance' as description,
        COUNT(*) as total_count,
        NULL::numeric as average_score
      FROM dts_surv_activities
      WHERE DATE(activity_datetime) BETWEEN $1 AND $2
        AND ${userCondition}
      
      UNION ALL
      
      SELECT 
        'simple' as activity_type,
        'Simple Dengue Activities' as activity_label,
        '🏠' as icon,
        'Basic dengue prevention and control activities' as description,
        COUNT(*) as total_count,
        NULL::numeric as average_score
      FROM dengue_simple_activities
      WHERE DATE(activity_datetime) BETWEEN $1 AND $2
        AND ${userCondition}
      
      UNION ALL
      
      SELECT 
        'patient' as activity_type,
        'Patient Activities' as activity_label,
        '🏥' as icon,
        'Patient-related dengue activities and tracking' as description,
        COUNT(*) as total_count,
        NULL::numeric as average_score
      FROM dts_patient_activities
      WHERE DATE(activity_submission_datetime) BETWEEN $1 AND $2
        AND ${userCondition}
      
      UNION ALL
      
      SELECT 
        'case_response' as activity_type,
        'Case Response Activities' as activity_label,
        '🚨' as icon,
        'Emergency response to dengue cases' as description,
        COUNT(*) as total_count,
        NULL::numeric as average_score
      FROM dts_case_response_activities
      WHERE DATE(submission_date) BETWEEN $1 AND $2
        AND ${userCondition}
      
      UNION ALL
      
      SELECT 
        'tpv' as activity_type,
        'Performance Evaluations' as activity_label,
        '📊' as icon,
        'Third party performance evaluations received' as description,
        COUNT(*) as total_count,
        AVG(CASE WHEN tpv_score ~ '^[0-9]+(\\.[0-9]+)?$' THEN tpv_score::numeric ELSE NULL END) as average_score
      FROM dts_tpv_activities
      WHERE DATE(tpv_activity_date_time) BETWEEN $1 AND $2
        AND ${tpvUserCondition}
      
      UNION ALL
      
      SELECT 
        'larva_detected' as activity_type,
        'Larva Detected' as activity_label,
        '🐛' as icon,
        'Surveillance activities with positive container findings' as description,
        COUNT(*) as total_count,
        NULL::numeric as average_score
      FROM dts_surv_activities sa
      WHERE DATE(sa.activity_datetime) BETWEEN $1 AND $2
        AND ${userCondition}
        AND EXISTS (
          SELECT 1 FROM dts_containers dc 
          WHERE dc.activity_id = sa.activity_id 
          AND dc.positive > 0
        )
      
      ORDER BY total_count DESC
    `;

    const result = await pool.query(summaryQuery, [
      filters.dateFrom,
      filters.dateTo,
      employee.username,
      employee.new_username || employee.username, // Use username as fallback if new_username is null
    ]);

    return result.rows.map(
      (row): ActivitySummary => ({
        activity_type: row.activity_type as
          | "surveillance"
          | "simple"
          | "patient"
          | "case_response"
          | "tpv",
        activity_label: row.activity_label,
        total_count: parseInt(row.total_count) || 0,
        icon: row.icon,
        description: row.description,
        average_score: row.average_score
          ? parseFloat(row.average_score)
          : undefined,
      })
    );
  } catch (error) {
    console.error("Error getting activity summary:", error);
    throw error;
  }
}

/**
 * Get paginated employee activities
 */
export async function getEmployeeActivities(
  filters: EmployeePerformanceFilters,
  page: number = 1,
  limit: number = 30
): Promise<EmployeeActivitiesResponse> {
  try {
    const employee = await getEmployeeById(filters.employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    const offset = (page - 1) * limit;

    const userCondition = `
      (submitted_by = $3 OR submitted_by = $4)
    `;

    const tpvUserCondition = `
      (auditee = $3 OR auditee = $4)
    `;

    // Union all activities from different tables
    const activitiesQuery = `
      (
        SELECT 
          id,
          activity_id,
          'surveillance' as activity_type,
          activity_datetime,
          district,
          town,
          uc,
          latitude,
          longitude,
          picture_url,
          name_of_family_head,
          shop_house,
          address,
          locality,
          report_type,
          NULL as patient_name,
          NULL as tag_name,
          NULL as patient_place,
          NULL as category_name,
          NULL as name_address,
          NULL as dengue_larvae,
          NULL as tag,
          NULL as larva_source,
          NULL as case_response_id,
          NULL as tpv_type,
          NULL as auditor,
          NULL as auditee,
          NULL as tpv_score
        FROM dts_surv_activities
        WHERE DATE(activity_datetime) BETWEEN $1 AND $2
          AND ${userCondition}
      )
      
      UNION ALL
      
      (
        SELECT 
          id,
          record_id as activity_id,
          'simple' as activity_type,
          activity_datetime,
          district,
          town,
          uc,
          latitude,
          longitude,
          before_picture_url as picture_url,
          NULL as name_of_family_head,
          NULL as shop_house,
          name_address as address,
          NULL as locality,
          NULL as report_type,
          NULL as patient_name,
          NULL as tag_name,
          NULL as patient_place,
          NULL as category_name,
          name_address,
          dengue_larvae,
          tag,
          NULL as larva_source,
          NULL as case_response_id,
          NULL as tpv_type,
          NULL as auditor,
          NULL as auditee,
          NULL as tpv_score
        FROM dengue_simple_activities
        WHERE DATE(activity_datetime) BETWEEN $1 AND $2
          AND ${userCondition}
      )
      
      UNION ALL
      
      (
        SELECT 
          id,
          patient_id as activity_id,
          'patient' as activity_type,
          activity_submission_datetime as activity_datetime,
          district,
          town,
          uc,
          latitude,
          longitude,
          picture_url,
          NULL as name_of_family_head,
          NULL as shop_house,
          NULL as address,
          NULL as locality,
          NULL as report_type,
          patient_name,
          tag_name,
          patient_place,
          category_name,
          NULL as name_address,
          NULL as dengue_larvae,
          NULL as tag,
          NULL as larva_source,
          NULL as case_response_id,
          NULL as tpv_type,
          NULL as auditor,
          NULL as auditee,
          NULL as tpv_score
        FROM dts_patient_activities
        WHERE DATE(activity_submission_datetime) BETWEEN $1 AND $2
          AND ${userCondition}
      )
      
      UNION ALL
      
      (
        SELECT 
          sr as id,
          case_response_id as activity_id,
          'case_response' as activity_type,
          submission_date as activity_datetime,
          district,
          town,
          uc,
          NULL as latitude,
          NULL as longitude,
          picture_url,
          NULL as name_of_family_head,
          NULL as shop_house,
          NULL as address,
          NULL as locality,
          NULL as report_type,
          NULL as patient_name,
          NULL as tag_name,
          NULL as patient_place,
          NULL as category_name,
          NULL as name_address,
          NULL as dengue_larvae,
          tag,
          larva_source,
          case_response_id,
          NULL as tpv_type,
          NULL as auditor,
          NULL as auditee,
          NULL as tpv_score
        FROM dts_case_response_activities
        WHERE DATE(submission_date) BETWEEN $1 AND $2
          AND ${userCondition}
      )
      
      UNION ALL
      
      (
        SELECT 
          sr as id,
          job_id as activity_id,
          'tpv' as activity_type,
          tpv_activity_date_time as activity_datetime,
          district,
          town,
          uc,
          NULL as latitude,
          NULL as longitude,
          picture_url,
          NULL as name_of_family_head,
          NULL as shop_house,
          NULL as address,
          NULL as locality,
          NULL as report_type,
          NULL as patient_name,
          NULL as tag_name,
          NULL as patient_place,
          NULL as category_name,
          NULL as name_address,
          NULL as dengue_larvae,
          NULL as tag,
          NULL as larva_source,
          NULL as case_response_id,
          tpv_type,
          auditor,
          auditee,
          tpv_score
        FROM dts_tpv_activities
        WHERE DATE(tpv_activity_date_time) BETWEEN $1 AND $2
          AND ${tpvUserCondition}
      )
      
      ORDER BY activity_datetime DESC
      LIMIT $5 OFFSET $6
    `;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT id FROM dts_surv_activities
        WHERE DATE(activity_datetime) BETWEEN $1 AND $2
          AND ${userCondition}
        UNION ALL
        SELECT id FROM dengue_simple_activities
        WHERE DATE(activity_datetime) BETWEEN $1 AND $2
          AND ${userCondition}
        UNION ALL
        SELECT id FROM dts_patient_activities
        WHERE DATE(activity_submission_datetime) BETWEEN $1 AND $2
          AND ${userCondition}
        UNION ALL
        SELECT sr FROM dts_case_response_activities
        WHERE DATE(submission_date) BETWEEN $1 AND $2
          AND ${userCondition}
        UNION ALL
        SELECT sr FROM dts_tpv_activities
        WHERE DATE(tpv_activity_date_time) BETWEEN $1 AND $2
          AND ${tpvUserCondition}
      ) as all_activities
    `;

    const [activitiesResult, countResult] = await Promise.all([
      pool.query(activitiesQuery, [
        filters.dateFrom,
        filters.dateTo,
        employee.username,
        employee.new_username || employee.username, // Use username as fallback if new_username is null
        limit,
        offset,
      ]),
      pool.query(countQuery, [
        filters.dateFrom,
        filters.dateTo,
        employee.username,
        employee.new_username || employee.username, // Use username as fallback if new_username is null
      ]),
    ]);

    const activities: EmployeeActivity[] = activitiesResult.rows.map(
      (row): EmployeeActivity => ({
        id: row.id,
        activity_id: row.activity_id || "",
        activity_type: row.activity_type,
        activity_datetime: row.activity_datetime?.toISOString() || "",
        district: row.district,
        town: row.town,
        uc: row.uc,
        latitude: row.latitude ? parseFloat(row.latitude) : undefined,
        longitude: row.longitude ? parseFloat(row.longitude) : undefined,
        picture_url: row.picture_url,
        name_of_family_head: row.name_of_family_head,
        shop_house: row.shop_house,
        address: row.address,
        locality: row.locality,
        report_type: row.report_type,
        patient_name: row.patient_name,
        tag_name: row.tag_name,
        patient_place: row.patient_place,
        category_name: row.category_name,
        name_address: row.name_address,
        dengue_larvae: row.dengue_larvae,
        tag: row.tag,
        larva_source: row.larva_source,
        case_response_id: row.case_response_id,
        tpv_type: row.tpv_type,
        auditor: row.auditor,
        auditee: row.auditee,
        tpv_score: row.tpv_score,
      })
    );

    // Fetch container data for surveillance activities
    const surveillanceActivityIds = activities
      .filter((activity) => activity.activity_type === "surveillance")
      .map((activity) => activity.activity_id)
      .filter(Boolean);

    let containerDataByActivity: { [activityId: string]: ContainerData[] } = {};
    if (surveillanceActivityIds.length > 0) {
      containerDataByActivity = await getContainerDataForActivities(
        surveillanceActivityIds
      );
    }

    // Add container data and larva_found flag to surveillance activities
    const activitiesWithContainers = activities.map((activity) => {
      if (activity.activity_type === "surveillance" && activity.activity_id) {
        const containers = containerDataByActivity[activity.activity_id] || [];
        return {
          ...activity,
          containers,
          larva_found: hasLarvaFound(containers),
        };
      }
      return activity;
    });

    const totalRecords = parseInt(countResult.rows[0]?.total || "0");
    const hasMore = offset + activitiesWithContainers.length < totalRecords;

    return {
      activities: activitiesWithContainers,
      total_records: totalRecords,
      has_more: hasMore,
      page,
      limit,
    };
  } catch (error) {
    console.error("Error getting employee activities:", error);
    throw error;
  }
}

/**
 * Debug function to verify user matching across all activity tables
 */
export async function debugUserMatching(
  employeeId: number,
  dateFrom: string,
  dateTo: string
): Promise<void> {
  try {
    const employee = await getEmployeeById(employeeId);
    if (!employee) {
      console.log("Employee not found");
      return;
    }

    console.log("Employee Info:", {
      id: employee.id,
      name: employee.name,
      username: employee.username,
      new_username: employee.new_username,
    });

    const userCondition = `
      (submitted_by = $3 OR submitted_by = $4)
    `;

    const tpvUserCondition = `
      (auditee = $3 OR auditee = $4)
    `;

    // Test each table individually
    const tables = [
      {
        name: "dts_surv_activities",
        condition: userCondition,
        dateField: "activity_datetime",
      },
      {
        name: "dengue_simple_activities",
        condition: userCondition,
        dateField: "activity_datetime",
      },
      {
        name: "dts_patient_activities",
        condition: userCondition,
        dateField: "activity_submission_datetime",
      },
      {
        name: "dts_case_response_activities",
        condition: userCondition,
        dateField: "submission_date",
      },
      {
        name: "dts_tpv_activities",
        condition: tpvUserCondition,
        dateField: "tpv_activity_date_time",
      },
    ];

    for (const table of tables) {
      const query = `
        SELECT COUNT(*) as count
        FROM ${table.name}
        WHERE DATE(${table.dateField}) BETWEEN $1 AND $2
          AND ${table.condition}
      `;

      const result = await pool.query(query, [
        dateFrom,
        dateTo,
        employee.username,
        employee.new_username || employee.username,
      ]);

      console.log(`${table.name}: ${result.rows[0].count} activities found`);
    }
  } catch (error) {
    console.error("Error in debug user matching:", error);
  }
}

/**
 * Get employee performance data (combined response)
 */
export async function getEmployeePerformance(
  filters: EmployeePerformanceFilters
): Promise<EmployeePerformanceResponse> {
  try {
    const employee = await getEmployeeById(filters.employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    const [dailyCounts, activitySummary] = await Promise.all([
      getDailyActivityCounts(filters),
      getActivitySummary(filters),
    ]);

    const totalRecords = dailyCounts.reduce(
      (sum, day) => sum + day.total_activities,
      0
    );

    return {
      employee,
      daily_counts: dailyCounts,
      activity_summary: activitySummary,
      total_records: totalRecords,
    };
  } catch (error) {
    console.error("Error getting employee performance:", error);
    throw error;
  }
}
