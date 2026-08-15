import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Ensure SQLite database file is writable on Vercel serverless /tmp directory
if (process.env.VERCEL || process.env.NODE_ENV === "production") {
  try {
    const tmpDbPath = "/tmp/dev.db";
    const needsCopy = !fs.existsSync(tmpDbPath) || fs.statSync(tmpDbPath).size === 0;

    if (needsCopy) {
      const candidates = [
        path.join(process.cwd(), "prisma", "seed.db"),
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join(process.cwd(), "dev.db"),
      ];

      for (const cand of candidates) {
        if (fs.existsSync(cand) && fs.statSync(cand).size > 0) {
          fs.copyFileSync(cand, tmpDbPath);
          break;
        }
      }
    }
    const envObj = process.env;
    envObj["DATABASE" + "_URL"] = "file:" + tmpDbPath;
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
