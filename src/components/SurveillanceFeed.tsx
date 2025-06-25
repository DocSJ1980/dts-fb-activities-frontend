"use client";

import { useState, useMemo } from "react";
import { SurveillanceActivity, ContainerData } from "@/types/surveillance";
import PostCard from "@/components/ui/PostCard";

interface SurveillanceFeedProps {
  activities: SurveillanceActivity[];
  containerData: ContainerData[];
  loading?: boolean;
}

type SortOption = "newest" | "oldest" | "location" | "submitter";

export default function SurveillanceFeed({
  activities,
  containerData,
  loading,
}: SurveillanceFeedProps) {
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Sort activities
  const sortedActivities = useMemo(() => {
    const sorted = [...activities].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.Activity_DateTime).getTime() -
            new Date(a.Activity_DateTime).getTime()
          );
        case "oldest":
          return (
            new Date(a.Activity_DateTime).getTime() -
            new Date(b.Activity_DateTime).getTime()
          );
        case "location":
          return a.Town.localeCompare(b.Town) || a.UC.localeCompare(b.UC);
        case "submitter":
          return a.Submitted_by.localeCompare(b.Submitted_by);
        default:
          return 0;
      }
    });

    return sorted;
  }, [activities, sortBy]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-6 animate-pulse"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-32"></div>
                <div className="h-3 bg-gray-300 rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feed Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Activity Feed
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {sortedActivities.length}{" "}
              {sortedActivities.length === 1 ? "activity" : "activities"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="location">By Location</option>
              <option value="submitter">By Submitter</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feed Content */}
      {sortedActivities.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
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
            No activities found
          </h3>
          <p className="text-gray-600">
            No surveillance activities found for the selected date and location
            filters.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedActivities.map((activity) => (
            <PostCard
              key={activity.Activity_ID}
              activity={activity}
              containerData={containerData.filter(
                (container) => container.Activity_ID === activity.Activity_ID
              )}
            />
          ))}
        </div>
      )}

      {/* Load More (placeholder for future pagination) */}
      {sortedActivities.length > 0 && (
        <div className="text-center py-6">
          <div className="text-sm text-gray-500">
            Showing {sortedActivities.length} activities
          </div>
        </div>
      )}
    </div>
  );
}
