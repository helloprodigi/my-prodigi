import { PrismaClient } from './generated/prisma';
const prisma = new PrismaClient({
  accelerateUrl: 'prisma://accelerate.prisma-client.com/?api_key=123'
});
async function test() {
  try {
    const res = await prisma.competition.findMany();
    console.log(res);
  } catch (e) {
    console.error(e);
  }
}
test();
