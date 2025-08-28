"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SurveillanceActivity } from "@/types/surveillance";
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

const getMarkerColor = (tag: string) => {
  switch (tag.toLowerCase()) {
    case "house visit":
      return "#3b82f6"; // blue
    case "shop visit":
      return "#10b981"; // green
    case "container check":
      return "#f59e0b"; // amber
    case "breeding site":
      return "#ef4444"; // red
    case "treatment":
      return "#8b5cf6"; // purple
    default:
      return "#3b82f6"; // gray
  }
};

interface MapUpdaterProps {
  activities: SurveillanceActivity[];
}

function MapUpdater({ activities }: MapUpdaterProps) {
  const map = useMap();

  useEffect(() => {
    if (activities.length > 0) {
      const bounds = L.latLngBounds(
        activities.map((activity) => [activity.Latitude, activity.Longitude])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [activities, map]);

  return null;
}

interface SurveillanceMapProps {
  activities: SurveillanceActivity[];
  showWrapper?: boolean;
  title?: string;
}

export default function SurveillanceMap({
  activities,
  showWrapper = true,
  title = "Activity Locations",
}: SurveillanceMapProps) {
  const [isClient, setIsClient] = useState(false);

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
      ? ([activities[0].Latitude, activities[0].Longitude] as [number, number])
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
        {activities.map((activity) => (
          <Marker
            key={activity.Activity_ID}
            position={[activity.Latitude, activity.Longitude]}
            icon={createCustomIcon(getMarkerColor(activity.Tag))}
          >
            <Popup>
              <div className="min-w-64">
                <div className="font-semibold text-lg mb-2">
                  {activity.Name_of_Family_Head}
                </div>
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>Address:</strong> {activity.Address}
                  </div>
                  <div>
                    <strong>Location:</strong> {activity.Town}, {activity.UC}
                  </div>
                  <div>
                    <strong>Coordinates:</strong> {activity.Latitude.toFixed(6)}
                    , {activity.Longitude.toFixed(6)}
                  </div>
                  <div>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        activity.Tag.toLowerCase().includes("positive")
                          ? "bg-red-100 text-red-800"
                          : activity.Tag.toLowerCase().includes("negative")
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {activity.Tag}
                    </span>
                  </div>
                  <div>
                    <strong>Submitted by:</strong> {activity.Submitted_by}
                  </div>
                  <div>
                    <strong>Date & Time:</strong>{" "}
                    {new Date(activity.Activity_DateTime).toLocaleString()}
                  </div>
                  <div>
                    <strong>Activity ID:</strong> {activity.Activity_ID}
                  </div>
                </div>
                {activity.Picture && (
                  <div className="mt-3">
                    <Image
                      src={activity.Picture}
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
        ))}
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
      {/* <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
          <span>House Visit</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span>Shop Visit</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-amber-500"></div>
          <span>Container Check</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-red-500"></div>
          <span>Breeding Site</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-purple-500"></div>
          <span>Treatment</span>
        </div>
      </div> */}

      <div className="h-96 md:h-[32rem] lg:h-[36rem]">{mapContent}</div>
    </div>
  );
}
