"use client";

import { useMemo } from "react";
import { SurveillanceActivity, User } from "@/types/surveillance";

// Utility function to format user display name based on activity type
const formatUserDisplayName = (user: User) => {
  const name = user.name || user.full_name || user.username;
  const fhName = user.fh_name;
  const activityType = user.activity_type;
  
  if (!fhName) {
    return name;
  }
  
  // Determine the separator based on activity type
  const separator = activityType === "Outdoor Activity" ? "S/O" : "W/O D/O";
  
  return `${name} ${separator} ${fhName}`;
};

// Utility function to get user contact info
const getUserContactInfo = () => {
  // Contact info removed for privacy protection
  return '';
};

interface ExtendedUser extends User {
  displayName?: string;
  contactInfo?: string;
  activityCount?: number;
}

interface FieldWorkerCardsProps {
  activities: SurveillanceActivity[];
  users: User[];
  selectedFieldWorker?: string;
  onFieldWorkerSelect: (fieldWorker: string | undefined) => void;
  loading?: boolean;
}

export default function FieldWorkerCards({
  activities,
  users,
  selectedFieldWorker,
  onFieldWorkerSelect,
  loading = false,
}: FieldWorkerCardsProps) {
  // Calculate activity counts for each user (memoized)
  const userActivityCounts: ExtendedUser[] = useMemo(() => {
    return users
      .map((user) => {
        // Handle both new and legacy user data structure
        const username = user.username || user.username_prefix || user.full_name;
        const displayName = formatUserDisplayName(user);
        const contactInfo = getUserContactInfo();
        
        const activityCount = activities.filter(
          (activity) => {
            const submittedBy = activity.submitted_by || activity.Submitted_by;
            return submittedBy?.trim() === username;
          }
        ).length;

        return {
          ...user,
          username,
          displayName,
          contactInfo,
          activityCount,
        } as ExtendedUser;
      })
      .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
  }, [users, activities]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Field Workers
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg p-4 h-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (userActivityCounts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Field Workers
        </h3>
        <p className="text-gray-500 text-center py-8">No field workers found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Field Workers</h3>
        {selectedFieldWorker && (
          <button
            onClick={() => onFieldWorkerSelect(undefined)}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Show All
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {userActivityCounts.map((user) => (
          <button
            key={user.username || user.username_prefix}
            onClick={() =>
              onFieldWorkerSelect(
                (user.username || user.username_prefix) === selectedFieldWorker
                  ? undefined
                  : (user.username || user.username_prefix)
              )
            }
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md ${
              selectedFieldWorker === (user.username || user.username_prefix)
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    selectedFieldWorker === (user.username || user.username_prefix)
                      ? "text-blue-900"
                      : "text-gray-900"
                  }`}
                >
                  {user.displayName}
                </p>
                <p
                  className={`text-xs mt-1 truncate ${
                    selectedFieldWorker === (user.username || user.username_prefix)
                      ? "text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  @{user.username || user.username_prefix}
                </p>
                {user.designation && (
                  <p
                    className={`text-xs mt-1 ${
                      selectedFieldWorker === (user.username || user.username_prefix)
                        ? "text-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    {user.designation}
                  </p>
                )}
              </div>
              <div
                className={`ml-2 w-8 h-8 rounded-full hidden md:flex items-center justify-center text-xs font-bold ${
                  selectedFieldWorker === (user.username || user.username_prefix)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                                {user.activityCount}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
