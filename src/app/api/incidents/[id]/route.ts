import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Verify the incident belongs to the admin's society
    const existing = await prisma.incident.findUnique({
      where: { id },
    });

    if (!existing || existing.society_id !== session.user.society_id) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const validStatuses = ["open", "acknowledged", "in_progress", "resolved", "closed", "reopened"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await prisma.incident.update({
      where: { id },
      data: { 
        status: status as any,
        resolved_at: status === "resolved" || status === "closed" ? new Date() : null,
        events: {
          create: {
            actor_id: session.user.id,
            type: "status_change",
            content: `Status updated to ${status}`,
          }
        }
      },
    });

    return NextResponse.json({ message: "Status updated", incident: updated });
  } catch (error) {
    console.error("Failed to update incident:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
