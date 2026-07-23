import { PrismaClient } from "./generated/prisma/index.js";

async function main() {
  const prisma = new PrismaClient();
  try {
    const userCount = await prisma.user.count();
    console.log("Connected to DB natively! Users count:", userCount);
  } catch (error) {
    console.error("Prisma error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
