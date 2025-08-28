"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Menu, X } from "lucide-react";
import {
  MapsFilters,
  FilterLayer,
  MapMarker,
  MapsDataRequest,
  MapsDataResponse,
} from "@/types/maps";
import MapsFilterPanel from "@/components/maps/MapsFilterPanel";

// Dynamically import the map component to avoid SSR issues
const MultiLayerMap = dynamic(() => import("@/components/maps/MultiLayerMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Loading map...</span>
    </div>
  ),
});

export default function MapsPage() {
  const [filters, setFilters] = useState<MapsFilters>({
    selectedTown: "",
    selectedUCs: [],
    layers: [],
  });

  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [layerCounts, setLayerCounts] = useState<Record<string, number>>({});
  const [enabledLayers, setEnabledLayers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(true);

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setShowFilterPanel(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Update enabled layers when filters change
  useEffect(() => {
    const enabled = new Set(
      filters.layers.filter((layer) => layer.enabled).map((layer) => layer.id)
    );
    setEnabledLayers(enabled);
  }, [filters.layers]);

  const fetchMapData = useCallback(async () => {
    if (filters.selectedUCs.length === 0 || filters.layers.length === 0) {
      setMarkers([]);
      setLayerCounts({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: MapsDataRequest = {
        ucs: filters.selectedUCs,
        layers: filters.layers.filter((layer) => layer.enabled),
      };

      const response = await fetch("/api/maps/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: MapsDataResponse = await response.json();
      setMarkers(data.markers);
      setLayerCounts(data.layerCounts);

      // Update layer record counts
      const updatedLayers = filters.layers.map((layer) => ({
        ...layer,
        recordCount: data.layerCounts[layer.id] || 0,
      }));

      setFilters((prev) => ({
        ...prev,
        layers: updatedLayers,
      }));
    } catch (err) {
      console.error("Error fetching map data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch map data");
      setMarkers([]);
      setLayerCounts({});
    } finally {
      setLoading(false);
    }
  }, [filters.selectedUCs, filters.layers]);

  const handleLayerToggle = useCallback((layerId: string) => {
    setFilters((prev) => ({
      ...prev,
      layers: prev.layers.map((layer) =>
        layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
      ),
    }));
  }, []);

  // Prepare data for map component
  const layerNames = filters.layers.reduce((acc, layer) => {
    acc[layer.id] = layer.name;
    return acc;
  }, {} as Record<string, string>);

  const layerColors = filters.layers.reduce((acc, layer) => {
    acc[layer.id] = layer.color;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                {showFilterPanel ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            )}
            <h1 className="text-xl font-semibold text-gray-900">
              Comprehensive Maps Dashboard
            </h1>
          </div>

          <div className="text-sm text-gray-600">
            {filters.selectedUCs.length > 0 && (
              <span>
                {filters.selectedUCs.length} UC
                {filters.selectedUCs.length !== 1 ? "s" : ""} •
              </span>
            )}
            {filters.layers.length} layer
            {filters.layers.length !== 1 ? "s" : ""} • {markers.length} marker
            {markers.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Filter Panel */}
        <div
          className={`
          ${
            isMobile
              ? `absolute inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out ${
                  showFilterPanel ? "translate-x-0" : "-translate-x-full"
                }`
              : `w-80 flex-shrink-0 ${showFilterPanel ? "block" : "hidden"}`
          }
        `}
        >
          {isMobile && showFilterPanel && (
            <div
              className="absolute inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowFilterPanel(false)}
            />
          )}
          <div className={`h-full bg-white ${isMobile ? "relative z-50" : ""}`}>
            <MapsFilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              onApplyFilters={fetchMapData}
              loading={loading}
            />
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 flex flex-col">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mx-4 mt-4 rounded-md">
              <p className="font-medium">Error loading map data:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex-1 p-4">
            <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <MultiLayerMap
                markers={markers}
                layerCounts={layerCounts}
                layerNames={layerNames}
                layerColors={layerColors}
                enabledLayers={enabledLayers}
                onLayerToggle={handleLayerToggle}
                title="Multi-Layer Activity Map"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobile && showFilterPanel && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setShowFilterPanel(false)}
        />
      )}
    </div>
  );
}
