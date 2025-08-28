"use client";

import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapMarker, TableName } from "@/types/maps";
import { DEFAULT_MAP_CENTER, MAP_ZOOM_LEVELS } from "@/utils/constants";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
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
      <circle cx="6" cy="6" r="5" fill="${color}" stroke="#fff" stroke-width="1"/>
    </svg>
  `;

  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -6],
  });
}

// Get appropriate icon based on table type
function getMarkerIcon(tableType: TableName, color: string): L.Icon {
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
      popupData.date
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

export default function MultiLayerMap({
  markers,
  layerCounts,
  layerNames,
  layerColors,
  enabledLayers,
  onLayerToggle,
  title = "Multi-Layer Activity Map",
}: MultiLayerMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
    <div className="h-full flex flex-col">
      {/* Map Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <div className="text-sm text-gray-600">
            {visibleMarkers.length} markers visible
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

          {/* Render markers by layer */}
          {visibleMarkers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.latitude, marker.longitude]}
              icon={getMarkerIcon(marker.tableType, marker.color)}
            >
              <Popup>
                <div
                  dangerouslySetInnerHTML={{
                    __html: formatPopupContent(marker),
                  }}
                />
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Zoom to Fit Button */}
        {visibleMarkers.length > 0 && (
          <button
            onClick={() => {
              // This would need to be implemented with a ref to the map
              console.log("Zoom to fit all markers");
            }}
            className="absolute top-4 right-4 z-[1000] bg-white border border-gray-300 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            Zoom to Fit
          </button>
        )}
      </div>
    </div>
  );
}
