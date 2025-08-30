"use client";

import dynamic from "next/dynamic";
import type { KoboResult } from "@/types/kobo";
import type { SurveillanceActivity } from "@/types/surveillance";
import { parseLocation } from "@/utils/kobo";

// Reuse the same underlying map component through dynamic import (no SSR)
const SurveillanceMap = dynamic(() => import("@/components/SurveillanceMap"), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-base font-semibold mb-2">Visit Locations</h2>
      <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        <span className="ml-2 text-gray-600 text-sm">Loading map...</span>
      </div>
    </div>
  ),
});

// Helper getter with keyof KoboResult to keep strict typing without 'any'
const getField = <K extends keyof KoboResult>(s: KoboResult, key: K) => s[key];

function toActivities(submission: KoboResult): SurveillanceActivity[] {
  const entries = [1, 2, 3, 4, 5].map((idx) => {
    const locStr = getField(
      submission,
      `group_hs_${idx}/hs_${idx}_location` as keyof KoboResult
    ) as string | undefined;

    const loc = parseLocation(locStr);
    if (!loc) return undefined;

    const code = getField(
      submission,
      `group_hs_${idx}/hs_${idx}_q1` as keyof KoboResult
    ) as string | undefined;
    const name = getField(
      submission,
      `group_hs_${idx}/hs_${idx}_q2` as keyof KoboResult
    ) as string | undefined;
    const phone = getField(
      submission,
      `group_hs_${idx}/hs_${idx}_q3` as keyof KoboResult
    ) as string | undefined;

    const title = name ?? `Health Setting ${idx}`;

    // Map to existing SurveillanceActivity shape defined in src/types/surveillance.ts
    const act: SurveillanceActivity = {
      // New required fields
      id: Date.now() + idx, // Generate a unique numeric ID
      activity_id: `${submission._id}-${idx}`,
      name_of_family_head: title,
      shop_house: "",
      address: submission["group_general_001/group_ln8pu96/area_address"] ?? "",
      locality: "",
      district: submission["group_general/town"] ?? "",
      town: submission["group_general/town"] ?? "",
      uc: submission["group_general/uc"] ?? "",
      report_type: [code ? `Code:${code}` : null, phone ? `Phone:${phone}` : null]
        .filter(Boolean)
        .join(" "),
      submitted_by: submission._submitted_by ?? "",
      activity_datetime: submission._submission_time ?? submission.start ?? "",
      picture_url: "",
      latitude: loc.lat,
      longitude: loc.lng,
      // Legacy fields for backward compatibility
      Sr_No: `${submission._id}-${idx}`,
      Activity_ID: `${submission._id}-${idx}`,
      Name_of_Family_Head: title,
      Shop_House: "",
      Address: submission["group_general_001/group_ln8pu96/area_address"] ?? "",
      Locality: "",
      District: submission["group_general/town"] ?? "",
      Town: submission["group_general/town"] ?? "",
      UC: submission["group_general/uc"] ?? "",
      Tag: [code ? `Code:${code}` : null, phone ? `Phone:${phone}` : null]
        .filter(Boolean)
        .join(" "),
      Submitted_by: submission._submitted_by ?? "",
      Activity_DateTime: submission._submission_time ?? submission.start ?? "",
      Picture: "",
      Latitude: loc.lat,
      Longitude: loc.lng,
    };

    return act;
  });

  return entries.filter(Boolean) as SurveillanceActivity[];
}

export default function SubmissionMap({
  submission,
}: {
  submission: KoboResult;
}) {
  const activities = toActivities(submission);

  if (activities.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-600">
        No valid locations available for this submission.
      </div>
    );
  }

  // Enforce fixed height and clip overflow to avoid overlapping adjacent content
  return (
    <div className="h-full w-full">
      <SurveillanceMap activities={activities} showWrapper={false} />
    </div>
  );
}
