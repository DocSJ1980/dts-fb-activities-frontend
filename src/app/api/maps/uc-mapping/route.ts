import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inputUC = searchParams.get('uc');

    if (!inputUC) {
      return NextResponse.json(
        { error: 'UC parameter is required' },
        { status: 400 }
      );
    }

    // Test the fuzzy matching query
    const testQuery = `
      SELECT DISTINCT uc, 
        CASE 
          WHEN LOWER(REPLACE(uc, '-', ' ')) = LOWER(REPLACE($1, '-', ' ')) THEN 'normalized_match'
          WHEN LOWER(uc) = LOWER($1) THEN 'case_insensitive_match'
          WHEN uc = $1 THEN 'exact_match'
          ELSE 'no_match'
        END as match_type
      FROM dts_patient_activities
      WHERE (
        LOWER(REPLACE(uc, '-', ' ')) = LOWER(REPLACE($1, '-', ' '))
        OR LOWER(uc) = LOWER($1)
        OR uc = $1
      )
      ORDER BY match_type, uc
    `;

    const result = await pool.query(testQuery, [inputUC]);

    // Also get all UCs that are similar
    const similarQuery = `
      SELECT DISTINCT uc, COUNT(*) as record_count
      FROM dts_patient_activities
      WHERE uc ILIKE $1
      GROUP BY uc
      ORDER BY record_count DESC
      LIMIT 10
    `;

    const similarResult = await pool.query(similarQuery, [`%${inputUC.replace('-', ' ')}%`]);

    // Get all unique UCs for reference
    const allUCsQuery = `
      SELECT DISTINCT uc, COUNT(*) as record_count
      FROM dts_patient_activities
      GROUP BY uc
      ORDER BY record_count DESC
      LIMIT 20
    `;

    const allUCsResult = await pool.query(allUCsQuery);

    return NextResponse.json({
      input_uc: inputUC,
      normalized_input: inputUC.toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim(),
      exact_matches: result.rows,
      similar_matches: similarResult.rows,
      top_ucs: allUCsResult.rows,
      query_used: testQuery.replace(/\$1/g, `'${inputUC}'`)
    });

  } catch (error) {
    console.error('UC mapping error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
