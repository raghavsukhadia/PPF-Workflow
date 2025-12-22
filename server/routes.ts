import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { insertJobSchema, insertServicePackageSchema, insertUserSchema, insertPpfProductSchema, insertPpfRollSchema, insertJobPpfUsageSchema, insertJobIssueSchema } from "@shared/schema";
import { z } from "zod";

const updatePpfRollSchema = z.object({
  status: z.enum(["active", "depleted", "disposed"]).optional(),
  batchNo: z.string().optional(),
  imageUrl: z.string().optional(),
}).strict();

declare module "express-session" {
  interface SessionData {
    passport: {
      user: string;
    };
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Trust proxy for secure cookies behind Replit's reverse proxy
  app.set("trust proxy", 1);
  
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "ppf-workshop-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid credentials" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Invalid credentials" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Not authenticated" });
  };

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Login failed" });
      }
      if (!user) {
        console.log("Login failed:", info?.message || "Invalid credentials");
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("Session login error:", loginErr);
          return res.status(500).json({ message: "Session error" });
        }
        res.json({
          id: user.id,
          name: user.name,
          role: user.role,
          username: user.username,
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", isAuthenticated, (req, res) => {
    const user = req.user as any;
    res.json({
      id: user.id,
      name: user.name,
      role: user.role,
      username: user.username,
    });
  });

  app.get("/api/jobs", isAuthenticated, async (req, res) => {
    try {
      const jobs = await storage.getAllJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/jobs", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertJobSchema.parse(req.body);
      const job = await storage.createJob(validatedData);
      res.status(201).json(job);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create job" });
    }
  });

  app.patch("/api/jobs/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/jobs/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteJob(req.params.id);
      res.json({ message: "Job deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create user" });
    }
  });

  app.delete("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.get("/api/packages", isAuthenticated, async (req, res) => {
    try {
      const packages = await storage.getAllServicePackages();
      res.json(packages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  app.post("/api/packages", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertServicePackageSchema.parse(req.body);
      const pkg = await storage.createServicePackage(validatedData);
      res.status(201).json(pkg);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create package" });
    }
  });

  app.delete("/api/packages/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteServicePackage(req.params.id);
      res.json({ message: "Package deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete package" });
    }
  });

  // PPF Products Routes
  app.get("/api/ppf-products", isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getAllPpfProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch PPF products" });
    }
  });

  app.post("/api/ppf-products", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPpfProductSchema.parse(req.body);
      const product = await storage.createPpfProduct(validatedData);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create PPF product" });
    }
  });

  app.delete("/api/ppf-products/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deletePpfProduct(req.params.id);
      res.json({ message: "PPF product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete PPF product" });
    }
  });

  // PPF Rolls Routes
  app.get("/api/ppf-rolls", isAuthenticated, async (req, res) => {
    try {
      const rolls = await storage.getAllPpfRolls();
      res.json(rolls);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch PPF rolls" });
    }
  });

  app.post("/api/ppf-rolls", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPpfRollSchema.parse(req.body);
      const roll = await storage.createPpfRoll(validatedData);
      res.status(201).json(roll);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create PPF roll" });
    }
  });

  app.patch("/api/ppf-rolls/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/ppf-rolls/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deletePpfRoll(req.params.id);
      res.json({ message: "PPF roll deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete PPF roll" });
    }
  });

  // Job PPF Usage Routes
  app.get("/api/jobs/:id/ppf-usage", isAuthenticated, async (req, res) => {
    try {
      const usage = await storage.getJobPpfUsage(req.params.id);
      res.json(usage);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch PPF usage" });
    }
  });

  app.post("/api/jobs/:id/ppf-usage", isAuthenticated, async (req, res) => {
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

  app.delete("/api/ppf-usage/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteJobPpfUsage(req.params.id);
      res.json({ message: "PPF usage deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete PPF usage" });
    }
  });

  // Job Issues Routes
  app.get("/api/jobs/:id/issues", isAuthenticated, async (req, res) => {
    try {
      const issues = await storage.getJobIssues(req.params.id);
      res.json(issues);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job issues" });
    }
  });

  app.post("/api/jobs/:id/issues", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const validatedData = insertJobIssueSchema.parse({
        ...req.body,
        jobId: req.params.id,
        reportedBy: user?.name || user?.username || 'Unknown' // Server-side auth
      });
      const issue = await storage.createJobIssue(validatedData);
      res.status(201).json(issue);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create job issue" });
    }
  });

  app.patch("/api/issues/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
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

  app.delete("/api/issues/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteJobIssue(req.params.id);
      res.json({ message: "Issue deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete issue" });
    }
  });

  return httpServer;
}
