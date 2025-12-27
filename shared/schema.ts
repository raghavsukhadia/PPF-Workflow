import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobNo: text("job_no").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  vehicleBrand: text("vehicle_brand").notNull(),
  vehicleModel: text("vehicle_model").notNull(),
  vehicleYear: text("vehicle_year"),
  vehicleColor: text("vehicle_color"),
  vehicleRegNo: text("vehicle_reg_no").notNull(),
  vehicleVin: text("vehicle_vin"),
  package: text("package").notNull(),
  status: text("status").notNull(),
  promisedDate: timestamp("promised_date").notNull(),
  currentStage: integer("current_stage").notNull().default(1),
  stages: jsonb("stages").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  priority: text("priority").notNull().default('normal'),
  activeIssue: jsonb("active_issue"),
  assignedTo: varchar("assigned_to"),
});

export const insertJobSchema = createInsertSchema(jobs, {
  promisedDate: z.union([z.date(), z.string()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
}).omit({
  id: true,
  jobNo: true,
  createdAt: true,
});

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

export const servicePackages = pgTable("service_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertServicePackageSchema = createInsertSchema(servicePackages).omit({
  id: true,
  createdAt: true,
});

export type InsertServicePackage = z.infer<typeof insertServicePackageSchema>;
export type ServicePackage = typeof servicePackages.$inferSelect;

// PPF Products - master data for PPF brands/types
export const ppfProducts = pgTable("ppf_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  type: text("type").notNull(), // e.g., "Clear", "Matte", "Colored"
  widthMm: integer("width_mm").notNull().default(1520), // Roll width in mm
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPpfProductSchema = createInsertSchema(ppfProducts).omit({
  id: true,
  createdAt: true,
});

export type InsertPpfProduct = z.infer<typeof insertPpfProductSchema>;
export type PpfProduct = typeof ppfProducts.$inferSelect;

// PPF Rolls - inventory tracking
export const ppfRolls = pgTable("ppf_rolls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rollId: text("roll_id").notNull().unique(), // Human-readable roll ID (e.g., "XPEL-001")
  productId: varchar("product_id").notNull(),
  batchNo: text("batch_no"),
  totalLengthMm: integer("total_length_mm").notNull(), // Total length in mm
  usedLengthMm: integer("used_length_mm").notNull().default(0), // Used length in mm
  status: text("status").notNull().default('active'), // active, depleted, disposed
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPpfRollSchema = createInsertSchema(ppfRolls).omit({
  id: true,
  createdAt: true,
  usedLengthMm: true,
});

export type InsertPpfRoll = z.infer<typeof insertPpfRollSchema>;
export type PpfRoll = typeof ppfRolls.$inferSelect;

// Job PPF Usage - tracks which rolls were used on which job/panel
export const jobPpfUsage = pgTable("job_ppf_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull(),
  panelName: text("panel_name").notNull(), // e.g., "Hood", "Front Bumper", "Left Fender"
  rollId: varchar("roll_id").notNull(),
  lengthUsedMm: integer("length_used_mm").notNull(),
  notes: text("notes"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertJobPpfUsageSchema = createInsertSchema(jobPpfUsage).omit({
  id: true,
  createdAt: true,
});

export type InsertJobPpfUsage = z.infer<typeof insertJobPpfUsageSchema>;
export type JobPpfUsage = typeof jobPpfUsage.$inferSelect;

// Job Issues - multiple issues per job with media support
export const jobIssues = pgTable("job_issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull(),
  stageId: integer("stage_id").notNull(),
  issueType: text("issue_type").notNull(), // scratch, dent, paint_defect, surface_damage, other
  description: text("description").notNull(),
  location: text("location"), // e.g., "Left front fender", "Hood center"
  severity: text("severity").notNull().default('medium'), // low, medium, high, critical
  status: text("status").notNull().default('open'), // open, acknowledged, resolved
  reportedBy: text("reported_by").notNull(),
  resolvedBy: text("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),
  mediaUrls: text("media_urls").array(), // array of image/video/audio URLs
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertJobIssueSchema = createInsertSchema(jobIssues).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
  resolvedBy: true,
  resolutionNotes: true,
  status: true,
}).extend({
  status: z.enum(['open', 'acknowledged', 'resolved']).optional().default('open'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
});

export type InsertJobIssue = z.infer<typeof insertJobIssueSchema>;
export type JobIssue = typeof jobIssues.$inferSelect;
