import { PrismaClient } from "@prisma/client";

function getCleanDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL || "";
  url = url.trim().replace(/^["']|["']$/g, "").trim();

  if (!url) return undefined;

  // If url doesn't start with postgresql:// or postgres:// or file:, format it cleanly
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://") && !url.startsWith("file:")) {
    // Strip any invalid leading protocol or garbage characters
    const cleanBody = url.replace(/^[a-zA-Z0-9_-]+:\/\//, "");
    url = "postgresql://" + cleanBody;
  }

  return url;
}

const cleanUrl = getCleanDatabaseUrl();

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
    ...(cleanUrl
      ? {
          datasources: {
            db: {
              url: cleanUrl,
            },
          },
        }
      : {}),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
