import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();

    // Only allow admins to view hotspots
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { society_id } = session.user;

    // Use queryRaw to aggregate by location inside the JSON field
    const hotspots = await prisma.$queryRaw<Array<{ category: string, location: string, count: number }>>`
      SELECT 
        category::text, 
        extracted_details->>'location' as location, 
        COUNT(*)::int as count 
      FROM "Incident" 
      WHERE society_id = ${society_id}
        AND created_at >= NOW() - INTERVAL '30 days'
        AND extracted_details->>'location' IS NOT NULL
        AND extracted_details->>'location' != ''
      GROUP BY category, extracted_details->>'location'
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 10
    `;

    return NextResponse.json({ hotspots });
  } catch (error) {
    console.error("Failed to fetch hotspots:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
