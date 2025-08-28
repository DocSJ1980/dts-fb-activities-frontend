import { NextResponse } from "next/server";
import pool from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Test database connection
    const testQuery = "SELECT NOW() as current_time";
    const result = await pool.query(testQuery);

    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'dengue_simple_activities',
        'dts_patient_activities', 
        'dts_surv_activities',
        'dts_containers',
        'dts_case_response_activities',
        'dts_tpv_activities'
      )
      ORDER BY table_name
    `;
    const tablesResult = await pool.query(tablesQuery);

    // Get sample data from surveillance activities
    const sampleQuery = `
      SELECT uc, COUNT(*) as count
      FROM dts_surv_activities
      GROUP BY uc
      ORDER BY count DESC
      LIMIT 10
    `;
    const sampleResult = await pool.query(sampleQuery);

    // Get sample data from other tables
    const patientQuery = `
      SELECT uc, COUNT(*) as count
      FROM dts_patient_activities
      GROUP BY uc
      ORDER BY count DESC
      LIMIT 5
    `;
    const patientResult = await pool.query(patientQuery);

    const dengueQuery = `
      SELECT uc, COUNT(*) as count
      FROM dengue_simple_activities
      GROUP BY uc
      ORDER BY count DESC
      LIMIT 5
    `;
    const dengueResult = await pool.query(dengueQuery);

    return NextResponse.json({
      status: "success",
      database_time: result.rows[0].current_time,
      available_tables: tablesResult.rows.map((row) => row.table_name),
      sample_data: {
        surveillance_ucs: sampleResult.rows,
        patient_ucs: patientResult.rows,
        dengue_ucs: dengueResult.rows,
      },
      message: "Database connection successful",
    });
  } catch (error) {
    console.error("Database debug error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Database connection failed",
      },
      { status: 500 }
    );
  }
}
