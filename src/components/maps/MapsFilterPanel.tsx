"use client";

import { useState, useEffect } from "react";
import { Plus, X, Eye, EyeOff, Trash2, Copy } from "lucide-react";
import { TableName, FilterLayer, MapsFilters } from "@/types/maps";
import { surveillanceApi } from "@/services/api";
import StringDropdown from "@/components/ui/StringDropdown";
import MultiSelect, { MultiSelectOption } from "@/components/ui/MultiSelect";

interface MapsFilterPanelProps {
  filters: MapsFilters;
  onFiltersChange: (filters: MapsFilters) => void;
  onApplyFilters: () => void;
  loading?: boolean;
}

const TABLE_LABELS: Record<TableName, string> = {
  [TableName.DENGUE_SIMPLE_ACTIVITIES]: "Dengue Simple Activities",
  [TableName.DTS_PATIENT_ACTIVITIES]: "Patient Activities",
  [TableName.DTS_SURV_ACTIVITIES]: "Surveillance Activities",
  [TableName.DTS_CONTAINERS]: "Container Data", // Keep for TypeScript but filter from dropdown
  [TableName.DTS_CASE_RESPONSE_ACTIVITIES]: "Case Response Activities",
  [TableName.DTS_TPV_ACTIVITIES]: "TPV Activities",
};

const DEFAULT_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
];

export default function MapsFilterPanel({
  filters,
  onFiltersChange,
  onApplyFilters,
  loading = false,
}: MapsFilterPanelProps) {
  const [allUCs, setAllUCs] = useState<MultiSelectOption[]>([]);
  const [loadingUCs, setLoadingUCs] = useState(false);

  // Load all UCs on component mount
  useEffect(() => {
    const fetchAllUCs = async () => {
      setLoadingUCs(true);
      try {
        const townsData = await surveillanceApi.getTowns();
        const allUCOptions: MultiSelectOption[] = [];

        for (const town of townsData) {
          const townUCs = await surveillanceApi.getUCs(town.town_code);
          townUCs.forEach((uc) => {
            allUCOptions.push({
              value: uc.uc_name,
              label: uc.uc_name,
              group: town.town_name,
            });
          });
        }

        setAllUCs(allUCOptions);
      } catch (error) {
        console.error("Error fetching UCs:", error);
      } finally {
        setLoadingUCs(false);
      }
    };

    fetchAllUCs();
  }, []);

  const generateLayerId = () =>
    `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addNewLayer = () => {
    // Calculate dates: start date is 7 days ago, end date is today
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const newLayer: FilterLayer = {
      id: generateLayerId(),
      name: `Layer ${filters.layers.length + 1}`,
      table: TableName.DENGUE_SIMPLE_ACTIVITIES,
      dateStart: sevenDaysAgo.toISOString().split("T")[0],
      dateEnd: today.toISOString().split("T")[0],
      filters: {},
      color: DEFAULT_COLORS[filters.layers.length % DEFAULT_COLORS.length],
      enabled: true,
      showAsClusters: false,
      showAsDots: false,
    };

    onFiltersChange({
      ...filters,
      layers: [newLayer, ...filters.layers],
    });
  };

  const updateLayer = (layerId: string, updates: Partial<FilterLayer>) => {
    const updatedLayers = filters.layers.map((layer) =>
      layer.id === layerId ? { ...layer, ...updates } : layer
    );

    onFiltersChange({
      ...filters,
      layers: updatedLayers,
    });
  };

  const removeLayer = (layerId: string) => {
    const updatedLayers = filters.layers.filter(
      (layer) => layer.id !== layerId
    );
    onFiltersChange({
      ...filters,
      layers: updatedLayers,
    });
  };

  const duplicateLayer = (layerId: string) => {
    const layerToDuplicate = filters.layers.find(
      (layer) => layer.id === layerId
    );
    if (!layerToDuplicate) return;

    const duplicatedLayer: FilterLayer = {
      ...layerToDuplicate,
      id: generateLayerId(),
      name: `${layerToDuplicate.name} (Copy)`,
      color: DEFAULT_COLORS[filters.layers.length % DEFAULT_COLORS.length],
    };

    onFiltersChange({
      ...filters,
      layers: [...filters.layers, duplicatedLayer],
    });
  };

  const clearAllLayers = () => {
    onFiltersChange({
      ...filters,
      layers: [],
    });
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Map Filters
        </h2>

        {/* UC Multi-Selection */}
        <div className="mb-4">
          <MultiSelect
            options={allUCs}
            value={filters.selectedUCs}
            onChange={(value) =>
              onFiltersChange({ ...filters, selectedUCs: value })
            }
            placeholder="Select UCs (Required)"
            loading={loadingUCs}
            disabled={loading}
            maxDisplayItems={2}
          />
          {filters.selectedUCs.length > 0 && (
            <div className="mt-1 text-xs text-gray-600">
              {filters.selectedUCs.length} UC
              {filters.selectedUCs.length !== 1 ? "s" : ""} selected
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={addNewLayer}
            disabled={filters.selectedUCs.length === 0 || loading}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Layer
          </button>

          <button
            onClick={clearAllLayers}
            disabled={filters.layers.length === 0 || loading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        </div>

        {/* Apply Button */}
        <button
          onClick={onApplyFilters}
          disabled={
            filters.selectedUCs.length === 0 ||
            filters.layers.length === 0 ||
            loading
          }
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? "Loading..." : "Apply Filters"}
        </button>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filters.layers.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No layers added yet.</p>
            <p className="text-sm">Click &ldquo;Add Layer&rdquo; to start.</p>
          </div>
        ) : (
          filters.layers.map((layer, index) => (
            <LayerCard
              key={layer.id}
              layer={layer}
              index={index}
              onUpdate={(updates) => updateLayer(layer.id, updates)}
              onRemove={() => removeLayer(layer.id)}
              onDuplicate={() => duplicateLayer(layer.id)}
              disabled={loading}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface LayerCardProps {
  layer: FilterLayer;
  index: number;
  onUpdate: (updates: Partial<FilterLayer>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  disabled?: boolean;
}

function LayerCard({
  layer,
  onUpdate,
  onRemove,
  onDuplicate,
  disabled,
}: LayerCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Layer Header */}
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-shrink">
            <div
              className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
              style={{ backgroundColor: layer.color }}
            />
            <input
              type="text"
              value={layer.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="font-medium text-sm bg-transparent border-none outline-none text-gray-900 min-w-0"
              disabled={disabled}
            />
            {layer.recordCount !== undefined && (
              <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                ({layer.recordCount} records)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onUpdate({ enabled: !layer.enabled })}
              disabled={disabled}
              className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800"
            >
              {layer.enabled ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onDuplicate}
              disabled={disabled}
              className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={onRemove}
              disabled={disabled}
              className="p-1 hover:bg-red-200 rounded text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800"
            >
              <span
                className={`transform transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Layer Content */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Table Selection */}
          <div>
            <StringDropdown
              options={Object.entries(TABLE_LABELS)
                .filter(([value]) => value !== TableName.DTS_CONTAINERS)
                .map(([value, label]) => ({
                  value,
                  label,
                }))}
              value={layer.table}
              onChange={(value) =>
                onUpdate({ table: value as TableName, filters: {} })
              }
              disabled={disabled}
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="date"
                value={layer.dateStart}
                onChange={(e) => onUpdate({ dateStart: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                disabled={disabled}
              />
            </div>
            <div>
              <input
                type="date"
                value={layer.dateEnd || ""}
                onChange={(e) => onUpdate({ dateEnd: e.target.value || null })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                disabled={disabled}
              />
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <div className="flex gap-1">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdate({ color })}
                  className={`w-6 h-6 rounded border-2 ${
                    layer.color === color
                      ? "border-gray-800"
                      : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                  disabled={disabled}
                />
              ))}
            </div>
          </div>

          {/* Display Options */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={layer.showAsClusters}
                onChange={(e) => onUpdate({ showAsClusters: e.target.checked })}
                disabled={disabled}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-medium text-gray-700">
                Show as clusters
              </span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={layer.showAsDots}
                onChange={(e) => onUpdate({ showAsDots: e.target.checked })}
                disabled={disabled}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-medium text-gray-700">
                Show as dots
              </span>
            </label>
          </div>

          {/* Table-specific filters */}
          <TableSpecificFilters
            table={layer.table}
            filters={layer.filters}
            onFiltersChange={(newFilters) => onUpdate({ filters: newFilters })}
            disabled={disabled}
            layerId={layer.id}
          />
        </div>
      )}
    </div>
  );
}

interface TableSpecificFiltersProps {
  table: TableName;
  filters: Record<string, unknown>;
  onFiltersChange: (filters: Record<string, unknown>) => void;
  disabled?: boolean;
  layerId: string;
}

function TableSpecificFilters({
  table,
  filters,
  onFiltersChange,
  disabled,
  layerId,
}: TableSpecificFiltersProps) {
  const updateFilter = (key: string, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  switch (table) {
    case TableName.DTS_SURV_ACTIVITIES:
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            {/* Report Type Filter */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Report Type</div>
              <div className="space-y-1">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`report_type_${layerId}`}
                    value=""
                    checked={!filters.report_type}
                    onChange={() => updateFilter("report_type", "")}
                    disabled={disabled}
                    className="mr-2"
                  />
                  <span className="text-xs text-gray-900">All</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`report_type_${layerId}`}
                    value="indoor"
                    checked={filters.report_type === "indoor"}
                    onChange={(e) => updateFilter("report_type", e.target.value)}
                    disabled={disabled}
                    className="mr-2"
                  />
                  <span className="text-xs text-gray-900">Indoor</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`report_type_${layerId}`}
                    value="outdoor"
                    checked={filters.report_type === "outdoor"}
                    onChange={(e) => updateFilter("report_type", e.target.value)}
                    disabled={disabled}
                    className="mr-2"
                  />
                  <span className="text-xs text-gray-900">Outdoor</span>
                </label>
              </div>
            </div>
            
            {/* Larva Found Filter */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Larva Status</div>
              <div className="space-y-1">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`larva_found_${layerId}`}
                    value=""
                    checked={!filters.larva_found}
                    onChange={() => updateFilter("larva_found", "")}
                    disabled={disabled}
                    className="mr-2"
                  />
                  <span className="text-xs text-gray-900">All</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`larva_found_${layerId}`}
                    value="yes"
                    checked={filters.larva_found === "yes"}
                    onChange={(e) => updateFilter("larva_found", e.target.value)}
                    disabled={disabled}
                    className="mr-2"
                  />
                  <span className="text-xs text-gray-900">Larva Found Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`larva_found_${layerId}`}
                    value="no"
                    checked={filters.larva_found === "no"}
                    onChange={(e) => updateFilter("larva_found", e.target.value)}
                    disabled={disabled}
                    className="mr-2"
                  />
                  <span className="text-xs text-gray-900">Larva Found No</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      );

    case TableName.DTS_PATIENT_ACTIVITIES:
      return (
        <div className="space-y-3">
          <div>
            <div className="space-y-1">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`tag_name_${layerId}`}
                  value="Patient"
                  checked={filters.tag_name === "Patient"}
                  onChange={(e) => updateFilter("tag_name", e.target.value)}
                  disabled={disabled}
                  className="mr-2"
                />
                <span className="text-xs text-gray-900">Patient</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`tag_name_${layerId}`}
                  value="Patient Irs"
                  checked={filters.tag_name === "Patient Irs"}
                  onChange={(e) => updateFilter("tag_name", e.target.value)}
                  disabled={disabled}
                  className="mr-2"
                />
                <span className="text-xs text-gray-900">Patient Irs</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`tag_name_${layerId}`}
                  value=""
                  checked={!filters.tag_name}
                  onChange={() => updateFilter("tag_name", "")}
                  disabled={disabled}
                  className="mr-2"
                />
                <span className="text-xs text-gray-900">All</span>
              </label>
            </div>
          </div>
        </div>
      );

    case TableName.DENGUE_SIMPLE_ACTIVITIES:
      // Tag options for Dengue Simple Activities
      const tagOptions = [
        { value: "", label: "All" },
        { value: "Abandoned Buildings", label: "Abandoned Buildings" },
        { value: "Adult Mosquito", label: "Adult Mosquito" },
        { value: "Awareness", label: "Awareness" },
        { value: "Bus Terminals", label: "Bus Terminals" },
        { value: "Colleges", label: "Colleges" },
        { value: "Dairy Farms", label: "Dairy Farms" },
        { value: "Damaged Tap", label: "Damaged Tap" },
        { value: "Dispensaries", label: "Dispensaries" },
        { value: "Factories", label: "Factories" },
        { value: "Filtration Plants", label: "Filtration Plants" },
        { value: "Fogging", label: "Fogging" },
        { value: "Garbage", label: "Garbage" },
        { value: "Garbage Sites", label: "Garbage Sites" },
        { value: "Godowns", label: "Godowns" },
        { value: "Grass Cutting", label: "Grass Cutting" },
        { value: "Graveyards", label: "Graveyards" },
        { value: "Grid Stations", label: "Grid Stations" },
        { value: "Historical Monuments/ Archaeological Sites", label: "Historical Monuments/ Archaeological Sites" },
        { value: "Hospitals", label: "Hospitals" },
        { value: "Hotels", label: "Hotels" },
        { value: "Housekeeping", label: "Housekeeping" },
        { value: "Indoor", label: "Indoor" },
        { value: "Irs", label: "Irs" },
        { value: "Junkyards", label: "Junkyards" },
        { value: "Khara Pani", label: "Khara Pani" },
        { value: "Larvae Case Response", label: "Larvae Case Response" },
        { value: "Larviciding", label: "Larviciding" },
        { value: "Machli", label: "Machli" },
        { value: "Marriage Halls", label: "Marriage Halls" },
        { value: "Mosques/ Religious Places/ Shrines", label: "Mosques/ Religious Places/ Shrines" },
        { value: "Nursery", label: "Nursery" },
        { value: "Other", label: "Other" },
        { value: "Outdoor", label: "Outdoor" },
        { value: "Ovi Trap", label: "Ovi Trap" },
        { value: "Parking Stands", label: "Parking Stands" },
        { value: "Parks", label: "Parks" },
        { value: "Railway Stations And Workshops", label: "Railway Stations And Workshops" },
        { value: "Rooftops Of High Rise Buildings", label: "Rooftops Of High Rise Buildings" },
        { value: "Schools", label: "Schools" },
        { value: "Service Stations", label: "Service Stations" },
        { value: "Swimming Pools", label: "Swimming Pools" },
        { value: "Tube Wells", label: "Tube Wells" },
        { value: "Tyre Shops", label: "Tyre Shops" },
        { value: "Under Construction Buildings", label: "Under Construction Buildings" },
        { value: "Water Drainage", label: "Water Drainage" },
        { value: "Water Ponding", label: "Water Ponding" },
        { value: "Workshops", label: "Workshops" }
      ];
      
      // Dengue Larvae options
      const larvaeOptions = [
        { value: "", label: "All" },
        { value: "Positive", label: "Positive" },
        { value: "Not Positive", label: "Not Positive" }
      ];
      
      return (
        <div className="space-y-3">
          <div>
            <StringDropdown
              options={tagOptions}
              value={(filters.tag as string) || ""}
              onChange={(value) => updateFilter("tag", value)}
              placeholder="Select activity type"
              disabled={disabled}
            />
          </div>
          <div>
            <StringDropdown
              options={larvaeOptions}
              value={(filters.dengue_larvae as string) || ""}
              onChange={(value) => updateFilter("dengue_larvae", value)}
              placeholder="Select larvae status"
              disabled={disabled}
            />
          </div>
        </div>
      );

    case TableName.DTS_CASE_RESPONSE_ACTIVITIES:
      return (
        <div className="space-y-3">
          <div>
            <input
              type="text"
              value={(filters.larva_source as string) || ""}
              onChange={(e) => updateFilter("larva_source", e.target.value)}
              placeholder="Enter larva source"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
              disabled={disabled}
            />
          </div>
        </div>
      );

    case TableName.DTS_TPV_ACTIVITIES:
      return (
        <div className="space-y-3">
          <div>
            <input
              type="text"
              value={(filters.tpv_type as string) || ""}
              onChange={(e) => updateFilter("tpv_type", e.target.value)}
              placeholder="Enter TPV type"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
              disabled={disabled}
            />
          </div>
        </div>
      );

    default:
      return (
        <div className="text-xs text-gray-500">
          No specific filters available for this table
        </div>
      );
  }
}
