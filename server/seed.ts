import { db } from "./db";
import { users, servicePackages, ppfProducts } from "@shared/schema";

export async function seedDatabase() {
  try {
    const existingUsers = await db.select().from(users).limit(1);

    if (existingUsers.length === 0) {
      console.log("Seeding database with initial data...");

      const dummyPassword = "supabase_managed"; // Passwords are now managed by Supabase Auth

      await db.insert(users).values([
        { username: "admin", password: dummyPassword, name: "Admin User", role: "Admin" },
        { username: "sameer", password: dummyPassword, name: "Sameer", role: "Installer" },
        { username: "priya", password: dummyPassword, name: "Priya", role: "Installer" },
        { username: "vikram", password: dummyPassword, name: "Vikram", role: "Installer" },
      ]);

      console.log("Created default users");
    }

    const existingPackages = await db.select().from(servicePackages).limit(1);

    if (existingPackages.length === 0) {
      await db.insert(servicePackages).values([
        { name: "Full Body PPF" },
        { name: "Full Body PPF + Ceramic" },
        { name: "Front Kit PPF" },
        { name: "Ceramic Coating" },
        { name: "Maintenance Wash" },
      ]);

      console.log("Created default service packages");
    }

    const existingProducts = await db.select().from(ppfProducts).limit(1);

    if (existingProducts.length === 0) {
      await db.insert(ppfProducts).values([
        { name: "XPEL Ultimate Plus", brand: "XPEL", type: "Gloss", widthMm: 1524 },
        { name: "XPEL Stealth", brand: "XPEL", type: "Matte", widthMm: 1524 },
        { name: "3M Pro Series", brand: "3M", type: "Gloss", widthMm: 1520 },
        { name: "SunTek Ultra", brand: "SunTek", type: "Gloss", widthMm: 1524 },
      ]);

      console.log("Created default PPF products");
    }

    console.log("Database ready");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
