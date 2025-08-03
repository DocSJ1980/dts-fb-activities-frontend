import type { KoboListResponse, KoboResult } from "@/types/kobo";
import { findAttachmentFor, analyzeSupervisoryQuality } from "@/utils/kobo";
import Link from "next/link";

// Force dynamic to ensure fresh data
export const dynamic = "force-dynamic";

async function fetchAll(): Promise<KoboListResponse> {
  const url =
    "https://kf.dharawalpindi.com/api/v2/assets/aFyQMvo4sF3PAUtBZ3iwXj/data.json";
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: "Token 1c77402fdb8443df0d3aa6a303a6ad3b6790a95a",
      Cookie: "django_language=en",
    },
    cache: "no-store",
  });
  if (!res.ok)
    throw new Error(`Failed to fetch supervision data: ${res.status}`);
  return res.json();
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function SupervisoryQualityCard({ submission }: { submission: KoboResult }) {
  const analysis = analyzeSupervisoryQuality(submission);

  const getGradeColorClasses = (color: string) => {
    switch (color) {
      case "green":
        return "bg-green-100 text-green-800 border-green-200";
      case "yellow":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "orange":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "red":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Performance Analysis
        </h2>
        <div className="text-sm text-gray-600 text-right">
          <div>{analysis.totalHouses} houses verified</div>
          {analysis.supervisionDurationMinutes > 0 && (
            <div className="text-xs">
              Duration: {analysis.supervisionDurationMinutes} minutes
            </div>
          )}
        </div>
      </div>

      {/* Two-column layout for Team vs Supervisory analysis */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Team Performance Analysis */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Team Performance
            </h3>
            <div
              className={`px-3 py-1 rounded-lg border-2 font-bold ${getGradeColorClasses(
                analysis.teamAnalysis.gradeColor
              )}`}
            >
              {analysis.teamAnalysis.grade}
            </div>
          </div>

          <p className="text-sm text-gray-700 mb-4">
            {analysis.teamAnalysis.gradeDescription}
          </p>

          <div className="space-y-4">
            {/* Team Critical Issues */}
            <div>
              <h4 className="font-medium text-red-800 mb-2 text-sm">
                Issues Found (
                {analysis.teamAnalysis.findings.criticalIssues.length})
              </h4>
              {analysis.teamAnalysis.findings.criticalIssues.length > 0 ? (
                <ul className="space-y-1">
                  {analysis.teamAnalysis.findings.criticalIssues.map(
                    (issue, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-red-700 bg-red-50 p-2 rounded border-l-2 border-red-400"
                      >
                        {issue}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="text-xs text-gray-500 italic">No issues found</p>
              )}
            </div>

            {/* Team Positive Findings */}
            <div>
              <h4 className="font-medium text-green-800 mb-2 text-sm">
                Good Practices (
                {analysis.teamAnalysis.findings.positiveFindings.length})
              </h4>
              {analysis.teamAnalysis.findings.positiveFindings.length > 0 ? (
                <ul className="space-y-1">
                  {analysis.teamAnalysis.findings.positiveFindings.map(
                    (finding, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-green-700 bg-green-50 p-2 rounded border-l-2 border-green-400"
                      >
                        {finding}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="text-xs text-gray-500 italic">
                  No positive findings
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Supervisory Quality Analysis */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-purple-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Supervisory Quality
              {analysis.supervisionDurationMinutes > 0 && (
                <span className="ml-2 text-xs text-gray-500">
                  ({analysis.supervisionDurationMinutes}min)
                </span>
              )}
            </h3>
            <div
              className={`px-3 py-1 rounded-lg border-2 font-bold ${getGradeColorClasses(
                analysis.supervisoryAnalysis.gradeColor
              )}`}
            >
              {analysis.supervisoryAnalysis.grade}
            </div>
          </div>

          <p className="text-sm text-gray-700 mb-4">
            {analysis.supervisoryAnalysis.gradeDescription}
          </p>

          <div className="space-y-4">
            {/* Supervisory Warnings */}
            {analysis.supervisoryAnalysis.findings.warnings.length > 0 && (
              <div>
                <h4 className="font-medium text-yellow-800 mb-2 text-sm">
                  Verification Concerns (
                  {analysis.supervisoryAnalysis.findings.warnings.length})
                </h4>
                <ul className="space-y-1">
                  {analysis.supervisoryAnalysis.findings.warnings.map(
                    (warning, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded border-l-2 border-yellow-400"
                      >
                        {warning}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {/* Supervisory Positive Findings */}
            <div>
              <h4 className="font-medium text-green-800 mb-2 text-sm">
                Verification Success (
                {analysis.supervisoryAnalysis.findings.positiveFindings.length})
              </h4>
              {analysis.supervisoryAnalysis.findings.positiveFindings.length >
              0 ? (
                <ul className="space-y-1">
                  {analysis.supervisoryAnalysis.findings.positiveFindings.map(
                    (finding, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-green-700 bg-green-50 p-2 rounded border-l-2 border-green-400"
                      >
                        {finding}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="text-xs text-gray-500 italic">
                  No verification activities
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Client-side map component for submission markers (no SSR)
import SubmissionMap from "@/components/supervision/SubmissionMap";

function ItemRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 text-sm py-2 border-b border-gray-100 last:border-b-0">
      <div className="text-gray-600 font-medium">{label}</div>
      <div className="col-span-2 text-gray-900">{value ?? "-"}</div>
    </div>
  );
}

function HSBlock({ idx, s }: { idx: 1 | 2 | 3 | 4 | 5; s: KoboResult }) {
  const prefix = `group_hs_${idx}/hs_${idx}_` as const;

  // Helper to read a known KoboResult key without using any
  const getField = <K extends keyof KoboResult>(key: K): KoboResult[K] =>
    s[key];

  const q1 = getField(`${prefix}q1` as keyof KoboResult) as string | undefined;
  const q2 = getField(`${prefix}q2` as keyof KoboResult) as string | undefined;
  const q3 = getField(`${prefix}q3` as keyof KoboResult) as string | undefined;
  const q4 = getField(`${prefix}q4` as keyof KoboResult) as string | undefined;
  const q5 = getField(`${prefix}q5` as keyof KoboResult) as string | undefined;
  const q6 = getField(`${prefix}q6` as keyof KoboResult) as string | undefined;
  const q7 = getField(`${prefix}q7` as keyof KoboResult) as string | undefined;
  const q8 = getField(`${prefix}q8` as keyof KoboResult) as string | undefined;
  const q9 = getField(`${prefix}q9` as keyof KoboResult) as string | undefined;
  const q10 = getField(`${prefix}q10` as keyof KoboResult) as
    | string
    | undefined;

  const picXPath = `group_hs_${idx}/hs_${idx}_picture`;
  const attachment = findAttachmentFor(picXPath, s._attachments);

  return (
    <Section title={`House/Spot Verified ${idx}`}>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="space-y-1">
            <ItemRow label="Location/Spot Number" value={q1} />
            <ItemRow label="Resident Name" value={q2} />
            <ItemRow label="Contact Number" value={q3} />
            <ItemRow label="House Inspected Inside" value={q4} />
            <ItemRow label="Last Visit Date" value={q5} />
            <ItemRow label="Roof Inspected" value={q6} />
            <ItemRow label="Larvae Found" value={q7} />
            <ItemRow label="Larvae Remaining" value={q8} />
            <ItemRow label="Awareness Provided" value={q9} />
            <ItemRow label="Work is Fake" value={q10} />
          </div>
        </div>
        <div>
          {attachment ? (
            <div className="space-y-3">
              {/* Prefer small/medium thumbnails, fall back to original; add explicit size to avoid layout shift */}
              {/* Use Next.js Image for better loading and layout stability.
                  Unoptimized to proxy Kobo URLs as-is (since they are remote). */}
              <div className="relative w-full h-48 md:h-56">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={attachment.download_url}
                  alt={`HS ${idx} picture`}
                  className="w-full h-full rounded-lg border object-cover bg-gray-50 shadow-sm"
                />
              </div>
              <div className="text-xs text-gray-600 break-all">
                <Link
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  href={attachment.download_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open original image
                </Link>
              </div>
            </div>
          ) : (
            <div className="h-48 md:h-56 rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 text-sm text-gray-400 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-8 h-8 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                No picture available
              </div>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

export default async function SupervisionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // In Next 15, route params are an async dynamic API and must be awaited.
  const { id } = await params;
  const numericId = Number(id);
  const data = await fetchAll();
  const submission = data.results.find((r) => r._id === numericId);

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/" className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">🦟</span>
                  </div>
                  <span className="text-xl font-semibold text-gray-900">
                    DTS
                  </span>
                </Link>
                <div className="h-6 w-px bg-gray-300"></div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Supervision Dashboard
                  </h1>
                  <p className="text-sm text-gray-600">
                    District Health Authority Rawalpindi
                  </p>
                </div>
              </div>
              <nav className="hidden md:flex space-x-6">
                <Link
                  href="/"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/supervision-dashboard"
                  className="text-blue-600 font-medium"
                >
                  Supervision
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-400 mr-3">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">
                  Submission not found
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🦟</span>
                </div>
                <span className="text-xl font-semibold text-gray-900">DTS</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Supervision Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  District Health Authority Rawalpindi
                </p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link
                href="/"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/supervision-dashboard"
                className="text-blue-600 font-medium"
              >
                Supervision
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">
              Submission #{submission._id}
            </h1>
            <span className="text-xs text-gray-500">
              {submission._submission_time
                ? new Date(submission._submission_time).toLocaleString()
                : ""}
            </span>
          </div>
        </div>

        <Section title="General Information">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <ItemRow label="Town" value={submission["group_general/town"]} />
              <ItemRow label="UC" value={submission["group_general/uc"]} />
              <ItemRow
                label="Supervisor CNIC"
                value={submission["group_general/supervisor_cnic"]}
              />
              <ItemRow
                label="Date of Visit"
                value={submission["group_general/Date_of_Visit"]}
              />
              <ItemRow
                label="Time of Visit"
                value={submission["group_general/Time_of_Visit"]}
              />
            </div>
            <div>
              <ItemRow
                label="Team Type"
                value={submission["group_general_001/Team_Type"]}
              />
              <ItemRow
                label="Dengue Team Number"
                value={submission["group_general_001/Dengue_Team_Number"]}
              />
              <ItemRow
                label="Team Member 1"
                value={submission["group_general_001/Team_Member_1_Name"]}
              />
              <ItemRow
                label="Team Member 2"
                value={submission["group_general_001/Team_Member_2_Name"]}
              />
              <ItemRow
                label="Area Address"
                value={
                  submission["group_general_001/group_ln8pu96/area_address"]
                }
              />
            </div>
          </div>
        </Section>

        {/* Performance Analysis */}
        <SupervisoryQualityCard submission={submission} />

        {/* Map with 5 markers from this submission */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Visit Locations Map
          </h2>
          {/* Contain the map to avoid overlapping adjacent sections */}
          <div className="relative">
            <div className="w-full rounded-lg border border-gray-200 overflow-hidden">
              {/* Fix the height here so the internal Leaflet canvas cannot auto-expand */}
              <div className="h-72">
                <SubmissionMap submission={submission} />
              </div>
            </div>
          </div>
        </div>

        <HSBlock idx={1} s={submission} />
        <HSBlock idx={2} s={submission} />
        <HSBlock idx={3} s={submission} />
        <HSBlock idx={4} s={submission} />
        <HSBlock idx={5} s={submission} />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">🦟</span>
              </div>
              <span className="text-xl font-semibold">
                District Health Authority Rawalpindi
              </span>
            </div>
            <p className="text-gray-400">
              Powered by Epidemics Prevention & Control Cell
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
