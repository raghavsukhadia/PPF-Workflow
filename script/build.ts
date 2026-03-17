import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  // Build Server API (monolith fallback)
  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/server.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  // Build Vercel API Functions
  // This ensures api/ files are compiled and placed where Vercel can find them if configured
  console.log("building api functions...");
  const apiFiles = [
    "api/index.ts",
    "api/users.ts",
    "api/packages.ts",
    "api/jobs-summary.ts",
    "api/ppf-products.ts",
    "api/ppf-rolls.ts",
    "api/diagnostic.ts",
    "api/users/[id].ts",
    "api/packages/[id].ts",
    "api/jobs/index.ts",
    "api/jobs/[id]/index.ts",
    "api/jobs/[id]/issues.ts",
    "api/jobs/[id]/ppf-usage.ts",
    "api/jobs/[id]/deliver.ts"
  ];

  // We don't bundle these fully, just transpile, or we bundle dependencies but exclude node_modules if Vercel handles them
  // For Vercel, we typically want individual entry points.
  await esbuild({
    entryPoints: apiFiles,
    platform: "node",
    bundle: true, // Bundle to include shared local deps like 'db.ts'
    format: "esm", // Vercel prefers ESM for modern node
    outdir: "dist/api", // Output to dist/api so Vercel can find them if outputDirectory is dist
    target: "node18",
    external: externals, // Keep node_modules external for Vercel runtime to handle
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
