"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { KoboResult, KoboListResponse } from "@/types/kobo";
import { analyzeSupervisoryQuality } from "@/utils/kobo";

import { surveillanceApi } from "@/services/api";
import { SurveillanceActivity } from "@/types/surveillance";
import { parseLocation } from "@/utils/kobo";
import dynamic from "next/dynamic";

// Dynamically import the map component with no SSR
const DynamicSurveillanceMap = dynamic(
  () => import("@/components/DynamicSurveillanceMap"),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          Supervisory Visit Locations
        </h2>
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading map...</span>
        </div>
      </div>
    ),
  }
);

interface SupervisionFilters {
  date: string;
}

interface UCVisitSummary {
  uc: string;
  totalVisits: number;
  hasVisits: boolean;
  teamQuality: {
    excellent: number;
    good: number;
    poor: number;
  };
  supervisoryQuality: {
    excellent: number;
    good: number;
    poor: number;
  };
}

interface TownSummary {
  town: string;
  ucSummaries: UCVisitSummary[];
}

interface TownUC {
  town: string;
  uc: string;
}

export default function SupervisionDashboardPage() {
  const [allData, setAllData] = useState<KoboResult[]>([]);
  const [data, setData] = useState<KoboResult[]>([]);
  const [allTownUCs, setAllTownUCs] = useState<TownUC[]>([]);
  const [expandedTowns, setExpandedTowns] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SupervisionFilters>({
    date: new Date().toISOString().split("T")[0],
  });

  // Get unique towns from all available town-UC combinations (used for grouping summaries)
  const towns = Array.from(new Set(allTownUCs.map((item) => item.town)));

  // Fetch all data once to get town-UC combinations
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // First, fetch supervision visit data from KoboToolbox
      const response = await fetch("/api/supervision", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch supervision data: ${response.status}`);
      }

      const result: KoboListResponse = await response.json();
      const allResults = result.results || [];

      // Store all supervision data
      setAllData(allResults);

      // Try to fetch all towns and their UCs from surveillance API
      try {
        const townsData = await surveillanceApi.getTowns();

        // Fetch all UCs for each town
        const allTownUCs: TownUC[] = [];
        for (const town of townsData) {
          try {
            const ucsData = await surveillanceApi.getUCs(town.town_code);
            ucsData.forEach((uc) => {
              allTownUCs.push({
                town: town.town_name,
                uc: uc.uc_name,
              });
            });
          } catch (ucError) {
            console.warn(
              `Failed to fetch UCs for town ${town.town_name}:`,
              ucError
            );
          }
        }

        setAllTownUCs(allTownUCs);
        console.log(
          `Loaded ${allTownUCs.length} town-UC combinations from surveillance API`
        );
      } catch (surveillanceError) {
        console.warn(
          "Failed to fetch town-UC data from surveillance API, falling back to supervision data:",
          surveillanceError
        );

        // Fallback: Extract town-UC combinations from supervision data
        const townUCSet = new Set<string>();
        const fallbackTownUCs: TownUC[] = [];

        allResults.forEach((item) => {
          const town = item["group_general/town"];
          const uc = item["group_general/uc"];
          if (town && uc) {
            const key = `${town}|${uc}`;
            if (!townUCSet.has(key)) {
              townUCSet.add(key);
              fallbackTownUCs.push({ town, uc });
            }
          }
        });

        setAllTownUCs(fallbackTownUCs);
        console.log(
          `Fallback: Loaded ${fallbackTownUCs.length} town-UC combinations from supervision data`
        );
      }

      // Filter initial data
      filterVisitData(allResults, filters);
    } catch (err) {
      setError("Failed to fetch supervision data. Please try again.");
      console.error("Error fetching supervision data:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Filter visit data based on current filters
  const filterVisitData = (
    sourceData: KoboResult[],
    currentFilters: SupervisionFilters
  ) => {
    setLoadingVisits(true);

    let filteredResults = sourceData;

    if (currentFilters.date) {
      filteredResults = filteredResults.filter(
        (item) => item["group_general/Date_of_Visit"] === currentFilters.date
      );
    }

    setData(filteredResults);
    setLoadingVisits(false);
  };

  // Load all data on component mount only
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]); // Include fetchAllData dependency

  // Filter data when filters change (but not on initial load)
  useEffect(() => {
    if (allData.length === 0) return;
    filterVisitData(allData, filters);
  }, [filters, allData]);

  const handleFilterChange = (newFilters: SupervisionFilters) => {
    setFilters(newFilters);
  };

  const toggleTownExpansion = (townName: string) => {
    setExpandedTowns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(townName)) {
        newSet.delete(townName);
      } else {
        newSet.add(townName);
      }
      return newSet;
    });
  };

  // Convert KoboResult supervision data to SurveillanceActivity format for map display
  const convertToMapActivities = (
    koboData: KoboResult[]
  ): SurveillanceActivity[] => {
    const activities: SurveillanceActivity[] = [];

    koboData.forEach((submission) => {
      // Try to extract location from various possible fields
      const locationFields = [
        "group_general_001/group_ln8pu96/area_address_location",
        "group_general/location",
        "_geolocation",
      ];

      let location = null;
      for (const field of locationFields) {
        const locData = submission[field as keyof KoboResult];

        // Handle different data types that might contain location info
        let locStr: string | null = null;

        if (typeof locData === "string") {
          locStr = locData;
        } else if (typeof locData === "object" && locData !== null) {
          // Handle object format like {lat: number, lng: number} or [lat, lng]
          if ("lat" in locData && "lng" in locData) {
            location = { lat: Number(locData.lat), lng: Number(locData.lng) };
            break;
          } else if (Array.isArray(locData) && locData.length >= 2) {
            location = { lat: Number(locData[0]), lng: Number(locData[1]) };
            break;
          } else {
            // Try to stringify and parse as location string
            locStr = JSON.stringify(locData);
          }
        }

        // Try to parse as location string if we have a string
        if (locStr && locStr.trim()) {
          try {
            location = parseLocation(locStr);
            if (location) break;
          } catch (error) {
            console.warn(
              `Failed to parse location from field ${field}:`,
              error
            );
          }
        }
      }

      if (location && location.lat && location.lng) {
        const activity: SurveillanceActivity = {
          // Required new fields
          id: parseInt(submission._id?.toString() || "0"),
          activity_id: submission._id?.toString() || "",
          name_of_family_head: submission["group_general/supervisor_cnic"] || "Supervision Visit",
          shop_house: "",
          address: submission["group_general_001/group_ln8pu96/area_address"] || "",
          locality: "",
          district: submission["group_general/town"] || "",
          town: submission["group_general/town"] || "",
          uc: submission["group_general/uc"] || "",
          report_type: "supervision",
          submitted_by: submission._submitted_by || "",
          activity_datetime: submission._submission_time || submission.start || "",
          picture_url: "",
          latitude: location.lat,
          longitude: location.lng,
          // Legacy field mappings for backward compatibility
          Sr_No: submission._id?.toString() || "",
          Activity_ID: submission._id?.toString() || "",
          Name_of_Family_Head: submission["group_general/supervisor_cnic"] || "Supervision Visit",
          Shop_House: "",
          Address: submission["group_general_001/group_ln8pu96/area_address"] || "",
          Locality: "",
          District: submission["group_general/town"] || "",
          Town: submission["group_general/town"] || "",
          UC: submission["group_general/uc"] || "",
          Tag: "Supervision Visit",
          Submitted_by: submission._submitted_by || "",
          Activity_DateTime: submission._submission_time || submission.start || "",
          Picture: "",
          Latitude: location.lat,
          Longitude: location.lng,
        };
        activities.push(activity);
      }
    });

    return activities;
  };

  // Convert current filtered data to map activities
  const mapActivities = convertToMapActivities(data);

  // Grade calculation functions for A/B/C system
  const calculateTeamGrade = (
    analysis: ReturnType<typeof analyzeSupervisoryQuality>
  ): "A" | "B" | "C" => {
    const criticalIssues = analysis.teamAnalysis.findings.criticalIssues.length;
    const warnings = analysis.teamAnalysis.findings.warnings.length;

    // A = Excellent (0 critical issues, 0-1 warnings)
    if (criticalIssues === 0 && warnings <= 1) {
      return "A";
    }
    // B = Good (0 critical issues, 2-3 warnings OR 1 critical issue, 0-1 warnings)
    else if (
      (criticalIssues === 0 && warnings <= 3) ||
      (criticalIssues === 1 && warnings <= 1)
    ) {
      return "B";
    }
    // C = Poor (everything else)
    else {
      return "C";
    }
  };

  const calculateSupervisoryGrade = (
    visit: KoboResult,
    analysis: ReturnType<typeof analyzeSupervisoryQuality>
  ): "A" | "B" | "C" => {
    const supervisionDuration = calculateSupervisionDuration(visit);
    const criticalIssues =
      analysis.supervisoryAnalysis.findings.criticalIssues.length;
    const warnings = analysis.supervisoryAnalysis.findings.warnings.length;

    // A = Excellent (>15 minutes, 0 critical issues, 0-1 warnings)
    if (supervisionDuration > 15 && criticalIssues === 0 && warnings <= 1) {
      return "A";
    }
    // B = Good (10-15 minutes with minimal issues OR >15 minutes with some warnings)
    else if (
      (supervisionDuration >= 10 &&
        supervisionDuration <= 15 &&
        criticalIssues === 0) ||
      (supervisionDuration > 15 && criticalIssues === 0 && warnings <= 3) ||
      (supervisionDuration >= 5 && criticalIssues === 0 && warnings <= 2)
    ) {
      return "B";
    }
    // C = Poor (everything else - short duration, multiple issues, etc.)
    else {
      return "C";
    }
  };

  // Calculate town summaries with all UCs (including those with no visits)
  const townSummaries: TownSummary[] = [];

  // Group visit data by town and UC
  const visitGroupedData = data.reduce((acc, item) => {
    const town = item["group_general/town"] || "Unknown";
    const uc = item["group_general/uc"] || "Unknown";
    const key = `${town}|${uc}`;

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, KoboResult[]>);

  // Create summaries for each town
  towns.forEach((town) => {
    const townUCs = allTownUCs.filter((item) => item.town === town);
    const ucSummaries: UCVisitSummary[] = [];

    townUCs.forEach(({ uc }) => {
      const key = `${town}|${uc}`;
      const visits = visitGroupedData[key] || [];
      const hasVisits = visits.length > 0;

      const teamQuality = { excellent: 0, good: 0, poor: 0 };
      const supervisoryQuality = { excellent: 0, good: 0, poor: 0 };

      if (hasVisits) {
        visits.forEach((visit) => {
          const analysis = analyzeSupervisoryQuality(visit);

          // Calculate team quality based on letter grade system (A=Excellent, B=Good, C&below=Poor)
          const teamGrade = calculateTeamGrade(analysis);
          if (teamGrade === "A") {
            teamQuality.excellent++;
          } else if (teamGrade === "B") {
            teamQuality.good++;
          } else {
            teamQuality.poor++;
          }

          // Calculate supervisory quality based on letter grade system (A=Excellent, B=Good, C&below=Poor)
          const supervisoryGrade = calculateSupervisoryGrade(visit, analysis);
          if (supervisoryGrade === "A") {
            supervisoryQuality.excellent++;
          } else if (supervisoryGrade === "B") {
            supervisoryQuality.good++;
          } else {
            supervisoryQuality.poor++;
          }
        });
      }

      ucSummaries.push({
        uc,
        totalVisits: visits.length,
        hasVisits,
        teamQuality,
        supervisoryQuality,
      });
    });

    // Sort UCs alphabetically
    ucSummaries.sort((a, b) => a.uc.localeCompare(b.uc));

    townSummaries.push({
      town,
      ucSummaries,
    });
  });

  // Sort towns alphabetically
  townSummaries.sort((a, b) => a.town.localeCompare(b.town));

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
                  Supervision Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  District Health Authority Rawalpindi
                </p>
              </div>
            </div>
            {/* <div className="flex items-center space-x-4">
              <Link
                href="/supervision-dashboard/details"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Details
              </Link>
            </div> */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <p className="text-sm text-gray-600 mt-1">
                Filter supervision visits by date
              </p>
            </div>
            <button
              onClick={() =>
                handleFilterChange({
                  date: new Date().toISOString().split("T")[0],
                })
              }
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              disabled={loading}
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) =>
                  handleFilterChange({ ...filters, date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">
              Loading supervision data...
            </span>
          </div>
        )}

        {/* Loading Visits State */}
        {!loading && loadingVisits && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Filtering visits...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !loadingVisits && !error && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {data.length}
                </div>
                <div className="text-sm text-gray-600 leading-tight">
                  Total Visits
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="text-2xl font-bold text-red-600 mb-2">
                  {townSummaries.reduce(
                    (sum, town) =>
                      sum +
                      town.ucSummaries.filter((uc) => !uc.hasVisits).length,
                    0
                  )}
                </div>
                <div className="text-sm text-gray-600 leading-tight">
                  UCs Without Visits
                </div>
              </div>
            </div>

            {/* Team Quality Stats */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Team Work Quality
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="text-xl font-bold text-green-600 mb-2">
                    {townSummaries.reduce(
                      (sum, town) =>
                        sum +
                        town.ucSummaries.reduce(
                          (ucSum, uc) => ucSum + uc.teamQuality.excellent,
                          0
                        ),
                      0
                    )}
                  </div>
                  <div className="text-xs text-gray-600 leading-tight">
                    Excellent Team Work
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="text-xl font-bold text-yellow-600 mb-2">
                    {townSummaries.reduce(
                      (sum, town) =>
                        sum +
                        town.ucSummaries.reduce(
                          (ucSum, uc) => ucSum + uc.teamQuality.good,
                          0
                        ),
                      0
                    )}
                  </div>
                  <div className="text-xs text-gray-600 leading-tight">
                    Good Team Work
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="text-xl font-bold text-red-600 mb-2">
                    {townSummaries.reduce(
                      (sum, town) =>
                        sum +
                        town.ucSummaries.reduce(
                          (ucSum, uc) => ucSum + uc.teamQuality.poor,
                          0
                        ),
                      0
                    )}
                  </div>
                  <div className="text-xs text-gray-600 leading-tight">
                    Poor Team Work
                  </div>
                </div>
              </div>
            </div>

            {/* Supervision Quality Stats */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Supervision Quality
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="text-xl font-bold text-green-600 mb-2">
                    {townSummaries.reduce(
                      (sum, town) =>
                        sum +
                        town.ucSummaries.reduce(
                          (ucSum, uc) =>
                            ucSum + uc.supervisoryQuality.excellent,
                          0
                        ),
                      0
                    )}
                  </div>
                  <div className="text-xs text-gray-600 leading-tight">
                    Excellent Supervision
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="text-xl font-bold text-yellow-600 mb-2">
                    {townSummaries.reduce(
                      (sum, town) =>
                        sum +
                        town.ucSummaries.reduce(
                          (ucSum, uc) => ucSum + uc.supervisoryQuality.good,
                          0
                        ),
                      0
                    )}
                  </div>
                  <div className="text-xs text-gray-600 leading-tight">
                    Good Supervision
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="text-xl font-bold text-red-600 mb-2">
                    {townSummaries.reduce(
                      (sum, town) =>
                        sum +
                        town.ucSummaries.reduce(
                          (ucSum, uc) => ucSum + uc.supervisoryQuality.poor,
                          0
                        ),
                      0
                    )}
                  </div>
                  <div className="text-xs text-gray-600 leading-tight">
                    Poor Supervision
                  </div>
                </div>
              </div>
            </div>

            {/* Map Component */}
            {mapActivities.length > 0 && (
              <div className="mb-6">
                <DynamicSurveillanceMap
                  activities={mapActivities}
                  title="Supervisory Visit Locations"
                />
              </div>
            )}

            {/* Town Tables */}
            {townSummaries.length > 0 ? (
              <div className="space-y-4">
                {townSummaries.map((townSummary) => {
                  const isExpanded = expandedTowns.has(townSummary.town);
                  return (
                    <div
                      key={townSummary.town}
                      className="bg-white rounded-lg shadow-md overflow-hidden"
                    >
                      <div
                        className="px-6 py-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleTownExpansion(townSummary.town)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {townSummary.town}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {townSummary.ucSummaries.length} Union Councils •{" "}
                              {
                                townSummary.ucSummaries.filter(
                                  (uc) => uc.hasVisits
                                ).length
                              }{" "}
                              with visits •{" "}
                              {
                                townSummary.ucSummaries.filter(
                                  (uc) => !uc.hasVisits
                                ).length
                              }{" "}
                              without visits
                            </p>
                            {/* Quality breakdown for this town */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Excellent:{" "}
                                {townSummary.ucSummaries.reduce(
                                  (sum, uc) =>
                                    sum +
                                    uc.teamQuality.excellent +
                                    uc.supervisoryQuality.excellent,
                                  0
                                )}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Good:{" "}
                                {townSummary.ucSummaries.reduce(
                                  (sum, uc) =>
                                    sum +
                                    uc.teamQuality.good +
                                    uc.supervisoryQuality.good,
                                  0
                                )}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Poor:{" "}
                                {townSummary.ucSummaries.reduce(
                                  (sum, uc) =>
                                    sum +
                                    uc.teamQuality.poor +
                                    uc.supervisoryQuality.poor,
                                  0
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <svg
                              className={`w-5 h-5 text-gray-500 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Union Council
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Visits
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Team Quality
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Supervision Quality
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {townSummary.ucSummaries.map((ucSummary) => (
                                <tr
                                  key={ucSummary.uc}
                                  className={
                                    !ucSummary.hasVisits ? "bg-red-50" : ""
                                  }
                                >
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="text-sm font-medium text-gray-900">
                                        {ucSummary.uc}
                                      </div>
                                      {!ucSummary.hasVisits && (
                                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                          No Visits
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {ucSummary.totalVisits > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {visitGroupedData[
                                          `${townSummary.town}|${ucSummary.uc}`
                                        ]?.map((visit, index) => (
                                          <Link
                                            key={visit._id}
                                            href={`/supervision-dashboard/details/${visit._id}`}
                                            className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
                                            title={`Visit #${visit._id}`}
                                          >
                                            {index + 1}
                                          </Link>
                                        )) || ucSummary.totalVisits}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">0</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {ucSummary.hasVisits ? (
                                      <div className="flex space-x-1">
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                          E: {ucSummary.teamQuality.excellent}
                                        </span>
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                          G: {ucSummary.teamQuality.good}
                                        </span>
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                          P: {ucSummary.teamQuality.poor}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 text-sm">
                                        -
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {ucSummary.hasVisits ? (
                                      <div className="flex space-x-1">
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                          E:{" "}
                                          {
                                            ucSummary.supervisoryQuality
                                              .excellent
                                          }
                                        </span>
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                          G: {ucSummary.supervisoryQuality.good}
                                        </span>
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                          P: {ucSummary.supervisoryQuality.poor}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 text-sm">
                                        -
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No supervision data found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your filters or check back later for new
                  supervision visits.
                </p>
              </div>
            )}
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

// Helper function to calculate supervision duration
function calculateSupervisionDuration(visit: KoboResult): number {
  if (!visit.start || !visit.end) return 0;

  const startTime = new Date(visit.start as string);
  const endTime = new Date(visit.end as string);
  return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
}
