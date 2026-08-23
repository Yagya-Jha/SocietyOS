import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { generateText } from "ai";
import { extractionModel } from "@/lib/ai";
import { generateEmbedding } from "@/lib/embeddings";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { raw_complaint_text, category: userCategory, location: userLocation } = await req.json();

    if (!raw_complaint_text) {
      return NextResponse.json(
        { error: "Complaint text is required" },
        { status: 400 }
      );
    }

    // 1. AI Classification & Extraction
    let finalCategory = userCategory || "other";
    let finalLocation = userLocation || "";
    let finalPriority = "low";
    let priorityScore = 1;
    let slaDueAt = new Date();
    let translatedText = raw_complaint_text;

    try {
      const { text } = await generateText({
        model: extractionModel,
        prompt: `Analyze the following resident complaint and extract its category, location, priority, and translate it to English. The complaint might be in Hindi, Hinglish, Roman Urdu, or any other language.
        Complaint: "${raw_complaint_text}"
        
        If the user provided a location hint "${userLocation}", try to incorporate or refine it.
        
        You MUST respond with ONLY a valid JSON object in the exact following format, without any markdown formatting or explanation:
        {
          "english_translation": "Translate the complaint into clear English. If it is already in English, just return the original text.",
          "category": "plumbing" | "electrical" | "civil_structural" | "elevator" | "security" | "housekeeping" | "parking" | "other",
          "location": "The specific location mentioned (e.g. 'Lobby', 'Elevator B', 'Flat 101'). Extract this from the translated text. Leave empty string if none.",
          "priority": "low" | "medium" | "high" | "critical"
        }
        
        Guidelines for priority:
        - critical: immediate life-safety or severe property damage risk (e.g., fire, massive flood, trapped in elevator).
        - high: major inconvenience, prevents essential use (e.g., no power in entire flat, main door broken).
        - medium: standard issues (e.g., leaking tap, broken bulb).
        - low: aesthetic or minor requests (e.g., chipped paint, grass trimming).`,
      });

      const jsonStr = text.replace(/```json\n?/, '').replace(/```/, '').trim();
      const object = JSON.parse(jsonStr);

      if (object.english_translation) {
        translatedText = object.english_translation;
      }

      if (finalCategory === "other" && object.category) {
        finalCategory = object.category.toLowerCase().replace(" ", "_");
      }
      
      if (object.location) {
        finalLocation = object.location;
      }
      
      if (object.priority) {
        finalPriority = object.priority.toLowerCase();
        if (!["low", "medium", "high", "critical"].includes(finalPriority)) {
           finalPriority = "low";
        }
      }
    } catch (aiError) {
      console.error("AI extraction failed, proceeding with fallback values:", aiError);
    }
    
    // SLA & Priority Score Logic
    switch (finalPriority) {
      case "critical":
        priorityScore = 4;
        slaDueAt.setHours(slaDueAt.getHours() + 4);
        break;
      case "high":
        priorityScore = 3;
        slaDueAt.setHours(slaDueAt.getHours() + 24);
        break;
      case "medium":
        priorityScore = 2;
        slaDueAt.setHours(slaDueAt.getHours() + 48);
        break;
      case "low":
      default:
        priorityScore = 1;
        slaDueAt.setHours(slaDueAt.getHours() + (24 * 7)); // 7 days
        break;
    }

    // Rule-based Assignment Logic from DB Settings
    let assignedTo = "Facility Manager"; // Default fallback
    try {
      const routingRule = await prisma.categoryRoutingRule.findUnique({
        where: {
          society_id_category: {
            society_id: session.user.society_id,
            category: finalCategory as any,
          }
        }
      });

      if (routingRule && routingRule.team_name) {
        assignedTo = routingRule.team_name;
      }
    } catch (routeError) {
      console.error("Failed to fetch routing rule, using default:", routeError);
    }

    // 2. Generate Embedding
    let embeddingString = null;
    let is_duplicate_of = null;
    
    try {
      const embedding = await generateEmbedding(translatedText);
      embeddingString = `[${embedding.join(',')}]`;

      // 3. Duplicate Detection via pgvector
      const similarIncidents = await prisma.$queryRaw<Array<{ id: string, similarity: number }>>`
        SELECT id, 1 - (embedding <=> ${embeddingString}::vector) as similarity
        FROM "Incident"
        WHERE society_id = ${session.user.society_id}
        AND embedding IS NOT NULL
        AND 1 - (embedding <=> ${embeddingString}::vector) > 0.85
        ORDER BY similarity DESC
        LIMIT 1
      `;

      if (similarIncidents.length > 0) {
        is_duplicate_of = similarIncidents[0].id;
        console.log(`Duplicate found! Linked to ${is_duplicate_of} with similarity ${similarIncidents[0].similarity}`);
        
        // Inherit properties from the original incident to avoid discrepancies
        const originalIncident = await prisma.incident.findUnique({
          where: { id: is_duplicate_of }
        });
        
        if (originalIncident) {
          finalCategory = originalIncident.category;
          if (originalIncident.priority) finalPriority = originalIncident.priority as string;
          if (originalIncident.priority_score) priorityScore = originalIncident.priority_score;
          if (originalIncident.assigned_to) assignedTo = originalIncident.assigned_to;
          if (originalIncident.sla_due_at) slaDueAt = originalIncident.sla_due_at;
        }
      }
    } catch (embError) {
      console.error("Embedding generation or search failed:", embError);
    }

    // 4. Save Incident
    const incident = await prisma.incident.create({
      data: {
        society_id: session.user.society_id,
        resident_id: session.user.id,
        raw_complaint_text,
        category: finalCategory,
        extracted_details: finalLocation ? { location: finalLocation } : undefined,
        status: "open",
        is_duplicate_of,
        priority: finalPriority as any,
        priority_score: priorityScore,
        sla_due_at: slaDueAt,
        assigned_to: assignedTo,
        events: {
          create: {
            actor_id: session.user.id,
            type: "system_note",
            content: "Incident reported and triaged.",
          }
        }
      },
    });

    // 5. Save the embedding vector using raw SQL
    if (embeddingString) {
      await prisma.$executeRaw`
        UPDATE "Incident" 
        SET embedding = ${embeddingString}::vector 
        WHERE id = ${incident.id}
      `;
    }

    return NextResponse.json(
      { message: "Complaint submitted successfully", incident },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to submit complaint:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

