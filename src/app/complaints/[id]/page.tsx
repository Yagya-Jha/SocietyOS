import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import StatusUpdater from "@/components/StatusUpdater";
import CommentForm from "@/components/CommentForm";

export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  
  const { id } = await params;

  const incident = await prisma.incident.findUnique({
    where: { id },
    include: { 
      resident: true,
      events: {
        orderBy: { created_at: "asc" },
        include: { actor: true }
      }
    },
  });

  if (!incident) return notFound();

  // Protect access: incident must belong to the user's society
  if (incident.society_id !== session.user.society_id) {
    return notFound(); // Mask cross-tenant leaks as a 404
  }

  // Only the owner or an admin can view this specific incident
  if (session.user.role !== "admin" && incident.resident_id !== session.user.id) {
    redirect("/dashboard");
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-yellow-100 text-yellow-800";
      case "acknowledged": return "bg-blue-100 text-blue-800";
      case "assigned": return "bg-purple-100 text-purple-800";
      case "in_progress": return "bg-indigo-100 text-indigo-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const details = incident.extracted_details as Record<string, any> || {};
  const isAdmin = session.user.role === "admin";

  return (
    <div className="min-h-screen bg-white text-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="text-indigo-600 font-medium hover:text-indigo-800 mb-6 inline-block"
        >
          &larr; Back to Dashboard
        </Link>

        <div className="mt-8 border-t border-gray-200">
          <div className="py-6 sm:py-8 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h1 className="text-xl font-bold text-gray-900 leading-snug">
                Issue #{incident.id.slice(0, 8)}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                {incident.is_duplicate_of && (
                  <Link
                    href={`/complaints/${incident.is_duplicate_of}`}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold hover:bg-red-200 transition-colors"
                  >
                    Duplicate (View Original &rarr;)
                  </Link>
                )}
                {isAdmin ? (
                  <StatusUpdater incidentId={incident.id} currentStatus={incident.status} />
                ) : (
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${getStatusColor(incident.status)}`}>
                    {incident.status.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
            <p className="text-gray-500 text-sm">
              Reported on {format(new Date(incident.created_at), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Description
              </h3>
              <p className="text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-100">
                {incident.raw_complaint_text}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Category
                </h3>
                <p className="text-gray-800 capitalize font-medium">
                  {incident.category.replace('_', ' ')}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Priority
                </h3>
                {incident.priority ? (
                  <p className="text-red-600 font-bold capitalize">
                    {incident.priority}
                  </p>
                ) : (
                  <p className="text-gray-500 italic">Pending AI Triage</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Location
                </h3>
                <p className="text-gray-800 font-medium">
                  {details.location || "Not specified"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Reporter
                </h3>
                <p className="text-gray-800 font-medium">
                  {incident.resident.name || "Resident"} 
                  {incident.resident.flat_number && ` (Flat ${incident.resident.flat_number})`}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Assigned To
                </h3>
                <p className="text-gray-800 font-medium">
                  {incident.assigned_to || "Unassigned"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  SLA Due Date
                </h3>
                <p className={`font-medium ${incident.sla_due_at && incident.sla_due_at < new Date() && incident.status !== 'resolved' && incident.status !== 'closed' ? 'text-red-600' : 'text-gray-800'}`}>
                  {incident.sla_due_at ? format(new Date(incident.sla_due_at), "MMM d, yyyy 'at' h:mm a") : "Not set"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline & Comments Section */}
        <div className="mt-12 border-t border-gray-200">
          <div className="py-6 sm:py-8 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Activity Timeline</h2>
          </div>
          <div className="p-6 sm:p-8">
            {incident.events.length > 0 ? (
              <div className="flow-root">
                <ul role="list" className="-mb-8">
                  {incident.events.map((event, eventIdx) => (
                    <li key={event.id}>
                      <div className="relative pb-8">
                        {eventIdx !== incident.events.length - 1 ? (
                          <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                              event.type === 'comment' ? 'bg-indigo-500' :
                              event.type === 'status_change' ? 'bg-blue-500' :
                              'bg-gray-500'
                            }`}>
                              {event.type === 'comment' ? (
                                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col sm:flex-row justify-between gap-1 sm:gap-4 pt-1.5">
                            <div>
                              <p className="text-sm text-gray-500">
                                {event.content}{' '}
                                <span className="font-medium text-gray-900">
                                  by {event.actor?.name || event.actor?.email || 'System'}
                                </span>
                              </p>
                            </div>
                            <div className="whitespace-nowrap text-left sm:text-right text-sm text-gray-400">
                              {format(new Date(event.created_at), "MMM d, h:mm a")}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No activity recorded yet.</p>
            )}

            {/* Render Comment Form for all users */}
            <div className="mt-6 border-t border-gray-100 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Leave a comment</h3>
              <CommentForm incidentId={incident.id} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
