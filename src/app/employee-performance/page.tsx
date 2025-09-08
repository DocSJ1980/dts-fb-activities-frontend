"use client";

/**
 * Employee Performance Page - Individual Employee Analytics
 * 
 * FEATURES:
 * - Employee search and selection with dropdown
 * - Date range filter (default 30 days from today)
 * - GitHub-style contribution grid showing daily activity counts
 * - Activity summary cards for each activity type
 * - Interactive map visualization of employee activities
 * - Complete activity feed showing all activities for selected date range
 * 
 * DATA SOURCES:
 * - dts_surv_activities: Surveillance activities
 * - dengue_simple_activities: Simple dengue activities
 * - dts_patient_activities: Patient activities
 * - dts_case_response_activities: Case response activities
 * - dts_tpv_activities: TPV activities
 * 
 * FILTERING STRATEGY:
 * - Server-side filtering by employee, date range
 * - Local filtering by activity type selection
 * - Map updates based on selected activity type
 * - Activity feed filters by selected activity type
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CalendarDays, User, TrendingUp, Map, List } from "lucide-react";
import { 
  Employee, 
  EmployeePerformanceFilters,
  EmployeePerformanceResponse,
  EmployeeActivity
} from "@/types/employee-performance";
import { employeePerformanceApiService } from "@/services/api";
import EmployeeSearchDropdown from "@/components/ui/EmployeeSearchDropdown";
import ContributionGrid from "@/components/ui/ContributionGrid";
import ActivitySummaryCards from "@/components/ui/ActivitySummaryCards";
import DynamicEmployeePerformanceMap from "@/components/ui/DynamicEmployeePerformanceMap";
import EmployeeActivityFeed from "@/components/ui/EmployeeActivityFeed";
import EmployeePerformanceTable from "@/components/ui/EmployeePerformanceTable";

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';

export default function EmployeePerformancePage() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [performanceData, setPerformanceData] = useState<EmployeePerformanceResponse | null>(null);
  const [activities, setActivities] = useState<EmployeeActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivityType, setSelectedActivityType] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Date range state (default 30 days from today)
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    return {
      from: thirtyDaysAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0],
    };
  });

  // Active view state for mobile responsiveness
  const [activeView, setActiveView] = useState<'overview' | 'map' | 'feed'>('overview');

  const fetchPerformanceData = useCallback(async () => {
    if (!selectedEmployee) {
      setPerformanceData(null);
      setActivities([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const filters: EmployeePerformanceFilters = {
        employeeId: selectedEmployee.id,
        username: selectedEmployee.username,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
      };

      const [performanceResponse, activitiesResponse] = await Promise.all([
        employeePerformanceApiService.getEmployeePerformance(filters),
        employeePerformanceApiService.getEmployeeActivities(filters, 1, 1000), // Load all activities for the date range
      ]);

      setPerformanceData(performanceResponse);
      setActivities(activitiesResponse.activities);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error fetching performance data:", err);
      setError("Failed to fetch employee performance data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedEmployee, dateRange]);

  // Fetch data when employee or date range changes
  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  const handleDateRangeChange = (field: 'from' | 'to', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleActivityTypeClick = (activityType: string) => {
    setSelectedActivityType(
      selectedActivityType === activityType ? null : activityType
    );
  };

  const getDisplayName = (employee: Employee) => {
    if (employee.name && employee.name.trim()) {
      return employee.name;
    }
    return employee.username;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">👨‍💼</span>
                </div>
                <span className="text-xl font-semibold text-gray-900">DTS</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Employee Performance Analytics
                </h1>
                <p className="text-sm text-gray-600">
                  District Health Authority Rawalpindi
                </p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link
                href="/"
                className="text-gray-600 hover:text-purple-600 transition-colors"
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
                className="text-gray-600 hover:text-orange-600 transition-colors"
              >
                Outdoor Surveillance
              </Link>
              <Link
                href="/employee-performance"
                className="text-purple-600 font-medium"
              >
                Employee Performance
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Employee Selection and Date Range Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Employee Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Select Employee
              </label>
              <EmployeeSearchDropdown
                selectedEmployee={selectedEmployee}
                onEmployeeSelect={setSelectedEmployee}
                placeholder="Search by name or username..."
                disabled={loading}
              />
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarDays className="w-4 h-4 inline mr-1" />
                Date From
              </label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => handleDateRangeChange('from', e.target.value)}
                disabled={loading}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:opacity-50 text-gray-900"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarDays className="w-4 h-4 inline mr-1" />
                Date To
              </label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => handleDateRangeChange('to', e.target.value)}
                disabled={loading}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:opacity-50 text-gray-900"
              />
            </div>
          </div>

          {/* Selected Employee Info */}
          {selectedEmployee && (
            <div className="mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 truncate">
                    {getDisplayName(selectedEmployee)}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    @{selectedEmployee.username}
                    {selectedEmployee.designation && (
                      <span className="hidden sm:inline ml-2">• {selectedEmployee.designation}</span>
                    )}
                    {selectedEmployee.town && (
                      <span className="hidden sm:inline ml-2">• {selectedEmployee.town}</span>
                    )}
                  </div>
                  {/* Mobile: Show designation and town on separate lines */}
                  <div className="sm:hidden text-xs text-gray-500 mt-1">
                    {selectedEmployee.designation && (
                      <div>{selectedEmployee.designation}</div>
                    )}
                    {selectedEmployee.town && (
                      <div>{selectedEmployee.town}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {!selectedEmployee ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">👨‍💼</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Select an Employee
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Choose an employee from the dropdown above to view their performance analytics,
              activity timeline, and detailed insights.
            </p>
          </div>
        ) : loading ? (
          <div className="space-y-8">
            {/* Loading skeletons */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-5 gap-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error Loading Data
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchPerformanceData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : performanceData ? (
          <div className="space-y-8">
            {/* Mobile View Tabs */}
            <div className="lg:hidden">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveView('overview')}
                  className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeView === 'overview'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveView('map')}
                  className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeView === 'map'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Map className="w-4 h-4 mr-1" />
                  Map
                </button>
                <button
                  onClick={() => setActiveView('feed')}
                  className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeView === 'feed'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4 mr-1" />
                  Activities
                </button>
              </div>
            </div>

            {/* Overview Section */}
            <div className={`space-y-8 ${
              activeView === 'overview' ? 'block' : 'hidden lg:block'
            }`}>
              {/* GitHub-style Contribution Grid - Independent of date range */}
              <ContributionGrid
                employeeId={selectedEmployee.id}
                username={selectedEmployee.username}
              />

              {/* Activity Summary Cards */}
              <ActivitySummaryCards
                activitySummary={performanceData.activity_summary}
                onCardClick={handleActivityTypeClick}
              />
              
              {/* Daily Activity Table */}
              <EmployeePerformanceTable
                activities={activities}
              />
            </div>

            {/* Map Section */}
            <div className={`${
              activeView === 'map' ? 'block' : 'hidden lg:block'
            }`}>
              <DynamicEmployeePerformanceMap
                activities={activities}
                selectedActivityType={selectedActivityType}
                title="Activity Locations"
              />
            </div>

            {/* Activity Feed Section */}
            <div>
              <EmployeeActivityFeed
                filters={{
                  employeeId: selectedEmployee.id,
                  username: selectedEmployee.username,
                  dateFrom: dateRange.from,
                  dateTo: dateRange.to,
                }}
                selectedActivityType={selectedActivityType}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Data Available
            </h3>
            <p className="text-gray-500">
              No performance data found for the selected employee and date range.
            </p>
          </div>
        )}      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">👨‍💼</span>
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