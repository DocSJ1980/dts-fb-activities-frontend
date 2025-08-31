"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  EmployeeActivity, 
  EmployeePerformanceFilters 
} from "@/types/employee-performance";
import { employeePerformanceApiService } from "@/services/api";
import EmployeeActivityCard from "@/components/ui/EmployeeActivityCard";

interface EmployeeActivityFeedProps {
  filters: EmployeePerformanceFilters;
  selectedActivityType?: string | null;
  refreshTrigger?: number;
}

export default function EmployeeActivityFeed({
  filters,
  selectedActivityType = null,
  refreshTrigger = 0,
}: EmployeeActivityFeedProps) {
  const [activities, setActivities] = useState<EmployeeActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load all activities for the selected date range (using a high page size)
      const response = await employeePerformanceApiService.getEmployeeActivities(
        filters,
        1,
        1000 // Load up to 1000 activities to get all data for the selected range
      );

      let filteredActivities = response.activities;
      
      // Filter by activity type if selected
      if (selectedActivityType) {
        if (selectedActivityType === 'larva_detected') {
          // For larva_detected, show only surveillance activities with positive containers
          filteredActivities = response.activities.filter(
            activity => activity.activity_type === 'surveillance' && activity.larva_found === true
          );
        } else {
          filteredActivities = response.activities.filter(
            activity => activity.activity_type === selectedActivityType
          );
        }
      }

      setActivities(filteredActivities);
    } catch (err) {
      console.error("Error loading activities:", err);
      setError("Failed to load activities. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filters, selectedActivityType]);

  // Load activities when filters or trigger change
  useEffect(() => {
    loadActivities();
  }, [loadActivities, refreshTrigger]);

  const getActivityLabel = (activityType: string) => {
    switch (activityType) {
      case 'surveillance':
        return 'Surveillance';
      case 'simple':
        return 'Simple Activity';
      case 'patient':
        return 'Patient Activity';
      case 'case_response':
        return 'Case Response';
      case 'tpv':
        return 'TPV Activity';
      case 'larva_detected':
        return 'Larva Detected';
      default:
        return 'Activity';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
        <div className="text-red-400 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Activities</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadActivities}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-gray-400 text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Activities Found</h3>
        <p className="text-gray-500">
          {selectedActivityType 
            ? `No ${getActivityLabel(selectedActivityType).toLowerCase()} activities found for the selected date range.`
            : "No activities found for the selected employee and date range."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Activity Feed
          {selectedActivityType && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              - {getActivityLabel(selectedActivityType)} only
            </span>
          )}
        </h3>
        <div className="text-sm text-gray-600">
          <span className="font-medium">{activities.length}</span> activities found
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-6">
        {activities.map((activity, index) => (
          <EmployeeActivityCard
            key={`${activity.activity_type}-${activity.id}-${index}`}
            activity={activity}
          />
        ))}
      </div>

      {/* Total Results */}
      {activities.length > 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          Showing all {activities.length} activities for the selected date range
        </div>
      )}
    </div>
  );
}