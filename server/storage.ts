import {
  users,
  jobs,
  servicePackages,
  ppfProducts,
  ppfRolls,
  jobPpfUsage,
  jobIssues,
  type User,
  type InsertUser,
  type Job,
  type InsertJob,
  type ServicePackage,
  type InsertServicePackage,
  type PpfProduct,
  type InsertPpfProduct,
  type PpfRoll,
  type InsertPpfRoll,
  type JobPpfUsage,
  type InsertJobPpfUsage,
  type JobIssue,
  type InsertJobIssue
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export type JobSummary = Pick<Job, 'id' | 'jobNo' | 'customerName' | 'vehicleBrand' | 'vehicleModel' | 'vehicleRegNo' | 'status' | 'currentStage' | 'priority' | 'promisedDate' | 'assignedTo' | 'package' | 'createdAt' | 'activeIssue'>;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;

  getAllJobs(): Promise<Job[]>;
  getJobsSummary(): Promise<JobSummary[]>;
  getJob(id: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, data: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: string): Promise<void>;

  getAllServicePackages(): Promise<ServicePackage[]>;
  createServicePackage(pkg: InsertServicePackage): Promise<ServicePackage>;
  deleteServicePackage(id: string): Promise<void>;

  getAllPpfProducts(): Promise<PpfProduct[]>;
  getPpfProduct(id: string): Promise<PpfProduct | undefined>;
  createPpfProduct(product: InsertPpfProduct): Promise<PpfProduct>;
  deletePpfProduct(id: string): Promise<void>;

  getAllPpfRolls(): Promise<PpfRoll[]>;
  getPpfRoll(id: string): Promise<PpfRoll | undefined>;
  createPpfRoll(roll: InsertPpfRoll): Promise<PpfRoll>;
  updatePpfRoll(id: string, data: Partial<PpfRoll>): Promise<PpfRoll | undefined>;
  deletePpfRoll(id: string): Promise<void>;

  getJobPpfUsage(jobId: string): Promise<JobPpfUsage[]>;
  getJobPpfUsageById(id: string): Promise<JobPpfUsage | undefined>;
  createJobPpfUsage(usage: InsertJobPpfUsage): Promise<JobPpfUsage>;
  deleteJobPpfUsage(id: string): Promise<void>;

  getJobIssues(jobId: string): Promise<JobIssue[]>;
  getJobIssue(id: string): Promise<JobIssue | undefined>;
  createJobIssue(issue: InsertJobIssue): Promise<JobIssue>;
  updateJobIssue(id: string, data: Partial<JobIssue>): Promise<JobIssue | undefined>;
  deleteJobIssue(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllJobs(): Promise<Job[]> {
    return await db.select().from(jobs).orderBy(desc(jobs.createdAt));
  }

  async getJobsSummary(): Promise<JobSummary[]> {
    return await db.select({
      id: jobs.id,
      jobNo: jobs.jobNo,
      customerName: jobs.customerName,
      vehicleBrand: jobs.vehicleBrand,
      vehicleModel: jobs.vehicleModel,
      vehicleRegNo: jobs.vehicleRegNo,
      status: jobs.status,
      currentStage: jobs.currentStage,
      priority: jobs.priority,
      promisedDate: jobs.promisedDate,
      assignedTo: jobs.assignedTo,
      package: jobs.package,
      createdAt: jobs.createdAt,
      activeIssue: jobs.activeIssue,
    }).from(jobs).orderBy(desc(jobs.createdAt));
  }

  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    try {
      const jobNo = `JOB-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      const [job] = await db
        .insert(jobs)
        .values({ ...insertJob, jobNo })
        .returning();
      return job;
    } catch (error) {
      console.error("Error in createJob:", error);
      throw error;
    }
  }

  async updateJob(id: string, data: Partial<InsertJob>): Promise<Job | undefined> {
    try {
      const [job] = await db
        .update(jobs)
        .set(data)
        .where(eq(jobs.id, id))
        .returning();
      return job || undefined;
    } catch (error) {
      console.error("Error in updateJob:", error);
      throw error;
    }
  }

  async deleteJob(id: string): Promise<void> {
    await db.delete(jobs).where(eq(jobs.id, id));
  }

  async getAllServicePackages(): Promise<ServicePackage[]> {
    return await db.select().from(servicePackages);
  }

  async createServicePackage(insertPkg: InsertServicePackage): Promise<ServicePackage> {
    const [pkg] = await db
      .insert(servicePackages)
      .values(insertPkg)
      .returning();
    return pkg;
  }

  async deleteServicePackage(id: string): Promise<void> {
    await db.delete(servicePackages).where(eq(servicePackages.id, id));
  }

  async getAllPpfProducts(): Promise<PpfProduct[]> {
    return await db.select().from(ppfProducts).orderBy(desc(ppfProducts.createdAt));
  }

  async getPpfProduct(id: string): Promise<PpfProduct | undefined> {
    const [product] = await db.select().from(ppfProducts).where(eq(ppfProducts.id, id));
    return product || undefined;
  }

  async createPpfProduct(insertProduct: InsertPpfProduct): Promise<PpfProduct> {
    const [product] = await db
      .insert(ppfProducts)
      .values(insertProduct)
      .returning();
    return product;
  }

  async deletePpfProduct(id: string): Promise<void> {
    await db.delete(ppfProducts).where(eq(ppfProducts.id, id));
  }

  async getAllPpfRolls(): Promise<PpfRoll[]> {
    return await db.select().from(ppfRolls).orderBy(desc(ppfRolls.createdAt));
  }

  async getPpfRoll(id: string): Promise<PpfRoll | undefined> {
    const [roll] = await db.select().from(ppfRolls).where(eq(ppfRolls.id, id));
    return roll || undefined;
  }

  async createPpfRoll(insertRoll: InsertPpfRoll): Promise<PpfRoll> {
    const [roll] = await db
      .insert(ppfRolls)
      .values(insertRoll)
      .returning();
    return roll;
  }

  async updatePpfRoll(id: string, data: Partial<PpfRoll>): Promise<PpfRoll | undefined> {
    const [roll] = await db
      .update(ppfRolls)
      .set(data)
      .where(eq(ppfRolls.id, id))
      .returning();
    return roll || undefined;
  }

  async deletePpfRoll(id: string): Promise<void> {
    await db.delete(ppfRolls).where(eq(ppfRolls.id, id));
  }

  async getJobPpfUsage(jobId: string): Promise<JobPpfUsage[]> {
    return await db.select().from(jobPpfUsage).where(eq(jobPpfUsage.jobId, jobId));
  }

  async getJobPpfUsageById(id: string): Promise<JobPpfUsage | undefined> {
    const [usage] = await db.select().from(jobPpfUsage).where(eq(jobPpfUsage.id, id));
    return usage || undefined;
  }

  async createJobPpfUsage(insertUsage: InsertJobPpfUsage): Promise<JobPpfUsage> {
    const roll = await this.getPpfRoll(insertUsage.rollId);
    if (!roll) {
      throw new Error("Roll not found");
    }

    const remainingLength = roll.totalLengthMm - roll.usedLengthMm;
    if (insertUsage.lengthUsedMm > remainingLength) {
      throw new Error(`Insufficient roll length. Available: ${remainingLength}mm, Requested: ${insertUsage.lengthUsedMm}mm`);
    }

    const [usage] = await db
      .insert(jobPpfUsage)
      .values(insertUsage)
      .returning();

    await this.updatePpfRoll(roll.id, {
      usedLengthMm: roll.usedLengthMm + insertUsage.lengthUsedMm
    });

    return usage;
  }

  async deleteJobPpfUsage(id: string): Promise<void> {
    const usage = await this.getJobPpfUsageById(id);
    if (usage) {
      const roll = await this.getPpfRoll(usage.rollId);
      if (roll) {
        await this.updatePpfRoll(roll.id, {
          usedLengthMm: Math.max(0, roll.usedLengthMm - usage.lengthUsedMm)
        });
      }
    }
    await db.delete(jobPpfUsage).where(eq(jobPpfUsage.id, id));
  }

  async getJobIssues(jobId: string): Promise<JobIssue[]> {
    return await db.select().from(jobIssues).where(eq(jobIssues.jobId, jobId)).orderBy(desc(jobIssues.createdAt));
  }

  async getJobIssue(id: string): Promise<JobIssue | undefined> {
    const [issue] = await db.select().from(jobIssues).where(eq(jobIssues.id, id));
    return issue || undefined;
  }

  async createJobIssue(insertIssue: InsertJobIssue): Promise<JobIssue> {
    const [issue] = await db
      .insert(jobIssues)
      .values(insertIssue)
      .returning();
    return issue;
  }

  async updateJobIssue(id: string, data: Partial<JobIssue>): Promise<JobIssue | undefined> {
    const [issue] = await db
      .update(jobIssues)
      .set(data)
      .where(eq(jobIssues.id, id))
      .returning();
    return issue || undefined;
  }

  async deleteJobIssue(id: string): Promise<void> {
    await db.delete(jobIssues).where(eq(jobIssues.id, id));
  }
}

export const storage = new DatabaseStorage();
