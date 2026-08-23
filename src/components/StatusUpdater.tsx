"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "reopened", label: "Reopened" },
];

export default function StatusUpdater({ incidentId, currentStatus }: { incidentId: string, currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setLoading(true);

    try {
      const res = await fetch(`/api/incidents/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      router.refresh(); // Refresh the page to reflect changes
    } catch (error) {
      console.error(error);
      alert("Failed to update status");
      setStatus(currentStatus); // Revert on failure
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-500">Status:</label>
      <select
        value={status}
        onChange={handleStatusChange}
        disabled={loading}
        className="text-sm bg-white border border-gray-300 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {loading && <span className="text-xs text-gray-400">Updating...</span>}
    </div>
  );
}
