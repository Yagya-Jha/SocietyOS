import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rules = await prisma.categoryRoutingRule.findMany({
      where: { society_id: session.user.society_id },
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("Failed to fetch routing rules:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rules } = await req.json();

    if (!Array.isArray(rules)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // Process all rules sequentially to prevent transaction timeouts (P2028)
    for (const r of rules) {
      await prisma.categoryRoutingRule.upsert({
        where: {
          society_id_category: {
            society_id: session.user.society_id,
            category: r.category,
          }
        },
        update: {
          team_name: r.team_name,
        },
        create: {
          society_id: session.user.society_id,
          category: r.category,
          team_name: r.team_name,
        }
      });
    }

    return NextResponse.json({ message: "Routing rules saved successfully" });
  } catch (error) {
    console.error("Failed to save routing rules:", error);
    require('fs').writeFileSync('debug_error.txt', String(error) + '\n\n' + (error as Error).stack);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
