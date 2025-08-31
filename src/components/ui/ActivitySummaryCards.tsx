"use client";

import { ActivitySummary } from "@/types/employee-performance";

interface ActivitySummaryCardsProps {
  activitySummary: ActivitySummary[];
  loading?: boolean;
  onCardClick?: (activityType: string) => void;
}

export default function ActivitySummaryCards({
  activitySummary,
  loading = false,
  onCardClick,
}: ActivitySummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-12"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activitySummary.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-gray-400 text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Activity Data
        </h3>
        <p className="text-gray-500">
          No activities found for the selected employee and date range.
        </p>
      </div>
    );
  }

  const getCardGradient = (activityType: string) => {
    switch (activityType) {
      case 'surveillance':
        return 'from-blue-500 to-blue-600';
      case 'simple':
        return 'from-green-500 to-green-600';
      case 'patient':
        return 'from-red-500 to-red-600';
      case 'case_response':
        return 'from-orange-500 to-orange-600';
      case 'tpv':
        return 'from-purple-500 to-purple-600';
      case 'larva_detected':
        return 'from-red-600 to-red-700';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getCardBorderColor = (activityType: string) => {
    switch (activityType) {
      case 'surveillance':
        return 'border-blue-200 hover:border-blue-300';
      case 'simple':
        return 'border-green-200 hover:border-green-300';
      case 'patient':
        return 'border-red-200 hover:border-red-300';
      case 'case_response':
        return 'border-orange-200 hover:border-orange-300';
      case 'tpv':
        return 'border-purple-200 hover:border-purple-300';
      case 'larva_detected':
        return 'border-red-300 hover:border-red-400';
      default:
        return 'border-gray-200 hover:border-gray-300';
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const totalActivities = activitySummary.reduce((sum, activity) => {
    // TPV activities are evaluations, not activities performed by the employee
    if (activity.activity_type === 'tpv') return sum;
    // larva_detected is a subset count, not an additional activity type
    if (activity.activity_type === 'larva_detected') return sum;
    return sum + activity.total_count;
  }, 0);
  
  const totalEvaluations = activitySummary.find(a => a.activity_type === 'tpv')?.total_count || 0;
  
  // Separate TPV activities from regular activities
  const regularActivities = activitySummary.filter(activity => 
    activity.activity_type !== 'tpv' && activity.activity_type !== 'larva_detected'
  );
  const tpvActivities = activitySummary.filter(activity => activity.activity_type === 'tpv');
  const larvaDetectedActivities = activitySummary.filter(activity => activity.activity_type === 'larva_detected');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Performance Overview
        </h3>
        <div className="text-sm text-gray-600">
          <span className="font-medium">{totalActivities}</span> activities
          {totalEvaluations > 0 && (
            <span className="ml-2">
              • <span className="font-medium">{totalEvaluations}</span> evaluations
            </span>
          )}
        </div>
      </div>

      {/* Activity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {regularActivities.map((activity) => (
          <div
            key={activity.activity_type}
            onClick={() => onCardClick?.(activity.activity_type)}
            className={`bg-white rounded-lg border-2 ${getCardBorderColor(
              activity.activity_type
            )} p-6 transition-all duration-200 hover:shadow-lg ${
              onCardClick ? 'cursor-pointer hover:scale-105' : ''
            }`}
          >
            {/* Header with icon and gradient circle */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl">{activity.icon}</div>
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-r ${getCardGradient(
                  activity.activity_type
                )} flex items-center justify-center`}
              >
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>

            {/* Count */}
            <div className="mb-2">
              <div className="text-3xl font-bold text-gray-900">
                {formatCount(activity.total_count)}
              </div>
            </div>

            {/* Activity Label */}
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-900 leading-tight">
                {activity.activity_label}
              </div>
            </div>

            {/* Description */}
            <div className="text-xs text-gray-500 leading-relaxed">
              {activity.description}
            </div>

            {/* Progress bar showing relative activity */}
            {totalActivities > 0 && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full bg-gradient-to-r ${getCardGradient(
                      activity.activity_type
                    )}`}
                    style={{
                      width: `${Math.max(
                        5,
                        (activity.total_count / totalActivities) * 100
                      )}%`,
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {Math.round((activity.total_count / totalActivities) * 100)}% of activities
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Larva Detection & Third Party Evaluations - Side by Side */}
      {(larvaDetectedActivities.length > 0 || tpvActivities.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Larva Detection Section - Left Half */}
          {larvaDetectedActivities.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  🐛 Larva Detection
                </h3>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{larvaDetectedActivities[0].total_count}</span> positive findings
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {larvaDetectedActivities.map((activity) => (
                  <div
                    key={activity.activity_type}
                    onClick={() => onCardClick?.(activity.activity_type)}
                    className={`bg-white rounded-lg border-2 ${getCardBorderColor(
                      activity.activity_type
                    )} p-6 transition-all duration-200 hover:shadow-lg ${
                      onCardClick ? 'cursor-pointer hover:scale-105' : ''
                    } h-80`}
                  >
                    {/* Header with icon and gradient circle */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl">{activity.icon}</div>
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-r ${getCardGradient(
                          activity.activity_type
                        )} flex items-center justify-center`}
                      >
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>

                    {/* Count */}
                    <div className="mb-2">
                      <div className="text-3xl font-bold text-red-600">
                        {formatCount(activity.total_count)}
                      </div>
                    </div>

                    {/* Activity Label */}
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-900 leading-tight">
                        {activity.activity_label}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="text-xs text-gray-500 leading-relaxed">
                      {activity.description}
                    </div>

                    {/* Warning indicator for positive findings */}
                    <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded">
                      <div className="text-xs text-red-700 font-medium">
                        ⚠️ Larva detected in {activity.total_count} surveillance{activity.total_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Third Party Evaluations Section - Right Half */}
          {tpvActivities.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  📊 Third Party Evaluations
                </h3>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{totalEvaluations}</span> evaluations received
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {tpvActivities.map((activity) => (
                  <div
                    key={activity.activity_type}
                    onClick={() => onCardClick?.(activity.activity_type)}
                    className={`bg-white rounded-lg border-2 ${getCardBorderColor(
                      activity.activity_type
                    )} p-6 transition-all duration-200 hover:shadow-lg ${
                      onCardClick ? 'cursor-pointer hover:scale-105' : ''
                    } h-80`}
                  >
                    {/* Header with icon and gradient circle */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl">{activity.icon}</div>
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-r ${getCardGradient(
                          activity.activity_type
                        )} flex items-center justify-center`}
                      >
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>

                    {/* Count and Score */}
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <div className="text-3xl font-bold text-gray-900">
                          {formatCount(activity.total_count)}
                        </div>
                        <div className="text-sm text-gray-600">
                          Evaluations
                        </div>
                      </div>
                      {activity.average_score && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600">
                            {activity.average_score.toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Avg Score
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Activity Label */}
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-900 leading-tight">
                        {activity.activity_label}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="text-xs text-gray-500 leading-relaxed">
                      {activity.description}
                    </div>

                    {/* Score visualization bar */}
                    {activity.average_score && (
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full bg-gradient-to-r ${getCardGradient(
                              activity.activity_type
                            )}`}
                            style={{
                              width: `${Math.min(100, (activity.average_score / 100) * 100)}%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Performance Score: {activity.average_score.toFixed(1)}/100
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{totalActivities}</div>
          <div className="text-sm text-gray-600">Activities Performed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{totalEvaluations}</div>
          <div className="text-sm text-gray-600">Evaluations Received</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {larvaDetectedActivities.length > 0 ? larvaDetectedActivities[0].total_count : 0}
          </div>
          <div className="text-sm text-gray-600">Larva Detected</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {tpvActivities.length > 0 && tpvActivities[0].average_score
              ? tpvActivities[0].average_score.toFixed(1)
              : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Avg Evaluation Score</div>
        </div>
      </div>
    </div>
  );
}