import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();

    // Only allow admins to view analytics
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { society_id } = session.user;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Total incidents (Last 30 Days)
    const totalIncidents = await prisma.incident.count({
      where: { 
        society_id,
        created_at: { gte: thirtyDaysAgo }
      },
    });

    // 2. Open / In Progress vs Resolved
    const openCount = await prisma.incident.count({
      where: {
        society_id,
        status: { in: ["open", "acknowledged", "in_progress", "assigned", "reopened"] },
      },
    });

    const resolvedCount = await prisma.incident.count({
      where: {
        society_id,
        status: { in: ["resolved", "closed"] },
        created_at: { gte: thirtyDaysAgo }
      },
    });

    // 3. Overdue SLA Count
    const overdueCount = await prisma.incident.count({
      where: {
        society_id,
        status: { in: ["open", "acknowledged", "in_progress", "assigned", "reopened"] },
        sla_due_at: { lt: new Date() }
      },
    });

    // 4. Breakdown by Category (using grouping)
    const categoryGroup = await prisma.incident.groupBy({
      by: ['category'],
      where: {
        society_id,
        created_at: { gte: thirtyDaysAgo }
      },
      _count: {
        category: true,
      },
    });

    const categories = categoryGroup.map((g: any) => ({
      name: g.category,
      count: g._count.category,
    })).sort((a: any, b: any) => b.count - a.count);

    return NextResponse.json({ 
      totalIncidents, 
      openCount, 
      resolvedCount, 
      overdueCount,
      categories 
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
