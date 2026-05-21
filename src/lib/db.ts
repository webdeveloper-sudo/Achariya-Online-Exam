import dns from "dns";

// Force Node.js DNS resolution to prioritize IPv4 over IPv6. This prevents transient
// getaddrinfo ENOTFOUND (DatabaseNotReachable/P1001) errors on local development environments.
dns.setDefaultResultOrder("ipv4first");

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not defined.");
}

const globalForPrisma = global as unknown as { prisma: PrismaClient; prisma1: PrismaClient };

let prismaInstance: PrismaClient;

if (globalForPrisma.prisma1) {
  prismaInstance = globalForPrisma.prisma1;
} else {
  // Use ssl: { rejectUnauthorized: false } to prevent SSL validation failures on Windows dev machines.
  // Add connectionTimeoutMillis to handle database cold-starts.
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 15000,
  });
  
  const adapter = new PrismaPg(pool);
  prismaInstance = new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma1 = prismaInstance;
  }
}

export const prisma = prismaInstance;
