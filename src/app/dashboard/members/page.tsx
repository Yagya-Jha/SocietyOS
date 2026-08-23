import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function MembersPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/auth/signin");
  }

  const members = await prisma.user.findMany({
    where: { society_id: session.user.society_id },
    orderBy: [
      { role: "asc" }, // Admin first
      { name: "asc" }
    ],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      flat_number: true,
    }
  });

  return (
    <div className="min-h-screen bg-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
              Society Members
            </h1>
            <p className="text-gray-500">
              Directory of all residents and administrators in your society.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-indigo-600 font-medium hover:text-indigo-800 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 self-start"
          >
            &larr; Back to Dashboard
          </Link>
        </div>

        <div className="mt-8 border-t border-gray-200">
          <ul className="divide-y divide-gray-100">
            {members.map((member) => (
              <li key={member.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-700 font-bold text-lg">
                    {member.name ? member.name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-900 font-semibold truncate">{member.name || "Unknown User"}</p>
                    <p className="text-sm text-gray-500 truncate">{member.email}</p>
                  </div>
                </div>
                
                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2">
                  {member.role === "admin" ? (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full border border-purple-200 uppercase tracking-wider">
                      Admin
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full border border-gray-200 uppercase tracking-wider">
                      Resident
                    </span>
                  )}
                  {member.flat_number && (
                    <span className="text-sm font-medium text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">
                      Flat: {member.flat_number}
                    </span>
                  )}
                </div>
              </li>
            ))}
            
            {members.length === 0 && (
              <li className="p-8 text-center text-gray-500">No members found.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
