const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const societies = await prisma.society.findMany();
    if(societies.length === 0) return console.log("No society");
    
    const sid = societies[0].id;
    console.log("Testing upsert for society:", sid);

    await prisma.categoryRoutingRule.upsert({
      where: {
        society_id_category: {
          society_id: sid,
          category: 'plumbing'
        }
      },
      update: {
        team_name: 'Test Team',
      },
      create: {
        society_id: sid,
        category: 'plumbing',
        team_name: 'Test Team',
      }
    });

    console.log("Upsert succeeded!");
  } catch (e) {
    console.error("Upsert failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
