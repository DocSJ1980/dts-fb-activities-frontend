"use client";

import dynamic from "next/dynamic";
import { EmployeeActivity } from "@/types/employee-performance";

// Dynamically import the map component with no SSR
const EmployeePerformanceMap = dynamic(
  () => import("./EmployeePerformanceMap"),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Activity Locations</h3>
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading map...</span>
        </div>
      </div>
    ),
  }
);

interface DynamicEmployeePerformanceMapProps {
  activities: EmployeeActivity[];
  selectedActivityType?: string | null;
  loading?: boolean;
  title?: string;
}

export default function DynamicEmployeePerformanceMap(props: DynamicEmployeePerformanceMapProps) {
  return <EmployeePerformanceMap {...props} />;
}