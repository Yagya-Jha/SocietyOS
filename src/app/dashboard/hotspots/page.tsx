"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Hotspot = {
  category: string;
  location: string;
  count: number;
};

export default function HotspotsPage() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/hotspots")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized or failed to fetch");
        return res.json();
      })
      .then((data) => setHotspots(data.hotspots))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
              Issue Hotspots
            </h1>
            <p className="text-gray-500">
              Detecting recurring problems and critical areas over the last 30 days.
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
          <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-white rounded-2xl shadow-sm border border-gray-100 animate-pulse"></div>
            ))}
          </div>
        ) : hotspots.length === 0 ? (
          <div className="text-center py-20 bg-white">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">No Hotspots Detected</h3>
            <p className="text-gray-500 mt-1">Great job! There are no recurring issues in specific locations recently.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotspots.map((h: any, idx: number) => (
              <Link
                key={idx}
                href={`/dashboard?category=${encodeURIComponent(h.category)}&location=${encodeURIComponent(h.location)}&status=all`}
                className="bg-red-50 border-l-4 border-red-400 p-6 hover:bg-red-100 transition-all flex flex-col items-start block"
              >
                <div className="flex items-center gap-2 mb-4 w-full justify-between">
                  <span className="text-sm font-bold tracking-wide text-red-800 bg-red-100 px-3 py-1 rounded-full uppercase">
                    {h.category.replace('_', ' ')}
                  </span>
                  <span className="text-2xl font-black text-red-600">
                    {h.count} <span className="text-sm font-bold text-red-400">issues</span>
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2 truncate w-full">
                  📍 {h.location}
                </h3>
                
                <p className="text-gray-600 text-sm mt-auto font-medium">
                  This location has experienced {h.count} identical or similar issues in the past 30 days. Click to view incidents.
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
