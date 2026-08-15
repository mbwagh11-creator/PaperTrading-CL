import { PrismaClient } from "@prisma/client";

function getCleanDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL || "";
  url = url.trim().replace(/^["']|["']$/g, "").trim();

  if (!url) return undefined;

  // Ensure valid PostgreSQL protocol prefix
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://") && !url.startsWith("file:")) {
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
