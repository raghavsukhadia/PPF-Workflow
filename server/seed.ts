import { db } from "./db";
import { users, servicePackages } from "@shared/schema";
import bcrypt from "bcrypt";

async function seed() {
  console.log("🌱 Seeding database...");

  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  const defaultUsers = [
    { username: "admin", password: hashedPassword, name: "Admin User", role: "Admin" },
    { username: "sameer", password: await bcrypt.hash("installer123", 10), name: "Sameer", role: "Installer" },
    { username: "priya", password: await bcrypt.hash("installer123", 10), name: "Priya", role: "Installer" },
    { username: "vikram", password: await bcrypt.hash("installer123", 10), name: "Vikram", role: "Installer" },
  ];

  for (const user of defaultUsers) {
    await db.insert(users).values(user).onConflictDoNothing();
  }
  console.log("✅ Users seeded");

  const defaultPackages = [
    { name: "Full Body PPF" },
    { name: "Full Body PPF + Ceramic" },
    { name: "Front Kit PPF" },
    { name: "Ceramic Coating" },
    { name: "Maintenance Wash" }
  ];

  for (const pkg of defaultPackages) {
    await db.insert(servicePackages).values(pkg).onConflictDoNothing();
  }
  console.log("✅ Service packages seeded");

  console.log("🎉 Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
