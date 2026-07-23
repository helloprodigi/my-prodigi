import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

let connectionString = process.env.DATABASE_URL || "";
if (connectionString) {
  const url = new URL(connectionString);
  url.searchParams.delete('sslmode');
  connectionString = url.toString();
}

const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
}); // pooler, port 6543

const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;