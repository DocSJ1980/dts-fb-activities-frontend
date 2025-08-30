"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SurveillanceActivity, ContainerData } from "@/types/surveillance";
import { DEFAULT_MAP_CENTER, MAP_ZOOM_LEVELS } from "@/utils/constants";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icons for different activity types
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

interface MapUpdaterProps {
  activities: SurveillanceActivity[];
}

function MapUpdater({ activities }: MapUpdaterProps) {
  const map = useMap();

  useEffect(() => {
    if (activities.length > 0) {
      const bounds = L.latLngBounds(
        activities
          .filter(activity => {
            const lat = activity.latitude ?? activity.Latitude;
            const lng = activity.longitude ?? activity.Longitude;
            return lat !== undefined && lng !== undefined;
          })
          .map((activity) => [
            activity.latitude ?? activity.Latitude!,
            activity.longitude ?? activity.Longitude!
          ])
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [activities, map]);

  return null;
}

interface SurveillanceMapProps {
  activities: SurveillanceActivity[];
  containerData?: ContainerData[];
  showWrapper?: boolean;
  title?: string;
}

export default function SurveillanceMap({
  activities,
  containerData = [],
  showWrapper = true,
  title = "Activity Locations",
}: SurveillanceMapProps) {
  const [isClient, setIsClient] = useState(false);

  // Function to check if an activity has positive containers
  const hasPositiveContainers = (activityId: string) => {
    const activityContainers = containerData.filter(
      container => (container.activity_id || container.Activity_ID) === activityId
    );
    return activityContainers.some(container => 
      (container.positive ?? container.Positive ?? 0) > 0
    );
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="h-96 md:h-[32rem] lg:h-[36rem] bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-gray-500">Loading map...</div>
        </div>
      </div>
    );
  }

  // Calculate center point from activities
  const center =
    activities.length > 0
      ? ([
          activities[0].latitude ?? activities[0].Latitude ?? DEFAULT_MAP_CENTER[0],
          activities[0].longitude ?? activities[0].Longitude ?? DEFAULT_MAP_CENTER[1]
        ] as [number, number])
      : DEFAULT_MAP_CENTER;

  const mapContent = (
    <div className="h-full rounded-lg overflow-hidden shadow-sm border">
      <MapContainer
        center={center}
        zoom={MAP_ZOOM_LEVELS.DEFAULT}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapUpdater activities={activities} />
        {activities.map((activity) => {
          const activityId = activity.activity_id || activity.Activity_ID || '';
          const latitude = activity.latitude ?? activity.Latitude ?? 0;
          const longitude = activity.longitude ?? activity.Longitude ?? 0;
          const tag = activity.report_type || activity.Tag || '';
          const familyHead = activity.name_of_family_head || activity.Name_of_Family_Head || '';
          const address = activity.address || activity.Address || '';
          const town = activity.town || activity.Town || '';
          const uc = activity.uc || activity.UC || '';
          const submittedBy = activity.submitted_by || activity.Submitted_by || '';
          const activityDateTime = activity.activity_datetime || activity.Activity_DateTime || '';
          const picture = activity.picture_url || activity.Picture;
          
          // Skip if no coordinates
          if (!latitude || !longitude) {
            return null;
          }
          
          // Determine marker color based on positive containers
          const markerColor = hasPositiveContainers(activityId) ? "#ef4444" : "#3b82f6"; // red for positive, blue for normal
          
          return (
            <Marker
              key={activityId}
              position={[latitude, longitude]}
              icon={createCustomIcon(markerColor)}
            >
              <Popup>
                <div className="min-w-64">
                  <div className="font-semibold text-lg mb-2">
                    {familyHead}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>
                      <strong>Address:</strong> {address}
                    </div>
                    <div>
                      <strong>Location:</strong> {town}, {uc}
                    </div>
                    <div>
                      <strong>Coordinates:</strong> {latitude.toFixed(6)}
                      , {longitude.toFixed(6)}
                    </div>
                    <div>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          tag.toLowerCase().includes("positive")
                            ? "bg-red-100 text-red-800"
                            : tag.toLowerCase().includes("negative")
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {tag}
                      </span>
                    </div>
                    <div>
                      <strong>Submitted by:</strong> {submittedBy}
                    </div>
                    <div>
                      <strong>Date & Time:</strong>{" "}
                      {activityDateTime ? new Date(activityDateTime).toLocaleString() : 'N/A'}
                    </div>
                    <div>
                      <strong>Activity ID:</strong> {activityId}
                    </div>
                  </div>
                  {picture && (
                    <div className="mt-3">
                      <Image
                        src={picture}
                        alt="Activity"
                        width={200}
                        height={128}
                        className="w-full rounded-lg max-h-32 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        }).filter(Boolean)}
      </MapContainer>
    </div>
  );

  if (!showWrapper) {
    return mapContent;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
        <div className="text-sm text-gray-600">
          {activities.length}{" "}
          {activities.length === 1 ? "location" : "locations"}
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-red-500 border border-gray-300"></div>
          <span>Activities with Positive Containers</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 border border-gray-300"></div>
          <span>Normal Activities</span>
        </div>
      </div>

      <div className="h-96 md:h-[32rem] lg:h-[36rem]">{mapContent}</div>
    </div>
  );
}
