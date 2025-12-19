import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { registerUserSchema, loginSchema, customerFormSchema, insertFeedbackSchema, updateFeedbackStatusSchema, inverterCommission } from "@shared/schema";
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
  // Trust proxy for production (Replit uses reverse proxy)
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  // Session setup
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "surya-partner-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
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
      
      // Create notification for the DDP about status change
      const statusLabels: Record<string, string> = {
        verified: "Documents Verified",
        approved: "Application Approved",
        installation_scheduled: "Installation Scheduled",
        completed: "Installation Completed",
      };
      
      if (statusLabels[status]) {
        await storage.createNotification({
          userId: customer.ddpId,
          customerId: customer.id,
          type: "status_update",
          title: `Customer Status: ${statusLabels[status]}`,
          message: `${customer.name}'s application status has been updated to "${statusLabels[status]}".`,
        });
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
      
      const customer = await storage.getCustomer(milestone.customerId);
      
      // Create notification for milestone completion
      if (customer) {
        const milestoneLabels: Record<string, string> = {
          application_submitted: "Application Submitted",
          documents_verified: "Documents Verified",
          site_survey: "Site Survey Complete",
          approval_received: "Approval Received",
          installation_scheduled: "Installation Scheduled",
          installation_complete: "Installation Complete",
          grid_connected: "Grid Connected",
          subsidy_applied: "Subsidy Applied",
          subsidy_received: "Subsidy Received",
        };
        
        await storage.createNotification({
          userId: customer.ddpId,
          customerId: customer.id,
          type: "milestone_complete",
          title: `Milestone: ${milestoneLabels[milestone.milestone] || milestone.milestone}`,
          message: `${customer.name}'s milestone "${milestoneLabels[milestone.milestone] || milestone.milestone}" has been completed.`,
        });
        
        // If installation is complete, create commission for the DDP
        if (milestone.milestone === "installation_complete") {
          const commissions = await storage.createCommissionForCustomer(customer.id, customer.ddpId);
          
          // Notify about commission earned
          if (commissions.ddpCommission) {
            await storage.createNotification({
              userId: customer.ddpId,
              customerId: customer.id,
              type: "commission_earned",
              title: "Commission Earned",
              message: `You earned Rs ${(commissions.ddpCommission.commissionAmount || 0).toLocaleString()} commission for ${customer.name}'s installation.`,
            });
          }
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

  // ==================== PRODUCT & PAYMENT ROUTES ====================
  
  // Get all products (public)
  app.get("/api/products", async (req, res) => {
    try {
      const productsList = await storage.getActiveProducts();
      res.json(productsList);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "Failed to get products" });
    }
  });

  // Admin: Get all products including inactive
  app.get("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const productsList = await storage.getAllProducts();
      res.json(productsList);
    } catch (error) {
      console.error("Get all products error:", error);
      res.status(500).json({ message: "Failed to get products" });
    }
  });

  // Admin: Seed default products (MUST be before /api/admin/products POST to avoid route conflicts)
  app.post("/api/admin/products/seed", requireAdmin, async (req, res) => {
    try {
      const defaultProducts = [
        { name: "3 kW DCR Solar Package (Hybrid Inverter)", description: "Complete 3 kW DCR solar panel system with 3-in-1 hybrid inverter. Eligible for government subsidy. Installation included.", category: "solar_package", price: 225000 },
        { name: "5 kW DCR Solar Package (Hybrid Inverter)", description: "Complete 5 kW DCR solar panel system with 3-in-1 hybrid inverter. Subsidy eligible up to 3 kW. Installation included.", category: "solar_package", price: 375000 },
        { name: "10 kW DCR Solar Package (Hybrid Inverter)", description: "Complete 10 kW DCR solar panel system with 3-in-1 hybrid inverter. Ideal for larger homes. Installation included.", category: "solar_package", price: 750000 },
        { name: "3 kW DCR Solar Package (Ongrid Inverter)", description: "Complete 3 kW DCR solar panel system with ongrid inverter. Eligible for government subsidy. Installation included.", category: "solar_package", price: 198000 },
        { name: "5 kW DCR Solar Package (Ongrid Inverter)", description: "Complete 5 kW DCR solar panel system with ongrid inverter. Subsidy eligible up to 3 kW. Installation included.", category: "solar_package", price: 330000 },
        { name: "3 kW Non-DCR Solar Package", description: "Complete 3 kW non-DCR solar panel system. Budget-friendly option without subsidy. Installation included.", category: "solar_package", price: 165000 },
        { name: "5 kW Non-DCR Solar Package", description: "Complete 5 kW non-DCR solar panel system. Budget-friendly option without subsidy. Installation included.", category: "solar_package", price: 275000 },
        { name: "10 kW Non-DCR Solar Package", description: "Complete 10 kW non-DCR solar panel system. Budget-friendly option for larger installations without subsidy.", category: "solar_package", price: 550000 },
        { name: "SunPunch Trimax 3.5 kW Inverter", description: "On-Grid + Off-Grid + Hybrid Inverter. Supports grid-tie, off-grid, and backup modes.", category: "accessory", price: 42000 },
        { name: "SunPunch Trimax 5.5 kW Inverter", description: "On-Grid + Off-Grid + Hybrid Inverter. Supports grid-tie, off-grid, and backup modes.", category: "accessory", price: 55000 },
        { name: "SunPunch Trimax 6.2 kW Inverter", description: "On-Grid + Off-Grid + Hybrid Inverter. Supports grid-tie, off-grid, and backup modes.", category: "accessory", price: 65000 },
        { name: "Solar Panel Brochure Pack (50 pcs)", description: "High-quality printed brochures explaining PM Surya Ghar Yojana benefits.", category: "marketing_material", price: 500 },
        { name: "Brochures Tri-Fold (100 pcs)", description: "Tri-fold brochures explaining PM Surya Ghar Yojana benefits.", category: "marketing_material", price: 1300 },
        { name: "Solar Subsidy Pamphlet (100 pcs)", description: "Pamphlets detailing central and state subsidies for rooftop solar.", category: "marketing_material", price: 350 },
        { name: "DivyanshiSolar Banner (3x6 ft)", description: "Large vinyl banner with DivyanshiSolar branding.", category: "marketing_material", price: 1200 },
        { name: "Standee Display (Roll-up 3x6 ft)", description: "Portable roll-up standee with solar benefits graphics.", category: "marketing_material", price: 2500 },
        { name: "Standee (2ft x 5ft)", description: "Portable roll-up standee with DivyanshiSolar branding.", category: "marketing_material", price: 1800 },
        { name: "Customer Visiting Cards (500 pcs)", description: "Professional visiting cards with DivyanshiSolar branding.", category: "marketing_material", price: 800 },
        { name: "Visiting Cards (100 pcs)", description: "Professional visiting cards with DivyanshiSolar branding.", category: "marketing_material", price: 300 },
        { name: "Personalised Notebooks", description: "Customized notebooks with DivyanshiSolar branding.", category: "marketing_material", price: 350 },
        { name: "Customized Key Chains", description: "Branded key chains with DivyanshiSolar logo.", category: "marketing_material", price: 250 },
      ];

      let createdCount = 0;
      for (const product of defaultProducts) {
        await storage.createProduct({
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          imageUrl: null,
          isActive: "active",
          stock: 0,
        });
        createdCount++;
      }
      
      console.log(`Admin seeded ${createdCount} products successfully`);
      res.json({ message: `Successfully seeded ${createdCount} products`, count: createdCount });
    } catch (error) {
      console.error("Seed products error:", error);
      res.status(500).json({ message: "Failed to seed products" });
    }
  });

  // Admin: Create product
  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const product = await storage.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      console.error("Create product error:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Admin: Update product
  app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Admin: Delete product
  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ message: "Product deleted" });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Create Razorpay order for payment
  app.post("/api/orders/create", requireAuth, async (req, res) => {
    try {
      const { items, customerName, customerPhone, customerEmail, customerAddress, notes } = req.body;
      
      if (!items || !items.length) {
        return res.status(400).json({ message: "Order must have at least one item" });
      }
      
      // Calculate total using SERVER-SIDE prices from database (security fix)
      let totalAmount = 0;
      const orderItems: Array<{productId?: string; productName: string; quantity: number; unitPrice: number; totalPrice: number}> = [];
      
      for (const item of items) {
        if (!item.productId) {
          return res.status(400).json({ message: "Each item must have a valid productId" });
        }
        
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product not found: ${item.productId}` });
        }
        
        if (product.isActive !== "active") {
          return res.status(400).json({ message: `Product is not available: ${product.name}` });
        }
        
        // Use SERVER-SIDE price, not client-provided price (security)
        const unitPrice = product.price;
        const quantity = Math.max(1, Math.min(item.quantity || 1, 100)); // Clamp quantity
        const totalPrice = unitPrice * quantity;
        
        orderItems.push({
          productId: item.productId,
          productName: product.name,
          quantity,
          unitPrice,
          totalPrice,
        });
        
        totalAmount += totalPrice;
      }
      
      if (totalAmount <= 0) {
        return res.status(400).json({ message: "Order total must be greater than zero" });
      }
      
      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      
      // Create order in database
      const order = await storage.createOrder({
        orderNumber,
        customerId: null,
        customerName: customerName || "Customer",
        customerPhone: customerPhone || "",
        customerEmail: customerEmail || null,
        customerAddress: customerAddress || null,
        totalAmount,
        status: "pending",
        razorpayOrderId: null,
        ddpId: req.session.userId!,
        notes: notes || null,
      });
      
      // Create order items
      for (const item of orderItems) {
        await storage.createOrderItem({
          orderId: order.id,
          ...item,
        });
      }
      
      // Create Razorpay order
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
      
      const razorpayOrder = await razorpay.orders.create({
        amount: totalAmount * 100, // Convert to paise
        currency: "INR",
        receipt: orderNumber,
        notes: {
          orderId: order.id,
          customerName,
        },
      });
      
      // Update order with Razorpay order ID
      await storage.updateOrder(order.id, {
        razorpayOrderId: razorpayOrder.id,
      });
      
      // Create payment record
      await storage.createPayment({
        orderId: order.id,
        razorpayOrderId: razorpayOrder.id,
        razorpayPaymentId: null,
        razorpaySignature: null,
        amount: totalAmount,
        currency: "INR",
        method: null,
        status: "pending",
        failureReason: null,
        paidAt: null,
      });
      
      res.json({
        order,
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: keyId,
        amount: totalAmount * 100,
        currency: "INR",
      });
    } catch (error: any) {
      console.error("Create order error:", error);
      res.status(500).json({ message: error.message || "Failed to create order" });
    }
  });

  // Verify payment after Razorpay checkout
  app.post("/api/orders/verify-payment", requireAuth, async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      
      // Validate required fields
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: "Missing required payment verification fields" });
      }
      
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        return res.status(500).json({ message: "Razorpay not configured" });
      }
      
      // Find order by Razorpay order ID FIRST (before verification to ensure it exists)
      const order = await storage.getOrderByRazorpayId(razorpay_order_id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Verify order belongs to requesting user
      if (order.ddpId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized access to order" });
      }
      
      // Check if order is already paid (idempotency)
      if (order.status === "paid") {
        return res.json({ success: true, order, message: "Order already verified" });
      }
      
      // Verify order is in pending state
      if (order.status !== "pending") {
        return res.status(400).json({ message: `Order cannot be verified in ${order.status} state` });
      }
      
      // Find pending payment record
      const existingPayments = await storage.getPaymentsByOrderId(order.id);
      const pendingPayment = existingPayments.find(p => p.status === "pending");
      if (!pendingPayment) {
        return res.status(400).json({ message: "No pending payment found for this order" });
      }
      
      // Verify signature (CRITICAL SECURITY CHECK)
      const crypto = require("crypto");
      const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
      
      if (expectedSignature !== razorpay_signature) {
        // Log failed verification attempt
        console.error("Payment signature verification failed", { razorpay_order_id, orderId: order.id });
        return res.status(400).json({ message: "Invalid payment signature" });
      }
      
      // ONLY after successful signature verification, update order and payment status
      await storage.updateOrder(order.id, {
        status: "paid",
      });
      
      await storage.updatePayment(pendingPayment.id, {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "captured",
        paidAt: new Date(),
      });
      
      // Fetch updated order
      const updatedOrder = await storage.getOrder(order.id);
      
      // Create commissions for SunPunch inverter sales
      const orderItems = await storage.getOrderItems(order.id);
      const ddp = await storage.getUser(order.ddpId);
      
      for (const item of orderItems) {
        // Check if this is a SunPunch inverter product
        if (item.productName && item.productName.toLowerCase().includes("sunpunch")) {
          const quantity = item.quantity || 1;
          const ddpCommissionAmount = inverterCommission.ddp * quantity;
          const bdpCommissionAmount = inverterCommission.bdp * quantity;
          
          // Create DDP commission for inverter sale
          await storage.createCommission({
            partnerId: order.ddpId,
            partnerType: "ddp",
            customerId: null,
            capacityKw: 0,
            commissionAmount: ddpCommissionAmount,
            status: "pending",
            paidAt: null,
            notes: `SunPunch Inverter sale: ${item.productName} x${quantity} (Order #${order.id.slice(-6)})`,
          });
          
          // Create BDP commission if DDP has a parent
          if (ddp?.parentId) {
            await storage.createCommission({
              partnerId: ddp.parentId,
              partnerType: "bdp",
              customerId: null,
              capacityKw: 0,
              commissionAmount: bdpCommissionAmount,
              status: "pending",
              paidAt: null,
              notes: `SunPunch Inverter sale: ${item.productName} x${quantity} (Order #${order.id.slice(-6)})`,
            });
          }
        }
      }
      
      res.json({ success: true, order: updatedOrder });
    } catch (error: any) {
      console.error("Verify payment error:", error);
      res.status(500).json({ message: error.message || "Failed to verify payment" });
    }
  });

  // Get orders for current user (DDP)
  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      const ordersList = await storage.getOrdersByDdpId(req.session.userId!);
      res.json(ordersList);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  // Get order details with items
  app.get("/api/orders/:id", requireAuth, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const items = await storage.getOrderItems(order.id);
      const orderPayments = await storage.getPaymentsByOrderId(order.id);
      
      res.json({ order, items, payments: orderPayments });
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ message: "Failed to get order" });
    }
  });

  // Admin: Get all orders
  app.get("/api/admin/orders", requireAdmin, async (req, res) => {
    try {
      const ordersList = await storage.getAllOrders();
      res.json(ordersList);
    } catch (error) {
      console.error("Get all orders error:", error);
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  // Admin: Get all payments
  app.get("/api/admin/payments", requireAdmin, async (req, res) => {
    try {
      const paymentsList = await storage.getAllPayments();
      res.json(paymentsList);
    } catch (error) {
      console.error("Get payments error:", error);
      res.status(500).json({ message: "Failed to get payments" });
    }
  });

  // Admin: Update order status
  app.patch("/api/admin/orders/:id", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const order = await storage.updateOrder(req.params.id, { status });
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Update order error:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Razorpay Webhook (for async payment updates)
  app.post("/api/razorpay/webhook", async (req, res) => {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      
      if (webhookSecret) {
        // Verify webhook signature
        const crypto = require("crypto");
        const signature = req.headers["x-razorpay-signature"];
        const expectedSignature = crypto
          .createHmac("sha256", webhookSecret)
          .update(JSON.stringify(req.body))
          .digest("hex");
        
        if (signature !== expectedSignature) {
          return res.status(400).json({ message: "Invalid webhook signature" });
        }
      }
      
      const { event, payload } = req.body;
      
      if (event === "payment.captured") {
        const payment = payload.payment.entity;
        const order = await storage.getOrderByRazorpayId(payment.order_id);
        
        if (order) {
          await storage.updateOrder(order.id, { status: "paid" });
          
          const existingPayments = await storage.getPaymentsByOrderId(order.id);
          if (existingPayments.length > 0) {
            await storage.updatePayment(existingPayments[0].id, {
              razorpayPaymentId: payment.id,
              status: "captured",
              method: payment.method,
              paidAt: new Date(),
            });
          }
        }
      } else if (event === "payment.failed") {
        const payment = payload.payment.entity;
        const order = await storage.getOrderByRazorpayId(payment.order_id);
        
        if (order) {
          const existingPayments = await storage.getPaymentsByOrderId(order.id);
          if (existingPayments.length > 0) {
            await storage.updatePayment(existingPayments[0].id, {
              status: "failed",
              failureReason: payment.error_description || "Payment failed",
            });
          }
        }
      }
      
      res.json({ status: "ok" });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // ============ FEEDBACK ROUTES ============
  
  // Submit feedback (authenticated users)
  app.post("/api/feedback", requireAuth, async (req, res) => {
    try {
      const validatedData = insertFeedbackSchema.omit({ userId: true }).parse(req.body);
      
      const feedback = await storage.createFeedback({
        userId: req.session.userId!,
        ...validatedData,
      });
      
      res.status(201).json(feedback);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Create feedback error:", error);
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });
  
  // Get user's own feedback
  app.get("/api/feedback", requireAuth, async (req, res) => {
    try {
      const feedback = await storage.getFeedbackByUserId(req.session.userId!);
      res.json(feedback);
    } catch (error) {
      console.error("Get feedback error:", error);
      res.status(500).json({ message: "Failed to get feedback" });
    }
  });
  
  // Admin: Get all feedback
  app.get("/api/admin/feedback", requireAdmin, async (req, res) => {
    try {
      const feedback = await storage.getAllFeedback();
      res.json(feedback);
    } catch (error) {
      console.error("Get all feedback error:", error);
      res.status(500).json({ message: "Failed to get feedback" });
    }
  });
  
  // Admin: Update feedback status
  app.patch("/api/admin/feedback/:id", requireAdmin, async (req, res) => {
    try {
      const validatedData = updateFeedbackStatusSchema.parse(req.body);
      const feedback = await storage.updateFeedbackStatus(req.params.id, validatedData.status, validatedData.adminNotes);
      if (!feedback) {
        return res.status(404).json({ message: "Feedback not found" });
      }
      res.json(feedback);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Update feedback error:", error);
      res.status(500).json({ message: "Failed to update feedback" });
    }
  });

  // ============ NOTIFICATION ROUTES ============
  
  // Get user's notifications
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUserId(req.session.userId!);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  // Get unread notification count
  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.session.userId!);
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const notification = await storage.markNotificationRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.post("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsRead(req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark all read error:", error);
      res.status(500).json({ message: "Failed to mark all as read" });
    }
  });

  // ============ USER PREFERENCES ROUTES ============
  
  // Get user preferences
  app.get("/api/preferences", requireAuth, async (req, res) => {
    try {
      let prefs = await storage.getUserPreferences(req.session.userId!);
      if (!prefs) {
        prefs = await storage.createOrUpdateUserPreferences(req.session.userId!, {});
      }
      res.json(prefs);
    } catch (error) {
      console.error("Get preferences error:", error);
      res.status(500).json({ message: "Failed to get preferences" });
    }
  });

  // Update user preferences
  app.patch("/api/preferences", requireAuth, async (req, res) => {
    try {
      const prefs = await storage.createOrUpdateUserPreferences(req.session.userId!, req.body);
      res.json(prefs);
    } catch (error) {
      console.error("Update preferences error:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // ============ PARTNER OF THE MONTH ROUTES ============
  
  // Get current partner of the month
  app.get("/api/partner-of-month", async (req, res) => {
    try {
      const pom = await storage.getCurrentPartnerOfMonth();
      res.json(pom || null);
    } catch (error) {
      console.error("Get partner of month error:", error);
      res.status(500).json({ message: "Failed to get partner of month" });
    }
  });

  // Get all partners of the month (history)
  app.get("/api/partner-of-month/history", requireAuth, async (req, res) => {
    try {
      const poms = await storage.getAllPartnersOfMonth();
      res.json(poms);
    } catch (error) {
      console.error("Get partner of month history error:", error);
      res.status(500).json({ message: "Failed to get history" });
    }
  });

  // Admin: Create partner of the month
  app.post("/api/admin/partner-of-month", requireAdmin, async (req, res) => {
    try {
      const { partnerId, month, year, achievement, customersCount, totalCommission } = req.body;
      const pom = await storage.createPartnerOfMonth({
        partnerId,
        month,
        year,
        achievement,
        customersCount: customersCount || 0,
        totalCommission: totalCommission || 0,
      });
      res.status(201).json(pom);
    } catch (error) {
      console.error("Create partner of month error:", error);
      res.status(500).json({ message: "Failed to create partner of month" });
    }
  });

  // ============ CHATBOT FAQ ROUTES ============
  
  // Get active FAQs (public)
  app.get("/api/faqs", async (req, res) => {
    try {
      const faqs = await storage.getActiveFaqs();
      res.json(faqs);
    } catch (error) {
      console.error("Get FAQs error:", error);
      res.status(500).json({ message: "Failed to get FAQs" });
    }
  });

  // Search FAQs
  app.get("/api/faqs/search", async (req, res) => {
    try {
      const query = req.query.q as string || "";
      const faqs = await storage.searchFaqs(query);
      res.json(faqs);
    } catch (error) {
      console.error("Search FAQs error:", error);
      res.status(500).json({ message: "Failed to search FAQs" });
    }
  });

  // Admin: Get all FAQs
  app.get("/api/admin/faqs", requireAdmin, async (req, res) => {
    try {
      const faqs = await storage.getAllFaqs();
      res.json(faqs);
    } catch (error) {
      console.error("Get all FAQs error:", error);
      res.status(500).json({ message: "Failed to get FAQs" });
    }
  });

  // Admin: Create FAQ
  app.post("/api/admin/faqs", requireAdmin, async (req, res) => {
    try {
      const { question, answer, category, keywords, sortOrder } = req.body;
      const faq = await storage.createFaq({
        question,
        answer,
        category,
        keywords: keywords || [],
        sortOrder: sortOrder || 0,
      });
      res.status(201).json(faq);
    } catch (error) {
      console.error("Create FAQ error:", error);
      res.status(500).json({ message: "Failed to create FAQ" });
    }
  });

  // Admin: Update FAQ
  app.patch("/api/admin/faqs/:id", requireAdmin, async (req, res) => {
    try {
      const faq = await storage.updateFaq(req.params.id, req.body);
      if (!faq) {
        return res.status(404).json({ message: "FAQ not found" });
      }
      res.json(faq);
    } catch (error) {
      console.error("Update FAQ error:", error);
      res.status(500).json({ message: "Failed to update FAQ" });
    }
  });

  // Admin: Delete FAQ
  app.delete("/api/admin/faqs/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteFaq(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete FAQ error:", error);
      res.status(500).json({ message: "Failed to delete FAQ" });
    }
  });

  return httpServer;
}
