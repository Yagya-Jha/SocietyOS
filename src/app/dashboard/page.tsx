import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const statusFilter = params.status as string || "active";
  const categoryFilter = params.category as string || undefined;
  const locationFilter = params.location as string || undefined;
  const searchQuery = params.q as string || undefined;

  let statusQuery: any = undefined;
  if (statusFilter === "active") {
    statusQuery = { in: ["open", "acknowledged", "assigned", "in_progress", "reopened"] };
  } else if (statusFilter === "resolved") {
    statusQuery = { in: ["resolved", "closed"] };
  }

  // Fetch incidents for the current resident, or all if admin (BUT strictly scoped to their society)
  const incidents = await prisma.incident.findMany({
    where: {
      society_id: session.user.society_id,
      ...(session.user.role === "admin" ? {} : { resident_id: session.user.id }),
      ...(statusQuery ? { status: statusQuery } : {}),
      ...(categoryFilter ? { category: categoryFilter as any } : {}),
      ...(locationFilter ? { extracted_details: { path: ['location'], equals: locationFilter } } : {}),
      ...(searchQuery ? { raw_complaint_text: { contains: searchQuery, mode: 'insensitive' } } : {})
    },
    orderBy: { created_at: "desc" },
  });

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

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-xl font-bold text-indigo-900">
              SocietyOS
            </Link>
            <span className="bg-indigo-100 text-indigo-800 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ml-1 sm:ml-2 uppercase tracking-wide hidden xs:inline-block">
              {session.user.role}
            </span>
            <Link href="/dashboard/members" className="ml-2 sm:ml-4 text-sm font-medium text-gray-600 hover:text-indigo-600">
              Directory
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              {session.user.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <h1 className="text-2xl font-bold">Welcome, {session.user.name || "User"}!</h1>
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto flex-wrap justify-end">
            <form action="/dashboard" method="GET" className="w-full sm:w-auto sm:min-w-64 flex-1 flex">
              <input type="hidden" name="status" value={statusFilter} />
              {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
              {locationFilter && <input type="hidden" name="location" value={locationFilter} />}
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search issues..."
                  className="pl-10 w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
              </div>
            </form>

            {(categoryFilter || locationFilter || searchQuery) && (
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition-colors shadow-sm text-sm whitespace-nowrap text-center"
              >
                Clear Filters
              </Link>
            )}

            {session.user.role !== "admin" && (
              <Link
                href="/complaints/new"
                className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap text-center"
              >
                + Report Issue
              </Link>
            )}

            {session.user.role === "admin" && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Link
                href="/dashboard/analytics"
                className="flex-1 sm:flex-none justify-center px-4 sm:px-6 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 font-medium rounded-lg hover:bg-blue-100 transition-colors shadow-sm flex items-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics
              </Link>
              <Link
                href="/dashboard/hotspots"
                className="flex-1 sm:flex-none justify-center px-4 py-2 bg-red-50 text-red-600 border border-red-200 font-medium rounded-lg hover:bg-red-100 transition-colors shadow-sm flex items-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Hotspots
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex-1 sm:flex-none justify-center px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 font-medium rounded-lg hover:bg-gray-100 transition-colors shadow-sm flex items-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
            </div>
            )}
          </div>
        </div>
        
        <div className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              {session.user.role === "admin" ? "All Recent Incidents" : "My Complaints"}
              {(categoryFilter || locationFilter) && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (Filtered by {categoryFilter} {locationFilter})
                </span>
              )}
            </h2>

            {/* Status Tabs */}
            <div className="flex overflow-x-auto w-full sm:w-auto bg-gray-100 rounded-lg p-1 text-sm font-medium">
              <Link 
                href={`/dashboard?status=active${categoryFilter ? `&category=${categoryFilter}` : ''}${locationFilter ? `&location=${locationFilter}` : ''}`}
                className={`px-4 py-1.5 rounded-md transition-colors ${statusFilter === 'active' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Active
              </Link>
              <Link 
                href={`/dashboard?status=resolved${categoryFilter ? `&category=${categoryFilter}` : ''}${locationFilter ? `&location=${locationFilter}` : ''}`}
                className={`px-4 py-1.5 rounded-md transition-colors ${statusFilter === 'resolved' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Resolved
              </Link>
              <Link 
                href={`/dashboard?status=all${categoryFilter ? `&category=${categoryFilter}` : ''}${locationFilter ? `&location=${locationFilter}` : ''}`}
                className={`px-4 py-1.5 rounded-md transition-colors ${statusFilter === 'all' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-600 hover:text-gray-900'}`}
              >
                All
              </Link>
            </div>
          </div>
          
          {incidents.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p>You haven't reported any issues yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {incidents.map((incident: any) => (
                <li key={incident.id}>
                  <Link 
                    href={`/complaints/${incident.id}`}
                    className="block hover:bg-gray-100 transition-colors py-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium truncate mb-1">
                          {incident.raw_complaint_text}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="capitalize">{incident.category.replace('_', ' ')}</span>
                          <span>&bull;</span>
                          <span>{formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3">
                        {incident.sla_due_at && incident.sla_due_at < new Date() && incident.status !== 'resolved' && incident.status !== 'closed' && (
                          <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-800 rounded-full animate-pulse">
                            Overdue
                          </span>
                        )}
                        {incident.is_duplicate_of && (
                          <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                            Duplicate
                          </span>
                        )}
                        {incident.priority && (
                          <span className="text-xs font-medium px-2 py-1 bg-red-50 text-red-700 rounded border border-red-100 capitalize">
                            {incident.priority}
                          </span>
                        )}
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${getStatusColor(incident.status)}`}>
                          {incident.status.replace('_', ' ')}
                        </span>
                        <span className="text-gray-400">&rarr;</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
