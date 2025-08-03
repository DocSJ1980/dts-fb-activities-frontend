import Link from "next/link";
import type { KoboListResponse, KoboResult } from "@/types/kobo";
import { getSubmissionInsights, analyzeSupervisoryQuality } from "@/utils/kobo";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore next/headers returns ReadonlyHeaders in this runtime; allow .get usage
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

async function fetchData(): Promise<KoboListResponse> {
  // Use absolute URL to avoid ERR_INVALID_URL when node fetch lacks base.
  // In Next 15, headers() is an async dynamic API that must be awaited.
  const h = await (headers() as unknown as Promise<Headers>);
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const origin = `${proto}://${host}`;
  const res = await fetch(`${origin}${basePath}/api/supervision`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to load supervision data: ${res.status}`);
  }
  return res.json();
}

function Card({ item }: { item: KoboResult }) {
  const insights = getSubmissionInsights(item);
  const analysis = analyzeSupervisoryQuality(item);

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
    <Link
      href={`/supervision-dashboard/details/${item._id}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6"
    >
      <div className="flex gap-4">
        {insights.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={insights.thumb}
            alt="thumb"
            className="w-24 h-24 object-cover rounded-lg border shadow-sm"
          />
        ) : (
          <div className="w-24 h-24 rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">
            <div className="text-center">
              <svg
                className="w-6 h-6 mx-auto mb-1"
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
              No Image
            </div>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Submission #{item._id}
            </h3>
            <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
              <span className="text-xs text-gray-500">
                {item._submission_time
                  ? new Date(item._submission_time).toLocaleDateString()
                  : ""}
              </span>
              <div className="flex space-x-1">
                <div
                  className={`px-2 py-1 rounded border font-semibold text-xs ${getGradeColorClasses(
                    analysis.teamAnalysis.gradeColor
                  )}`}
                  title="Team Performance Grade"
                >
                  T:{analysis.teamAnalysis.grade}
                </div>
                <div
                  className={`px-2 py-1 rounded border font-semibold text-xs ${getGradeColorClasses(
                    analysis.supervisoryAnalysis.gradeColor
                  )}`}
                  title="Supervisory Quality Grade"
                >
                  S:{analysis.supervisoryAnalysis.grade}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center">
              <span className="font-medium text-gray-900 w-16">Location:</span>
              <span>
                {insights.town} • {insights.uc}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-900 w-16">CNIC:</span>
              <span>{insights.supervisorCnic ?? "-"}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-900 w-16">Visit:</span>
              <span>
                {insights.visitDate}{" "}
                {insights.visitTime ? `• ${insights.visitTime}` : ""}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-900 w-16">Team:</span>
              <span>
                {insights.teamType} • {insights.teamMember1}
                {insights.teamMember2 ? `, ${insights.teamMember2}` : ""}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-900 w-16">Area:</span>
              <span className="truncate">{insights.areaAddress ?? "-"}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
              HS Count: {insights.hsCount}
            </span>
            {insights.riskFlags.map((f, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${
                  f === "Fake Work Detected" || f === "Larvae Remaining"
                    ? "bg-red-100 text-red-800"
                    : f === "Larvae Found"
                    ? "bg-orange-100 text-orange-800"
                    : f === "Incomplete Inspection" ||
                      f === "No Awareness Provided"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-amber-100 text-amber-800"
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

export default async function SupervisionDetailsListPage() {
  const data = await fetchData();

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
          <h1 className="text-xl font-bold text-gray-900">
            Supervision Submissions
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Listing {data.count} submissions from field teams
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.results.map((r) => (
            <Card key={r._id} item={r} />
          ))}
        </div>
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
