import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding SocietyOS database...");

  // 1. Create a Society
  const society = await prisma.society.upsert({
    where: { invite_code: "DEMO-123" },
    update: {},
    create: {
      name: "Sunnyvale Heights",
      address: "123 Silicon Valley Road",
      invite_code: "DEMO-123",
    },
  });
  console.log(`✅ Society Created: ${society.name}`);

  // 2. Create Users
  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@society.com" },
    update: {},
    create: {
      society_id: society.id,
      name: "System Admin",
      email: "admin@society.com",
      password_hash: passwordHash,
      role: "admin",
    },
  });

  const resident1 = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      society_id: society.id,
      name: "Alice Wonderland",
      email: "alice@example.com",
      password_hash: passwordHash,
      role: "resident",
      flat_number: "A-101",
    },
  });

  const resident2 = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      society_id: society.id,
      name: "Bob Builder",
      email: "bob@example.com",
      password_hash: passwordHash,
      role: "resident",
      flat_number: "B-202",
    },
  });
  console.log(`✅ Users Created (Admin: ${admin.email}, Residents: Alice, Bob)`);

  // 3. Create Routing Rules
  const routes = [
    { category: "plumbing", team_name: "QuickFix Plumbers" },
    { category: "electrical", team_name: "Volt Services" },
    { category: "elevator", team_name: "Otis Maintenance" },
    { category: "housekeeping", team_name: "Sparkle Cleaners" },
    { category: "security", team_name: "Ironclad Security" },
  ];

  for (const r of routes) {
    await prisma.categoryRoutingRule.upsert({
      where: {
        society_id_category: {
          society_id: society.id,
          category: r.category,
        },
      },
      update: { team_name: r.team_name },
      create: {
        society_id: society.id,
        category: r.category,
        team_name: r.team_name,
      },
    });
  }
  console.log(`✅ Routing Rules Created`);

  // 4. Create Incidents
  const now = new Date();
  const past3Days = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  
  const incidentsToCreate = [
    {
      resident_id: resident1.id,
      raw_complaint_text: "Water is leaking heavily from the kitchen sink.",
      category: "plumbing",
      priority: "high",
      priority_score: 3,
      status: "open",
      assigned_to: "QuickFix Plumbers",
      extracted_details: { location: "Kitchen" },
      sla_due_at: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Due tomorrow
      created_at: now,
    },
    {
      resident_id: resident2.id,
      raw_complaint_text: "Elevator A is stuck on the 4th floor.",
      category: "elevator",
      priority: "critical",
      priority_score: 4,
      status: "in_progress",
      assigned_to: "Otis Maintenance",
      extracted_details: { location: "Elevator A" },
      sla_due_at: new Date(now.getTime() - 2 * 60 * 60 * 1000), // OVERDUE 2 hrs
      created_at: past3Days,
    },
    {
      resident_id: resident1.id,
      raw_complaint_text: "Gym AC is not cooling properly.",
      category: "electrical",
      priority: "medium",
      priority_score: 2,
      status: "resolved",
      assigned_to: "Volt Services",
      extracted_details: { location: "Gym" },
      sla_due_at: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      created_at: past3Days,
      resolved_at: now,
    }
  ];

  for (const inc of incidentsToCreate) {
    const createdInc = await prisma.incident.create({
      data: {
        society_id: society.id,
        ...inc,
        events: {
          create: [
            {
              actor_id: admin.id,
              type: "system_note",
              content: "Incident seeded for demo."
            }
          ]
        }
      }
    });
    console.log(`✅ Incident Created: ${createdInc.category} - ${createdInc.priority}`);
  }

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
