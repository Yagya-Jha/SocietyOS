import { prisma } from './src/lib/prisma';

console.log("Keys on prisma object:", Object.keys(prisma));
console.log("Is categoryRoutingRule defined?", typeof prisma.categoryRoutingRule);
