import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: incidentId } = await params;
    const { content } = await req.json();

    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    }

    // Verify access
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    // Must be from same society
    if (incident.society_id !== session.user.society_id) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    // Only owner or admin can comment
    if (session.user.role !== "admin" && incident.resident_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const event = await prisma.incidentEvent.create({
      data: {
        incident_id: incidentId,
        actor_id: session.user.id,
        type: "comment",
        content: content.trim(),
      },
    });

    return NextResponse.json({ message: "Comment added", event }, { status: 201 });
  } catch (error) {
    console.error("Failed to add comment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
