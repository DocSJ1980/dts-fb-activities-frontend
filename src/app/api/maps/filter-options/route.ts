import { NextRequest, NextResponse } from 'next/server';
import { getFilterOptions } from '@/lib/maps-queries';
import { TableName } from '@/types/maps';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table') as TableName;
    const uc = searchParams.get('uc');

    if (!table) {
      return NextResponse.json(
        { error: 'Table parameter is required' },
        { status: 400 }
      );
    }

    if (!Object.values(TableName).includes(table)) {
      return NextResponse.json(
        { error: 'Invalid table name' },
        { status: 400 }
      );
    }

    // Define available filter fields for each table
    const tableFields: Record<TableName, string[]> = {
      [TableName.DENGUE_SIMPLE_ACTIVITIES]: ['tag', 'dengue_larvae', 'district', 'town', 'submitted_by'],
      [TableName.DTS_PATIENT_ACTIVITIES]: ['tag_name', 'category_name', 'district', 'town', 'submitted_by'],
      [TableName.DTS_SURV_ACTIVITIES]: ['report_type', 'district', 'town', 'submitted_by'],
      [TableName.DTS_CONTAINERS]: ['container_tag'],
      [TableName.DTS_CASE_RESPONSE_ACTIVITIES]: ['larva_source', 'district', 'town', 'submitted_by'],
      [TableName.DTS_TPV_ACTIVITIES]: ['tpv_type', 'auditor', 'district', 'town'],
    };

    const fields = tableFields[table];
    if (!fields) {
      return NextResponse.json(
        { error: 'No filter fields defined for this table' },
        { status: 400 }
      );
    }

    // Get filter options for all fields in parallel
    const optionsPromises = fields.map(async (field) => {
      const options = await getFilterOptions(table, field, uc || undefined);
      return { field, options };
    });

    const results = await Promise.all(optionsPromises);
    
    // Convert to object format
    const filterOptions: Record<string, unknown[]> = {};
    results.forEach(({ field, options }) => {
      filterOptions[field] = options;
    });

    return NextResponse.json(filterOptions);

  } catch (error) {
    console.error('Error in filter options API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
