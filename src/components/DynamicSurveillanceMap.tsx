'use client';

import dynamic from 'next/dynamic';
import { SurveillanceActivity } from '@/types/surveillance';

// Dynamically import the map component with no SSR
const SurveillanceMap = dynamic(() => import('./SurveillanceMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Activity Locations</h2>
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading map...</span>
      </div>
    </div>
  ),
});

interface DynamicSurveillanceMapProps {
  activities: SurveillanceActivity[];
}

export default function DynamicSurveillanceMap({ activities }: DynamicSurveillanceMapProps) {
  return <SurveillanceMap activities={activities} />;
}
