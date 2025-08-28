"use client";

import { useState, useEffect } from "react";
import { Plus, X, Eye, EyeOff, Trash2, Copy } from "lucide-react";
import { TableName, FilterLayer, MapsFilters } from "@/types/maps";
import { surveillanceApi } from "@/services/api";
import Dropdown from "@/components/ui/Dropdown";
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
  [TableName.DTS_CONTAINERS]: "Container Data",
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
  const [towns, setTowns] = useState<Array<{ value: string; label: string }>>(
    []
  );
  const [allUCs, setAllUCs] = useState<MultiSelectOption[]>([]);
  const [loadingTowns, setLoadingTowns] = useState(false);
  const [loadingUCs, setLoadingUCs] = useState(false);
  const [filterOptions, setFilterOptions] = useState<Record<string, any>>({});

  // Load all towns on component mount
  useEffect(() => {
    const fetchTowns = async () => {
      setLoadingTowns(true);
      try {
        const townsData = await surveillanceApi.getTowns();
        const townOptions = townsData.map((town) => ({
          value: town.town_name,
          label: town.town_name,
        }));
        setTowns(townOptions);
      } catch (error) {
        console.error("Error fetching towns:", error);
      } finally {
        setLoadingTowns(false);
      }
    };

    fetchTowns();
  }, []);

  // Load UCs when town changes or on mount
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
    const newLayer: FilterLayer = {
      id: generateLayerId(),
      name: `Layer ${filters.layers.length + 1}`,
      table: TableName.DENGUE_SIMPLE_ACTIVITIES,
      dateStart: new Date().toISOString().split("T")[0],
      dateEnd: null,
      filters: {},
      color: DEFAULT_COLORS[filters.layers.length % DEFAULT_COLORS.length],
      enabled: true,
    };

    onFiltersChange({
      ...filters,
      layers: [...filters.layers, newLayer],
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

        {/* Town Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Town
          </label>
          <StringDropdown
            options={towns}
            value={filters.selectedTown}
            onChange={(value) =>
              onFiltersChange({
                ...filters,
                selectedTown: value,
                selectedUCs: [],
              })
            }
            placeholder="Select Town (Optional)"
            loading={loadingTowns}
            disabled={loading}
          />
        </div>

        {/* UC Multi-Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Union Councils (UCs) <span className="text-red-500">*</span>
          </label>
          <MultiSelect
            options={
              filters.selectedTown
                ? allUCs.filter((uc) => uc.group === filters.selectedTown)
                : allUCs
            }
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
            <p className="text-sm">Click "Add Layer" to start.</p>
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
  index,
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: layer.color }}
            />
            <input
              type="text"
              value={layer.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="font-medium text-sm bg-transparent border-none outline-none"
              disabled={disabled}
            />
            {layer.recordCount !== undefined && (
              <span className="text-xs text-gray-500">
                ({layer.recordCount} records)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdate({ enabled: !layer.enabled })}
              disabled={disabled}
              className="p-1 hover:bg-gray-200 rounded"
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
              className="p-1 hover:bg-gray-200 rounded"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={onRemove}
              disabled={disabled}
              className="p-1 hover:bg-red-200 rounded text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-200 rounded"
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
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Table
            </label>
            <StringDropdown
              options={Object.entries(TABLE_LABELS).map(([value, label]) => ({
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
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={layer.dateStart}
                onChange={(e) => onUpdate({ dateStart: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={layer.dateEnd || ""}
                onChange={(e) => onUpdate({ dateEnd: e.target.value || null })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                disabled={disabled}
              />
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Color
            </label>
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
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
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
  const updateFilter = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  switch (table) {
    case TableName.DTS_SURV_ACTIVITIES:
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <div className="space-y-1">
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
                <span className="text-sm">Indoor</span>
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
                <span className="text-sm">Outdoor</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`report_type_${layerId}`}
                  value=""
                  checked={!filters.report_type}
                  onChange={(e) => updateFilter("report_type", "")}
                  disabled={disabled}
                  className="mr-2"
                />
                <span className="text-sm">All</span>
              </label>
            </div>
          </div>
        </div>
      );

    case TableName.DTS_PATIENT_ACTIVITIES:
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Tag Name
            </label>
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
                <span className="text-sm">Patient</span>
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
                <span className="text-sm">Patient Irs</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`tag_name_${layerId}`}
                  value=""
                  checked={!filters.tag_name}
                  onChange={(e) => updateFilter("tag_name", "")}
                  disabled={disabled}
                  className="mr-2"
                />
                <span className="text-sm">All</span>
              </label>
            </div>
          </div>
        </div>
      );

    case TableName.DENGUE_SIMPLE_ACTIVITIES:
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Tag
            </label>
            <input
              type="text"
              value={filters.tag || ""}
              onChange={(e) => updateFilter("tag", e.target.value)}
              placeholder="Enter tag (e.g., Fogging)"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Dengue Larvae
            </label>
            <input
              type="text"
              value={filters.dengue_larvae || ""}
              onChange={(e) => updateFilter("dengue_larvae", e.target.value)}
              placeholder="Enter larvae status"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              disabled={disabled}
            />
          </div>
        </div>
      );

    case TableName.DTS_CASE_RESPONSE_ACTIVITIES:
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Larva Source
            </label>
            <input
              type="text"
              value={filters.larva_source || ""}
              onChange={(e) => updateFilter("larva_source", e.target.value)}
              placeholder="Enter larva source"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              disabled={disabled}
            />
          </div>
        </div>
      );

    case TableName.DTS_TPV_ACTIVITIES:
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              TPV Type
            </label>
            <input
              type="text"
              value={filters.tpv_type || ""}
              onChange={(e) => updateFilter("tpv_type", e.target.value)}
              placeholder="Enter TPV type"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
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
