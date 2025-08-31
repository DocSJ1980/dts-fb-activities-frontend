"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { EmployeeActivity } from "@/types/employee-performance";
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
const createCustomIcon = (activityType: string) => {
  const colors = {
    surveillance: "#3b82f6", // blue
    simple: "#10b981", // green
    patient: "#ef4444", // red
    case_response: "#f59e0b", // orange
    tpv: "#8b5cf6", // purple
  };
  
  const color = colors[activityType as keyof typeof colors] || "#6b7280"; // gray fallback
  
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
  activities: EmployeeActivity[];
}

function MapUpdater({ activities }: MapUpdaterProps) {
  const map = useMap();

  useEffect(() => {
    if (activities.length > 0) {
      const validActivities = activities.filter(activity => 
        activity.latitude !== undefined && 
        activity.longitude !== undefined &&
        activity.latitude !== null &&
        activity.longitude !== null
      );
      
      if (validActivities.length > 0) {
        const bounds = L.latLngBounds(
          validActivities.map((activity) => [
            activity.latitude!,
            activity.longitude!
          ])
        );
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      }
    }
  }, [activities, map]);

  return null;
}

interface EmployeePerformanceMapProps {
  activities: EmployeeActivity[];
  selectedActivityType?: string | null;
  loading?: boolean;
  title?: string;
}

export default function EmployeePerformanceMap({
  activities,
  selectedActivityType = null,
  loading = false,
  title = "Activity Locations",
}: EmployeePerformanceMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-gray-500">Loading map...</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading activities...</span>
        </div>
      </div>
    );
  }

  // Filter activities based on selected type and valid coordinates
  const filteredActivities = activities.filter(activity => {
    const hasCoordinates = activity.latitude !== undefined && 
                          activity.longitude !== undefined &&
                          activity.latitude !== null &&
                          activity.longitude !== null;
    
    if (!hasCoordinates) return false;
    
    if (selectedActivityType) {
      return activity.activity_type === selectedActivityType;
    }
    
    return true;
  });

  if (filteredActivities.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-4">🗺️</div>
            <div className="text-gray-600">
              {selectedActivityType 
                ? `No ${selectedActivityType} activities with coordinates found`
                : "No activities with coordinates found"
              }
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate center point from filtered activities
  const center =
    filteredActivities.length > 0
      ? ([
          filteredActivities[0].latitude!,
          filteredActivities[0].longitude!
        ] as [number, number])
      : DEFAULT_MAP_CENTER;

  const getActivityDetails = (activity: EmployeeActivity) => {
    switch (activity.activity_type) {
      case 'surveillance':
        return {
          title: activity.name_of_family_head || 'Surveillance Activity',
          subtitle: `${activity.shop_house || 'N/A'} - ${activity.address || 'No address'}`,
          location: `${activity.locality || ''} ${activity.uc || ''}`.trim() || 'No location',
        };
      case 'simple':
        return {
          title: 'Simple Dengue Activity',
          subtitle: activity.name_address || 'No address provided',
          location: `${activity.uc || ''} ${activity.town || ''}`.trim() || 'No location',
        };
      case 'patient':
        return {
          title: activity.patient_name || 'Patient Activity',
          subtitle: `${activity.category_name || ''} - ${activity.tag_name || ''}`.trim() || 'Patient activity',
          location: `${activity.patient_place || ''} ${activity.uc || ''}`.trim() || 'No location',
        };
      case 'case_response':
        return {
          title: 'Case Response Activity',
          subtitle: activity.larva_source || 'Case response',
          location: `${activity.uc || ''} ${activity.town || ''}`.trim() || 'No location',
        };
      case 'tpv':
        return {
          title: 'TPV Activity',
          subtitle: `${activity.tpv_type || ''} - Score: ${activity.tpv_score || 'N/A'}`,
          location: `${activity.uc || ''} ${activity.town || ''}`.trim() || 'No location',
        };
      default:
        return {
          title: 'Activity',
          subtitle: 'Activity details',
          location: 'No location',
        };
    }
  };

  const getActivityTypeLabel = (activityType: string) => {
    switch (activityType) {
      case 'surveillance':
        return 'Surveillance';
      case 'simple':
        return 'Simple Activity';
      case 'patient':
        return 'Patient Activity';
      case 'case_response':
        return 'Case Response';
      case 'tpv':
        return 'TPV Activity';
      default:
        return 'Activity';
    }
  };

  const formatDateTime = (datetime: string) => {
    if (!datetime) return 'N/A';
    try {
      const date = new Date(datetime);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="text-sm text-gray-600">
          {filteredActivities.length} activities with coordinates
          {selectedActivityType && ` (${getActivityTypeLabel(selectedActivityType)} only)`}
        </div>
      </div>
      
      <div className="h-96 rounded-lg overflow-hidden border">
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
          <MapUpdater activities={filteredActivities} />
          {filteredActivities.map((activity, index) => {
            const details = getActivityDetails(activity);
            
            return (
              <Marker
                key={`${activity.activity_type}-${activity.id}-${index}`}
                position={[activity.latitude!, activity.longitude!]}
                icon={createCustomIcon(activity.activity_type)}
              >
                <Popup>
                  <div className="min-w-64">
                    <div className="font-semibold text-lg mb-2">
                      {details.title}
                    </div>
                    <div className="space-y-1 text-sm">
                      <div>
                        <strong>Details:</strong> {details.subtitle}
                      </div>
                      <div>
                        <strong>Location:</strong> {details.location}
                      </div>
                      <div>
                        <strong>Coordinates:</strong> {activity.latitude!.toFixed(6)}, {activity.longitude!.toFixed(6)}
                      </div>
                      <div>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          activity.activity_type === 'surveillance' ? 'bg-blue-100 text-blue-800' :
                          activity.activity_type === 'simple' ? 'bg-green-100 text-green-800' :
                          activity.activity_type === 'patient' ? 'bg-red-100 text-red-800' :
                          activity.activity_type === 'case_response' ? 'bg-orange-100 text-orange-800' :
                          activity.activity_type === 'tpv' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getActivityTypeLabel(activity.activity_type)}
                        </span>
                      </div>
                      <div>
                        <strong>Date & Time:</strong> {formatDateTime(activity.activity_datetime)}
                      </div>
                      <div>
                        <strong>Activity ID:</strong> {activity.activity_id}
                      </div>
                      {activity.picture_url && (
                        <div>
                          <strong>Photo:</strong> <span className="text-green-600">Available</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <span className="font-medium text-gray-900">Activity Types:</span>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
          <span className="text-gray-900">Surveillance</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
          <span className="text-gray-900">Simple</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
          <span className="text-gray-900">Patient</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
          <span className="text-gray-900">Case Response</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
          <span className="text-gray-900">TPV</span>
        </div>
      </div>
    </div>
  );
}