"use client";

import Link from "next/link";
import type { KoboResult } from "@/types/kobo";
import { getSubmissionInsights } from "@/utils/kobo";

export default function SupervisionCard({ item }: { item: KoboResult }) {
  const insights = getSubmissionInsights(item);

  return (
    <Link
      href={`/supervision-dashboard/details/${item._id}`}
      className="block rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition p-4 bg-white"
    >
      <div className="flex gap-3">
        {insights.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={insights.thumb}
            alt="thumb"
            className="w-20 h-20 object-cover rounded-md border"
          />
        ) : (
          <div className="w-20 h-20 rounded-md bg-gray-100 border flex items-center justify-center text-xs text-gray-400">
            No Image
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">
              Submission #{item._id}
            </h3>
            <span className="text-xs text-gray-500">
              {item._submission_time
                ? new Date(item._submission_time).toLocaleString()
                : ""}
            </span>
          </div>
          <div className="mt-1 text-sm text-gray-700">
            <div>
              {insights.town} • {insights.uc}
            </div>
            <div>Supervisor CNIC: {insights.supervisorCnic ?? "-"}</div>
            <div>
              Visit: {insights.visitDate}{" "}
              {insights.visitTime ? `• ${insights.visitTime}` : ""}
            </div>
            <div>
              Team: {insights.teamType} • Members: {insights.teamMember1}
              {insights.teamMember2 ? `, ${insights.teamMember2}` : ""}
            </div>
            <div>Area: {insights.areaAddress ?? "-"}</div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              HS Count: {insights.hsCount}
            </span>
            {insights.riskFlags.map((f, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center px-2 py-0.5 rounded border ${
                  f === "Fake Work Detected" || f === "Larvae Remaining"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : f === "Larvae Found"
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : f === "Incomplete Inspection" ||
                      f === "No Awareness Provided"
                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
