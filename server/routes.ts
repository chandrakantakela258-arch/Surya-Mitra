import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { registerUserSchema, loginSchema, customerFormSchema } from "@shared/schema";
import { z } from "zod";

// Extend express-session types
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

// Auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

async function requireBDP(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || (user.role !== "bdp" && user.role !== "admin")) {
    return res.status(403).json({ message: "Forbidden: BDP access required" });
  }
  (req as any).user = user;
  next();
}

async function requireDDP(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || (user.role !== "ddp" && user.role !== "admin")) {
    return res.status(403).json({ message: "Forbidden: DDP access required" });
  }
  (req as any).user = user;
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session setup
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "surya-partner-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // ==================== AUTH ROUTES ====================
  
  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerUserSchema.parse(req.body);
      
      // Check if username exists
      const existing = await storage.getUserByUsername(data.username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(data);
      req.session.userId = user.id;
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Register error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(data.username);
      if (!user || user.password !== data.password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      req.session.userId = user.id;
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out" });
    });
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    res.json({ user: { ...user, password: undefined } });
  });

  // ==================== BDP ROUTES ====================
  
  // Get BDP stats
  app.get("/api/bdp/stats", requireBDP, async (req, res) => {
    try {
      const user = (req as any).user;
      const stats = await storage.getBdpStats(user.id);
      res.json(stats);
    } catch (error) {
      console.error("BDP stats error:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // Get BDP's partners (DDPs)
  app.get("/api/bdp/partners", requireBDP, async (req, res) => {
    try {
      const user = (req as any).user;
      const partners = await storage.getPartnersByParentId(user.id);
      res.json(partners.map((p) => ({ ...p, password: undefined })));
    } catch (error) {
      console.error("Get partners error:", error);
      res.status(500).json({ message: "Failed to get partners" });
    }
  });

  // Add new partner (DDP)
  app.post("/api/bdp/partners", requireBDP, async (req, res) => {
    try {
      const user = (req as any).user;
      const data = registerUserSchema.parse(req.body);
      
      // Check if username exists
      const existing = await storage.getUserByUsername(data.username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const partner = await storage.createUser({
        ...data,
        role: "ddp",
        parentId: user.id,
        status: "approved", // Auto-approve partners added by BDP
      });
      
      res.json({ ...partner, password: undefined });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Add partner error:", error);
      res.status(500).json({ message: "Failed to add partner" });
    }
  });

  // Get all customers under BDP's network
  app.get("/api/bdp/customers", requireBDP, async (req, res) => {
    try {
      const user = (req as any).user;
      const customers = await storage.getAllCustomersByBdpId(user.id);
      res.json(customers);
    } catch (error) {
      console.error("Get BDP customers error:", error);
      res.status(500).json({ message: "Failed to get customers" });
    }
  });

  // ==================== DDP ROUTES ====================
  
  // Get DDP stats
  app.get("/api/ddp/stats", requireDDP, async (req, res) => {
    try {
      const user = (req as any).user;
      const stats = await storage.getDdpStats(user.id);
      res.json(stats);
    } catch (error) {
      console.error("DDP stats error:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // Get DDP's customers
  app.get("/api/ddp/customers", requireDDP, async (req, res) => {
    try {
      const user = (req as any).user;
      const customers = await storage.getCustomersByDdpId(user.id);
      res.json(customers);
    } catch (error) {
      console.error("Get DDP customers error:", error);
      res.status(500).json({ message: "Failed to get customers" });
    }
  });

  // Add new customer
  app.post("/api/ddp/customers", requireDDP, async (req, res) => {
    try {
      const user = (req as any).user;
      const data = customerFormSchema.parse(req.body);
      
      const customer = await storage.createCustomer({
        ...data,
        ddpId: user.id,
        status: "pending",
      });
      
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Add customer error:", error);
      res.status(500).json({ message: "Failed to add customer" });
    }
  });

  // ==================== SHARED ROUTES ====================
  
  // Update partner status
  app.patch("/api/partners/:id/status", requireBDP, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const user = await storage.updateUserStatus(id, status);
      if (!user) {
        return res.status(404).json({ message: "Partner not found" });
      }
      
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error("Update partner status error:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Update customer status
  app.patch("/api/customers/:id/status", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!["pending", "verified", "approved", "installation_scheduled", "completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const customer = await storage.updateCustomerStatus(id, status);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      console.error("Update customer status error:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Get single customer
  app.get("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const customer = await storage.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      console.error("Get customer error:", error);
      res.status(500).json({ message: "Failed to get customer" });
    }
  });

  // ==================== MILESTONE ROUTES ====================
  
  // Get customer milestones
  app.get("/api/customers/:id/milestones", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const customer = await storage.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Initialize milestones if they don't exist
      const milestones = await storage.initializeCustomerMilestones(id);
      res.json(milestones);
    } catch (error) {
      console.error("Get milestones error:", error);
      res.status(500).json({ message: "Failed to get milestones" });
    }
  });

  // Complete a milestone
  app.patch("/api/milestones/:id/complete", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      
      const milestone = await storage.completeMilestone(id, notes);
      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      // If installation is complete, create commission for the DDP
      if (milestone.milestone === "installation_complete") {
        const customer = await storage.getCustomer(milestone.customerId);
        if (customer) {
          await storage.createCommissionForCustomer(customer.id, customer.ddpId);
        }
      }
      
      res.json(milestone);
    } catch (error) {
      console.error("Complete milestone error:", error);
      res.status(500).json({ message: "Failed to complete milestone" });
    }
  });

  // ==================== COMMISSION ROUTES ====================
  
  // Get DDP's commissions
  app.get("/api/ddp/commissions", requireDDP, async (req, res) => {
    try {
      const user = (req as any).user;
      const commissions = await storage.getCommissionsByPartnerId(user.id, "ddp");
      res.json(commissions);
    } catch (error) {
      console.error("Get commissions error:", error);
      res.status(500).json({ message: "Failed to get commissions" });
    }
  });

  // Get DDP's commission summary
  app.get("/api/ddp/commissions/summary", requireDDP, async (req, res) => {
    try {
      const user = (req as any).user;
      const summary = await storage.getCommissionSummaryByPartnerId(user.id, "ddp");
      res.json(summary);
    } catch (error) {
      console.error("Get commission summary error:", error);
      res.status(500).json({ message: "Failed to get commission summary" });
    }
  });

  // Get BDP's commissions
  app.get("/api/bdp/commissions", requireBDP, async (req, res) => {
    try {
      const user = (req as any).user;
      const commissions = await storage.getCommissionsByPartnerId(user.id, "bdp");
      res.json(commissions);
    } catch (error) {
      console.error("Get BDP commissions error:", error);
      res.status(500).json({ message: "Failed to get commissions" });
    }
  });

  // Get BDP's commission summary
  app.get("/api/bdp/commissions/summary", requireBDP, async (req, res) => {
    try {
      const user = (req as any).user;
      const summary = await storage.getCommissionSummaryByPartnerId(user.id, "bdp");
      res.json(summary);
    } catch (error) {
      console.error("Get BDP commission summary error:", error);
      res.status(500).json({ message: "Failed to get commission summary" });
    }
  });

  // Update commission status (BDP only - for approving/paying)
  app.patch("/api/commissions/:id/status", requireBDP, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!["pending", "approved", "paid"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const commission = await storage.updateCommissionStatus(id, status);
      if (!commission) {
        return res.status(404).json({ message: "Commission not found" });
      }
      
      res.json(commission);
    } catch (error) {
      console.error("Update commission status error:", error);
      res.status(500).json({ message: "Failed to update commission status" });
    }
  });

  return httpServer;
}
