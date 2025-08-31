"use client";

import { useEffect, useState, useRef } from "react";
import { Maximize, Minimize } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { MapMarker, TableName } from "@/types/maps";
import { DEFAULT_MAP_CENTER, MAP_ZOOM_LEVELS } from "@/utils/constants";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MultiLayerMapProps {
  markers: MapMarker[];
  layerCounts: Record<string, number>;
  layerNames: Record<string, string>;
  layerColors: Record<string, string>;
  enabledLayers: Set<string>;
  onLayerToggle: (layerId: string) => void;
  layerSettings: Record<string, { showAsClusters: boolean; showAsDots: boolean }>; // Layer display settings
  title?: string;
}

// Create custom colored icon
function createColoredIcon(color: string): L.Icon {
  const svgIcon = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="12.5" cy="12.5" r="6" fill="#fff"/>
    </svg>
  `;

  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    shadowSize: [41, 41],
  });
}

// Create small circle marker for surveillance activities
function createCircleIcon(color: string): L.Icon {
  const svgIcon = `
    <svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6" cy="6" r="5" fill="${color}" stroke="#000" stroke-width="1"/>
    </svg>
  `;

  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -6],
  });
}

// Create dot marker for dot display mode
function createDotIcon(color: string): L.Icon {
  const svgIcon = `
    <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6" fill="${color}" stroke="#000" stroke-width="2"/>
    </svg>
  `;

  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
}

// Create large circle marker for Patient Activities with 500m diameter
function createPatientCircleIcon(color: string): L.Icon {
  const svgIcon = `
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${color}" fill-opacity="0.3" stroke="#000" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" fill="${color}" stroke="#000" stroke-width="1"/>
    </svg>
  `;

  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

// Get color based on patient_place for Patient Activities
function getPatientPlaceColor(patientPlace: string): string {
  switch (patientPlace?.toLowerCase()) {
    case 'residence':
      return '#FF0000'; // Red
    case 'workplace':
      return '#0000FF'; // Blue
    case 'permanent':
      return '#800080'; // Purple
    default:
      return '#808080'; // Gray for unknown/empty values
  }
}

// Get appropriate icon based on table type and display mode
function getMarkerIcon(tableType: TableName, color: string, showAsDots: boolean = false, marker?: MapMarker): L.Icon {
  if (showAsDots) {
    return createDotIcon(color);
  }
  
  // Special handling for Patient Activities with tag_name = 'Patient'
  if (tableType === TableName.DTS_PATIENT_ACTIVITIES && marker?.popupData?.tag_name === 'Patient') {
    const patientPlaceColor = getPatientPlaceColor(marker.popupData.patient_place as string);
    return createPatientCircleIcon(patientPlaceColor);
  }
  
  if (tableType === TableName.DTS_SURV_ACTIVITIES) {
    return createCircleIcon(color);
  }
  return createColoredIcon(color);
}

// Component to fit map bounds to markers
function MapBoundsUpdater({ markers }: { markers: MapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(
        markers.map((marker) => [marker.latitude, marker.longitude])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [markers, map]);

  return null;
}

// Format popup content based on table type
function formatPopupContent(marker: MapMarker): string {
  const { popupData, tableType } = marker;

  let content = `<div class="min-w-64">`;
  content += `<div class="font-semibold text-lg mb-2 text-blue-600">${getTableDisplayName(
    tableType
  )}</div>`;

  // Common fields
  content += `<div class="space-y-1 text-sm">`;
  if (popupData.date) {
    content += `<div><strong>Date:</strong> ${new Date(
      popupData.date as string | number | Date
    ).toLocaleDateString()}</div>`;
  }
  if (popupData.town) {
    content += `<div><strong>Town:</strong> ${popupData.town}</div>`;
  }
  if (popupData.uc) {
    content += `<div><strong>UC:</strong> ${popupData.uc}</div>`;
  }

  // Table-specific fields
  switch (tableType) {
    case TableName.DENGUE_SIMPLE_ACTIVITIES:
      if (popupData.tag)
        content += `<div><strong>Tag:</strong> ${popupData.tag}</div>`;
      if (popupData.dengue_larvae)
        content += `<div><strong>Dengue Larvae:</strong> ${popupData.dengue_larvae}</div>`;
      if (popupData.submitted_by)
        content += `<div><strong>Submitted By:</strong> ${popupData.submitted_by}</div>`;
      break;

    case TableName.DTS_PATIENT_ACTIVITIES:
      if (popupData.patient_name)
        content += `<div><strong>Patient:</strong> ${popupData.patient_name}</div>`;
      if (popupData.tag_name)
        content += `<div><strong>Tag:</strong> ${popupData.tag_name}</div>`;
      if (popupData.category_name)
        content += `<div><strong>Category:</strong> ${popupData.category_name}</div>`;
      if (popupData.patient_place)
        content += `<div><strong>Patient Place:</strong> ${popupData.patient_place}</div>`;
      break;

    case TableName.DTS_SURV_ACTIVITIES:
      if (popupData.report_type)
        content += `<div><strong>Report Type:</strong> ${popupData.report_type}</div>`;
      if (popupData.submitted_by)
        content += `<div><strong>Submitted By:</strong> ${popupData.submitted_by}</div>`;
      break;

    case TableName.DTS_CASE_RESPONSE_ACTIVITIES:
      if (popupData.larva_source)
        content += `<div><strong>Larva Source:</strong> ${popupData.larva_source}</div>`;
      if (popupData.submitted_by)
        content += `<div><strong>Submitted By:</strong> ${popupData.submitted_by}</div>`;
      break;

    case TableName.DTS_TPV_ACTIVITIES:
      if (popupData.tpv_type)
        content += `<div><strong>TPV Type:</strong> ${popupData.tpv_type}</div>`;
      if (popupData.auditor)
        content += `<div><strong>Auditor:</strong> ${popupData.auditor}</div>`;
      break;
  }

  content += `</div></div>`;
  return content;
}

function getTableDisplayName(tableType: TableName): string {
  const names: Record<TableName, string> = {
    [TableName.DENGUE_SIMPLE_ACTIVITIES]: "Dengue Activity",
    [TableName.DTS_PATIENT_ACTIVITIES]: "Patient Activity",
    [TableName.DTS_SURV_ACTIVITIES]: "Surveillance Activity",
    [TableName.DTS_CONTAINERS]: "Container Data",
    [TableName.DTS_CASE_RESPONSE_ACTIVITIES]: "Case Response",
    [TableName.DTS_TPV_ACTIVITIES]: "TPV Activity",
  };
  return names[tableType] || tableType;
}

// Cluster layer renderer for high-density layers
function ClusterLayerRenderer({
  markers,
  color,
  showAsDots = false,
}: {
  markers: MapMarker[];
  color: string;
  showAsDots?: boolean;
}) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!map || markers.length === 0) return;

    // Create cluster group with custom styling
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount();
        const size = count < 10 ? "small" : count < 100 ? "medium" : "large";
        const sizeValue = size === "small" ? 30 : size === "medium" ? 40 : 50;
        const fontSize =
          size === "small" ? "12px" : size === "medium" ? "14px" : "16px";

        return L.divIcon({
          html: `<div style="background-color: ${color}; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: ${fontSize}; width: ${sizeValue}px; height: ${sizeValue}px;">${count}</div>`,
          className: `custom-cluster-icon cluster-${size}`,
          iconSize: L.point(sizeValue, sizeValue),
        });
      },
    });

    // Add markers to cluster group
    markers.forEach((marker) => {
      // Special handling for Patient Activities with tag_name = 'Patient' - don't cluster these
      if (marker.tableType === TableName.DTS_PATIENT_ACTIVITIES && marker.popupData?.tag_name === 'Patient') {
        // These will be handled separately in the main render function
        return;
      }
      
      const leafletMarker = L.marker([marker.latitude, marker.longitude], {
        icon: getMarkerIcon(marker.tableType, marker.color, showAsDots, marker),
      });

      leafletMarker.bindPopup(formatPopupContent(marker));
      clusterGroup.addLayer(leafletMarker);
    });

    clusterGroupRef.current = clusterGroup;
    map.addLayer(clusterGroup);

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
      }
    };
  }, [map, markers, color, showAsDots]);

  return null;
}

// Layer renderer component that handles both clustered and individual markers
function LayerRenderer({
  markersByLayer,
  layerColors,
  layerSettings,
}: {
  markersByLayer: Record<string, MapMarker[]>;
  layerColors: Record<string, string>;
  layerSettings: Record<string, { showAsClusters: boolean; showAsDots: boolean }>;
}) {
  return (
    <>
      {Object.entries(markersByLayer).map(([layerId, layerMarkers]) => {
        const layerColor = layerColors[layerId];
        const shouldCluster = layerSettings[layerId]?.showAsClusters || false;
        const showAsDots = layerSettings[layerId]?.showAsDots || false;

        // Separate Patient Activities with tag_name = 'Patient' for special handling
        const patientCircleMarkers = layerMarkers.filter(
          (marker) => marker.tableType === TableName.DTS_PATIENT_ACTIVITIES && marker.popupData?.tag_name === 'Patient'
        );
        const regularMarkers = layerMarkers.filter(
          (marker) => !(marker.tableType === TableName.DTS_PATIENT_ACTIVITIES && marker.popupData?.tag_name === 'Patient')
        );

        return (
          <div key={layerId}>
            {/* Render Patient Circle Markers separately */}
            {patientCircleMarkers.map((marker) => {
              const patientPlaceColor = getPatientPlaceColor(marker.popupData.patient_place as string);
              return (
                <Circle
                  key={`patient-${marker.id}`}
                  center={[marker.latitude, marker.longitude]}
                  radius={500}
                  pathOptions={{
                    color: '#000',
                    fillColor: patientPlaceColor,
                    fillOpacity: 0.2,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: formatPopupContent(marker),
                      }}
                    />
                  </Popup>
                </Circle>
              );
            })}

            {/* Render regular markers */}
            {regularMarkers.length > 0 && (
              shouldCluster ? (
                <ClusterLayerRenderer
                  key={`cluster-${layerId}`}
                  markers={regularMarkers}
                  color={layerColor}
                  showAsDots={showAsDots}
                />
              ) : (
                regularMarkers.map((marker) => (
                  <Marker
                    key={marker.id}
                    position={[marker.latitude, marker.longitude]}
                    icon={getMarkerIcon(marker.tableType, marker.color, showAsDots, marker)}
                  >
                    <Popup>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: formatPopupContent(marker),
                        }}
                      />
                    </Popup>
                  </Marker>
                ))
              )
            )}
          </div>
        );
      })}
    </>
  );
}

export default function MultiLayerMap({
  markers,
  layerCounts,
  layerNames,
  layerColors,
  enabledLayers,
  onLayerToggle,
  layerSettings,
  title = "Multi-Layer Activity Map",
}: MultiLayerMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  if (!isClient) {
    return (
      <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  // Filter markers by enabled layers
  const visibleMarkers = markers.filter((marker) =>
    enabledLayers.has(marker.layerId)
  );

  // Group markers by layer for clustering
  const markersByLayer = visibleMarkers.reduce((acc, marker) => {
    if (!acc[marker.layerId]) {
      acc[marker.layerId] = [];
    }
    acc[marker.layerId].push(marker);
    return acc;
  }, {} as Record<string, MapMarker[]>);

  return (
    <div className={`flex flex-col ${
      isFullScreen 
        ? 'fixed inset-0 z-[9999] bg-white' 
        : 'h-full'
    }`}>
      {/* Map Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              {visibleMarkers.length} markers visible
            </div>
            <button
              onClick={toggleFullScreen}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm transition-colors"
              title={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            >
              {isFullScreen ? (
                <>
                  <Minimize className="w-4 h-4" />
                  <span>Exit Full Screen</span>
                </>
              ) : (
                <>
                  <Maximize className="w-4 h-4" />
                  <span>Full Screen</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Layer Legend */}
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(layerNames).map(([layerId, name]) => (
            <button
              key={layerId}
              onClick={() => onLayerToggle(layerId)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border transition-colors ${
                enabledLayers.has(layerId)
                  ? "bg-white border-gray-300 text-gray-700"
                  : "bg-gray-100 border-gray-200 text-gray-500"
              }`}
            >
              <div
                className="w-3 h-3 rounded-full border border-white"
                style={{ backgroundColor: layerColors[layerId] }}
              />
              <span>{name}</span>
              <span className="text-xs">({layerCounts[layerId] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={
            visibleMarkers.length > 0
              ? [visibleMarkers[0].latitude, visibleMarkers[0].longitude]
              : DEFAULT_MAP_CENTER
          }
          zoom={MAP_ZOOM_LEVELS.DEFAULT}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <MapBoundsUpdater markers={visibleMarkers} />

          {/* Render markers by layer with user-controlled clustering */}
          <LayerRenderer
            markersByLayer={markersByLayer}
            layerColors={layerColors}
            layerSettings={layerSettings}
          />
        </MapContainer>
      </div>
    </div>
  );
}
