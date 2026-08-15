import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Ensure SQLite database file is writable on Vercel serverless /tmp directory
if (process.env.VERCEL || process.env.NODE_ENV === "production") {
  try {
    const tmpDbPath = "/tmp/dev.db";
    if (!fs.existsSync(tmpDbPath)) {
      const localDb = path.join(process.cwd(), "dev.db");
      if (fs.existsSync(localDb)) {
        fs.copyFileSync(localDb, tmpDbPath);
      } else {
        fs.writeFileSync(tmpDbPath, "");
      }
    }
    process.env.DATABASE_URL = `file:${tmpDbPath}`;
  } catch (err) {
    console.error("Vercel tmp db setup error:", err);
  }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
