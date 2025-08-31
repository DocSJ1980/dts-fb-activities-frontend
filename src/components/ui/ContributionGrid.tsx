"use client";

import { useState, useEffect, useMemo } from "react";
import { DailyActivityCount } from "@/types/employee-performance";
import { employeePerformanceApiService } from "@/services/api";

interface ContributionGridProps {
  employeeId: number;
  username: string;
}

interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  dayOfWeek: number;
  weekIndex: number;
}

export default function ContributionGrid({
  employeeId,
  username,
}: ContributionGridProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [dailyCounts, setDailyCounts] = useState<DailyActivityCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get available years (current year and up to 3 previous years)
  const availableYears = useMemo(() => {
    const years = [];
    for (let i = 0; i < 4; i++) {
      years.push(currentYear - i);
    }
    return years;
  }, [currentYear]);

  // Fetch data for the selected year
  useEffect(() => {
    const fetchYearData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const yearStart = `${selectedYear}-01-01`;
        const yearEnd = `${selectedYear}-12-31`;
        
        const response = await employeePerformanceApiService.getEmployeePerformance({
          employeeId,
          username,
          dateFrom: yearStart,
          dateTo: yearEnd,
        });
        
        setDailyCounts(response.daily_counts);
      } catch (err) {
        console.error('Error fetching year data:', err);
        setError('Failed to load activity data');
      } finally {
        setLoading(false);
      }
    };

    fetchYearData();
  }, [selectedYear, employeeId, username]);

  const { weeks, maxCount, totalContributions } = useMemo(() => {
    if (dailyCounts.length === 0) {
      return { weeks: [], maxCount: 0, totalContributions: 0 };
    }

    // Calculate total contributions
    const totalContributions = dailyCounts.reduce((sum, day) => sum + day.total_activities, 0);
    
    // Create year start and end dates
    const yearStart = new Date(selectedYear, 0, 1); // January 1st
    const yearEnd = new Date(selectedYear, 11, 31); // December 31st
    
    // Find the maximum count to determine activity levels
    const maxCount = Math.max(...dailyCounts.map(d => d.total_activities), 1);
    
    // Create a map of date to count for quick lookup
    const countMap = new Map<string, number>();
    dailyCounts.forEach(day => {
      countMap.set(day.date, day.total_activities);
    });

    // Calculate activity level (0-4) based on count
    const getActivityLevel = (count: number): 0 | 1 | 2 | 3 | 4 => {
      if (count === 0) return 0;
      if (count <= maxCount * 0.25) return 1;
      if (count <= maxCount * 0.5) return 2;
      if (count <= maxCount * 0.75) return 3;
      return 4;
    };

    // Get the start of the first week (Sunday before or equal to yearStart)
    const firstWeekStart = new Date(yearStart);
    firstWeekStart.setDate(firstWeekStart.getDate() - firstWeekStart.getDay());

    // Get the end of the last week (Saturday after or equal to yearEnd)
    const lastWeekEnd = new Date(yearEnd);
    lastWeekEnd.setDate(lastWeekEnd.getDate() + (6 - lastWeekEnd.getDay()));

    // Generate all days in the grid
    const days: ContributionDay[] = [];
    const currentDate = new Date(firstWeekStart);
    let weekIndex = 0;

    while (currentDate <= lastWeekEnd) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = countMap.get(dateStr) || 0;
      const dayOfWeek = currentDate.getDay();
      
      days.push({
        date: dateStr,
        count,
        level: getActivityLevel(count),
        dayOfWeek,
        weekIndex,
      });

      currentDate.setDate(currentDate.getDate() + 1);
      
      // Move to next week when we reach Sunday
      if (currentDate.getDay() === 0) {
        weekIndex++;
      }
    }

    // Group days by week
    const weeks: ContributionDay[][] = [];
    let currentWeek: ContributionDay[] = [];

    days.forEach(day => {
      if (day.dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return { weeks, maxCount, totalContributions };
  }, [dailyCounts, selectedYear]);

  // Color mapping for activity levels
  const getColorClass = (level: 0 | 1 | 2 | 3 | 4) => {
    switch (level) {
      case 0: return "bg-gray-100"; // No activity
      case 1: return "bg-green-200"; // Low activity
      case 2: return "bg-green-300"; // Medium-low activity
      case 3: return "bg-green-500"; // Medium-high activity
      case 4: return "bg-green-700"; // High activity
      default: return "bg-gray-100";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMonthLabel = (weekIndex: number) => {
    if (weeks[weekIndex] && weeks[weekIndex][0]) {
      const firstDay = new Date(weeks[weekIndex][0].date);
      return firstDay.toLocaleDateString('en-US', { month: 'short' });
    }
    return '';
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header with year navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
        <h3 className="text-lg font-semibold text-gray-900">
          Activity Overview
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
          {/* Year navigation buttons */}
          <div className="flex items-center space-x-2">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedYear === year
                    ? 'bg-green-100 text-green-800 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{totalContributions}</span> activities in {selectedYear}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Loading {selectedYear} activity data...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12 text-red-600">
          <span>⚠️ {error}</span>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-600">
            {dailyCounts.length} days of activity in {selectedYear}
          </div>

          {/* Mobile scroll hint */}
          <div className="sm:hidden mb-2 text-xs text-gray-500 text-center">
            ← Scroll horizontally to view full year →
          </div>

      {/* Month labels */}
      <div className="hidden sm:flex items-center mb-2">
        <div className="w-8"></div>
        <div className="flex-1 flex">
          {weeks.map((_, weekIndex) => (
            <div key={weekIndex} className="flex-1 text-xs text-gray-500 text-center">
              {weekIndex === 0 || weekIndex % 4 === 0 ? getMonthLabel(weekIndex) : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="flex min-w-max">
          {/* Day labels */}
          <div className="flex flex-col space-y-1 mr-2">
            {dayLabels.map((day, index) => (
              <div
                key={day}
                className={`h-3 text-xs text-gray-500 flex items-center ${
                  index % 2 === 1 ? '' : 'opacity-0'
                }`}
              >
                {index % 2 === 1 ? day : ''}
              </div>
            ))}
          </div>

          {/* Activity grid */}
          <div className="flex space-x-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col space-y-1">
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const day = week.find(d => d.dayOfWeek === dayIndex);
                  if (!day) {
                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className="w-3 h-3 bg-gray-50 rounded-sm"
                      />
                    );
                  }

                  return (
                    <div
                      key={day.date}
                      className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-gray-400 ${getColorClass(day.level)}`}
                      title={`${formatDate(day.date)}: ${day.count} activities`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
        <span>Less</span>
        <div className="flex items-center space-x-1">
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              className={`w-3 h-3 rounded-sm ${getColorClass(level as 0 | 1 | 2 | 3 | 4)}`}
              title={level === 0 ? 'No activity' : `Activity level ${level}`}
            />
          ))}
        </div>
        <span>More</span>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-semibold text-gray-900">
            {totalContributions}
          </div>
          <div className="text-xs text-gray-600">Total Activities</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-semibold text-gray-900">
            {dailyCounts.filter(d => d.total_activities > 0).length}
          </div>
          <div className="text-xs text-gray-600">Active Days</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-semibold text-gray-900">
            {Math.round((totalContributions / 365) * 10) / 10}
          </div>
          <div className="text-xs text-gray-600">Avg/Day</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-semibold text-gray-900">
            {maxCount}
          </div>
          <div className="text-xs text-gray-600">Best Day</div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}