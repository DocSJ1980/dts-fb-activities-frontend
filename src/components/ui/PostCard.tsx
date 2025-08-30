"use client";

import { useState } from "react";
import { SurveillanceActivity, ContainerData } from "@/types/surveillance";
import Image from "next/image";

interface PostCardProps {
  activity: SurveillanceActivity;
  containerData?: ContainerData[];
}

export default function PostCard({
  activity,
  containerData = [],
}: PostCardProps) {
  const [imageError, setImageError] = useState(false);

  // Calculate totals
  const totalChecked = containerData.reduce(
    (sum, container) => sum + (container.checked ?? container.Checked ?? 0),
    0
  );
  const totalPositive = containerData.reduce(
    (sum, container) => sum + (container.positive ?? container.Positive ?? 0),
    0
  );
  const hasPositiveContainers = totalPositive > 0;

  const formatDateTime = (dateTime: string) => {
    // Handle empty or invalid dateTime
    if (!dateTime || dateTime.trim() === '') {
      return {
        date: 'N/A',
        time: 'N/A',
      };
    }

    try {
      // Expected format: "MM/DD/YYYY HH:MMAM/PM"
      const parts = dateTime.split(" ");
      if (parts.length < 2) {
        throw new Error('Invalid date format');
      }
      
      const [datePart, timePart] = parts;
      if (!datePart || !timePart) {
        throw new Error('Missing date or time part');
      }
      
      const dateComponents = datePart.split("/");
      if (dateComponents.length !== 3) {
        throw new Error('Invalid date format');
      }
      
      const [month, day, year] = dateComponents;
      const timeWithoutAmPm = timePart.slice(0, -2);
      const ampm = timePart.slice(-2);
      
      if (!timeWithoutAmPm || !ampm) {
        throw new Error('Invalid time format');
      }
      
      const timeComponents = timeWithoutAmPm.split(":");
      if (timeComponents.length !== 2) {
        throw new Error('Invalid time format');
      }
      
      const [hourStr, minuteStr] = timeComponents;
      
      let hourInt = parseInt(hourStr, 10);
      if (isNaN(hourInt)) {
        throw new Error('Invalid hour');
      }
      
      if (ampm === "PM" && hourInt < 12) {
        hourInt += 12;
      } else if (ampm === "AM" && hourInt === 12) {
        hourInt = 0; // Midnight (12 AM)
      }

      // Construct a valid date string for Date object
      const formattedDateTime = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${String(
        hourInt
      ).padStart(2, "0")}:${minuteStr}:00`;
      const date = new Date(formattedDateTime);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }

      return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
    } catch (error) {
      console.warn('Error formatting date:', dateTime, error);
      return {
        date: 'N/A',
        time: 'N/A',
      };
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case "house visit":
        return "bg-blue-100 text-blue-800";
      case "shop visit":
        return "bg-green-100 text-green-800";
      case "container check":
        return "bg-amber-100 text-amber-800";
      case "breeding site":
        return "bg-red-100 text-red-800";
      case "treatment":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getInitials = (name: string) => {
    if (!name || name.trim() === '') {
      return 'N/A';
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
      .slice(0, 2) || 'N/A';
  };

  const activityDateTime = activity.activity_datetime || activity.Activity_DateTime || '';
  const familyHead = activity.name_of_family_head || activity.Name_of_Family_Head || '';
  const submittedBy = activity.submitted_by || activity.Submitted_by || '';
  const tag = activity.report_type || activity.Tag || '';
  const address = activity.address || activity.Address || '';
  const locality = activity.locality || activity.Locality || '';
  const town = activity.town || activity.Town || '';
  const uc = activity.uc || activity.UC || '';
  const shopHouse = activity.shop_house || activity.Shop_House || '';
  const activityId = activity.activity_id || activity.Activity_ID || '';
  const picture = activity.picture_url || activity.Picture || '';
  const latitude = activity.latitude ?? activity.Latitude ?? 0;
  const longitude = activity.longitude ?? activity.Longitude ?? 0;
  const srNo = activity.id?.toString() || activity.Sr_No || '';

  const { date, time } = formatDateTime(activityDateTime);

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
              {getInitials(familyHead)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {familyHead}
              </h3>
              <div className="flex flex-col md:flex-row md:items-center md:space-x-2 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <span>{date}</span>
                  <span>•</span>
                  <span>{time}</span>
                </div>
                <div className="flex items-center space-x-2 mt-1 md:mt-0">
                  <span className="md:inline">User: </span>
                  <span className="text-blue-600">{submittedBy}</span>
                  <span className="md:hidden">•</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getTagColor(
                      tag
                    )}`}
                  >
                    {tag}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Content */}
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <span className="text-gray-400 mt-1">🗺️</span>
            <div className="text-gray-700">
              <div className="font-medium">{address}</div>
              <div className="text-sm text-gray-600">
                {locality}, {town}, {uc}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <span>🏠</span>
              <span>{shopHouse}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>🆔</span>
              <span>{activityId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Container Summary */}
      {containerData && containerData.length > 0 && (
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
      {picture && !imageError && (
        <div className="px-6 pb-4">
          {/* Image wrapper: constrain like a feed photo */}
          <div
            className="
              relative w-full
              bg-gray-100
              rounded-lg overflow-hidden shadow-sm
              /* Mobile: show full image to preserve details like timestamp */
              aspect-[4/3]
              /* Desktop: constrain height like a feed photo */
              md:aspect-auto md:h-[70vh] md:max-h-[70vh]
              flex items-center justify-center
            "
          >
            <Image
              src={picture}
              alt="Activity"
              fill
              onError={() => setImageError(true)}
              /* Mobile: contain to avoid cropping; Desktop: contain as before */
              className="object-contain"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 800px, 900px"
              priority={false}
            />
          </div>
        </div>
      )}

      {/* Container Data Table - Transposed */}
      {containerData && containerData.length > 0 && (
        <div className="px-6 pb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Container Data
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Metric
                  </th>
                  {containerData.map((container, index) => (
                    <th
                      key={index}
                      className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {container.container_tag || container.Container_Tag}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                    Checked
                  </td>
                  {containerData.map((container, index) => (
                    <td
                      key={index}
                      className="px-3 py-2 whitespace-nowrap text-sm text-center text-gray-900"
                    >
                      {container.checked || container.Checked}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                    Positive
                  </td>
                  {containerData.map((container, index) => (
                    <td
                      key={index}
                      className="px-3 py-2 whitespace-nowrap text-sm text-center"
                    >
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (container.positive ?? container.Positive ?? 0) > 0
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {container.positive || container.Positive}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4 text-gray-600">
            <div className="flex items-center space-x-1">
              <span>📍</span>
              <span>Lat: {latitude.toFixed(6)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>📍</span>
              <span>Lng: {longitude.toFixed(6)}</span>
            </div>
          </div>
          <div className="text-gray-500">#{srNo}</div>
        </div>
      </div>
    </div>
  );
}
