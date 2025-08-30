"use client";

/**
 * Outdoor Surveillance Page - Performance Optimized
 * 
 * DATA FETCHING STRATEGY:
 * - Server requests ONLY for: date, town, UC changes
 * - Local filtering for: field worker selection, positive cases filter
 * - Town changes only fetch UCs (cascading dropdown)
 * 
 * FILTERING CAPABILITIES:
 * - Field worker selection: Shows activities from specific worker
 * - Positive cases filter: Shows only activities with positive containers
 * - Combined filtering: Both filters can work together
 * - Clickable stats cards: Houses/Containers Positive cards filter to positive cases
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Memoized calculations for filtered activities and stats
 * - Efficient container data grouping to avoid repeated filtering
 * - Preserved field worker selection across data refreshes when possible
 * - Callback memoization to prevent unnecessary re-renders
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import FilterPanel from "@/components/FilterPanel";
import FieldWorkerCards from "@/components/FieldWorkerCards";
import DynamicSurveillanceMap from "@/components/DynamicSurveillanceMap";
import SurveillanceFeed from "@/components/SurveillanceFeed";
import {
  SurveillanceActivity,
  SurveillanceFilters,
  ContainerData,
  User,
} from "@/types/surveillance";
import { outdoorSurveillanceApi } from "@/services/api";


export default function OutdoorSurveillancePage() {
  const [activities, setActivities] = useState<SurveillanceActivity[]>([]);
  const [containerData, setContainerData] = useState<ContainerData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SurveillanceFilters>({
    date: new Date().toISOString().split("T")[0],
    townCode: undefined,
    ucCode: undefined,
    fieldWorker: undefined, // Keep for API compatibility but don't use for filtering
  });
  const [selectedFieldWorker, setSelectedFieldWorker] = useState<
    string | undefined
  >(undefined);
  const [showOnlyPositive, setShowOnlyPositive] = useState(false);

  // Memoized filtered activities based on field worker selection
  const filteredActivities = useMemo(() => {
    const startTime = performance.now();
    let result;
    
    if (!selectedFieldWorker) {
      result = activities;
      console.log('🔍 Local Filter: Showing all activities (' + activities.length + ')');
    } else {
      result = activities.filter(
        (activity) => (activity.submitted_by || activity.Submitted_by) === selectedFieldWorker
      );
      console.log('🔍 Local Filter: Field worker "' + selectedFieldWorker + '" -> ' + result.length + '/' + activities.length + ' activities');
    }
    
    const duration = performance.now() - startTime;
    console.log('⚡ Local filtering took:', duration.toFixed(2) + 'ms');
    return result;
  }, [activities, selectedFieldWorker]);

  // Memoized filtered activities with positive container filter
  const finalFilteredActivities = useMemo(() => {
    if (!showOnlyPositive) {
      return filteredActivities;
    }
    
    const startTime = performance.now();
    const positiveActivities = filteredActivities.filter(activity => {
      const activityId = activity.activity_id || activity.Activity_ID || '';
      const activityContainers = containerData.filter(
        container => (container.activity_id || container.Activity_ID) === activityId
      );
      return activityContainers.some(container => 
        (container.positive ?? container.Positive ?? 0) > 0
      );
    });
    
    const duration = performance.now() - startTime;
    console.log('🔍 Positive filter: ' + positiveActivities.length + '/' + filteredActivities.length + ' activities have positive containers');
    console.log('⚡ Positive filtering took:', duration.toFixed(2) + 'ms');
    
    return positiveActivities;
  }, [filteredActivities, containerData, showOnlyPositive]);

  // Memoized container data for filtered activities
  const filteredContainerData = useMemo(() => {
    if (finalFilteredActivities.length === 0) return [];
    
    const activityIds = new Set(
      finalFilteredActivities.map(activity => activity.activity_id || activity.Activity_ID)
    );
    
    return containerData.filter(container => 
      activityIds.has(container.activity_id || container.Activity_ID || '')
    );
  }, [finalFilteredActivities, containerData]);

  // Memoized summary statistics
  const summaryStats = useMemo(() => {
    const startTime = performance.now();
    
    const housesChecked = filteredActivities.length;
    
    let housesPositive = 0;
    let containersChecked = 0;
    let containersPositive = 0;
    
    // Group containers by activity ID for efficient lookup
    const containersByActivity = new Map<string, ContainerData[]>();
    containerData.forEach(container => {
      const activityId = container.activity_id || container.Activity_ID || '';
      const belongsToFilteredActivity = filteredActivities.some(activity => 
        (activity.activity_id || activity.Activity_ID) === activityId
      );
      
      if (belongsToFilteredActivity) {
        if (!containersByActivity.has(activityId)) {
          containersByActivity.set(activityId, []);
        }
        containersByActivity.get(activityId)!.push(container);
      }
    });
    
    // Calculate stats for each activity
    filteredActivities.forEach(activity => {
      const activityId = activity.activity_id || activity.Activity_ID || '';
      const activityContainers = containersByActivity.get(activityId) || [];
      
      // Check if this house has any positive containers
      const hasPositiveContainers = activityContainers.some(container => 
        (container.positive ?? container.Positive ?? 0) > 0
      );
      if (hasPositiveContainers) {
        housesPositive++;
      }
      
      // Sum up containers checked and positive
      activityContainers.forEach(container => {
        containersChecked += (container.checked ?? container.Checked ?? 0);
        containersPositive += (container.positive ?? container.Positive ?? 0);
      });
    });
    
    const duration = performance.now() - startTime;
    console.log('📈 Stats calculation took:', duration.toFixed(2) + 'ms');
    
    return {
      housesChecked,
      housesPositive,
      containersChecked,
      containersPositive
    };
  }, [filteredActivities, containerData]);

  const fetchSurveillanceData = useCallback(async (newFilters: SurveillanceFilters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await outdoorSurveillanceApi.getSurveillanceData(newFilters);
      setActivities(response.combined_data || []);
      setContainerData(response.container_data || []);
      setUsers(response.users || []);
      
      // Reset field worker selection when new data is loaded
      // but only if the current selection is not valid anymore
      if (selectedFieldWorker && response.users) {
        const userExists = response.users.some(user => 
          (user.username || user.username_prefix) === selectedFieldWorker
        );
        if (!userExists) {
          setSelectedFieldWorker(undefined);
        }
      }
      
      // Reset positive filter when new data is loaded
      setShowOnlyPositive(false);
    } catch (err) {
      setError("Failed to fetch outdoor surveillance data. Please try again.");
      console.error("Error fetching outdoor surveillance data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedFieldWorker]);

  const handleFilterChange = useCallback((newFilters: SurveillanceFilters) => {
    setFilters(newFilters);
    // Only fetch data if UC is selected and one of the key filters changed
    if (
      newFilters.ucCode && (
        newFilters.date !== filters.date ||
        newFilters.townCode !== filters.townCode ||
        newFilters.ucCode !== filters.ucCode
      )
    ) {
      console.log('🚀 Fetching data due to date/town/UC change:', {
        oldFilters: { date: filters.date, townCode: filters.townCode, ucCode: filters.ucCode },
        newFilters: { date: newFilters.date, townCode: newFilters.townCode, ucCode: newFilters.ucCode }
      });
      fetchSurveillanceData(newFilters);
    } else {
      console.log('✅ No server request needed - filters unchanged or UC not selected');
    }
  }, [filters.date, filters.townCode, filters.ucCode, fetchSurveillanceData]);

  const handleFieldWorkerSelect = useCallback((fieldWorker: string | undefined) => {
    console.log('👥 Field worker selection changed (local filter only):', fieldWorker || 'All workers');
    setSelectedFieldWorker(fieldWorker);
    // Reset positive filter when changing field worker
    setShowOnlyPositive(false);
  }, []);

  const handlePositiveFilter = useCallback(() => {
    const newState = !showOnlyPositive;
    console.log('🔴 Positive filter toggled:', newState ? 'Showing only positive' : 'Showing all');
    setShowOnlyPositive(newState);
  }, [showOnlyPositive]);



  // Initial data fetch only if UC is already selected
  useEffect(() => {
    if (filters.ucCode) {
      console.log('Initial data fetch on mount for UC:', filters.ucCode);
      fetchSurveillanceData(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🌿</span>
                </div>
                <span className="text-xl font-semibold text-gray-900">DTS</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Outdoor Vector Surveillance
                </h1>
                <p className="text-sm text-gray-600">
                  District Health Authority Rawalpindi
                </p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link
                href="/"
                className="text-gray-600 hover:text-orange-600 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/indoor-surveillance"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                Indoor Surveillance
              </Link>
              <Link
                href="/outdoor-surveillance"
                className="text-orange-600 font-medium"
              >
                Outdoor Surveillance
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter Panel */}
        <div className="mb-6">
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            loading={loading}
            fieldWorkers={[]} // Don't show field worker dropdown
          />
        </div>



        {/* Field Worker Cards */}
        {activities.length > 0 && (
          <div className="mb-6">
            <FieldWorkerCards
              activities={activities}
              users={users}
              selectedFieldWorker={selectedFieldWorker}
              onFieldWorkerSelect={handleFieldWorkerSelect}
              loading={loading}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-400 mr-3">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <span className="ml-3 text-gray-600">
              Loading outdoor surveillance data...
            </span>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Show message when no UC is selected */}
            {!filters.ucCode && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
                <div className="text-orange-400 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-orange-900 mb-2">
                  Select Union Council to Load Data
                </h3>
                <p className="text-orange-700">
                  Please select a town and union council from the filters above to view outdoor surveillance activities.
                </p>
              </div>
            )}

            {/* Stats Summary - only show when there's data */}
            {filters.ucCode && activities.length > 0 && (
              <div className="space-y-4 mb-6">
                {/* Active Filter Indicator */}
                {(selectedFieldWorker || showOnlyPositive) && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-orange-700">
                        <span>📊</span>
                        <span>Active filters:</span>
                        {selectedFieldWorker && (
                          <span className="bg-orange-100 px-2 py-1 rounded text-xs">
                            Field Worker: {selectedFieldWorker}
                          </span>
                        )}
                        {showOnlyPositive && (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                            Only Positive Cases
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFieldWorker(undefined);
                          setShowOnlyPositive(false);
                        }}
                        className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Houses Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-2xl font-bold text-orange-600">
                      {summaryStats.housesChecked}
                    </div>
                    <div className="text-sm text-gray-600">Houses Checked</div>
                  </div>
                  <button
                    onClick={handlePositiveFilter}
                    className={`bg-white rounded-lg shadow p-6 text-left transition-all duration-200 hover:shadow-md ${
                      showOnlyPositive ? 'ring-2 ring-red-500 bg-red-50' : 'hover:bg-gray-50'
                    } ${summaryStats.housesPositive > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                    disabled={summaryStats.housesPositive === 0}
                  >
                    <div
                      className={`text-2xl font-bold ${
                        summaryStats.housesPositive > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {summaryStats.housesPositive}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">Houses Positive</div>
                      {summaryStats.housesPositive > 0 && (
                        <div className="text-xs text-orange-600">
                          {showOnlyPositive ? 'Filtered' : 'Click to filter'}
                        </div>
                      )}
                    </div>
                  </button>
                </div>

                {/* Containers Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-2xl font-bold text-purple-600">
                      {summaryStats.containersChecked}
                    </div>
                    <div className="text-sm text-gray-600">
                      Containers Checked
                    </div>
                  </div>
                  <button
                    onClick={handlePositiveFilter}
                    className={`bg-white rounded-lg shadow p-6 text-left transition-all duration-200 hover:shadow-md ${
                      showOnlyPositive ? 'ring-2 ring-red-500 bg-red-50' : 'hover:bg-gray-50'
                    } ${summaryStats.containersPositive > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                    disabled={summaryStats.containersPositive === 0}
                  >
                    <div
                      className={`text-2xl font-bold ${
                        summaryStats.containersPositive > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {summaryStats.containersPositive}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Containers Positive
                      </div>
                      {summaryStats.containersPositive > 0 && (
                        <div className="text-xs text-orange-600">
                          {showOnlyPositive ? 'Filtered' : 'Click to filter'}
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* No data message when UC is selected but no data found */}
            {filters.ucCode && activities.length === 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No surveillance activities found
                </h3>
                <p className="text-gray-600">
                  No outdoor surveillance activities found for the selected date and location filters.
                </p>
              </div>
            )}

            {/* Map Component */}
            {finalFilteredActivities.length > 0 && (
              <div className="mb-6">
                <DynamicSurveillanceMap 
                  activities={finalFilteredActivities} 
                  containerData={filteredContainerData}
                />
              </div>
            )}

            {/* Feed Component */}
            {activities.length > 0 && (
              <SurveillanceFeed
                activities={finalFilteredActivities}
                containerData={filteredContainerData}
                loading={loading}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">🌿</span>
              </div>
              <span className="text-xl font-semibold">
                District Health Authority Rawalpindi
              </span>
            </div>
            <p className="text-gray-400">
              Powered by Epidemics Prevention & Control Cell
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}