import { PrismaClient } from './generated/prisma'

const prisma = new PrismaClient()

async function main() {
  await prisma.$executeRawUnsafe(`NOTIFY pgrst, 'reload schema'`)
  console.log("Schema cache reloaded successfully!")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
