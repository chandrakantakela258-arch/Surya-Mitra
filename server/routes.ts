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

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
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

  // ==================== ADMIN ROUTES ====================

  // Get admin stats
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: "Failed to get admin stats" });
    }
  });

  // Get all partners (BDPs and DDPs)
  app.get("/api/admin/partners", requireAdmin, async (req, res) => {
    try {
      const partners = await storage.getAllPartners();
      res.json(partners.map((p) => ({ ...p, password: undefined })));
    } catch (error) {
      console.error("Get all partners error:", error);
      res.status(500).json({ message: "Failed to get partners" });
    }
  });

  // Get recent partners
  app.get("/api/admin/partners/recent", requireAdmin, async (req, res) => {
    try {
      const partners = await storage.getRecentPartners(5);
      res.json(partners.map((p) => ({ ...p, password: undefined })));
    } catch (error) {
      console.error("Get recent partners error:", error);
      res.status(500).json({ message: "Failed to get recent partners" });
    }
  });

  // Update partner status
  app.patch("/api/admin/partners/:id/status", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const partner = await storage.updateUserStatus(id, status);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      
      res.json({ ...partner, password: undefined });
    } catch (error) {
      console.error("Update partner status error:", error);
      res.status(500).json({ message: "Failed to update partner status" });
    }
  });

  // Get all customers
  app.get("/api/admin/customers", requireAdmin, async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Get all customers error:", error);
      res.status(500).json({ message: "Failed to get customers" });
    }
  });

  // Get recent customers
  app.get("/api/admin/customers/recent", requireAdmin, async (req, res) => {
    try {
      const customers = await storage.getRecentCustomers(5);
      res.json(customers);
    } catch (error) {
      console.error("Get recent customers error:", error);
      res.status(500).json({ message: "Failed to get recent customers" });
    }
  });

  // ==================== BANK ACCOUNT ROUTES ====================
  
  // Get partner's bank account
  app.get("/api/bank-account", requireAuth, async (req, res) => {
    try {
      const account = await storage.getBankAccountByPartnerId(req.session.userId!);
      res.json(account || null);
    } catch (error) {
      console.error("Get bank account error:", error);
      res.status(500).json({ message: "Failed to get bank account" });
    }
  });

  // Create or update bank account
  app.post("/api/bank-account", requireAuth, async (req, res) => {
    try {
      const { accountHolderName, accountNumber, ifscCode, bankName } = req.body;
      
      if (!accountHolderName || !accountNumber || !ifscCode) {
        return res.status(400).json({ message: "Account holder name, account number, and IFSC code are required" });
      }
      
      const existing = await storage.getBankAccountByPartnerId(req.session.userId!);
      
      if (existing) {
        const updated = await storage.updateBankAccount(req.session.userId!, {
          accountHolderName,
          accountNumber,
          ifscCode,
          bankName: bankName || null,
          verified: "pending",
          razorpayContactId: null,
          razorpayFundAccountId: null,
        });
        res.json(updated);
      } else {
        const account = await storage.createBankAccount({
          partnerId: req.session.userId!,
          accountHolderName,
          accountNumber,
          ifscCode,
          bankName: bankName || null,
          verified: "pending",
        });
        res.json(account);
      }
    } catch (error) {
      console.error("Save bank account error:", error);
      res.status(500).json({ message: "Failed to save bank account" });
    }
  });

  // ==================== PAYOUT ROUTES (ADMIN) ====================

  // Get all commissions
  app.get("/api/admin/commissions", requireAdmin, async (req, res) => {
    try {
      const allCommissions = await storage.getAllCommissions();
      res.json(allCommissions);
    } catch (error) {
      console.error("Get all commissions error:", error);
      res.status(500).json({ message: "Failed to get commissions" });
    }
  });

  // Update commission status
  app.patch("/api/admin/commissions/:id/status", requireAdmin, async (req, res) => {
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

  // Get all payouts
  app.get("/api/admin/payouts", requireAdmin, async (req, res) => {
    try {
      const allPayouts = await storage.getAllPayouts();
      res.json(allPayouts);
    } catch (error) {
      console.error("Get all payouts error:", error);
      res.status(500).json({ message: "Failed to get payouts" });
    }
  });

  // Initialize Razorpay and process payout
  app.post("/api/admin/payouts/process", requireAdmin, async (req, res) => {
    try {
      const { commissionId, partnerId, amount, mode = "IMPS" } = req.body;
      
      if (!partnerId || !amount) {
        return res.status(400).json({ message: "Partner ID and amount are required" });
      }
      
      // Check if Razorpay keys are configured
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      const accountNumber = process.env.RAZORPAYX_ACCOUNT_NUMBER;
      
      if (!keyId || !keySecret || !accountNumber) {
        return res.status(500).json({ 
          message: "Razorpay not configured. Please add RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and RAZORPAYX_ACCOUNT_NUMBER to secrets." 
        });
      }
      
      // Get partner and bank account
      const partner = await storage.getUser(partnerId);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      
      const bankAccount = await storage.getBankAccountByPartnerId(partnerId);
      if (!bankAccount) {
        return res.status(400).json({ message: "Partner has not added bank account details" });
      }
      
      // Initialize Razorpay
      const Razorpay = require("razorpay");
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
      
      // Create payout record first
      const payout = await storage.createPayout({
        partnerId,
        commissionId: commissionId || null,
        amount,
        mode,
        status: "processing",
        razorpayPayoutId: null,
        razorpayStatus: null,
        utr: null,
        failureReason: null,
        processedAt: null,
      });
      
      try {
        // Use Composite API to create contact, fund account, and payout in one call
        const razorpayPayout = await razorpay.payouts.create({
          account_number: accountNumber,
          amount: amount * 100, // Convert to paisa
          currency: "INR",
          mode: mode,
          purpose: "payout",
          fund_account: {
            account_type: "bank_account",
            bank_account: {
              name: bankAccount.accountHolderName,
              ifsc: bankAccount.ifscCode,
              account_number: bankAccount.accountNumber,
            },
            contact: {
              name: partner.name,
              email: partner.email,
              contact: partner.phone,
              type: "vendor",
            },
          },
          queue_if_low_balance: true,
          reference_id: `PAY_${payout.id}`,
          narration: "Commission Payout",
        }, {
          headers: {
            "X-Payout-Idempotency": `idempotency_${payout.id}`,
          },
        });
        
        // Update payout with Razorpay response
        const updatedPayout = await storage.updatePayout(payout.id, {
          razorpayPayoutId: razorpayPayout.id,
          razorpayStatus: razorpayPayout.status,
          utr: razorpayPayout.utr || null,
          status: razorpayPayout.status === "processed" ? "completed" : "processing",
          processedAt: razorpayPayout.status === "processed" ? new Date() : null,
        });
        
        // Update commission status if provided
        if (commissionId && razorpayPayout.status === "processed") {
          await storage.updateCommissionStatus(commissionId, "paid");
        }
        
        res.json({
          success: true,
          payout: updatedPayout,
          razorpayPayout,
        });
      } catch (razorpayError: any) {
        // Update payout with failure
        await storage.updatePayout(payout.id, {
          status: "failed",
          failureReason: razorpayError.message || "Razorpay API error",
        });
        
        throw razorpayError;
      }
    } catch (error: any) {
      console.error("Process payout error:", error);
      res.status(500).json({ 
        message: error.message || "Failed to process payout",
        error: error.error?.description || error.message,
      });
    }
  });

  // Get payout status from Razorpay
  app.get("/api/admin/payouts/:id/status", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const payout = await storage.getAllPayouts().then(p => p.find(p => p.id === id));
      if (!payout || !payout.razorpayPayoutId) {
        return res.status(404).json({ message: "Payout not found or not processed" });
      }
      
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      
      if (!keyId || !keySecret) {
        return res.status(500).json({ message: "Razorpay not configured" });
      }
      
      const Razorpay = require("razorpay");
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
      
      const razorpayPayout = await razorpay.payouts.fetch(payout.razorpayPayoutId);
      
      // Update local payout status
      const updatedPayout = await storage.updatePayout(payout.id, {
        razorpayStatus: razorpayPayout.status,
        utr: razorpayPayout.utr || payout.utr,
        status: razorpayPayout.status === "processed" ? "completed" : 
                razorpayPayout.status === "reversed" || razorpayPayout.status === "cancelled" ? "failed" : 
                "processing",
        processedAt: razorpayPayout.status === "processed" ? new Date() : payout.processedAt,
        failureReason: razorpayPayout.failure_reason || null,
      });
      
      res.json({
        payout: updatedPayout,
        razorpayPayout,
      });
    } catch (error: any) {
      console.error("Get payout status error:", error);
      res.status(500).json({ message: error.message || "Failed to get payout status" });
    }
  });

  // Get partner payouts (for partner view)
  app.get("/api/payouts", requireAuth, async (req, res) => {
    try {
      const payouts = await storage.getPayoutsByPartnerId(req.session.userId!);
      res.json(payouts);
    } catch (error) {
      console.error("Get partner payouts error:", error);
      res.status(500).json({ message: "Failed to get payouts" });
    }
  });

  return httpServer;
}
