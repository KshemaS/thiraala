import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

const MIN_PASSWORD_LENGTH = 12;

/**
 * Creates or updates the admin login from ADMIN_USERNAME (default "admin") and
 * ADMIN_PASSWORD. Skipped when ADMIN_PASSWORD is unset.
 *
 * Runs as part of `prisma db seed`, or on its own to (re)set just the admin password:
 *   ADMIN_PASSWORD='...' npx tsx prisma/seed-admin.ts
 */
export async function seedAdminUser(prisma: PrismaClient) {
  const username = process.env.ADMIN_USERNAME?.trim() || "admin";
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.warn("⚠️  ADMIN_PASSWORD not set — skipping admin user seed");
    return;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  const passwordHash = await hashPassword(password);
  await prisma.adminUser.upsert({
    where: { username },
    update: { passwordHash },
    create: {
      username,
      passwordHash,
      name: "Thiraala Admin",
      role: "admin",
    },
  });
  console.log(`✅ Seeded admin user "${username}"`);
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("prisma/seed-admin.ts")) {
  const prisma = new PrismaClient();
  seedAdminUser(prisma)
    .catch((e) => {
      console.error("❌ Error seeding admin user:", e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
