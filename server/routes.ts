import { Router, type Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertJobSchema, insertServicePackageSchema, insertPpfProductSchema, insertPpfRollSchema, insertJobPpfUsageSchema, insertJobIssueSchema } from "../shared/schema";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin Client for token verification
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials not found in environment. Auth verification will fail.");
}

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const updatePpfRollSchema = z.object({
  status: z.enum(["active", "depleted", "disposed"]).optional(),
  batchNo: z.string().optional(),
  imageUrl: z.string().optional(),
}).strict();

// Middleware to verify Supabase JWT
const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!supabase) {
    console.error("Supabase client not initialized. Check environment variables.");
    return res.status(500).json({ message: "Auth service unavailable" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No authorization header" });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ message: "Invalid token" });
  }

  // Attach user to request
  (req as any).user = {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || user.email,
    role: user.user_metadata?.role || "user",
    username: user.user_metadata?.username || user.email,
  };

  next();
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Trust proxy for Vercel/proxies
  app.set("trust proxy", 1);

  const router = Router();

  // API Routes - All protected by verifyAuth
  router.get("/auth/me", verifyAuth, (req, res) => {
    const user = (req as any).user;
    res.json(user);
  });

  router.get("/jobs", verifyAuth, async (req, res) => {
    try {
      const jobs = await storage.getAllJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  router.get("/jobs/summary", verifyAuth, async (req, res) => {
    try {
      const jobs = await storage.getJobsSummary();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs summary" });
    }
  });

  router.get("/jobs/:id", verifyAuth, async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  router.post("/jobs", verifyAuth, async (req, res) => {
    try {
      const validatedData = insertJobSchema.parse(req.body);
      const job = await storage.createJob(validatedData);
      res.status(201).json(job);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create job" });
    }
  });

  router.patch("/jobs/:id", verifyAuth, async (req, res) => {
    try {
      const job = await storage.updateJob(req.params.id, req.body);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update job" });
    }
  });

  router.post("/jobs/:id/deliver", verifyAuth, async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const stages = typeof job.stages === 'string' ? JSON.parse(job.stages as string) : job.stages;

      if (stages && stages[10]) {
        stages[10] = {
          ...stages[10],
          status: 'completed',
          completedAt: new Date().toISOString()
        };
      }

      const updatedJob = await storage.updateJob(req.params.id, {
        status: 'delivered',
        stages: JSON.stringify(stages)
      });

      res.json(updatedJob);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to mark job as delivered" });
    }
  });

  router.delete("/jobs/:id", verifyAuth, async (req, res) => {
    try {
      await storage.deleteJob(req.params.id);
      res.json({ message: "Job deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  router.get("/users", verifyAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Supabase users are managed via Supabase Auth, but if we sync them to local DB:
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Note: Creating users typically happens via Supabase Auth SignUp. 
  router.post("/users", verifyAuth, async (req, res) => {
    try {
      res.status(501).json({ message: "User creation should be done via Supabase Auth" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create user" });
    }
  });

  router.delete("/users/:id", verifyAuth, async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  router.get("/packages", verifyAuth, async (req, res) => {
    try {
      const packages = await storage.getAllServicePackages();
      res.json(packages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  router.post("/packages", verifyAuth, async (req, res) => {
    try {
      const validatedData = insertServicePackageSchema.parse(req.body);
      const pkg = await storage.createServicePackage(validatedData);
      res.status(201).json(pkg);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create package" });
    }
  });

  router.delete("/packages/:id", verifyAuth, async (req, res) => {
    try {
      await storage.deleteServicePackage(req.params.id);
      res.json({ message: "Package deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete package" });
    }
  });

  // PPF Products Routes
  router.get("/ppf-products", verifyAuth, async (req, res) => {
    try {
      const products = await storage.getAllPpfProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch PPF products" });
    }
  });

  router.post("/ppf-products", verifyAuth, async (req, res) => {
    try {
      const validatedData = insertPpfProductSchema.parse(req.body);
      const product = await storage.createPpfProduct(validatedData);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create PPF product" });
    }
  });

  router.delete("/ppf-products/:id", verifyAuth, async (req, res) => {
    try {
      await storage.deletePpfProduct(req.params.id);
      res.json({ message: "PPF product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete PPF product" });
    }
  });

  // PPF Rolls Routes
  router.get("/ppf-rolls", verifyAuth, async (req, res) => {
    try {
      const rolls = await storage.getAllPpfRolls();
      res.json(rolls);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch PPF rolls" });
    }
  });

  router.post("/ppf-rolls", verifyAuth, async (req, res) => {
    try {
      const validatedData = insertPpfRollSchema.parse(req.body);
      const roll = await storage.createPpfRoll(validatedData);
      res.status(201).json(roll);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create PPF roll" });
    }
  });

  router.patch("/ppf-rolls/:id", verifyAuth, async (req, res) => {
    try {
      const validatedData = updatePpfRollSchema.parse(req.body);
      const roll = await storage.updatePpfRoll(req.params.id, validatedData);
      if (!roll) {
        return res.status(404).json({ message: "PPF roll not found" });
      }
      res.json(roll);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update PPF roll" });
    }
  });

  router.delete("/ppf-rolls/:id", verifyAuth, async (req, res) => {
    try {
      await storage.deletePpfRoll(req.params.id);
      res.json({ message: "PPF roll deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete PPF roll" });
    }
  });

  // Job PPF Usage Routes
  router.get("/jobs/:id/ppf-usage", verifyAuth, async (req, res) => {
    try {
      const usage = await storage.getJobPpfUsage(req.params.id);
      res.json(usage);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch PPF usage" });
    }
  });

  router.post("/jobs/:id/ppf-usage", verifyAuth, async (req, res) => {
    try {
      const validatedData = insertJobPpfUsageSchema.parse({
        ...req.body,
        jobId: req.params.id
      });
      const usage = await storage.createJobPpfUsage(validatedData);
      res.status(201).json(usage);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create PPF usage" });
    }
  });

  router.delete("/ppf-usage/:id", verifyAuth, async (req, res) => {
    try {
      await storage.deleteJobPpfUsage(req.params.id);
      res.json({ message: "PPF usage deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete PPF usage" });
    }
  });

  // Job Issues Routes
  router.get("/jobs/:id/issues", verifyAuth, async (req, res) => {
    try {
      const issues = await storage.getJobIssues(req.params.id);
      res.json(issues);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job issues" });
    }
  });

  router.post("/jobs/:id/issues", verifyAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const validatedData = insertJobIssueSchema.parse({
        ...req.body,
        jobId: req.params.id,
        reportedBy: user?.name || user?.username || 'Unknown'
      });
      const issue = await storage.createJobIssue(validatedData);
      res.status(201).json(issue);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create job issue" });
    }
  });

  router.patch("/issues/:id", verifyAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const updateData = { ...req.body };
      // If resolving an issue, set resolvedBy from authenticated user
      if (updateData.status === 'resolved' && !updateData.resolvedBy) {
        updateData.resolvedBy = user?.name || user?.username || 'Unknown';
      }
      const issue = await storage.updateJobIssue(req.params.id, updateData);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      res.json(issue);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update issue" });
    }
  });

  router.delete("/issues/:id", verifyAuth, async (req, res) => {
    try {
      await storage.deleteJobIssue(req.params.id);
      res.json({ message: "Issue deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete issue" });
    }
  });

  // Mount the router at both /api and / to handle different deployment environments (like Vercel)
  // where the /api prefix might or might not be stripped before reaching the app.
  app.use("/api", router);
  app.use("/", (req, res, next) => {
    // Only handle if it doesn't already start with /api (to avoid double processing)
    if (req.url.startsWith('/api')) {
      return next();
    }
    router(req, res, next);
  });

  return httpServer;
}
