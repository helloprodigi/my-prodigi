const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany();
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}
run();
