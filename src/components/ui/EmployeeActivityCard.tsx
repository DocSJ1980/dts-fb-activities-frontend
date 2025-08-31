"use client";

import { useState } from "react";
import { EmployeeActivity } from "@/types/employee-performance";
import Image from "next/image";

interface EmployeeActivityCardProps {
  activity: EmployeeActivity;
}

export default function EmployeeActivityCard({
  activity,
}: EmployeeActivityCardProps) {
  const [imageError, setImageError] = useState(false);

  // Calculate container totals for surveillance activities
  const containers = activity.containers || [];
  const totalChecked = containers.reduce((sum, container) => sum + container.checked, 0);
  const totalPositive = containers.reduce((sum, container) => sum + container.positive, 0);
  const hasPositiveContainers = activity.larva_found || totalPositive > 0;

  const formatDateTime = (dateTime: string) => {
    if (!dateTime || dateTime.trim() === '') {
      return { date: 'N/A', time: 'N/A' };
    }

    try {
      const date = new Date(dateTime);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return {
        date: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        time: date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
      };
    } catch {
      return { date: 'N/A', time: 'N/A' };
    }
  };

  const getActivityTypeColor = (activityType: string) => {
    switch (activityType) {
      case 'surveillance':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'simple':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'patient':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'case_response':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'tpv':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'surveillance':
        return '🦟';
      case 'simple':
        return '🏠';
      case 'patient':
        return '🏥';
      case 'case_response':
        return '🚨';
      case 'tpv':
        return '📊';
      default:
        return '📋';
    }
  };

  const getActivityTitle = (activity: EmployeeActivity) => {
    switch (activity.activity_type) {
      case 'surveillance':
        return activity.name_of_family_head || 'Surveillance Activity';
      case 'simple':
        return 'Simple Dengue Activity';
      case 'patient':
        return activity.patient_name || 'Patient Activity';
      case 'case_response':
        return 'Case Response Activity';
      case 'tpv':
        return 'TPV Activity';
      default:
        return 'Activity';
    }
  };

  const getActivitySubtitle = (activity: EmployeeActivity) => {
    switch (activity.activity_type) {
      case 'surveillance':
        return `${activity.shop_house || 'N/A'} - ${activity.address || 'No address'}`;
      case 'simple':
        return activity.name_address || 'No address provided';
      case 'patient':
        return `${activity.category_name || ''} - ${activity.tag_name || ''}`.trim() || 'Patient activity';
      case 'case_response':
        return activity.larva_source || 'Case response';
      case 'tpv':
        return `${activity.tpv_type || 'TPV'} - Score: ${activity.tpv_score || 'N/A'}`;
      default:
        return 'Activity details';
    }
  };

  const getActivityTypeTag = (activityType: string) => {
    switch (activityType) {
      case 'case_response':
        return 'LARVA_RESPONSE';
      default:
        return activityType.toUpperCase();
    }
  };

  const getLocationInfo = (activity: EmployeeActivity) => {
    const parts = [];
    if (activity.locality) parts.push(activity.locality);
    if (activity.town) parts.push(activity.town);
    if (activity.uc) parts.push(activity.uc);
    return parts.join(', ') || 'No location';
  };

  const getInitials = (name: string) => {
    if (!name || name.trim() === '') {
      return getActivityIcon(activity.activity_type);
    }
    
    // Extract just the first name for initials (before S/O, W/O, or D/O)
    const firstName = name.split(/\s+(S\/O|W\/O|D\/O)\s+/)[0] || name;
    
    return firstName
      .trim()
      .split(" ")
      .filter(word => word.length > 0)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2) || getActivityIcon(activity.activity_type);
  };

  const { date, time } = formatDateTime(activity.activity_datetime);
  const title = getActivityTitle(activity);
  const subtitle = getActivitySubtitle(activity);
  const location = getLocationInfo(activity);

  return (
    <div
      className={`rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden ${
        hasPositiveContainers ? "bg-red-50" : "bg-white"
      }`}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md">
              {getInitials(title)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {title}
              </h3>
              <div className="flex flex-col md:flex-row md:items-center md:space-x-2 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <span>{date}</span>
                  <span>•</span>
                  <span>{time}</span>
                </div>
                <div className="flex items-center space-x-2 mt-1 md:mt-0">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getActivityTypeColor(
                      activity.activity_type
                    )}`}
                  >
                    {getActivityIcon(activity.activity_type)} {getActivityTypeTag(activity.activity_type)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Content */}
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <span className="text-gray-400 mt-1">📍</span>
            <div className="text-gray-700">
              <div className="font-medium">{subtitle}</div>
              <div className="text-sm text-gray-600">{location}</div>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <span>🆔</span>
              <span>{activity.activity_id}</span>
            </div>
            {activity.district && (
              <div className="flex items-center space-x-1">
                <span>📍</span>
                <span>{activity.district}</span>
              </div>
            )}
          </div>

          {/* TPV Specific Info */}
          {activity.activity_type === 'tpv' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {activity.auditor && (
                  <div>
                    <span className="text-purple-700 font-medium">Auditor:</span>
                    <div className="text-gray-600">{activity.auditor}</div>
                  </div>
                )}
                {activity.auditee && (
                  <div>
                    <span className="text-purple-700 font-medium">Auditee:</span>
                    <div className="text-gray-600">{activity.auditee}</div>
                  </div>
                )}
                {activity.tpv_score && (
                  <div>
                    <span className="text-purple-700 font-medium">Score:</span>
                    <div className="text-gray-600 font-semibold">{activity.tpv_score}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Container Summary - Only for surveillance activities */}
      {activity.activity_type === 'surveillance' && containers.length > 0 && (
        <div className="px-6 pb-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">
                {totalChecked}
              </div>
              <div className="text-sm text-blue-700">Containers Checked</div>
            </div>
            <div
              className={`rounded-lg p-3 ${
                totalPositive > 0 ? "bg-red-100" : "bg-green-100"
              }`}
            >
              <div
                className={`text-2xl font-bold ${
                  totalPositive > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {totalPositive}
              </div>
              <div
                className={`text-sm ${
                  totalPositive > 0 ? "text-red-700" : "text-green-700"
                }`}
              >
                Containers Positive
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image */}
      {activity.picture_url && !imageError && (
        <div className="px-6 pb-4">
          <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden shadow-sm aspect-[4/3] md:aspect-auto md:h-[70vh] md:max-h-[70vh] flex items-center justify-center">
            <Image
              src={activity.picture_url}
              alt="Activity"
              fill
              onError={() => setImageError(true)}
              className="object-contain"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 800px, 900px"
              priority={false}
            />
          </div>
        </div>
      )}

      {/* Container Data Table - Transposed (exactly like PostCard.tsx) */}
      {activity.activity_type === 'surveillance' && containers && containers.length > 0 && (
        <div className="px-6 pb-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Metric
                  </th>
                  {containers.map((container, index) => (
                    <th
                      key={container.id || index}
                      className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {container.container_tag || `Container ${index + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                    Checked
                  </td>
                  {containers.map((container, index) => (
                    <td
                      key={container.id || index}
                      className="px-3 py-2 whitespace-nowrap text-sm text-center text-gray-900"
                    >
                      {container.checked}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                    Positive
                  </td>
                  {containers.map((container, index) => (
                    <td
                      key={container.id || index}
                      className="px-3 py-2 whitespace-nowrap text-sm text-center"
                    >
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (container.positive ?? 0) > 0
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {container.positive}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer with coordinates if available */}
      {(activity.latitude || activity.longitude) && (
        <div className="px-6 pb-4 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>📍 Coordinates</span>
            <span>
              {activity.latitude?.toFixed(6)}, {activity.longitude?.toFixed(6)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}