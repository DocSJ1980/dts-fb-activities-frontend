"use client";

import { useState, useMemo } from "react";
import { EmployeeActivity } from "@/types/employee-performance";

interface EmployeePerformanceTableProps {
  activities: EmployeeActivity[];
}

interface AggregatedActivity {
  date: string;
  uc: string;
  indoor_surveillance: number;
  outdoor_surveillance: number;
  larva_response: number;
  patients_tagged: number;
  patients_irs_done: number;
  simple_activities: number;
  total: number;
}

export default function EmployeePerformanceTable({
  activities,
}: EmployeePerformanceTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof AggregatedActivity;
    direction: "asc" | "desc";
  } | null>(null);

  // Aggregate activities by date and UC
  const aggregatedData = useMemo(() => {
    const grouped: {
      [key: string]: AggregatedActivity;
    } = {};

    activities.forEach((activity) => {
      const date = activity.activity_datetime.split("T")[0];
      const uc = activity.uc || "Unknown";
      const key = `${date}-${uc}`;

      if (!grouped[key]) {
        grouped[key] = {
          date,
          uc,
          indoor_surveillance: 0,
          outdoor_surveillance: 0,
          larva_response: 0,
          patients_tagged: 0,
          patients_irs_done: 0,
          simple_activities: 0,
          total: 0,
        };
      }

      // Categorize activities based on type and properties
      switch (activity.activity_type) {
        case "surveillance":
          if (activity.report_type === "indoor") {
            grouped[key].indoor_surveillance += 1;
          } else if (activity.report_type === "outdoor") {
            grouped[key].outdoor_surveillance += 1;
          }
          break;
        case "case_response":
          grouped[key].larva_response += 1;
          break;
        case "patient":
          if (activity.tag_name === "Patient") {
            grouped[key].patients_tagged += 1;
          } else if (activity.tag_name === "Patient Irs") {
            grouped[key].patients_irs_done += 1;
          }
          break;
        case "simple":
          grouped[key].simple_activities += 1;
          break;
      }

      // Update total
      grouped[key].total += 1;
    });

    // Convert to array
    const result = Object.values(grouped);

    // Sort by date descending by default
    result.sort((a, b) => b.date.localeCompare(a.date));

    return result;
  }, [activities]);

  const handleSort = (key: keyof AggregatedActivity) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    // Sort the aggregated data
    aggregatedData.sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === "asc" ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  const getSortIndicator = (key: keyof AggregatedActivity) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  if (aggregatedData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-gray-400 text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Activity Data
        </h3>
        <p className="text-gray-500">
          No activities found for the selected employee and date range.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Daily Activity Summary
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Activities grouped by date and Union Council
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center">
                  Date{getSortIndicator("date")}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("uc")}
              >
                <div className="flex items-center">
                  Union Council{getSortIndicator("uc")}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("indoor_surveillance")}
              >
                <div className="flex items-center">
                  Indoor Vector Surveillance
                  {getSortIndicator("indoor_surveillance")}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("outdoor_surveillance")}
              >
                <div className="flex items-center">
                  Outdoor Vector Surveillance
                  {getSortIndicator("outdoor_surveillance")}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("larva_response")}
              >
                <div className="flex items-center">
                  Larva Response Activities{getSortIndicator("larva_response")}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("patients_tagged")}
              >
                <div className="flex items-center">
                  Patients tagged{getSortIndicator("patients_tagged")}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("patients_irs_done")}
              >
                <div className="flex items-center">
                  Patients IRS Done{getSortIndicator("patients_irs_done")}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("simple_activities")}
              >
                <div className="flex items-center">
                  Simple Activities{getSortIndicator("simple_activities")}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("total")}
              >
                <div className="flex items-center">
                  Total{getSortIndicator("total")}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {aggregatedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.uc}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.indoor_surveillance}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.outdoor_surveillance}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.larva_response}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.patients_tagged}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.patients_irs_done}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.simple_activities}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-6 py-3 text-sm font-medium text-gray-900">
                Total
              </td>
              <td className="px-6 py-3 text-sm text-gray-900"></td>
              <td className="px-6 py-3 text-sm font-medium text-gray-900">
                {aggregatedData.reduce(
                  (sum, row) => sum + row.indoor_surveillance,
                  0
                )}
              </td>
              <td className="px-6 py-3 text-sm font-medium text-gray-900">
                {aggregatedData.reduce(
                  (sum, row) => sum + row.outdoor_surveillance,
                  0
                )}
              </td>
              <td className="px-6 py-3 text-sm font-medium text-gray-900">
                {aggregatedData.reduce(
                  (sum, row) => sum + row.larva_response,
                  0
                )}
              </td>
              <td className="px-6 py-3 text-sm font-medium text-gray-900">
                {aggregatedData.reduce(
                  (sum, row) => sum + row.patients_tagged,
                  0
                )}
              </td>
              <td className="px-6 py-3 text-sm font-medium text-gray-900">
                {aggregatedData.reduce(
                  (sum, row) => sum + row.patients_irs_done,
                  0
                )}
              </td>
              <td className="px-6 py-3 text-sm font-medium text-gray-900">
                {aggregatedData.reduce(
                  (sum, row) => sum + row.simple_activities,
                  0
                )}
              </td>
              <td className="px-6 py-3 text-sm font-medium text-gray-900">
                {aggregatedData.reduce((sum, row) => sum + row.total, 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Showing {aggregatedData.length} day-UC combinations
        </p>
      </div>
    </div>
  );
}
