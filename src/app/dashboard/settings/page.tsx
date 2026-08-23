"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CATEGORIES = [
  "plumbing",
  "electrical",
  "civil_structural",
  "elevator",
  "security",
  "housekeeping",
  "parking",
  "other"
];

type RoutingRule = {
  category: string;
  team_name: string;
};

export default function SettingsPage() {
  const [rules, setRules] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings/routing")
      .then(res => res.json())
      .then(data => {
        const rulesMap: Record<string, string> = {};
        if (data.rules) {
          data.rules.forEach((r: RoutingRule) => {
            rulesMap[r.category] = r.team_name;
          });
        }
        setRules(rulesMap);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (category: string, value: string) => {
    setRules(prev => ({ ...prev, [category]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const payload = CATEGORIES.map(cat => ({
        category: cat,
        team_name: rules[cat] || "Unassigned"
      }));

      const res = await fetch("/api/settings/routing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: payload }),
      });

      if (res.ok) {
        setMessage("Settings saved successfully!");
      } else {
        const err = await res.json();
        setMessage(`Error: ${err.error}`);
      }
    } catch (err) {
      setMessage("An unexpected error occurred.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordMessage("");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setPasswordMessage("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        const err = await res.json();
        setPasswordMessage(`Error: ${err.error}`);
      }
    } catch (err) {
      setPasswordMessage("An unexpected error occurred.");
    } finally {
      setSavingPassword(false);
      setTimeout(() => setPasswordMessage(""), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
              Routing Settings
            </h1>
            <p className="text-gray-500">
              Map incident categories to specific teams for automatic assignment.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-indigo-600 font-medium hover:text-indigo-800 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 self-start"
          >
            &larr; Back to Dashboard
          </Link>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Category to Team Mapping</h2>
          </div>
          
          <div className="p-6 sm:p-8">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {CATEGORIES.map(cat => (
                  <div key={cat} className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <label className="sm:w-1/3 font-medium text-gray-700 capitalize">
                      {cat.replace('_', ' ')}
                    </label>
                    <input
                      type="text"
                      className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900 placeholder-gray-400 font-medium bg-white"
                      placeholder="e.g. Plumbing Team, Security Chief..."
                      value={rules[cat] || ""}
                      onChange={(e) => handleChange(cat, e.target.value)}
                    />
                  </div>
                ))}

                <div className="pt-6 mt-6 flex items-center justify-between">
                  <span className={`text-sm font-medium ${message.includes("Error") ? "text-red-600" : "text-green-600"}`}>
                    {message}
                  </span>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 border-t border-gray-200 pt-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Change Password</h2>
          </div>
          
          <div className="p-6 sm:p-8">
            <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900 bg-white"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900 bg-white"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className={`text-sm font-medium ${passwordMessage.includes("Error") ? "text-red-600" : "text-green-600"}`}>
                  {passwordMessage}
                </span>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50"
                >
                  {savingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
