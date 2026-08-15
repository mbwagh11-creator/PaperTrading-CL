import { PrismaClient } from "@prisma/client";

function getCleanDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL || "";
  url = url.trim().replace(/^["']|["']$/g, "").trim();

  if (!url) return undefined;

  // Safely handle unencoded special characters (like @ or #) in database passwords
  if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
    const protocol = url.startsWith("postgresql://") ? "postgresql://" : "postgres://";
    const body = url.slice(protocol.length);
    const lastAtIndex = body.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const authPart = body.slice(0, lastAtIndex);
      const hostPart = body.slice(lastAtIndex + 1);
      const colonIndex = authPart.indexOf(":");
      if (colonIndex !== -1) {
        const user = authPart.slice(0, colonIndex);
        const pass = authPart.slice(colonIndex + 1);
        // Only encode if not already encoded
        if (pass.includes("@") || pass.includes("#") || pass.includes("$")) {
          const encodedPass = encodeURIComponent(pass);
          url = `${protocol}${user}:${encodedPass}@${hostPart}`;
        }
      }
    }
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
