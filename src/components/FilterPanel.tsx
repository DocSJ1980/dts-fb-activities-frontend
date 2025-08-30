"use client";

import { useState, useEffect } from "react";
import Dropdown from "@/components/ui/Dropdown";
// import StringDropdown from "@/components/ui/StringDropdown";
import { Town, UC, SurveillanceFilters } from "@/types/surveillance";
import { surveillanceApi } from "@/services/api";

interface FilterPanelProps {
  filters: SurveillanceFilters;
  onFilterChange: (filters: SurveillanceFilters) => void;
  loading?: boolean;
  fieldWorkers?: string[];
}

export default function FilterPanel({
  filters,
  onFilterChange,
  loading,
}: // fieldWorkers = [],
FilterPanelProps) {
  const [towns, setTowns] = useState<Town[]>([]);
  const [ucs, setUCs] = useState<UC[]>([]);
  const [loadingTowns, setLoadingTowns] = useState(false);
  const [loadingUCs, setLoadingUCs] = useState(false);

  // Fetch towns on component mount
  useEffect(() => {
    const fetchTowns = async () => {
      setLoadingTowns(true);
      try {
        const townsData = await surveillanceApi.getTowns();
        setTowns(townsData);
      } catch (error) {
        console.error("Error fetching towns:", error);
      } finally {
        setLoadingTowns(false);
      }
    };

    fetchTowns();
  }, []);

  // Fetch UCs when town changes
  useEffect(() => {
    const fetchUCs = async () => {
      if (!filters.townCode) {
        setUCs([]);
        return;
      }

      setLoadingUCs(true);
      try {
        const ucsData = await surveillanceApi.getUCs(filters.townCode);
        setUCs(ucsData);
      } catch (error) {
        console.error("Error fetching UCs:", error);
        setUCs([]);
      } finally {
        setLoadingUCs(false);
      }
    };

    fetchUCs();
  }, [filters.townCode]);

  const handleDateChange = (date: string) => {
    onFilterChange({
      ...filters,
      date,
    });
  };

  const handleTownChange = (townCode: number | undefined) => {
    onFilterChange({
      ...filters,
      townCode,
      ucCode: undefined, // Reset UC when town changes
    });
  };

  const handleUCChange = (ucCode: number | undefined) => {
    onFilterChange({
      ...filters,
      ucCode,
    });
  };

  // const handleFieldWorkerChange = (fieldWorker: string | undefined) => {
  //   onFilterChange({
  //     ...filters,
  //     fieldWorker,
  //   });
  // };

  const clearFilters = () => {
    onFilterChange({
      date: new Date().toISOString().split("T")[0],
      townCode: undefined,
      ucCode: undefined,
      fieldWorker: undefined,
    });
  };

  // These could be used for displaying selected values if needed
  // const selectedTown = towns.find(
  //   (town) => town.town_code === filters.townCode
  // );
  // const selectedUC = ucs.find((uc) => uc.uc_code === filters.ucCode);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <p className="text-sm text-gray-600 mt-1">
            Town and UC selection are required to load surveillance data
          </p>
        </div>
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          disabled={loading}
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Date Filter */}
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Date
          </label>
          <input
            type="date"
            id="date"
            value={filters.date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-700 text-blue-700"
            disabled={loading}
            placeholder="Select date"
          />
        </div>

        {/* Town Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Town <span className="text-red-500">*</span>
          </label>
          <Dropdown
            options={towns.map((town) => ({
              value: town.town_code,
              label: town.town_name,
            }))}
            value={typeof filters.townCode === 'string' ? parseInt(filters.townCode) : filters.townCode}
            onChange={handleTownChange}
            placeholder="Select Town (Required)"
            loading={loadingTowns}
            disabled={loading}
          />
        </div>

        {/* UC Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Union Council (UC) <span className="text-red-500">*</span>
          </label>
          <Dropdown
            options={ucs.map((uc) => ({
              value: uc.uc_code,
              label: uc.uc_name,
            }))}
            value={typeof filters.ucCode === 'string' ? parseInt(filters.ucCode) : filters.ucCode}
            onChange={handleUCChange}
            placeholder="Select UC (Required)"
            loading={loadingUCs}
            disabled={loading || !filters.townCode}
          />
        </div>

        {/* Field Worker Filter
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Field Worker
          </label>
          <StringDropdown
            options={fieldWorkers.map((worker) => ({
              value: worker,
              label: worker,
            }))}
            value={filters.fieldWorker}
            onChange={handleFieldWorkerChange}
            placeholder="All Field Workers"
            disabled={loading || fieldWorkers.length === 0}
          />
        </div> */}
      </div>
    </div>
  );
}
