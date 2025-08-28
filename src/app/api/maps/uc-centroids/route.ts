import { NextResponse } from 'next/server';
import { getUCCentroids } from '@/lib/maps-queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const centroids = await getUCCentroids();
    return NextResponse.json(centroids);
  } catch (error) {
    console.error('Error in UC centroids API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
