"use client";

import { SurveillanceActivity } from "@/types/surveillance";

interface FieldWorkerCardsProps {
  activities: SurveillanceActivity[];
  selectedFieldWorker?: string;
  onFieldWorkerSelect: (fieldWorker: string | undefined) => void;
  loading?: boolean;
}

export default function FieldWorkerCards({
  activities,
  selectedFieldWorker,
  onFieldWorkerSelect,
  loading = false,
}: FieldWorkerCardsProps) {
  // Calculate field worker stats
  const fieldWorkerStats = activities.reduce(
    (acc: Record<string, number>, activity) => {
      const worker = activity.Submitted_by?.trim();
      if (!worker) return acc;

      if (!acc[worker]) {
        acc[worker] = 0;
      }
      acc[worker]++;
      return acc;
    },
    {}
  );

  const fieldWorkers = Object.entries(fieldWorkerStats).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Field Workers
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg p-4 h-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (fieldWorkers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Field Workers
        </h3>
        <p className="text-gray-500 text-center py-8">No field workers found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Field Workers</h3>
        {selectedFieldWorker && (
          <button
            onClick={() => onFieldWorkerSelect(undefined)}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Show All
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {fieldWorkers.map(([worker, count]) => (
          <button
            key={worker}
            onClick={() =>
              onFieldWorkerSelect(
                worker === selectedFieldWorker ? undefined : worker
              )
            }
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md ${
              selectedFieldWorker === worker
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    selectedFieldWorker === worker
                      ? "text-blue-900"
                      : "text-gray-900"
                  }`}
                >
                  {worker}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    selectedFieldWorker === worker
                      ? "text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  {count} {count === 1 ? "activity" : "activities"}
                </p>
              </div>
              <div
                className={`ml-2 w-8 h-8 rounded-full hidden md:flex items-center justify-center text-xs font-bold ${
                  selectedFieldWorker === worker
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {count}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
