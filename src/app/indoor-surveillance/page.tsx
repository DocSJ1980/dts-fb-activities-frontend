"use client";

import { useState, useEffect } from "react";
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
import { surveillanceApi } from "@/services/api";
import { generateSurveillancePDF } from "@/utils/pdfGenerator";

export default function IndoorSurveillancePage() {
  const [activities, setActivities] = useState<SurveillanceActivity[]>([]);
  const [containerData, setContainerData] = useState<ContainerData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filteredActivities, setFilteredActivities] = useState<
    SurveillanceActivity[]
  >([]);
  const [filters, setFilters] = useState<SurveillanceFilters>({
    date: new Date().toISOString().split("T")[0],
    townCode: undefined,
    ucCode: undefined,
    fieldWorker: undefined, // Keep for API compatibility but don't use for filtering
  });
  const [selectedFieldWorker, setSelectedFieldWorker] = useState<
    string | undefined
  >(undefined);

  const fetchSurveillanceData = async (newFilters: SurveillanceFilters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await surveillanceApi.getSurveillanceData(newFilters);
      setActivities(response.combined_data || []);
      setContainerData(response.container_data || []);
      setUsers(response.users || []);
    } catch (err) {
      setError("Failed to fetch surveillance data. Please try again.");
      console.error("Error fetching surveillance data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: SurveillanceFilters) => {
    setFilters(newFilters);
    // Only fetch new data if town, UC, or date changed (not field worker)
    if (
      newFilters.date !== filters.date ||
      newFilters.townCode !== filters.townCode ||
      newFilters.ucCode !== filters.ucCode
    ) {
      fetchSurveillanceData(newFilters);
    }
  };

  const handleFieldWorkerSelect = (fieldWorker: string | undefined) => {
    setSelectedFieldWorker(fieldWorker);
  };

  const handleExportPDF = async () => {
    try {
      const doc = await generateSurveillancePDF({
        activities: filteredActivities,
        containerData,
        users,
        filters: {
          date: filters.date,
          townCode: filters.townCode?.toString(),
          ucCode: filters.ucCode?.toString(),
        },
        selectedFieldWorker,
      });

      // Generate filename with date and filters
      const dateStr = new Date(filters.date).toISOString().split("T")[0];
      let filename = `surveillance-report-${dateStr}`;
      if (filters.townCode) filename += `-${filters.townCode}`;
      if (filters.ucCode) filename += `-${filters.ucCode}`;
      if (selectedFieldWorker) filename += `-${selectedFieldWorker}`;
      filename += ".pdf";

      doc.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  // Filter activities based on field worker selection
  useEffect(() => {
    if (!selectedFieldWorker) {
      setFilteredActivities(activities);
    } else {
      setFilteredActivities(
        activities.filter(
          (activity) => activity.Submitted_by === selectedFieldWorker
        )
      );
    }
  }, [activities, selectedFieldWorker]);

  // Calculate summary stats
  const housesChecked = filteredActivities.length;
  const housesPositive = filteredActivities.filter((activity) => {
    const activityContainers = containerData.filter(
      (container) => container.Activity_ID === activity.Activity_ID
    );
    return activityContainers.some((container) => container.Positive > 0);
  }).length;
  const containersChecked = filteredActivities.reduce((total, activity) => {
    const activityContainers = containerData.filter((container) => {
      return container.Activity_ID === activity.Activity_ID;
    });
    return (
      total +
      activityContainers.reduce((sum, container) => sum + container.Checked, 0)
    );
  }, 0);

  const containersPositive = filteredActivities.reduce((total, activity) => {
    const activityContainers = containerData.filter((container) => {
      return container.Activity_ID === activity.Activity_ID;
    });
    return (
      total +
      activityContainers.reduce((sum, container) => sum + container.Positive, 0)
    );
  }, 0);

  // Initial data fetch
  useEffect(() => {
    fetchSurveillanceData(filters);
  }, [filters]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🦟</span>
                </div>
                <span className="text-xl font-semibold text-gray-900">DTS</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Indoor Vector Surveillance
                </h1>
                <p className="text-sm text-gray-600">
                  District Health Authority Rawalpindi
                </p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link
                href="/"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/indoor-surveillance"
                className="text-blue-600 font-medium"
              >
                Indoor Surveillance
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

        {/* Export Button */}
        {!loading && !error && filteredActivities.length > 0 && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export PDF Report
            </button>
          </div>
        )}

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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">
              Loading surveillance data...
            </span>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Stats Summary */}
            <div className="space-y-4 mb-6">
              {/* Houses Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {housesChecked}
                  </div>
                  <div className="text-sm text-gray-600">Houses Checked</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div
                    className={`text-2xl font-bold ${
                      housesPositive > 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {housesPositive}
                  </div>
                  <div className="text-sm text-gray-600">Houses Positive</div>
                </div>
              </div>

              {/* Containers Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-2xl font-bold text-purple-600">
                    {containersChecked}
                  </div>
                  <div className="text-sm text-gray-600">
                    Containers Checked
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div
                    className={`text-2xl font-bold ${
                      containersPositive > 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {containersPositive}
                  </div>
                  <div className="text-sm text-gray-600">
                    Containers Positive
                  </div>
                </div>
              </div>
            </div>

            {/* Map Component */}
            {filteredActivities.length > 0 && (
              <div className="mb-6">
                <DynamicSurveillanceMap activities={filteredActivities} />
              </div>
            )}

            {/* Feed Component */}
            <SurveillanceFeed
              activities={filteredActivities}
              containerData={containerData}
              loading={loading}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">🦟</span>
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
