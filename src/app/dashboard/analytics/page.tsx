"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AnalyticsData = {
  totalIncidents: number;
  openCount: number;
  resolvedCount: number;
  overdueCount: number;
  categories: { name: string, count: number }[];
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized or failed to fetch");
        return res.json();
      })
      .then((d) => setData(d))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
              Facility Analytics
            </h1>
            <p className="text-gray-500">
              Overview of maintenance performance and active issues.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-indigo-600 font-medium hover:text-indigo-800 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 self-start"
          >
            &larr; Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 mb-8">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white rounded-2xl shadow-sm border border-gray-100"></div>
            ))}
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 flex flex-col border-l-4 border-gray-200">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Last 30 Days</p>
                <p className="text-3xl font-bold text-gray-900">{data.totalIncidents}</p>
                <p className="text-sm text-gray-400 mt-1">Total Reported</p>
              </div>

              <div className="bg-white p-6 flex flex-col relative overflow-hidden border-l-4 border-yellow-400">
                <p className="text-sm font-medium text-yellow-600 uppercase tracking-wider mb-2 relative z-10">Needs Attention</p>
                <p className="text-3xl font-bold text-yellow-700 relative z-10">{data.openCount}</p>
                <p className="text-sm text-yellow-600/70 mt-1 relative z-10">Active / Open Issues</p>
              </div>

              <div className="bg-white p-6 flex flex-col relative overflow-hidden border-l-4 border-green-400">
                <p className="text-sm font-medium text-green-600 uppercase tracking-wider mb-2 relative z-10">Resolved (30d)</p>
                <p className="text-3xl font-bold text-green-700 relative z-10">{data.resolvedCount}</p>
                <p className="text-sm text-green-600/70 mt-1 relative z-10">Successfully Closed</p>
              </div>

              <div className="bg-white p-6 flex flex-col relative overflow-hidden border-l-4 border-red-400">
                <p className="text-sm font-medium text-red-600 uppercase tracking-wider mb-2 relative z-10">SLA Breaches</p>
                <p className="text-3xl font-bold text-red-700 relative z-10">{data.overdueCount}</p>
                <p className="text-sm text-red-600/70 mt-1 relative z-10">Overdue Tasks</p>
              </div>
            </div>

            <div className="mb-8">
              {/* Category Breakdown */}
              <div className="bg-white p-6 sm:p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Issue Breakdown by Category</h3>
                {data.categories.length === 0 ? (
                  <p className="text-gray-500">No data available.</p>
                ) : (
                  <div className="space-y-4">
                    {data.categories.map((cat, idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700 capitalize">{cat.name.replace('_', ' ')}</span>
                          <span className="text-gray-500 font-semibold">{cat.count}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div 
                            className="bg-indigo-500 h-2 rounded-full" 
                            style={{ width: `${Math.max(5, (cat.count / data.totalIncidents) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
