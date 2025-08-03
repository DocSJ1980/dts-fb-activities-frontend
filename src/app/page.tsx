import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">🦟</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  DHA Rawalpindi
                </h1>
                <p className="text-sm text-gray-600">
                  District Health Authority Rawalpindi
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            District Health Authority Rawalpindi Dengue Surveillance Dashboard
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Monitor and track dengue vector surveillance activities across
            different locations. Real-time data visualization and comprehensive
            reporting for effective disease control.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Surveillance Activities Card */}
          <Link href="/indoor-surveillance" className="group">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-3xl">🦟</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Indoor Vector Surveillance
              </h3>
              <p className="text-gray-600 mb-6">
                View and monitor dengue surveillance activities across different
                locations with interactive maps and detailed reports.
              </p>
              <div className="flex items-center text-blue-600 font-medium">
                <span>Explore Activities</span>
                <svg
                  className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Link>

          {/* Outdoor Vector Surveillance Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
              <span className="text-3xl">🌿</span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Outdoor Vector Surveillance
            </h3>
            <p className="text-gray-600 mb-6">
              Monitor outdoor dengue vector activities with up-to-date data and
              insights.
            </p>
            <div className="flex items-center text-gray-400 font-medium">
              <span>Coming Soon</span>
            </div>
          </div>

          {/* Supervision Dashboard Card */}
          <Link href="/supervision-dashboard" className="group">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Supervision Dashboard
              </h3>
              <p className="text-gray-600 mb-6">
                Monitor supervisory visits and assess team performance quality
                with detailed analytics and quality indicators.
              </p>
              <div className="flex items-center text-green-600 font-medium">
                <span>View Dashboard</span>
                <svg
                  className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Link>

          {/* Analytics Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Data Analytics
            </h3>
            <p className="text-gray-600 mb-6">
              Comprehensive analytics and insights from surveillance data to
              support decision-making and resource allocation.
            </p>
            <div className="flex items-center text-gray-400 font-medium">
              <span>Coming Soon</span>
            </div>
          </div>

          {/* Reports Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Reports & Export
            </h3>
            <p className="text-gray-600 mb-6">
              Generate detailed reports and export data for further analysis and
              sharing with stakeholders.
            </p>
            <div className="flex items-center text-gray-400 font-medium">
              <span>Coming Soon</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Quick Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">--</div>
              <div className="text-gray-600">Total Activities</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">--</div>
              <div className="text-gray-600">Towns Covered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">--</div>
              <div className="text-gray-600">UCs Monitored</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">--</div>
              <div className="text-gray-600">Active Cases</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
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
              Empowering public health through data-driven surveillance and
              monitoring. Powered by Epidemics Prevention & Control Cell
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
