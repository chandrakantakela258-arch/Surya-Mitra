import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "./db";
import { storage } from "./storage";
import { registerUserSchema, loginSchema, customerFormSchema, insertFeedbackSchema, updateFeedbackStatusSchema, inverterCommission, insertVendorSchema, vendorStates, insertSiteSurveySchema } from "@shared/schema";
import { z } from "zod";
import { notificationService } from "./notification-service";
import { calculateLeadScore, type LeadScoreResult } from "./lead-scoring-service";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = file.mimetype.startsWith("video/") ? "videos" : "images";
    const targetDir = path.join(uploadDir, subDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max for videos
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    const allowedVideoTypes = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];
    
    if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images (JPEG, PNG, WebP) and videos (MP4, MOV, AVI, WebM) are allowed."));
    }
  },
});

const SALT_ROUNDS = 10;

const PgSession = connectPgSimple(session);

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
  console.log("requireAdmin - session:", req.session, "sessionId:", req.sessionID, "cookies:", req.headers.cookie);
  if (!req.session.userId) {
    console.log("requireAdmin - No userId in session");
    return res.status(401).json({ message: "Not authenticated" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  (req as any).user = user;
  next();
}

async function requireCustomerPartner(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "customer_partner") {
    return res.status(403).json({ message: "Forbidden: Customer Partner access required" });
  }
  (req as any).user = user;
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Trust proxy - Replit always uses reverse proxy
  app.set("trust proxy", 1);

  // Session setup with PostgreSQL store for production persistence
  const isProduction = process.env.NODE_ENV === "production";
  app.use(
    session({
      store: new PgSession({
        pool: pool,
        tableName: "user_sessions",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "surya-partner-secret-key",
      resave: false,
      saveUninitialized: false,
      proxy: true,
      cookie: {
        secure: isProduction,
        httpOnly: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
      
      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
      const user = await storage.createUser({ ...data, password: hashedPassword });
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
      console.log("Login attempt for:", data.username);
      
      const user = await storage.getUserByUsername(data.username);
      if (!user) {
        console.log("Login failed - user not found");
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Compare password using bcrypt (supports both hashed and plain text for migration)
      let isValidPassword = false;
      if (user.password.startsWith("$2")) {
        // Password is hashed with bcrypt
        isValidPassword = await bcrypt.compare(data.password, user.password);
      } else {
        // Legacy plain text password - compare directly and upgrade
        isValidPassword = user.password === data.password;
        if (isValidPassword) {
          // Upgrade to hashed password
          const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
          await storage.updateUserPassword(user.id, hashedPassword);
          console.log("Upgraded password to bcrypt hash for user:", user.username);
        }
      }
      
      if (!isValidPassword) {
        console.log("Login failed - invalid password");
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      req.session.userId = user.id;
      console.log("Login successful, setting userId:", user.id, "sessionId:", req.sessionID);
      
      // Force session save
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session save failed" });
        }
        console.log("Session saved successfully");
        res.json({ user: { ...user, password: undefined } });
      });
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

  // ==================== FORGOT PASSWORD ROUTES ====================
  
  // Send OTP for password reset (uses database storage for persistence)
  app.post("/api/auth/forgot-password/send-otp", async (req, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      
      // Find user by phone
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(404).json({ message: "No account found with this phone number" });
      }
      
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Store OTP in database (replaces any existing OTP for this phone)
      await storage.createPasswordResetOtp({
        phone,
        otp,
        expiresAt,
      });
      
      // Send OTP via Twilio SMS
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
      
      if (twilioSid && twilioToken && twilioPhone) {
        try {
          const twilio = require("twilio")(twilioSid, twilioToken);
          await twilio.messages.create({
            body: `Your DivyanshiSolar password reset OTP is: ${otp}. Valid for 10 minutes.`,
            from: twilioPhone,
            to: phone.startsWith("+") ? phone : `+91${phone}`,
          });
        } catch (smsError) {
          console.error("SMS send error:", smsError);
          // Still return success - OTP is stored, user can use it
        }
      }
      
      res.json({ 
        success: true, 
        userName: user.name,
        message: "OTP sent successfully" 
      });
    } catch (error) {
      console.error("Send OTP error:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });
  
  // Verify OTP
  app.post("/api/auth/forgot-password/verify-otp", async (req, res) => {
    try {
      const { phone, otp } = req.body;
      
      if (!phone || !otp) {
        return res.status(400).json({ message: "Phone and OTP are required" });
      }
      
      // Get OTP from database
      const storedOtp = await storage.getPasswordResetOtp(phone);
      if (!storedOtp) {
        return res.status(400).json({ message: "OTP not found. Please request a new one." });
      }
      
      if (new Date() > new Date(storedOtp.expiresAt)) {
        await storage.markPasswordResetOtpUsed(storedOtp.id);
        return res.status(400).json({ message: "OTP has expired. Please request a new one." });
      }
      
      if (storedOtp.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP. Please try again." });
      }
      
      // Generate reset token and update in database
      const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes for password reset
      
      // Update the OTP record with reset token
      await storage.createPasswordResetOtp({
        phone,
        otp: storedOtp.otp,
        resetToken,
        expiresAt: newExpiresAt,
      });
      
      res.json({ 
        success: true, 
        resetToken,
        message: "OTP verified successfully" 
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });
  
  // Reset password
  app.post("/api/auth/forgot-password/reset", async (req, res) => {
    try {
      const { phone, resetToken, newPassword } = req.body;
      
      if (!phone || !resetToken || !newPassword) {
        return res.status(400).json({ message: "Phone, reset token and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      // Get OTP from database and verify reset token
      const storedOtp = await storage.getPasswordResetOtp(phone);
      if (!storedOtp || storedOtp.resetToken !== resetToken) {
        return res.status(400).json({ message: "Invalid reset token. Please start again." });
      }
      
      if (new Date() > new Date(storedOtp.expiresAt)) {
        await storage.markPasswordResetOtpUsed(storedOtp.id);
        return res.status(400).json({ message: "Reset token has expired. Please start again." });
      }
      
      // Find user and update password
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
      
      // Update user password
      await storage.updateUser(user.id, { password: hashedPassword });
      
      // Mark OTP as used
      await storage.markPasswordResetOtpUsed(storedOtp.id);
      
      res.json({ 
        success: true, 
        message: "Password reset successfully" 
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
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

  // Get specific partner details
  app.get("/api/bdp/partners/:id", requireBDP, async (req, res) => {
    try {
      const user = (req as any).user;
      const partnerId = req.params.id;
      
      // Get the partner
      const partner = await storage.getUser(partnerId);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      
      // Verify this partner belongs to the BDP
      if (partner.parentId !== user.id && user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json({ ...partner, password: undefined });
    } catch (error) {
      console.error("Get partner details error:", error);
      res.status(500).json({ message: "Failed to get partner details" });
    }
  });

  // Get customers for a specific partner
  app.get("/api/bdp/partners/:id/customers", requireBDP, async (req, res) => {
    try {
      const user = (req as any).user;
      const partnerId = req.params.id;
      
      // Get the partner to verify access
      const partner = await storage.getUser(partnerId);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      
      // Verify this partner belongs to the BDP
      if (partner.parentId !== user.id && user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get customers for this partner
      const customers = await storage.getCustomersByDdpId(partnerId);
      res.json(customers);
    } catch (error) {
      console.error("Get partner customers error:", error);
      res.status(500).json({ message: "Failed to get partner customers" });
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
  
  // Upload site pictures (6 images from all angles) with optional GPS location
  app.post("/api/ddp/customers/:id/site-pictures", requireDDP, upload.array("pictures", 6), async (req, res) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { latitude, longitude } = req.body;
      
      // Verify customer belongs to this DDP
      const customer = await storage.getCustomer(id);
      if (!customer || customer.ddpId !== user.id) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      
      if (files.length > 6) {
        return res.status(400).json({ message: "Maximum 6 pictures allowed" });
      }
      
      // Get existing pictures and combine with new ones
      const existingPictures = customer.sitePictures || [];
      const newPictures = files.map(f => `/uploads/images/${f.filename}`);
      const allPictures = [...existingPictures, ...newPictures].slice(0, 6);
      
      const updated = await storage.updateCustomerSiteMedia(id, allPictures, undefined);
      
      // Update GPS location if provided and not already set
      let locationUpdated = false;
      if (latitude && longitude && (!customer.latitude || !customer.longitude)) {
        await storage.updateCustomerLocation(id, latitude, longitude);
        locationUpdated = true;
      }
      
      res.json({ 
        message: "Pictures uploaded successfully", 
        sitePictures: updated?.sitePictures,
        count: updated?.sitePictures?.length || 0,
        locationUpdated
      });
    } catch (error) {
      console.error("Upload site pictures error:", error);
      res.status(500).json({ message: "Failed to upload pictures" });
    }
  });
  
  // Update customer GPS location
  app.patch("/api/ddp/customers/:id/location", requireDDP, async (req, res) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { lat, lng } = req.body;
      
      const customer = await storage.getCustomer(id);
      if (!customer || customer.ddpId !== user.id) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude and longitude required" });
      }
      
      await storage.updateCustomerLocation(id, lat, lng);
      res.json({ message: "Location updated successfully" });
    } catch (error) {
      console.error("Update location error:", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });
  
  // Upload site video (9:16 Instagram-style, max 60 seconds)
  app.post("/api/ddp/customers/:id/site-video", requireDDP, upload.single("video"), async (req, res) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      
      // Verify customer belongs to this DDP
      const customer = await storage.getCustomer(id);
      if (!customer || customer.ddpId !== user.id) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No video uploaded" });
      }
      
      const videoUrl = `/uploads/videos/${file.filename}`;
      const updated = await storage.updateCustomerSiteMedia(id, undefined, videoUrl);
      
      res.json({ 
        message: "Video uploaded successfully", 
        siteVideo: updated?.siteVideo 
      });
    } catch (error) {
      console.error("Upload site video error:", error);
      res.status(500).json({ message: "Failed to upload video" });
    }
  });
  
  // Delete a site picture
  app.delete("/api/ddp/customers/:id/site-pictures/:index", requireDDP, async (req, res) => {
    try {
      const user = (req as any).user;
      const { id, index } = req.params;
      const pictureIndex = parseInt(index, 10);
      
      // Verify customer belongs to this DDP
      const customer = await storage.getCustomer(id);
      if (!customer || customer.ddpId !== user.id) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      const pictures = customer.sitePictures || [];
      if (pictureIndex < 0 || pictureIndex >= pictures.length) {
        return res.status(400).json({ message: "Invalid picture index" });
      }
      
      // Remove the picture from array
      pictures.splice(pictureIndex, 1);
      const updated = await storage.updateCustomerSiteMedia(id, pictures, undefined);
      
      res.json({ 
        message: "Picture deleted successfully", 
        sitePictures: updated?.sitePictures 
      });
    } catch (error) {
      console.error("Delete site picture error:", error);
      res.status(500).json({ message: "Failed to delete picture" });
    }
  });
  
  // Delete site video
  app.delete("/api/ddp/customers/:id/site-video", requireDDP, async (req, res) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      
      // Verify customer belongs to this DDP
      const customer = await storage.getCustomer(id);
      if (!customer || customer.ddpId !== user.id) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      const updated = await storage.updateCustomerSiteMedia(id, undefined, "");
      res.json({ message: "Video deleted successfully" });
    } catch (error) {
      console.error("Delete site video error:", error);
      res.status(500).json({ message: "Failed to delete video" });
    }
  });
  
  // ==================== LEAD SCORING ROUTES ====================
  
  // Calculate lead score for a specific customer
  app.post("/api/customers/:id/lead-score", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      
      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Verify access based on role hierarchy
      if (user.role === "ddp" && customer.ddpId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // For BDP, verify customer belongs to their network
      if (user.role === "bdp") {
        const ddp = await storage.getUser(customer.ddpId);
        if (!ddp || ddp.parentId !== user.id) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      // Calculate lead score using AI
      const scoreResult = await calculateLeadScore(customer);
      
      // Validate score result before storing
      if (typeof scoreResult.score !== "number" || scoreResult.score < 0 || scoreResult.score > 100) {
        return res.status(500).json({ message: "Invalid score generated" });
      }
      
      if (!["hot", "warm", "cold"].includes(scoreResult.tier)) {
        scoreResult.tier = scoreResult.score >= 70 ? "hot" : scoreResult.score >= 40 ? "warm" : "cold";
      }
      
      // Save the score to database
      await storage.updateCustomerLeadScore(id, scoreResult.score, JSON.stringify(scoreResult));
      
      res.json(scoreResult);
    } catch (error) {
      console.error("Lead scoring error:", error);
      res.status(500).json({ message: "Failed to calculate lead score" });
    }
  });
  
  // Get lead score for a customer (without recalculating)
  app.get("/api/customers/:id/lead-score", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      
      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Verify access based on role hierarchy
      if (user.role === "ddp" && customer.ddpId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // For BDP, verify customer belongs to their network
      if (user.role === "bdp") {
        const ddp = await storage.getUser(customer.ddpId);
        if (!ddp || ddp.parentId !== user.id) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      if (!customer.leadScore || !customer.leadScoreDetails) {
        return res.json({ 
          score: null, 
          message: "No lead score calculated yet" 
        });
      }
      
      try {
        const details = JSON.parse(customer.leadScoreDetails) as LeadScoreResult;
        res.json({
          ...details,
          updatedAt: customer.leadScoreUpdatedAt,
        });
      } catch {
        res.json({ 
          score: customer.leadScore,
          tier: customer.leadScore >= 70 ? "hot" : customer.leadScore >= 40 ? "warm" : "cold",
          updatedAt: customer.leadScoreUpdatedAt,
        });
      }
    } catch (error) {
      console.error("Get lead score error:", error);
      res.status(500).json({ message: "Failed to get lead score" });
    }
  });
  
  // Batch calculate lead scores for all customers (admin/BDP only)
  app.post("/api/lead-scores/batch", requireBDP, async (req, res) => {
    try {
      const user = (req as any).user;
      let customers;
      
      if (user.role === "admin") {
        customers = await storage.getAllCustomers();
      } else {
        customers = await storage.getAllCustomersByBdpId(user.id);
      }
      
      // Filter to only unscored or stale scores (older than 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const toScore = customers.filter(c => 
        !c.leadScore || 
        !c.leadScoreUpdatedAt || 
        new Date(c.leadScoreUpdatedAt) < sevenDaysAgo
      );
      
      // Process in background, return immediately
      res.json({ 
        message: `Scoring ${toScore.length} customers in background`,
        total: customers.length,
        toScore: toScore.length,
      });
      
      // Process scoring asynchronously
      for (const customer of toScore) {
        try {
          const scoreResult = await calculateLeadScore(customer);
          await storage.updateCustomerLeadScore(customer.id, scoreResult.score, JSON.stringify(scoreResult));
        } catch (error) {
          console.error(`Failed to score customer ${customer.id}:`, error);
        }
        // Rate limiting - wait 1 second between API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error("Batch lead scoring error:", error);
      res.status(500).json({ message: "Failed to start batch scoring" });
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
      
      // Get current customer to track old status
      const existingCustomer = await storage.getCustomer(id);
      if (!existingCustomer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      const oldStatus = existingCustomer.status;
      
      const customer = await storage.updateCustomerStatus(id, status);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Send notifications via WhatsApp, SMS, and Email
      await notificationService.notifyCustomerStatusChange({
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email || undefined,
        ddpId: customer.ddpId,
        oldStatus,
        newStatus: status,
      });
      
      // When installation is completed, check if the DDP's referrer should get their reward
      // Partner referral reward is earned when referred partner completes 15 installations
      if (status === "completed" && customer.ddpId) {
        try {
          const result = await storage.checkAndConvertPartnerReferral(customer.ddpId);
          if (result.converted && result.referral) {
            console.log(`Partner referral converted! Referrer: ${result.referral.referrerId}, Reward: Rs ${result.referral.rewardAmount}`);
          }
        } catch (err) {
          console.error("Error checking partner referral:", err);
        }
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
        
        // Send milestone notification via WhatsApp/Email/In-app
        await notificationService.notifyMilestoneComplete(
          customer.id,
          customer.name,
          customer.phone,
          customer.email || undefined,
          milestoneLabels[milestone.milestone] || milestone.milestone,
          customer.ddpId
        );
        
        // If installation is complete, create commission for the DDP and/or Customer Partner
        // Skip commission for independent/direct website registrations (no referral code)
        if (milestone.milestone === "installation_complete") {
          // Only create commission if customer was referred (not direct website registration)
          const isIndependentCustomer = customer.source === "website_direct";
          
          if (!isIndependentCustomer) {
            // Check if referred by a Customer Partner
            if (customer.referrerCustomerId) {
              // Customer was referred by a Customer Partner
              // Only create commission if capacity is 3kW or above
              const capacity = parseInt(customer.proposedCapacity || "0");
              if (capacity >= 3) {
                // Find the Customer Partner user by their linkedCustomerId
                const allUsers = await storage.getAllPartners();
                const customerPartner = allUsers.find(
                  u => u.role === "customer_partner" && u.linkedCustomerId === customer.referrerCustomerId
                );
                
                if (customerPartner) {
                  // Create Rs 10,000 referral commission for Customer Partner
                  await storage.createCommission({
                    partnerId: customerPartner.id,
                    partnerType: "customer_partner",
                    customerId: customer.id,
                    capacityKw: capacity,
                    commissionAmount: 10000, // Fixed Rs 10,000 for customer referrals
                    panelType: customer.panelType || "dcr",
                    status: "pending",
                    commissionType: "customer_referral",
                  });
                  
                  // Notify customer partner
                  await notificationService.notifyCommissionEarned(
                    customerPartner.id,
                    customerPartner.phone,
                    customerPartner.email,
                    10000,
                    "customer referral",
                    customer.name
                  );
                  
                  // Update referral status if exists
                  const referrals = await storage.getReferralsByReferrerId(customerPartner.id);
                  const referral = referrals.find(r => r.referredPhone === customer.phone);
                  if (referral) {
                    await storage.updateReferral(referral.id, { 
                      status: "converted",
                      rewardAmount: 10000,
                    });
                  }
                }
              }
            } else {
              // Original BDP/DDP commission logic (for non-customer-partner referrals)
              const commissions = await storage.createCommissionForCustomer(customer.id, customer.ddpId);
              
              // Notify about commission earned via WhatsApp/Email
              if (commissions.ddpCommission) {
                const ddp = await storage.getUser(customer.ddpId);
                if (ddp) {
                  await notificationService.notifyCommissionEarned(
                    customer.ddpId,
                    ddp.phone,
                    ddp.email,
                    commissions.ddpCommission.commissionAmount || 0,
                    "solar installation",
                    customer.name
                  );
                }
              }
              
              // Also notify BDP if exists
              if (commissions.bdpCommission) {
                const ddp = await storage.getUser(customer.ddpId);
                if (ddp?.parentId) {
                  const bdp = await storage.getUser(ddp.parentId);
                  if (bdp) {
                    await notificationService.notifyCommissionEarned(
                      bdp.id,
                      bdp.phone,
                      bdp.email,
                      commissions.bdpCommission.commissionAmount || 0,
                      "solar installation (via partner)",
                      customer.name
                    );
                  }
                }
              }
            }
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

  // Get DDP's enhanced commission summary with breakdown
  app.get("/api/ddp/commissions/enhanced-summary", requireDDP, async (req, res) => {
    try {
      const user = (req as any).user;
      const summary = await storage.getEnhancedCommissionSummary(user.id, "ddp");
      res.json(summary);
    } catch (error) {
      console.error("Get enhanced commission summary error:", error);
      res.status(500).json({ message: "Failed to get enhanced commission summary" });
    }
  });

  // Get DDP's current incentive target
  app.get("/api/ddp/incentive-target", requireDDP, async (req, res) => {
    try {
      const user = (req as any).user;
      const target = await storage.getCurrentIncentiveTarget(user.id);
      res.json(target);
    } catch (error) {
      console.error("Get incentive target error:", error);
      res.status(500).json({ message: "Failed to get incentive target" });
    }
  });

  // Get DDP's all incentive targets (history)
  app.get("/api/ddp/incentive-targets", requireDDP, async (req, res) => {
    try {
      const user = (req as any).user;
      const targets = await storage.getIncentiveTargetsByPartnerId(user.id);
      res.json(targets);
    } catch (error) {
      console.error("Get incentive targets error:", error);
      res.status(500).json({ message: "Failed to get incentive targets" });
    }
  });

  // Get DDP's performance metrics
  app.get("/api/ddp/performance", requireDDP, async (req, res) => {
    try {
      const user = (req as any).user;
      const months = parseInt(req.query.months as string) || 6;
      const metrics = await storage.getMonthlyPerformance(user.id, months);
      res.json(metrics);
    } catch (error) {
      console.error("Get performance metrics error:", error);
      res.status(500).json({ message: "Failed to get performance metrics" });
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
      console.log("Fetching all partners for admin...");
      const partners = await storage.getAllPartners();
      console.log(`Found ${partners.length} partners:`, partners.map(p => ({ id: p.id, name: p.name, role: p.role, status: p.status })));
      res.json(partners.map((p) => ({ ...p, password: undefined })));
    } catch (error) {
      console.error("Get all partners error:", error);
      res.status(500).json({ message: "Failed to get partners" });
    }
  });
  
  // Debug: Check all users in database (public for debugging)
  app.get("/api/debug/users-count", async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const partners = await storage.getAllPartners();
      const stats = await storage.getAdminStats();
      console.log("DEBUG - Total users:", allUsers.length, "Partners:", partners.length, "Stats:", stats);
      res.json({ 
        totalUsers: allUsers.length, 
        totalPartners: partners.length,
        stats: stats,
        users: allUsers.map(u => ({ name: u.name, role: u.role, status: u.status }))
      });
    } catch (error) {
      console.error("Debug users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // Debug: Check session status (public for debugging)
  app.get("/api/debug/session", (req, res) => {
    res.json({
      hasSession: !!req.session,
      sessionId: req.sessionID,
      userId: req.session?.userId || null,
      cookie: req.headers.cookie || "none",
      isProduction: process.env.NODE_ENV === "production",
    });
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

  // Admin update customer status (with notifications)
  app.patch("/api/admin/customers/:id/status", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!["pending", "verified", "approved", "installation_scheduled", "completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const existingCustomer = await storage.getCustomer(id);
      if (!existingCustomer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      const oldStatus = existingCustomer.status;
      
      const customer = await storage.updateCustomerStatus(id, status);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Send notifications via WhatsApp, SMS, and Email
      await notificationService.notifyCustomerStatusChange({
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email || undefined,
        ddpId: customer.ddpId,
        oldStatus,
        newStatus: status,
      });
      
      // When installation is completed, check if the DDP's referrer should get their reward
      // Partner referral reward is earned when referred partner completes 15 installations
      if (status === "completed" && customer.ddpId) {
        try {
          const result = await storage.checkAndConvertPartnerReferral(customer.ddpId);
          if (result.converted && result.referral) {
            console.log(`Partner referral converted! Referrer: ${result.referral.referrerId}, Reward: Rs ${result.referral.rewardAmount}`);
          }
        } catch (err) {
          console.error("Error checking partner referral:", err);
        }
      }
      
      res.json(customer);
    } catch (error) {
      console.error("Admin update customer status error:", error);
      res.status(500).json({ message: "Failed to update customer status" });
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

  // ============ PUBLIC CUSTOMER REGISTRATION ============
  
  // Public: Register as a customer (no authentication required)
  app.post("/api/public/customer-registration", async (req, res) => {
    try {
      const { name, phone, email, address, district, state, pincode, roofType, panelType, proposedCapacity, monthlyBill, referralCode } = req.body;
      
      // Validate required fields
      if (!name || !phone || !address || !district || !state || !pincode || !roofType || !panelType || !proposedCapacity) {
        return res.status(400).json({ message: "Please fill all required fields" });
      }
      
      // Check if phone number is valid (10 digits)
      if (!/^\d{10}$/.test(phone.replace(/\D/g, '').slice(-10))) {
        return res.status(400).json({ message: "Invalid phone number" });
      }
      
      // Check if customer used a referral code
      let ddpId: string | null = null;
      let isIndependent = true; // Default: no commission sharing
      let referrerCustomerId: string | null = null; // For customer partner referrals
      
      if (referralCode && referralCode.trim()) {
        const code = referralCode.trim();
        
        // Check if it's a Customer Partner referral code (starts with CP)
        if (code.startsWith("CP")) {
          // Find customer partner with this referral code
          const customerPartner = await storage.getUserByReferralCode(code);
          if (customerPartner && customerPartner.role === "customer_partner" && customerPartner.linkedCustomerId) {
            isIndependent = false; // Referred by customer partner - commission eligible
            referrerCustomerId = customerPartner.linkedCustomerId;
            
            // Track referral in referrals table
            await storage.createReferral({
              referrerId: customerPartner.id,
              referredType: "customer",
              referredName: name,
              referredPhone: phone,
              status: "pending",
            });
          }
        } else {
          // Find user with this referral code (BDP/DDP - but now they don't have referral access)
          // Keep backward compatibility but mark as website_direct (no commission for BDP/DDP referrals)
          const referrer = await storage.getUserByReferralCode(code);
          if (referrer && (referrer.role === "ddp" || referrer.role === "bdp")) {
            // BDP/DDP referrals now go to website_direct (no commission)
            // Only Customer Partner referrals earn commission
            if (referrer.role === "ddp") {
              ddpId = referrer.id;
            } else {
              // For BDP referral, find any DDP under this BDP
              const ddps = await storage.getPartnersByParentId(referrer.id);
              if (ddps.length > 0) {
                ddpId = ddps[0].id;
              }
            }
            // Note: isIndependent stays true - BDP/DDP don't get referral commission anymore
          }
        }
      }
      
      // For independent customers (no valid referral), still need to assign a DDP for tracking
      // but mark as independent so no commission is generated
      if (!ddpId) {
        const allPartners = await storage.getAllPartners();
        const activeDDPs = allPartners.filter(p => p.role === "ddp" && p.status === "active");
        
        if (activeDDPs.length > 0) {
          // Assign to a random active DDP for tracking purposes only
          ddpId = activeDDPs[Math.floor(Math.random() * activeDDPs.length)].id;
        } else {
          const anyDDP = allPartners.find(p => p.role === "ddp");
          if (anyDDP) {
            ddpId = anyDDP.id;
          } else {
            return res.status(400).json({ message: "No partners available. Please try again later." });
          }
        }
      }
      
      // Create the customer - independent customers have source "website_direct" (no commission)
      // Referred customers have source "website_referral" (commission eligible)
      const customer = await storage.createCustomer({
        name,
        phone,
        email: email || null,
        address,
        district,
        state,
        pincode,
        roofType,
        panelType,
        proposedCapacity,
        avgMonthlyBill: monthlyBill || null,
        ddpId,
        status: "pending",
        source: isIndependent ? "website_direct" : "website_referral",
        referrerCustomerId, // For customer partner referrals
      });
      
      res.status(201).json({ 
        message: "Registration successful! Our partner will contact you within 24-48 hours.",
        customerId: customer.id 
      });
    } catch (error) {
      console.error("Public customer registration error:", error);
      res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  // ============ FEEDBACK ROUTES ============
  
  // Submit feedback (public - for anonymous users and landing page)
  app.post("/api/public/feedback", async (req, res) => {
    try {
      const validatedData = insertFeedbackSchema.parse(req.body);
      
      const feedback = await storage.createFeedback({
        ...validatedData,
        userId: null, // Anonymous submission
      });
      
      res.status(201).json(feedback);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Create public feedback error:", error);
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });
  
  // Submit feedback (authenticated users)
  app.post("/api/feedback", requireAuth, async (req, res) => {
    try {
      const validatedData = insertFeedbackSchema.omit({ userId: true }).parse(req.body);
      const user = await storage.getUser(req.session.userId!);
      
      const feedback = await storage.createFeedback({
        userId: req.session.userId!,
        userEmail: user?.email,
        userName: user?.name,
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
  
  // Get notification service configuration status (admin only)
  app.get("/api/admin/notification-config", requireAdmin, async (req, res) => {
    try {
      const config = notificationService.isConfigured();
      res.json({
        whatsapp: config.twilio,
        sms: config.twilio,
        email: config.resend,
        message: !config.twilio && !config.resend 
          ? "No notification services configured. Add TWILIO_* and RESEND_API_KEY secrets to enable."
          : "Notification services active.",
      });
    } catch (error) {
      console.error("Get notification config error:", error);
      res.status(500).json({ message: "Failed to get notification config" });
    }
  });
  
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

  // ===== NEWS & UPDATES ROUTES =====
  
  // Public: Get published news
  app.get("/api/public/news", async (req, res) => {
    try {
      const posts = await storage.getPublishedNewsPosts();
      res.json(posts);
    } catch (error) {
      console.error("Get published news error:", error);
      res.status(500).json({ message: "Failed to get news" });
    }
  });

  // Public: Get single news post by slug
  app.get("/api/public/news/:slug", async (req, res) => {
    try {
      const post = await storage.getNewsPostBySlug(req.params.slug);
      if (!post || post.isPublished !== "true") {
        return res.status(404).json({ message: "News post not found" });
      }
      await storage.incrementNewsViewCount(post.id);
      res.json(post);
    } catch (error) {
      console.error("Get news post error:", error);
      res.status(500).json({ message: "Failed to get news post" });
    }
  });

  // Admin: Get all news posts
  app.get("/api/admin/news", requireAdmin, async (req, res) => {
    try {
      const posts = await storage.getAllNewsPosts();
      res.json(posts);
    } catch (error) {
      console.error("Get all news error:", error);
      res.status(500).json({ message: "Failed to get news" });
    }
  });

  // Admin: Create news post
  app.post("/api/admin/news", requireAdmin, async (req, res) => {
    try {
      const { title, summary, content, category, imageUrl, tags, isPublished } = req.body;
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const publishedValue = isPublished === true || isPublished === "true" ? "true" : "false";
      const post = await storage.createNewsPost({
        title,
        slug: `${slug}-${Date.now()}`,
        summary,
        content,
        category: category || "news",
        imageUrl,
        authorId: req.user?.id,
        isPublished: publishedValue,
        publishedAt: publishedValue === "true" ? new Date() : null,
        tags: tags || [],
      });
      res.status(201).json(post);
    } catch (error) {
      console.error("Create news error:", error);
      res.status(500).json({ message: "Failed to create news post" });
    }
  });

  // Admin: Update news post
  app.patch("/api/admin/news/:id", requireAdmin, async (req, res) => {
    try {
      const data = { ...req.body };
      if (data.isPublished !== undefined) {
        data.isPublished = data.isPublished === true || data.isPublished === "true" ? "true" : "false";
      }
      if (data.isPublished === "true" && !data.publishedAt) {
        data.publishedAt = new Date();
      }
      const post = await storage.updateNewsPost(req.params.id, data);
      if (!post) {
        return res.status(404).json({ message: "News post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Update news error:", error);
      res.status(500).json({ message: "Failed to update news post" });
    }
  });

  // Admin: Delete news post
  app.delete("/api/admin/news/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteNewsPost(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete news error:", error);
      res.status(500).json({ message: "Failed to delete news post" });
    }
  });

  // ===== PANEL COMPARISON ROUTES =====
  
  // Public: Get active panel models for comparison
  app.get("/api/public/panels", async (req, res) => {
    try {
      const models = await storage.getActivePanelModels();
      res.json(models);
    } catch (error) {
      console.error("Get panels error:", error);
      res.status(500).json({ message: "Failed to get panel models" });
    }
  });

  // Admin: Get all panel models
  app.get("/api/admin/panels", requireAdmin, async (req, res) => {
    try {
      const models = await storage.getAllPanelModels();
      res.json(models);
    } catch (error) {
      console.error("Get all panels error:", error);
      res.status(500).json({ message: "Failed to get panel models" });
    }
  });

  // Admin: Create panel model
  app.post("/api/admin/panels", requireAdmin, async (req, res) => {
    try {
      const model = await storage.createPanelModel(req.body);
      res.status(201).json(model);
    } catch (error) {
      console.error("Create panel error:", error);
      res.status(500).json({ message: "Failed to create panel model" });
    }
  });

  // Admin: Update panel model
  app.patch("/api/admin/panels/:id", requireAdmin, async (req, res) => {
    try {
      const model = await storage.updatePanelModel(req.params.id, req.body);
      if (!model) {
        return res.status(404).json({ message: "Panel model not found" });
      }
      res.json(model);
    } catch (error) {
      console.error("Update panel error:", error);
      res.status(500).json({ message: "Failed to update panel model" });
    }
  });

  // Admin: Delete panel model
  app.delete("/api/admin/panels/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deletePanelModel(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete panel error:", error);
      res.status(500).json({ message: "Failed to delete panel model" });
    }
  });

  // ===== LEADERBOARD ROUTES =====
  
  // Public/Partner: Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const { period = "monthly", year, month } = req.query;
      const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
      const currentMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
      
      const entries = await storage.getLeaderboard(
        period as string,
        currentYear,
        period === "monthly" ? currentMonth : undefined
      );
      res.json(entries);
    } catch (error) {
      console.error("Get leaderboard error:", error);
      res.status(500).json({ message: "Failed to get leaderboard" });
    }
  });

  // Admin: Refresh leaderboard
  app.post("/api/admin/leaderboard/refresh", requireAdmin, async (req, res) => {
    try {
      const { period = "monthly" } = req.body;
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      
      await storage.updateLeaderboard(period, year, period === "monthly" ? month : undefined);
      res.json({ success: true, message: "Leaderboard refreshed" });
    } catch (error) {
      console.error("Refresh leaderboard error:", error);
      res.status(500).json({ message: "Failed to refresh leaderboard" });
    }
  });

  // ===== REFERRAL ROUTES =====
  
  // Partner: Get my referrals
  app.get("/api/referrals", requireAuth, async (req, res) => {
    try {
      const referrals = await storage.getReferralsByReferrerId(req.user!.id);
      res.json(referrals);
    } catch (error) {
      console.error("Get referrals error:", error);
      res.status(500).json({ message: "Failed to get referrals" });
    }
  });

  // Partner: Get or generate my referral code
  app.get("/api/referral-code", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (user?.referralCode) {
        return res.json({ code: user.referralCode });
      }
      
      // Generate a new code
      const code = await storage.generateReferralCode(req.user!.id);
      await storage.updateUserReferralCode(req.user!.id, code);
      res.json({ code });
    } catch (error) {
      console.error("Get referral code error:", error);
      res.status(500).json({ message: "Failed to get referral code" });
    }
  });

  // Public: Validate referral code
  app.get("/api/public/validate-referral/:code", async (req, res) => {
    try {
      const user = await storage.getUserByReferralCode(req.params.code);
      if (!user) {
        return res.status(404).json({ valid: false, message: "Invalid referral code" });
      }
      res.json({ valid: true, referrerName: user.name, referrerId: user.id });
    } catch (error) {
      console.error("Validate referral error:", error);
      res.status(500).json({ message: "Failed to validate referral code" });
    }
  });

  // Partner: Create referral tracking
  app.post("/api/referrals", requireAuth, async (req, res) => {
    try {
      const { referredType, referredCustomerId, referredPartnerId } = req.body;
      const user = await storage.getUser(req.user!.id);
      
      if (!user?.referralCode) {
        return res.status(400).json({ message: "You need a referral code first" });
      }
      
      const referral = await storage.createReferral({
        referrerId: req.user!.id,
        referredType,
        referredCustomerId,
        referredPartnerId,
        referralCode: user.referralCode,
        status: "pending",
        rewardAmount: referredType === "customer" ? 1000 : 2000, // Rs 1000 for customer, Rs 2000 for partner
      });
      res.status(201).json(referral);
    } catch (error) {
      console.error("Create referral error:", error);
      res.status(500).json({ message: "Failed to create referral" });
    }
  });

  // ===== MAP VIEW ROUTES =====
  
  // Public: Get installation locations for map (completed only)
  app.get("/api/public/installations-map", async (req, res) => {
    try {
      const installations = await storage.getCustomersWithLocations();
      // Return customer data with media but exclude sensitive fields
      const publicData = installations.map(c => ({
        id: c.id,
        state: c.state,
        district: c.district,
        address: c.address,
        proposedCapacity: c.proposedCapacity,
        panelType: c.panelType,
        latitude: c.latitude,
        longitude: c.longitude,
        installationDate: c.installationDate,
        sitePictures: c.sitePictures,
        siteVideo: c.siteVideo,
        status: c.status,
      }));
      res.json(publicData);
    } catch (error) {
      console.error("Get installations map error:", error);
      res.status(500).json({ message: "Failed to get installation locations" });
    }
  });
  
  // Public: Get all installations for interactive map (including ongoing)
  app.get("/api/public/all-installations-map", async (req, res) => {
    try {
      const installations = await storage.getAllCustomersWithLocations();
      const publicData = installations.map(c => ({
        id: c.id,
        state: c.state,
        district: c.district,
        address: c.address,
        proposedCapacity: c.proposedCapacity,
        panelType: c.panelType,
        latitude: c.latitude,
        longitude: c.longitude,
        installationDate: c.installationDate,
        sitePictures: c.sitePictures,
        siteVideo: c.siteVideo,
        status: c.status,
      }));
      res.json(publicData);
    } catch (error) {
      console.error("Get all installations map error:", error);
      res.status(500).json({ message: "Failed to get installation locations" });
    }
  });
  
  // Public: Get partner network for map visualization
  app.get("/api/public/partner-network-map", async (req, res) => {
    try {
      const partners = await storage.getPartnersForMap();
      // Return only public partner data (no sensitive info)
      const publicData = partners.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        district: p.district,
        state: p.state,
      }));
      res.json(publicData);
    } catch (error) {
      console.error("Get partner network map error:", error);
      res.status(500).json({ message: "Failed to get partner network" });
    }
  });

  // Partner: Get detailed installations for their customers
  app.get("/api/installations-map", requireAuth, async (req, res) => {
    try {
      const customers = await storage.getCustomersWithLocations();
      res.json(customers);
    } catch (error) {
      console.error("Get installations error:", error);
      res.status(500).json({ message: "Failed to get installations" });
    }
  });

  // Admin: Update customer location
  app.patch("/api/admin/customers/:id/location", requireAdmin, async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      const customer = await storage.updateCustomerLocation(req.params.id, latitude, longitude);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Update location error:", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  // ===== NOTIFICATION TEMPLATE ROUTES =====
  
  // Admin: Get all notification templates
  app.get("/api/admin/notification-templates", requireAdmin, async (req, res) => {
    try {
      const templates = await storage.getAllNotificationTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ message: "Failed to get notification templates" });
    }
  });

  // Admin: Create notification template
  app.post("/api/admin/notification-templates", requireAdmin, async (req, res) => {
    try {
      const template = await storage.createNotificationTemplate(req.body);
      res.status(201).json(template);
    } catch (error) {
      console.error("Create template error:", error);
      res.status(500).json({ message: "Failed to create notification template" });
    }
  });

  // Admin: Update notification template
  app.patch("/api/admin/notification-templates/:id", requireAdmin, async (req, res) => {
    try {
      const template = await storage.updateNotificationTemplate(req.params.id, req.body);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Update template error:", error);
      res.status(500).json({ message: "Failed to update notification template" });
    }
  });

  // Admin: Delete notification template
  app.delete("/api/admin/notification-templates/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteNotificationTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete template error:", error);
      res.status(500).json({ message: "Failed to delete notification template" });
    }
  });

  // Admin: Test notification
  app.post("/api/admin/test-notification", requireAdmin, async (req, res) => {
    try {
      const { phone, email, message } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      const results: { sms?: string; whatsapp?: string; email?: string } = {};
      
      if (phone) {
        try {
          await notificationService.sendSMS(phone, message);
          results.sms = "sent";
        } catch (err) {
          results.sms = "failed";
          console.error("Test SMS error:", err);
        }
        
        try {
          await notificationService.sendWhatsAppMessage(phone, message);
          results.whatsapp = "sent";
        } catch (err) {
          results.whatsapp = "failed";
          console.error("Test WhatsApp error:", err);
        }
      }
      
      if (email) {
        try {
          await notificationService.sendEmail(
            email,
            "Test Notification - Divyanshi Solar",
            `<div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Test Notification</h2>
              <p>${message}</p>
              <hr />
              <p style="color: #666; font-size: 12px;">This is a test notification from Divyanshi Solar.</p>
            </div>`
          );
          results.email = "sent";
        } catch (err) {
          results.email = "failed";
          console.error("Test email error:", err);
        }
      }
      
      res.json({ success: true, results });
    } catch (error) {
      console.error("Test notification error:", error);
      res.status(500).json({ message: "Failed to send test notification" });
    }
  });

  // ===== VENDOR REGISTRATION ROUTES =====
  
  // Public: Register as a vendor
  app.post("/api/public/vendors/register", async (req, res) => {
    try {
      // Validate and parse input using schema (strips disallowed fields like status, notes)
      const validatedData = insertVendorSchema.parse(req.body);
      
      // Verify state is one of the allowed states
      const allowedStates = vendorStates.map(s => s.value);
      if (!allowedStates.includes(validatedData.state)) {
        return res.status(400).json({ message: "Invalid state. Only Bihar, Jharkhand, Uttar Pradesh, and Odisha are accepted." });
      }
      
      const vendor = await storage.createVendor(validatedData);
      res.status(201).json({ 
        message: "Registration successful! We will review your application and contact you soon.",
        vendor 
      });
    } catch (error) {
      console.error("Vendor registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to register vendor" });
    }
  });
  
  // Admin: Get all vendors
  app.get("/api/admin/vendors", requireAdmin, async (req, res) => {
    try {
      const allVendors = await storage.getVendors();
      res.json(allVendors);
    } catch (error) {
      console.error("Get vendors error:", error);
      res.status(500).json({ message: "Failed to get vendors" });
    }
  });
  
  // Admin: Update vendor status
  app.patch("/api/admin/vendors/:id/status", requireAdmin, async (req, res) => {
    try {
      const { status, notes } = req.body;
      const vendor = await storage.updateVendorStatus(req.params.id, status, notes);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      console.error("Update vendor status error:", error);
      res.status(500).json({ message: "Failed to update vendor status" });
    }
  });

  // ===== SITE EXPENSE ROUTES =====
  
  // Admin: Get all site expenses
  app.get("/api/admin/site-expenses", requireAdmin, async (req, res) => {
    try {
      const expenses = await storage.getSiteExpenses();
      res.json(expenses);
    } catch (error) {
      console.error("Get site expenses error:", error);
      res.status(500).json({ message: "Failed to get site expenses" });
    }
  });
  
  // Admin: Get site expense by ID
  app.get("/api/admin/site-expenses/:id", requireAdmin, async (req, res) => {
    try {
      const expense = await storage.getSiteExpense(req.params.id);
      if (!expense) {
        return res.status(404).json({ message: "Site expense not found" });
      }
      res.json(expense);
    } catch (error) {
      console.error("Get site expense error:", error);
      res.status(500).json({ message: "Failed to get site expense" });
    }
  });
  
  // Admin: Create site expense (when customer is approved)
  app.post("/api/admin/site-expenses", requireAdmin, async (req, res) => {
    try {
      const { customerId } = req.body;
      
      // Check if expense already exists for this customer
      const existing = await storage.getSiteExpenseByCustomerId(customerId);
      if (existing) {
        return res.status(400).json({ message: "Site expense already exists for this customer", expense: existing });
      }
      
      // Generate unique site ID
      const siteId = await storage.generateSiteId();
      
      const expense = await storage.createSiteExpense({
        customerId,
        siteId,
        status: "pending",
      });
      
      res.status(201).json(expense);
    } catch (error) {
      console.error("Create site expense error:", error);
      res.status(500).json({ message: "Failed to create site expense" });
    }
  });
  
  // Admin: Update site expense
  app.patch("/api/admin/site-expenses/:id", requireAdmin, async (req, res) => {
    try {
      const expense = await storage.updateSiteExpense(req.params.id, req.body);
      if (!expense) {
        return res.status(404).json({ message: "Site expense not found" });
      }
      res.json(expense);
    } catch (error) {
      console.error("Update site expense error:", error);
      res.status(500).json({ message: "Failed to update site expense" });
    }
  });
  
  // Admin: Get site expense by customer ID
  app.get("/api/admin/customers/:customerId/site-expense", requireAdmin, async (req, res) => {
    try {
      const expense = await storage.getSiteExpenseByCustomerId(req.params.customerId);
      res.json(expense || null);
    } catch (error) {
      console.error("Get site expense by customer error:", error);
      res.status(500).json({ message: "Failed to get site expense" });
    }
  });

  // ==================== CUSTOMER FILE SUBMISSION ROUTES (Step 1 of Customer Journey) ====================
  
  // Admin: Get all customer file submissions
  app.get("/api/admin/customer-file-submissions", requireAdmin, async (req, res) => {
    try {
      const submissions = await storage.getCustomerFileSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Get customer file submissions error:", error);
      res.status(500).json({ message: "Failed to get customer file submissions" });
    }
  });
  
  // Admin: Get customer file submission by ID
  app.get("/api/admin/customer-file-submissions/:id", requireAdmin, async (req, res) => {
    try {
      const submission = await storage.getCustomerFileSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Customer file submission not found" });
      }
      res.json(submission);
    } catch (error) {
      console.error("Get customer file submission error:", error);
      res.status(500).json({ message: "Failed to get customer file submission" });
    }
  });
  
  // Admin: Create customer file submission
  app.post("/api/admin/customer-file-submissions", requireAdmin, async (req, res) => {
    try {
      const { customerId, customerName, consumerNo, billHolderName, loanApplied, submissionDate, remarks } = req.body;
      
      // Validate required fields
      if (!customerName || typeof customerName !== "string" || customerName.trim() === "") {
        return res.status(400).json({ message: "Customer name is required" });
      }
      if (!consumerNo || typeof consumerNo !== "string" || consumerNo.trim() === "") {
        return res.status(400).json({ message: "Consumer number is required" });
      }
      if (!billHolderName || typeof billHolderName !== "string" || billHolderName.trim() === "") {
        return res.status(400).json({ message: "Bill holder name is required" });
      }
      if (!submissionDate) {
        return res.status(400).json({ message: "Submission date is required" });
      }
      
      // Validate date
      const parsedDate = new Date(submissionDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Invalid submission date format" });
      }
      
      // If customerId is provided, verify customer exists
      if (customerId) {
        const customer = await storage.getCustomer(customerId);
        if (!customer) {
          return res.status(404).json({ message: "Customer not found" });
        }
      }
      
      // Properly convert loanApplied to boolean (handles string "false", "0", etc.)
      const parseLoanApplied = (value: any): boolean => {
        if (typeof value === "boolean") return value;
        if (typeof value === "string") {
          const lower = value.toLowerCase().trim();
          return lower === "true" || lower === "1" || lower === "yes";
        }
        return Boolean(value);
      };
      
      const submission = await storage.createCustomerFileSubmission({
        customerId: customerId || null,
        customerName: customerName.trim(),
        consumerNo: consumerNo.trim(),
        billHolderName: billHolderName.trim(),
        loanApplied: parseLoanApplied(loanApplied),
        submissionDate: parsedDate,
        remarks: remarks ? String(remarks).trim() : null,
        status: "submitted",
      });
      
      res.status(201).json(submission);
    } catch (error) {
      console.error("Create customer file submission error:", error);
      res.status(500).json({ message: "Failed to create customer file submission" });
    }
  });
  
  // Admin: Update customer file submission
  app.patch("/api/admin/customer-file-submissions/:id", requireAdmin, async (req, res) => {
    try {
      const { customerName, consumerNo, billHolderName, loanApplied, submissionDate, status, remarks } = req.body;
      
      // Valid status values
      const validStatuses = ["submitted", "under_review", "approved", "rejected", "resubmission_required"];
      
      // Build update object with proper type conversions and validation
      const updateData: Record<string, any> = {};
      
      if (customerName !== undefined) {
        if (typeof customerName !== "string" || customerName.trim() === "") {
          return res.status(400).json({ message: "Customer name must be a non-empty string" });
        }
        updateData.customerName = customerName.trim();
      }
      if (consumerNo !== undefined) {
        if (typeof consumerNo !== "string" || consumerNo.trim() === "") {
          return res.status(400).json({ message: "Consumer number must be a non-empty string" });
        }
        updateData.consumerNo = consumerNo.trim();
      }
      if (billHolderName !== undefined) {
        if (typeof billHolderName !== "string" || billHolderName.trim() === "") {
          return res.status(400).json({ message: "Bill holder name must be a non-empty string" });
        }
        updateData.billHolderName = billHolderName.trim();
      }
      if (loanApplied !== undefined) {
        // Properly convert loanApplied to boolean (handles string "false", "0", etc.)
        const parseLoanApplied = (value: any): boolean => {
          if (typeof value === "boolean") return value;
          if (typeof value === "string") {
            const lower = value.toLowerCase().trim();
            return lower === "true" || lower === "1" || lower === "yes";
          }
          return Boolean(value);
        };
        updateData.loanApplied = parseLoanApplied(loanApplied);
      }
      if (submissionDate !== undefined) {
        const parsedDate = new Date(submissionDate);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({ message: "Invalid submission date format" });
        }
        updateData.submissionDate = parsedDate;
      }
      if (status !== undefined) {
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
        }
        updateData.status = status;
      }
      if (remarks !== undefined) {
        updateData.remarks = remarks ? String(remarks).trim() : null;
      }
      
      const submission = await storage.updateCustomerFileSubmission(req.params.id, updateData);
      if (!submission) {
        return res.status(404).json({ message: "Customer file submission not found" });
      }
      res.json(submission);
    } catch (error) {
      console.error("Update customer file submission error:", error);
      res.status(500).json({ message: "Failed to update customer file submission" });
    }
  });
  
  // Admin: Delete customer file submission
  app.delete("/api/admin/customer-file-submissions/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteCustomerFileSubmission(req.params.id);
      res.json({ message: "Customer file submission deleted" });
    } catch (error) {
      console.error("Delete customer file submission error:", error);
      res.status(500).json({ message: "Failed to delete customer file submission" });
    }
  });
  
  // Admin: Get customer file submissions by customer ID
  app.get("/api/admin/customers/:customerId/customer-file-submissions", requireAdmin, async (req, res) => {
    try {
      const submissions = await storage.getCustomerFileSubmissionsByCustomerId(req.params.customerId);
      res.json(submissions);
    } catch (error) {
      console.error("Get customer file submissions by customer error:", error);
      res.status(500).json({ message: "Failed to get customer file submissions" });
    }
  });

  // ==================== BANK LOAN SUBMISSION ROUTES (Step 2 of Customer Journey) ====================
  
  // Admin: Get all bank loan submissions
  app.get("/api/admin/bank-loan-submissions", requireAdmin, async (req, res) => {
    try {
      const submissions = await storage.getBankLoanSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Get bank loan submissions error:", error);
      res.status(500).json({ message: "Failed to get bank loan submissions" });
    }
  });
  
  // Admin: Get bank loan submission by ID
  app.get("/api/admin/bank-loan-submissions/:id", requireAdmin, async (req, res) => {
    try {
      const submission = await storage.getBankLoanSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Bank loan submission not found" });
      }
      res.json(submission);
    } catch (error) {
      console.error("Get bank loan submission error:", error);
      res.status(500).json({ message: "Failed to get bank loan submission" });
    }
  });
  
  // Admin: Create bank loan submission
  app.post("/api/admin/bank-loan-submissions", requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const { customerId, bankName, bankBranch, bankManagerName, bankManagerMobile, submissionDate, loanAmount, remarks } = req.body;
      
      // Validate required fields
      if (!customerId || typeof customerId !== "string") {
        return res.status(400).json({ message: "Customer ID is required" });
      }
      if (!bankName || typeof bankName !== "string" || bankName.trim() === "") {
        return res.status(400).json({ message: "Bank name is required" });
      }
      if (!bankBranch || typeof bankBranch !== "string" || bankBranch.trim() === "") {
        return res.status(400).json({ message: "Bank branch is required" });
      }
      if (!submissionDate) {
        return res.status(400).json({ message: "Submission date is required" });
      }
      
      // Validate date
      const parsedDate = new Date(submissionDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Invalid submission date format" });
      }
      
      // Verify customer exists
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      const submission = await storage.createBankLoanSubmission({
        customerId,
        bankName: bankName.trim(),
        bankBranch: bankBranch.trim(),
        bankManagerName: bankManagerName ? String(bankManagerName).trim() : null,
        bankManagerMobile: bankManagerMobile ? String(bankManagerMobile).trim() : null,
        submissionDate: parsedDate,
        loanAmount: loanAmount ? String(loanAmount) : null,
        remarks: remarks ? String(remarks).trim() : null,
        status: "submitted",
        createdBy: user.id,
      });
      
      res.status(201).json(submission);
    } catch (error) {
      console.error("Create bank loan submission error:", error);
      res.status(500).json({ message: "Failed to create bank loan submission" });
    }
  });
  
  // Admin: Update bank loan submission
  app.patch("/api/admin/bank-loan-submissions/:id", requireAdmin, async (req, res) => {
    try {
      const { bankName, bankBranch, bankManagerName, bankManagerMobile, submissionDate, loanAmount, status, remarks } = req.body;
      
      // Valid status values
      const validStatuses = ["submitted", "processing", "approved", "rejected", "disbursed"];
      
      // Build update object with proper validation
      const updateData: Record<string, any> = {};
      
      if (bankName !== undefined) {
        if (typeof bankName !== "string" || bankName.trim() === "") {
          return res.status(400).json({ message: "Bank name must be a non-empty string" });
        }
        updateData.bankName = bankName.trim();
      }
      if (bankBranch !== undefined) {
        if (typeof bankBranch !== "string" || bankBranch.trim() === "") {
          return res.status(400).json({ message: "Bank branch must be a non-empty string" });
        }
        updateData.bankBranch = bankBranch.trim();
      }
      if (bankManagerName !== undefined) {
        updateData.bankManagerName = bankManagerName ? String(bankManagerName).trim() : null;
      }
      if (bankManagerMobile !== undefined) {
        updateData.bankManagerMobile = bankManagerMobile ? String(bankManagerMobile).trim() : null;
      }
      if (submissionDate !== undefined) {
        const parsedDate = new Date(submissionDate);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({ message: "Invalid submission date format" });
        }
        updateData.submissionDate = parsedDate;
      }
      if (loanAmount !== undefined) {
        updateData.loanAmount = loanAmount ? String(loanAmount) : null;
      }
      if (status !== undefined) {
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
        }
        updateData.status = status;
      }
      if (remarks !== undefined) {
        updateData.remarks = remarks ? String(remarks).trim() : null;
      }
      
      const submission = await storage.updateBankLoanSubmission(req.params.id, updateData);
      if (!submission) {
        return res.status(404).json({ message: "Bank loan submission not found" });
      }
      res.json(submission);
    } catch (error) {
      console.error("Update bank loan submission error:", error);
      res.status(500).json({ message: "Failed to update bank loan submission" });
    }
  });
  
  // Admin: Delete bank loan submission
  app.delete("/api/admin/bank-loan-submissions/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteBankLoanSubmission(req.params.id);
      res.json({ message: "Bank loan submission deleted" });
    } catch (error) {
      console.error("Delete bank loan submission error:", error);
      res.status(500).json({ message: "Failed to delete bank loan submission" });
    }
  });
  
  // Admin: Get bank loan submissions by customer ID
  app.get("/api/admin/customers/:customerId/bank-loan-submissions", requireAdmin, async (req, res) => {
    try {
      const submissions = await storage.getBankLoanSubmissionsByCustomerId(req.params.customerId);
      res.json(submissions);
    } catch (error) {
      console.error("Get customer bank loan submissions error:", error);
      res.status(500).json({ message: "Failed to get bank loan submissions" });
    }
  });

  // ==================== SITE SURVEYS ROUTES (Step 3: Bank Staff & DISCOM) ====================
  
  // Admin: Get all site surveys
  app.get("/api/admin/site-surveys", requireAdmin, async (req, res) => {
    try {
      const surveys = await storage.getSiteSurveys();
      res.json(surveys);
    } catch (error) {
      console.error("Get site surveys error:", error);
      res.status(500).json({ message: "Failed to get site surveys" });
    }
  });
  
  // Admin: Get site survey by ID
  app.get("/api/admin/site-surveys/:id", requireAdmin, async (req, res) => {
    try {
      const survey = await storage.getSiteSurvey(req.params.id);
      if (!survey) {
        return res.status(404).json({ message: "Site survey not found" });
      }
      res.json(survey);
    } catch (error) {
      console.error("Get site survey error:", error);
      res.status(500).json({ message: "Failed to get site survey" });
    }
  });
  
  // Admin: Create site survey
  app.post("/api/admin/site-surveys", requireAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      
      // Validate request body with Zod schema
      const validationResult = insertSiteSurveySchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(e => e.message).join(", ");
        return res.status(400).json({ message: errors });
      }
      
      const data = validationResult.data;
      const surveyNumber = await storage.generateSiteSurveyNumber();
      
      const survey = await storage.createSiteSurvey({
        surveyNumber,
        customerId: data.customerId || null,
        loanSubmissionId: data.loanSubmissionId || null,
        customerName: data.customerName,
        customerPhone: data.customerPhone || null,
        siteAddress: data.siteAddress,
        district: data.district || null,
        state: data.state || null,
        pincode: data.pincode || null,
        scheduledDate: data.scheduledDate,
        surveyTime: data.surveyTime || null,
        bankName: data.bankName || null,
        bankBranch: data.bankBranch || null,
        bankStaffName: data.bankStaffName || null,
        bankStaffDesignation: data.bankStaffDesignation || null,
        bankStaffPhone: data.bankStaffPhone || null,
        discomName: data.discomName || null,
        discomDivision: data.discomDivision || null,
        discomRepName: data.discomRepName || null,
        discomRepDesignation: data.discomRepDesignation || null,
        discomRepPhone: data.discomRepPhone || null,
        status: "scheduled",
        remarks: data.remarks || null,
        createdBy: user.id,
      });
      
      res.status(201).json(survey);
    } catch (error) {
      console.error("Create site survey error:", error);
      res.status(500).json({ message: "Failed to create site survey" });
    }
  });
  
  // Admin: Update site survey
  app.patch("/api/admin/site-surveys/:id", requireAdmin, async (req, res) => {
    try {
      const { 
        customerName, customerPhone, siteAddress, district, state, pincode,
        scheduledDate, actualDate, surveyTime,
        bankName, bankBranch, bankStaffName, bankStaffDesignation, bankStaffPhone,
        bankSurveyCompleted, bankSurveyDate, bankSurveyNotes, bankApprovalStatus,
        discomName, discomDivision, discomRepName, discomRepDesignation, discomRepPhone,
        discomSurveyCompleted, discomSurveyDate, discomSurveyNotes, discomApprovalStatus,
        roofCondition, roofType, roofArea, shadowAnalysis, structuralFeasibility, electricalFeasibility,
        existingMeterType, meterLocation, sanctionedLoad, proposedCapacity, gridConnectionDistance,
        roofPhotos, meterPhotos, sitePhotos,
        status, overallRecommendation, recommendedCapacity, specialConditions, rejectionReason, remarks
      } = req.body;
      
      const updateData: Record<string, any> = {};
      
      if (customerName !== undefined) updateData.customerName = customerName;
      if (customerPhone !== undefined) updateData.customerPhone = customerPhone;
      if (siteAddress !== undefined) updateData.siteAddress = siteAddress;
      if (district !== undefined) updateData.district = district;
      if (state !== undefined) updateData.state = state;
      if (pincode !== undefined) updateData.pincode = pincode;
      if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate;
      if (actualDate !== undefined) updateData.actualDate = actualDate;
      if (surveyTime !== undefined) updateData.surveyTime = surveyTime;
      
      // Bank details
      if (bankName !== undefined) updateData.bankName = bankName;
      if (bankBranch !== undefined) updateData.bankBranch = bankBranch;
      if (bankStaffName !== undefined) updateData.bankStaffName = bankStaffName;
      if (bankStaffDesignation !== undefined) updateData.bankStaffDesignation = bankStaffDesignation;
      if (bankStaffPhone !== undefined) updateData.bankStaffPhone = bankStaffPhone;
      if (bankSurveyCompleted !== undefined) updateData.bankSurveyCompleted = bankSurveyCompleted;
      if (bankSurveyDate !== undefined) updateData.bankSurveyDate = bankSurveyDate;
      if (bankSurveyNotes !== undefined) updateData.bankSurveyNotes = bankSurveyNotes;
      if (bankApprovalStatus !== undefined) updateData.bankApprovalStatus = bankApprovalStatus;
      
      // DISCOM details
      if (discomName !== undefined) updateData.discomName = discomName;
      if (discomDivision !== undefined) updateData.discomDivision = discomDivision;
      if (discomRepName !== undefined) updateData.discomRepName = discomRepName;
      if (discomRepDesignation !== undefined) updateData.discomRepDesignation = discomRepDesignation;
      if (discomRepPhone !== undefined) updateData.discomRepPhone = discomRepPhone;
      if (discomSurveyCompleted !== undefined) updateData.discomSurveyCompleted = discomSurveyCompleted;
      if (discomSurveyDate !== undefined) updateData.discomSurveyDate = discomSurveyDate;
      if (discomSurveyNotes !== undefined) updateData.discomSurveyNotes = discomSurveyNotes;
      if (discomApprovalStatus !== undefined) updateData.discomApprovalStatus = discomApprovalStatus;
      
      // Site assessment
      if (roofCondition !== undefined) updateData.roofCondition = roofCondition;
      if (roofType !== undefined) updateData.roofType = roofType;
      if (roofArea !== undefined) updateData.roofArea = roofArea;
      if (shadowAnalysis !== undefined) updateData.shadowAnalysis = shadowAnalysis;
      if (structuralFeasibility !== undefined) updateData.structuralFeasibility = structuralFeasibility;
      if (electricalFeasibility !== undefined) updateData.electricalFeasibility = electricalFeasibility;
      
      // Meter details
      if (existingMeterType !== undefined) updateData.existingMeterType = existingMeterType;
      if (meterLocation !== undefined) updateData.meterLocation = meterLocation;
      if (sanctionedLoad !== undefined) updateData.sanctionedLoad = sanctionedLoad;
      if (proposedCapacity !== undefined) updateData.proposedCapacity = proposedCapacity;
      if (gridConnectionDistance !== undefined) updateData.gridConnectionDistance = gridConnectionDistance;
      
      // Photos
      if (roofPhotos !== undefined) updateData.roofPhotos = roofPhotos;
      if (meterPhotos !== undefined) updateData.meterPhotos = meterPhotos;
      if (sitePhotos !== undefined) updateData.sitePhotos = sitePhotos;
      
      // Outcome
      if (status !== undefined) updateData.status = status;
      if (overallRecommendation !== undefined) updateData.overallRecommendation = overallRecommendation;
      if (recommendedCapacity !== undefined) updateData.recommendedCapacity = recommendedCapacity;
      if (specialConditions !== undefined) updateData.specialConditions = specialConditions;
      if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;
      if (remarks !== undefined) updateData.remarks = remarks;
      
      const survey = await storage.updateSiteSurvey(req.params.id, updateData);
      if (!survey) {
        return res.status(404).json({ message: "Site survey not found" });
      }
      res.json(survey);
    } catch (error) {
      console.error("Update site survey error:", error);
      res.status(500).json({ message: "Failed to update site survey" });
    }
  });
  
  // Admin: Delete site survey
  app.delete("/api/admin/site-surveys/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteSiteSurvey(req.params.id);
      res.json({ message: "Site survey deleted" });
    } catch (error) {
      console.error("Delete site survey error:", error);
      res.status(500).json({ message: "Failed to delete site survey" });
    }
  });
  
  // Admin: Get site survey by customer ID
  app.get("/api/admin/customers/:customerId/site-surveys", requireAdmin, async (req, res) => {
    try {
      const survey = await storage.getSiteSurveyByCustomerId(req.params.customerId);
      res.json(survey || null);
    } catch (error) {
      console.error("Get customer site survey error:", error);
      res.status(500).json({ message: "Failed to get site survey" });
    }
  });

  // ==================== BANK LOAN APPROVAL ROUTES (Step 4) ====================
  
  // Admin: Get all bank loan approvals
  app.get("/api/admin/bank-loan-approvals", requireAdmin, async (req, res) => {
    try {
      const approvals = await storage.getBankLoanApprovals();
      res.json(approvals);
    } catch (error) {
      console.error("Get bank loan approvals error:", error);
      res.status(500).json({ message: "Failed to get bank loan approvals" });
    }
  });
  
  // Admin: Get bank loan approval by ID
  app.get("/api/admin/bank-loan-approvals/:id", requireAdmin, async (req, res) => {
    try {
      const approval = await storage.getBankLoanApproval(req.params.id);
      if (!approval) {
        return res.status(404).json({ message: "Bank loan approval not found" });
      }
      res.json(approval);
    } catch (error) {
      console.error("Get bank loan approval error:", error);
      res.status(500).json({ message: "Failed to get bank loan approval" });
    }
  });
  
  // Admin: Create bank loan approval
  app.post("/api/admin/bank-loan-approvals", requireAdmin, async (req, res) => {
    try {
      const { customerId, bankLoanSubmissionId, customerName, bankName, bankBranch, approvalDate, approvalTime, approvedAmount, interestRate, loanTenure, remarks } = req.body;
      
      // Validate required fields
      if (!customerName || typeof customerName !== "string" || customerName.trim() === "") {
        return res.status(400).json({ message: "Customer name is required" });
      }
      if (!bankName || typeof bankName !== "string" || bankName.trim() === "") {
        return res.status(400).json({ message: "Bank name is required" });
      }
      if (!approvalDate) {
        return res.status(400).json({ message: "Approval date is required" });
      }
      
      // Validate date
      const parsedDate = new Date(approvalDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Invalid approval date format" });
      }
      
      // If customerId is provided, verify customer exists
      if (customerId) {
        const customer = await storage.getCustomer(customerId);
        if (!customer) {
          return res.status(404).json({ message: "Customer not found" });
        }
      }
      
      const approval = await storage.createBankLoanApproval({
        customerId: customerId || null,
        bankLoanSubmissionId: bankLoanSubmissionId || null,
        customerName: customerName.trim(),
        bankName: bankName.trim(),
        bankBranch: bankBranch ? String(bankBranch).trim() : null,
        approvalDate: parsedDate,
        approvalTime: approvalTime ? String(approvalTime).trim() : null,
        approvedAmount: approvedAmount ? String(approvedAmount) : null,
        interestRate: interestRate ? String(interestRate) : null,
        loanTenure: loanTenure ? Number(loanTenure) : null,
        status: "approved",
        remarks: remarks ? String(remarks).trim() : null,
      });
      
      res.status(201).json(approval);
    } catch (error) {
      console.error("Create bank loan approval error:", error);
      res.status(500).json({ message: "Failed to create bank loan approval" });
    }
  });
  
  // Admin: Update bank loan approval
  app.patch("/api/admin/bank-loan-approvals/:id", requireAdmin, async (req, res) => {
    try {
      const { customerName, bankName, bankBranch, approvalDate, approvalTime, approvedAmount, interestRate, loanTenure, status, remarks } = req.body;
      
      // Valid status values
      const validStatuses = ["pending", "approved", "conditionally_approved", "rejected"];
      
      // Build update object with proper validation
      const updateData: Record<string, any> = {};
      
      if (customerName !== undefined) {
        if (typeof customerName !== "string" || customerName.trim() === "") {
          return res.status(400).json({ message: "Customer name must be a non-empty string" });
        }
        updateData.customerName = customerName.trim();
      }
      if (bankName !== undefined) {
        if (typeof bankName !== "string" || bankName.trim() === "") {
          return res.status(400).json({ message: "Bank name must be a non-empty string" });
        }
        updateData.bankName = bankName.trim();
      }
      if (bankBranch !== undefined) {
        updateData.bankBranch = bankBranch ? String(bankBranch).trim() : null;
      }
      if (approvalDate !== undefined) {
        const parsedDate = new Date(approvalDate);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({ message: "Invalid approval date format" });
        }
        updateData.approvalDate = parsedDate;
      }
      if (approvalTime !== undefined) {
        updateData.approvalTime = approvalTime ? String(approvalTime).trim() : null;
      }
      if (approvedAmount !== undefined) {
        updateData.approvedAmount = approvedAmount ? String(approvedAmount) : null;
      }
      if (interestRate !== undefined) {
        updateData.interestRate = interestRate ? String(interestRate) : null;
      }
      if (loanTenure !== undefined) {
        updateData.loanTenure = loanTenure ? Number(loanTenure) : null;
      }
      if (status !== undefined) {
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
        }
        updateData.status = status;
      }
      if (remarks !== undefined) {
        updateData.remarks = remarks ? String(remarks).trim() : null;
      }
      
      const approval = await storage.updateBankLoanApproval(req.params.id, updateData);
      if (!approval) {
        return res.status(404).json({ message: "Bank loan approval not found" });
      }
      res.json(approval);
    } catch (error) {
      console.error("Update bank loan approval error:", error);
      res.status(500).json({ message: "Failed to update bank loan approval" });
    }
  });
  
  // Admin: Delete bank loan approval
  app.delete("/api/admin/bank-loan-approvals/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteBankLoanApproval(req.params.id);
      res.json({ message: "Bank loan approval deleted" });
    } catch (error) {
      console.error("Delete bank loan approval error:", error);
      res.status(500).json({ message: "Failed to delete bank loan approval" });
    }
  });

  // ==================== LOAN DISBURSEMENT ROUTES (STEP 4) ====================
  
  // Admin: Get all loan disbursements
  app.get("/api/admin/loan-disbursements", requireAdmin, async (req, res) => {
    try {
      const disbursements = await storage.getLoanDisbursements();
      res.json(disbursements);
    } catch (error) {
      console.error("Get loan disbursements error:", error);
      res.status(500).json({ message: "Failed to get loan disbursements" });
    }
  });
  
  // Admin: Get loan disbursement by ID
  app.get("/api/admin/loan-disbursements/:id", requireAdmin, async (req, res) => {
    try {
      const disbursement = await storage.getLoanDisbursement(req.params.id);
      if (!disbursement) {
        return res.status(404).json({ message: "Loan disbursement not found" });
      }
      res.json(disbursement);
    } catch (error) {
      console.error("Get loan disbursement error:", error);
      res.status(500).json({ message: "Failed to get loan disbursement" });
    }
  });
  
  // Admin: Create loan disbursement
  app.post("/api/admin/loan-disbursements", requireAdmin, async (req, res) => {
    try {
      const { customerId, bankLoanApprovalId, customerName, bankName, bankBranch, disbursementDate, disbursementTime, disbursedAmount, transactionReference, divyanshiBankAccount, remarks } = req.body;
      
      // Validate required fields
      if (!customerName || typeof customerName !== "string" || customerName.trim() === "") {
        return res.status(400).json({ message: "Customer name is required" });
      }
      if (!bankName || typeof bankName !== "string" || bankName.trim() === "") {
        return res.status(400).json({ message: "Bank name is required" });
      }
      if (!disbursementDate) {
        return res.status(400).json({ message: "Disbursement date is required" });
      }
      if (!disbursedAmount || isNaN(parseFloat(disbursedAmount))) {
        return res.status(400).json({ message: "Valid disbursed amount is required" });
      }
      
      // Validate date
      const parsedDate = new Date(disbursementDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Invalid disbursement date format" });
      }
      
      // If customerId is provided, verify customer exists
      if (customerId) {
        const customer = await storage.getCustomer(customerId);
        if (!customer) {
          return res.status(404).json({ message: "Customer not found" });
        }
      }
      
      // If bankLoanApprovalId is provided, verify approval exists
      if (bankLoanApprovalId) {
        const approval = await storage.getBankLoanApproval(bankLoanApprovalId);
        if (!approval) {
          return res.status(404).json({ message: "Bank loan approval not found" });
        }
      }
      
      const disbursement = await storage.createLoanDisbursement({
        customerId: customerId || null,
        bankLoanApprovalId: bankLoanApprovalId || null,
        customerName: customerName.trim(),
        bankName: bankName.trim(),
        bankBranch: bankBranch ? String(bankBranch).trim() : null,
        disbursementDate: parsedDate,
        disbursementTime: disbursementTime ? String(disbursementTime).trim() : null,
        disbursedAmount: String(disbursedAmount),
        transactionReference: transactionReference ? String(transactionReference).trim() : null,
        divyanshiBankAccount: divyanshiBankAccount ? String(divyanshiBankAccount).trim() : null,
        status: "received",
        remarks: remarks ? String(remarks).trim() : null,
      });
      
      res.status(201).json(disbursement);
    } catch (error) {
      console.error("Create loan disbursement error:", error);
      res.status(500).json({ message: "Failed to create loan disbursement" });
    }
  });
  
  // Admin: Update loan disbursement
  app.patch("/api/admin/loan-disbursements/:id", requireAdmin, async (req, res) => {
    try {
      const { customerName, bankName, bankBranch, disbursementDate, disbursementTime, disbursedAmount, transactionReference, divyanshiBankAccount, status, remarks } = req.body;
      
      // Valid status values
      const validStatuses = ["pending", "processing", "received", "failed", "partial"];
      
      const updateData: Record<string, any> = {};
      
      if (customerName !== undefined) {
        if (typeof customerName !== "string" || customerName.trim() === "") {
          return res.status(400).json({ message: "Customer name cannot be empty" });
        }
        updateData.customerName = customerName.trim();
      }
      if (bankName !== undefined) {
        if (typeof bankName !== "string" || bankName.trim() === "") {
          return res.status(400).json({ message: "Bank name cannot be empty" });
        }
        updateData.bankName = bankName.trim();
      }
      if (bankBranch !== undefined) {
        updateData.bankBranch = bankBranch ? String(bankBranch).trim() : null;
      }
      if (disbursementDate !== undefined) {
        const parsedDate = new Date(disbursementDate);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({ message: "Invalid disbursement date format" });
        }
        updateData.disbursementDate = parsedDate;
      }
      if (disbursementTime !== undefined) {
        updateData.disbursementTime = disbursementTime ? String(disbursementTime).trim() : null;
      }
      if (disbursedAmount !== undefined) {
        if (isNaN(parseFloat(disbursedAmount))) {
          return res.status(400).json({ message: "Invalid disbursed amount" });
        }
        updateData.disbursedAmount = String(disbursedAmount);
      }
      if (transactionReference !== undefined) {
        updateData.transactionReference = transactionReference ? String(transactionReference).trim() : null;
      }
      if (divyanshiBankAccount !== undefined) {
        updateData.divyanshiBankAccount = divyanshiBankAccount ? String(divyanshiBankAccount).trim() : null;
      }
      if (status !== undefined) {
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
        }
        updateData.status = status;
      }
      if (remarks !== undefined) {
        updateData.remarks = remarks ? String(remarks).trim() : null;
      }
      
      const disbursement = await storage.updateLoanDisbursement(req.params.id, updateData);
      if (!disbursement) {
        return res.status(404).json({ message: "Loan disbursement not found" });
      }
      res.json(disbursement);
    } catch (error) {
      console.error("Update loan disbursement error:", error);
      res.status(500).json({ message: "Failed to update loan disbursement" });
    }
  });
  
  // Admin: Delete loan disbursement
  app.delete("/api/admin/loan-disbursements/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteLoanDisbursement(req.params.id);
      res.json({ message: "Loan disbursement deleted" });
    } catch (error) {
      console.error("Delete loan disbursement error:", error);
      res.status(500).json({ message: "Failed to delete loan disbursement" });
    }
  });

  // ==================== STEP 5: VENDOR PURCHASE ORDERS ====================
  
  // Admin: Get all vendor purchase orders
  app.get("/api/admin/vendor-purchase-orders", requireAdmin, async (req, res) => {
    try {
      const orders = await storage.getVendorPurchaseOrders();
      res.json(orders);
    } catch (error) {
      console.error("Get vendor purchase orders error:", error);
      res.status(500).json({ message: "Failed to get vendor purchase orders" });
    }
  });
  
  // Admin: Get vendor purchase order by ID
  app.get("/api/admin/vendor-purchase-orders/:id", requireAdmin, async (req, res) => {
    try {
      const order = await storage.getVendorPurchaseOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Get vendor purchase order error:", error);
      res.status(500).json({ message: "Failed to get purchase order" });
    }
  });
  
  // Admin: Generate PO Number
  app.get("/api/admin/vendor-purchase-orders/generate-po-number", requireAdmin, async (req, res) => {
    try {
      const poNumber = await storage.generatePoNumber();
      res.json({ poNumber });
    } catch (error) {
      console.error("Generate PO number error:", error);
      res.status(500).json({ message: "Failed to generate PO number" });
    }
  });
  
  // Admin: Create vendor purchase order
  app.post("/api/admin/vendor-purchase-orders", requireAdmin, async (req, res) => {
    try {
      const { 
        customerId, vendorId, loanDisbursementId,
        poNumber, customerName, vendorName, orderDate, expectedDeliveryDate,
        panelType, panelCapacity, inverterType, quantity,
        orderAmount, gstAmount, totalAmount,
        advanceAmount, advanceDate, advanceReference,
        balanceAmount, balancePaidDate, balanceReference,
        paymentStatus, orderStatus, deliveryDate, deliveryNotes, remarks 
      } = req.body;
      
      // Validate required fields
      if (!poNumber || typeof poNumber !== "string" || poNumber.trim() === "") {
        return res.status(400).json({ message: "PO Number is required" });
      }
      if (!customerName || typeof customerName !== "string" || customerName.trim() === "") {
        return res.status(400).json({ message: "Customer name is required" });
      }
      if (!vendorName || typeof vendorName !== "string" || vendorName.trim() === "") {
        return res.status(400).json({ message: "Vendor name is required" });
      }
      if (!orderDate) {
        return res.status(400).json({ message: "Order date is required" });
      }
      if (!orderAmount || isNaN(parseFloat(orderAmount))) {
        return res.status(400).json({ message: "Valid order amount is required" });
      }
      if (!totalAmount || isNaN(parseFloat(totalAmount))) {
        return res.status(400).json({ message: "Valid total amount is required" });
      }
      
      // Validate date
      const parsedOrderDate = new Date(orderDate);
      if (isNaN(parsedOrderDate.getTime())) {
        return res.status(400).json({ message: "Invalid order date format" });
      }
      
      // Validate customer if provided
      if (customerId) {
        const customer = await storage.getCustomer(customerId);
        if (!customer) {
          return res.status(404).json({ message: "Customer not found" });
        }
      }
      
      // Validate vendor if provided
      if (vendorId) {
        const vendor = await storage.getVendor(vendorId);
        if (!vendor) {
          return res.status(404).json({ message: "Vendor not found" });
        }
      }
      
      const order = await storage.createVendorPurchaseOrder({
        customerId: customerId || null,
        vendorId: vendorId || null,
        loanDisbursementId: loanDisbursementId || null,
        poNumber: poNumber.trim(),
        customerName: customerName.trim(),
        vendorName: vendorName.trim(),
        orderDate: parsedOrderDate,
        expectedDeliveryDate: expectedDeliveryDate || null,
        panelType: panelType || null,
        panelCapacity: panelCapacity || null,
        inverterType: inverterType || null,
        quantity: quantity ? parseInt(quantity) : 1,
        orderAmount: String(orderAmount),
        gstAmount: gstAmount ? String(gstAmount) : null,
        totalAmount: String(totalAmount),
        advanceAmount: advanceAmount ? String(advanceAmount) : null,
        advanceDate: advanceDate || null,
        advanceReference: advanceReference || null,
        balanceAmount: balanceAmount ? String(balanceAmount) : null,
        balancePaidDate: balancePaidDate || null,
        balanceReference: balanceReference || null,
        paymentStatus: paymentStatus || "pending",
        orderStatus: orderStatus || "draft",
        deliveryDate: deliveryDate || null,
        deliveryNotes: deliveryNotes || null,
        remarks: remarks || null,
      });
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Create vendor purchase order error:", error);
      res.status(500).json({ message: "Failed to create purchase order" });
    }
  });
  
  // Admin: Update vendor purchase order
  app.patch("/api/admin/vendor-purchase-orders/:id", requireAdmin, async (req, res) => {
    try {
      const validOrderStatuses = ["draft", "sent", "acknowledged", "in_progress", "delivered", "completed", "cancelled"];
      const validPaymentStatuses = ["pending", "partial", "paid", "refunded"];
      
      const updateData: Record<string, any> = {};
      
      const stringFields = ["poNumber", "customerName", "vendorName", "panelType", "panelCapacity", "inverterType", "advanceReference", "balanceReference", "deliveryNotes", "remarks"];
      const dateFields = ["orderDate", "expectedDeliveryDate", "advanceDate", "balancePaidDate", "deliveryDate"];
      const amountFields = ["orderAmount", "gstAmount", "totalAmount", "advanceAmount", "balanceAmount"];
      
      for (const field of stringFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field] ? String(req.body[field]).trim() : null;
        }
      }
      
      for (const field of dateFields) {
        if (req.body[field] !== undefined) {
          if (req.body[field]) {
            const parsedDate = new Date(req.body[field]);
            if (isNaN(parsedDate.getTime())) {
              return res.status(400).json({ message: `Invalid ${field} format` });
            }
            updateData[field] = parsedDate;
          } else {
            updateData[field] = null;
          }
        }
      }
      
      for (const field of amountFields) {
        if (req.body[field] !== undefined) {
          if (req.body[field] && !isNaN(parseFloat(req.body[field]))) {
            updateData[field] = String(req.body[field]);
          } else if (!req.body[field]) {
            updateData[field] = null;
          }
        }
      }
      
      if (req.body.quantity !== undefined) {
        updateData.quantity = req.body.quantity ? parseInt(req.body.quantity) : 1;
      }
      
      if (req.body.orderStatus !== undefined) {
        if (!validOrderStatuses.includes(req.body.orderStatus)) {
          return res.status(400).json({ message: `Invalid order status. Must be one of: ${validOrderStatuses.join(", ")}` });
        }
        updateData.orderStatus = req.body.orderStatus;
      }
      
      if (req.body.paymentStatus !== undefined) {
        if (!validPaymentStatuses.includes(req.body.paymentStatus)) {
          return res.status(400).json({ message: `Invalid payment status. Must be one of: ${validPaymentStatuses.join(", ")}` });
        }
        updateData.paymentStatus = req.body.paymentStatus;
      }
      
      const order = await storage.updateVendorPurchaseOrder(req.params.id, updateData);
      if (!order) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Update vendor purchase order error:", error);
      res.status(500).json({ message: "Failed to update purchase order" });
    }
  });
  
  // Admin: Delete vendor purchase order
  app.delete("/api/admin/vendor-purchase-orders/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteVendorPurchaseOrder(req.params.id);
      res.json({ message: "Purchase order deleted" });
    } catch (error) {
      console.error("Delete vendor purchase order error:", error);
      res.status(500).json({ message: "Failed to delete purchase order" });
    }
  });

  // ==================== STEP 6: GOODS DELIVERY ====================
  
  // Admin: Get all goods deliveries
  app.get("/api/admin/goods-deliveries", requireAdmin, async (req, res) => {
    try {
      const deliveries = await storage.getGoodsDeliveries();
      res.json(deliveries);
    } catch (error) {
      console.error("Get goods deliveries error:", error);
      res.status(500).json({ message: "Failed to get goods deliveries" });
    }
  });
  
  // Admin: Get goods delivery by ID
  app.get("/api/admin/goods-deliveries/:id", requireAdmin, async (req, res) => {
    try {
      const delivery = await storage.getGoodsDelivery(req.params.id);
      if (!delivery) {
        return res.status(404).json({ message: "Goods delivery not found" });
      }
      res.json(delivery);
    } catch (error) {
      console.error("Get goods delivery error:", error);
      res.status(500).json({ message: "Failed to get goods delivery" });
    }
  });
  
  // Admin: Create goods delivery
  app.post("/api/admin/goods-deliveries", requireAdmin, async (req, res) => {
    try {
      const { 
        customerId, purchaseOrderId, vendorId,
        customerName, customerPhone, deliveryAddress, district, state, pincode,
        scheduledDate, scheduledTimeSlot, actualDeliveryDate,
        status, deliveredBy, vehicleNumber, vehicleType,
        panelType, panelCapacity, inverterType, quantityOrdered, quantityDelivered,
        receiverName, receiverPhone, receiverSignature, deliveryPhotos,
        siteVerificationBefore, siteVerificationAfter, verificationNotes,
        poNumber, vendorName, remarks, failureReason, rescheduleReason
      } = req.body;
      
      // Validate required fields
      if (!customerName || typeof customerName !== "string" || customerName.trim() === "") {
        return res.status(400).json({ message: "Customer name is required" });
      }
      if (!deliveryAddress || typeof deliveryAddress !== "string" || deliveryAddress.trim() === "") {
        return res.status(400).json({ message: "Delivery address is required" });
      }
      if (!scheduledDate) {
        return res.status(400).json({ message: "Scheduled date is required" });
      }
      
      // Validate scheduled date
      const parsedScheduledDate = new Date(scheduledDate);
      if (isNaN(parsedScheduledDate.getTime())) {
        return res.status(400).json({ message: "Invalid scheduled date format" });
      }
      
      // Validate status if provided
      const validStatuses = ["scheduled", "in_transit", "delivered", "partially_delivered", "failed", "rescheduled"];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
      }
      
      // Validate customer if provided
      if (customerId) {
        const customer = await storage.getCustomer(customerId);
        if (!customer) {
          return res.status(404).json({ message: "Customer not found" });
        }
      }
      
      // Validate purchase order if provided
      if (purchaseOrderId) {
        const purchaseOrder = await storage.getVendorPurchaseOrder(purchaseOrderId);
        if (!purchaseOrder) {
          return res.status(404).json({ message: "Purchase order not found" });
        }
      }
      
      const delivery = await storage.createGoodsDelivery({
        customerId: customerId || null,
        purchaseOrderId: purchaseOrderId || null,
        vendorId: vendorId || null,
        customerName: customerName.trim(),
        customerPhone: customerPhone || null,
        deliveryAddress: deliveryAddress.trim(),
        district: district || null,
        state: state || null,
        pincode: pincode || null,
        scheduledDate: parsedScheduledDate,
        scheduledTimeSlot: scheduledTimeSlot || null,
        actualDeliveryDate: actualDeliveryDate ? new Date(actualDeliveryDate) : null,
        status: status || "scheduled",
        deliveredBy: deliveredBy || null,
        vehicleNumber: vehicleNumber || null,
        vehicleType: vehicleType || null,
        panelType: panelType || null,
        panelCapacity: panelCapacity || null,
        inverterType: inverterType || null,
        quantityOrdered: quantityOrdered ? parseInt(quantityOrdered) : 1,
        quantityDelivered: quantityDelivered ? parseInt(quantityDelivered) : null,
        receiverName: receiverName || null,
        receiverPhone: receiverPhone || null,
        receiverSignature: receiverSignature || null,
        deliveryPhotos: deliveryPhotos || null,
        siteVerificationBefore: siteVerificationBefore || null,
        siteVerificationAfter: siteVerificationAfter || null,
        verificationNotes: verificationNotes || null,
        poNumber: poNumber || null,
        vendorName: vendorName || null,
        remarks: remarks || null,
        failureReason: failureReason || null,
        rescheduleReason: rescheduleReason || null,
      });
      
      res.status(201).json(delivery);
    } catch (error) {
      console.error("Create goods delivery error:", error);
      res.status(500).json({ message: "Failed to create goods delivery" });
    }
  });
  
  // Admin: Update goods delivery
  app.patch("/api/admin/goods-deliveries/:id", requireAdmin, async (req, res) => {
    try {
      const validStatuses = ["scheduled", "in_transit", "delivered", "partially_delivered", "failed", "rescheduled"];
      
      const updateData: Record<string, any> = {};
      
      const stringFields = ["customerName", "customerPhone", "deliveryAddress", "district", "state", "pincode", 
        "scheduledTimeSlot", "deliveredBy", "vehicleNumber", "vehicleType", "panelType", "panelCapacity", 
        "inverterType", "receiverName", "receiverPhone", "receiverSignature", "verificationNotes", 
        "poNumber", "vendorName", "remarks", "failureReason", "rescheduleReason"];
      const dateFields = ["scheduledDate", "actualDeliveryDate"];
      const arrayFields = ["deliveryPhotos", "siteVerificationBefore", "siteVerificationAfter"];
      const intFields = ["quantityOrdered", "quantityDelivered"];
      
      for (const field of stringFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field] ? String(req.body[field]).trim() : null;
        }
      }
      
      for (const field of dateFields) {
        if (req.body[field] !== undefined) {
          if (req.body[field]) {
            const parsedDate = new Date(req.body[field]);
            if (isNaN(parsedDate.getTime())) {
              return res.status(400).json({ message: `Invalid ${field} format` });
            }
            updateData[field] = parsedDate;
          } else {
            updateData[field] = null;
          }
        }
      }
      
      for (const field of arrayFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field] || null;
        }
      }
      
      for (const field of intFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field] ? parseInt(req.body[field]) : null;
        }
      }
      
      if (req.body.status !== undefined) {
        if (!validStatuses.includes(req.body.status)) {
          return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
        }
        updateData.status = req.body.status;
      }
      
      const delivery = await storage.updateGoodsDelivery(req.params.id, updateData);
      if (!delivery) {
        return res.status(404).json({ message: "Goods delivery not found" });
      }
      res.json(delivery);
    } catch (error) {
      console.error("Update goods delivery error:", error);
      res.status(500).json({ message: "Failed to update goods delivery" });
    }
  });
  
  // Admin: Delete goods delivery
  app.delete("/api/admin/goods-deliveries/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteGoodsDelivery(req.params.id);
      res.json({ message: "Goods delivery deleted" });
    } catch (error) {
      console.error("Delete goods delivery error:", error);
      res.status(500).json({ message: "Failed to delete goods delivery" });
    }
  });

  // ==================== STEP 7: SITE EXECUTION ORDERS ====================
  
  // Admin: Get all site execution orders
  app.get("/api/admin/site-execution-orders", requireAdmin, async (req, res) => {
    try {
      const orders = await storage.getSiteExecutionOrders();
      res.json(orders);
    } catch (error) {
      console.error("Get site execution orders error:", error);
      res.status(500).json({ message: "Failed to get site execution orders" });
    }
  });
  
  // Admin: Get site execution order by ID
  app.get("/api/admin/site-execution-orders/:id", requireAdmin, async (req, res) => {
    try {
      const order = await storage.getSiteExecutionOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Site execution order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Get site execution order error:", error);
      res.status(500).json({ message: "Failed to get site execution order" });
    }
  });
  
  // Admin: Create site execution order
  app.post("/api/admin/site-execution-orders", requireAdmin, async (req, res) => {
    try {
      const { 
        customerId, vendorId, purchaseOrderId, deliveryId,
        customerName, customerPhone, siteAddress, district, state, pincode,
        vendorName, vendorContactPerson, vendorPhone,
        scheduledStartDate, scheduledEndDate, actualStartDate, actualEndDate, estimatedDuration,
        crewLeadName, crewLeadPhone, crewSize, crewMembers,
        scopeOfWork, workDescription, panelType, panelCapacity, inverterType, numberOfPanels,
        requiredMaterials, requiredTools, specialInstructions,
        safetyChecklistCompleted, safetyNotes, permitsRequired, permitsObtained,
        status, progressPercentage, progressNotes,
        qualityCheckCompleted, qualityCheckNotes, qualityCheckDate, qualityCheckedBy,
        completionCertificate, completionPhotos, customerSignoff, customerSignoffDate,
        customerFeedback, customerRating, holdReason, cancelReason, remarks
      } = req.body;
      
      // Validate required fields
      if (!customerName || typeof customerName !== "string" || customerName.trim() === "") {
        return res.status(400).json({ message: "Customer name is required" });
      }
      if (!siteAddress || typeof siteAddress !== "string" || siteAddress.trim() === "") {
        return res.status(400).json({ message: "Site address is required" });
      }
      if (!scheduledStartDate) {
        return res.status(400).json({ message: "Scheduled start date is required" });
      }
      
      // Validate scheduled start date
      const parsedStartDate = new Date(scheduledStartDate);
      if (isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({ message: "Invalid scheduled start date format" });
      }
      
      // Validate status if provided
      const validStatuses = ["draft", "assigned", "in_progress", "completed", "on_hold", "cancelled"];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
      }
      
      // Validate customer if provided
      if (customerId) {
        const customer = await storage.getCustomer(customerId);
        if (!customer) {
          return res.status(404).json({ message: "Customer not found" });
        }
      }
      
      // Validate vendor if provided
      if (vendorId) {
        const vendor = await storage.getVendor(vendorId);
        if (!vendor) {
          return res.status(404).json({ message: "Vendor not found" });
        }
      }
      
      // Generate order number
      const orderNumber = await storage.generateExecutionOrderNumber();
      
      const order = await storage.createSiteExecutionOrder({
        orderNumber,
        customerId: customerId || null,
        vendorId: vendorId || null,
        purchaseOrderId: purchaseOrderId || null,
        deliveryId: deliveryId || null,
        customerName: customerName.trim(),
        customerPhone: customerPhone || null,
        siteAddress: siteAddress.trim(),
        district: district || null,
        state: state || null,
        pincode: pincode || null,
        vendorName: vendorName || null,
        vendorContactPerson: vendorContactPerson || null,
        vendorPhone: vendorPhone || null,
        scheduledStartDate: parsedStartDate,
        scheduledEndDate: scheduledEndDate ? new Date(scheduledEndDate) : null,
        actualStartDate: actualStartDate ? new Date(actualStartDate) : null,
        actualEndDate: actualEndDate ? new Date(actualEndDate) : null,
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null,
        crewLeadName: crewLeadName || null,
        crewLeadPhone: crewLeadPhone || null,
        crewSize: crewSize ? parseInt(crewSize) : null,
        crewMembers: crewMembers || null,
        scopeOfWork: scopeOfWork || null,
        workDescription: workDescription || null,
        panelType: panelType || null,
        panelCapacity: panelCapacity || null,
        inverterType: inverterType || null,
        numberOfPanels: numberOfPanels ? parseInt(numberOfPanels) : null,
        requiredMaterials: requiredMaterials || null,
        requiredTools: requiredTools || null,
        specialInstructions: specialInstructions || null,
        safetyChecklistCompleted: safetyChecklistCompleted || false,
        safetyNotes: safetyNotes || null,
        permitsRequired: permitsRequired || null,
        permitsObtained: permitsObtained || false,
        status: status || "draft",
        progressPercentage: progressPercentage ? parseInt(progressPercentage) : 0,
        progressNotes: progressNotes || null,
        qualityCheckCompleted: qualityCheckCompleted || false,
        qualityCheckNotes: qualityCheckNotes || null,
        qualityCheckDate: qualityCheckDate ? new Date(qualityCheckDate) : null,
        qualityCheckedBy: qualityCheckedBy || null,
        completionCertificate: completionCertificate || null,
        completionPhotos: completionPhotos || null,
        customerSignoff: customerSignoff || null,
        customerSignoffDate: customerSignoffDate ? new Date(customerSignoffDate) : null,
        customerFeedback: customerFeedback || null,
        customerRating: customerRating ? parseInt(customerRating) : null,
        holdReason: holdReason || null,
        cancelReason: cancelReason || null,
        remarks: remarks || null,
        createdBy: (req as any).user?.id || null,
      });
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Create site execution order error:", error);
      res.status(500).json({ message: "Failed to create site execution order" });
    }
  });
  
  // Admin: Update site execution order
  app.patch("/api/admin/site-execution-orders/:id", requireAdmin, async (req, res) => {
    try {
      const validStatuses = ["draft", "assigned", "in_progress", "completed", "on_hold", "cancelled"];
      
      // Status transition matrix: defines which transitions are allowed
      const statusTransitions: Record<string, string[]> = {
        "draft": ["assigned", "cancelled"],
        "assigned": ["in_progress", "on_hold", "cancelled"],
        "in_progress": ["completed", "on_hold", "cancelled"],
        "on_hold": ["assigned", "in_progress", "cancelled"],
        "completed": [], // Terminal state - no transitions allowed
        "cancelled": [], // Terminal state - no transitions allowed
      };
      
      // Get the existing order first
      const existingOrder = await storage.getSiteExecutionOrder(req.params.id);
      if (!existingOrder) {
        return res.status(404).json({ message: "Site execution order not found" });
      }
      
      const updateData: Record<string, any> = {};
      
      const stringFields = ["customerName", "customerPhone", "siteAddress", "district", "state", "pincode",
        "vendorName", "vendorContactPerson", "vendorPhone", "crewLeadName", "crewLeadPhone",
        "scopeOfWork", "workDescription", "panelType", "panelCapacity", "inverterType",
        "specialInstructions", "safetyNotes", "progressNotes", "qualityCheckNotes", "qualityCheckedBy",
        "completionCertificate", "customerSignoff", "customerFeedback", "holdReason", "cancelReason", "remarks"];
      const dateFields = ["scheduledStartDate", "scheduledEndDate", "actualStartDate", "actualEndDate", 
        "qualityCheckDate", "customerSignoffDate"];
      const arrayFields = ["crewMembers", "requiredMaterials", "requiredTools", "permitsRequired", "completionPhotos"];
      const intFields = ["estimatedDuration", "crewSize", "numberOfPanels", "progressPercentage", "customerRating"];
      const boolFields = ["safetyChecklistCompleted", "permitsObtained", "qualityCheckCompleted"];
      
      for (const field of stringFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field] ? String(req.body[field]).trim() : null;
        }
      }
      
      for (const field of dateFields) {
        if (req.body[field] !== undefined) {
          if (req.body[field]) {
            const parsedDate = new Date(req.body[field]);
            if (isNaN(parsedDate.getTime())) {
              return res.status(400).json({ message: `Invalid ${field} format` });
            }
            updateData[field] = parsedDate;
          } else {
            updateData[field] = null;
          }
        }
      }
      
      for (const field of arrayFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field] || null;
        }
      }
      
      for (const field of intFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field] !== null && req.body[field] !== "" ? parseInt(req.body[field]) : null;
        }
      }
      
      for (const field of boolFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = Boolean(req.body[field]);
        }
      }
      
      // Validate status transition if status is being changed
      if (req.body.status !== undefined) {
        if (!validStatuses.includes(req.body.status)) {
          return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
        }
        
        const currentStatus = existingOrder.status || "draft";
        const newStatus = req.body.status;
        
        // Allow staying in the same status (no-op)
        if (currentStatus !== newStatus) {
          const allowedTransitions = statusTransitions[currentStatus] || [];
          if (!allowedTransitions.includes(newStatus)) {
            return res.status(400).json({ 
              message: `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${allowedTransitions.length > 0 ? allowedTransitions.join(", ") : "none (terminal state)"}` 
            });
          }
        }
        
        updateData.status = req.body.status;
      }
      
      const order = await storage.updateSiteExecutionOrder(req.params.id, updateData);
      if (!order) {
        return res.status(404).json({ message: "Site execution order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Update site execution order error:", error);
      res.status(500).json({ message: "Failed to update site execution order" });
    }
  });
  
  // Admin: Delete site execution order
  app.delete("/api/admin/site-execution-orders/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteSiteExecutionOrder(req.params.id);
      res.json({ message: "Site execution order deleted" });
    } catch (error) {
      console.error("Delete site execution order error:", error);
      res.status(500).json({ message: "Failed to delete site execution order" });
    }
  });

  // ==================== STEP 8: SITE EXECUTION COMPLETION REPORTS ====================
  
  // Admin: Get all completion reports
  app.get("/api/admin/completion-reports", requireAdmin, async (req, res) => {
    try {
      const reports = await storage.getCompletionReports();
      res.json(reports);
    } catch (error) {
      console.error("Get completion reports error:", error);
      res.status(500).json({ message: "Failed to fetch completion reports" });
    }
  });
  
  // Admin: Get single completion report
  app.get("/api/admin/completion-reports/:id", requireAdmin, async (req, res) => {
    try {
      const report = await storage.getCompletionReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Completion report not found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Get completion report error:", error);
      res.status(500).json({ message: "Failed to fetch completion report" });
    }
  });
  
  // Admin: Get completion report by execution order ID
  app.get("/api/admin/completion-reports/by-order/:orderId", requireAdmin, async (req, res) => {
    try {
      const report = await storage.getCompletionReportByOrderId(req.params.orderId);
      res.json(report || null);
    } catch (error) {
      console.error("Get completion report by order error:", error);
      res.status(500).json({ message: "Failed to fetch completion report" });
    }
  });
  
  // Admin: Create completion report (with file uploads)
  app.post("/api/admin/completion-reports", requireAdmin, upload.fields([
    { name: 'beforePhotos', maxCount: 5 },
    { name: 'duringPhotos', maxCount: 5 },
    { name: 'afterPhotos', maxCount: 5 },
    { name: 'panelPhotos', maxCount: 5 },
    { name: 'inverterPhotos', maxCount: 5 },
    { name: 'wiringPhotos', maxCount: 5 },
    { name: 'meterPhotos', maxCount: 5 },
  ]), async (req, res) => {
    try {
      const reportNumber = await storage.generateCompletionReportNumber();
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      const reportData = {
        ...req.body,
        reportNumber,
        createdBy: req.user?.id,
        beforePhotos: files?.beforePhotos?.map(f => `/uploads/${f.filename}`) || [],
        duringPhotos: files?.duringPhotos?.map(f => `/uploads/${f.filename}`) || [],
        afterPhotos: files?.afterPhotos?.map(f => `/uploads/${f.filename}`) || [],
        panelPhotos: files?.panelPhotos?.map(f => `/uploads/${f.filename}`) || [],
        inverterPhotos: files?.inverterPhotos?.map(f => `/uploads/${f.filename}`) || [],
        wiringPhotos: files?.wiringPhotos?.map(f => `/uploads/${f.filename}`) || [],
        meterPhotos: files?.meterPhotos?.map(f => `/uploads/${f.filename}`) || [],
        panelsInstalled: req.body.panelsInstalled ? parseInt(req.body.panelsInstalled) : null,
        totalWorkHours: req.body.totalWorkHours ? parseInt(req.body.totalWorkHours) : null,
        crewSize: req.body.crewSize ? parseInt(req.body.crewSize) : null,
        customerRating: req.body.customerRating ? parseInt(req.body.customerRating) : null,
        wiringCompleted: req.body.wiringCompleted === 'true' || req.body.wiringCompleted === true,
        earthingCompleted: req.body.earthingCompleted === 'true' || req.body.earthingCompleted === true,
        meterConnected: req.body.meterConnected === 'true' || req.body.meterConnected === true,
        gridSyncCompleted: req.body.gridSyncCompleted === 'true' || req.body.gridSyncCompleted === true,
        generationTestPassed: req.body.generationTestPassed === 'true' || req.body.generationTestPassed === true,
        qualityChecklistCompleted: req.body.qualityChecklistCompleted === 'true' || req.body.qualityChecklistCompleted === true,
        safetyChecklistCompleted: req.body.safetyChecklistCompleted === 'true' || req.body.safetyChecklistCompleted === true,
        cleanupCompleted: req.body.cleanupCompleted === 'true' || req.body.cleanupCompleted === true,
        customerBriefingDone: req.body.customerBriefingDone === 'true' || req.body.customerBriefingDone === true,
      };
      
      const report = await storage.createCompletionReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      console.error("Create completion report error:", error);
      res.status(500).json({ message: "Failed to create completion report" });
    }
  });
  
  // Admin: Update completion report (with file uploads)
  app.patch("/api/admin/completion-reports/:id", requireAdmin, upload.fields([
    { name: 'beforePhotos', maxCount: 5 },
    { name: 'duringPhotos', maxCount: 5 },
    { name: 'afterPhotos', maxCount: 5 },
    { name: 'panelPhotos', maxCount: 5 },
    { name: 'inverterPhotos', maxCount: 5 },
    { name: 'wiringPhotos', maxCount: 5 },
    { name: 'meterPhotos', maxCount: 5 },
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const existingReport = await storage.getCompletionReport(req.params.id);
      
      if (!existingReport) {
        return res.status(404).json({ message: "Completion report not found" });
      }
      
      // Status transition validation
      const validTransitions: Record<string, string[]> = {
        draft: ['submitted'],
        submitted: ['under_review', 'rejected'],
        under_review: ['approved', 'rejected'],
        rejected: ['draft', 'submitted'],
        approved: [], // Terminal state
      };
      
      if (req.body.status && req.body.status !== existingReport.status) {
        const allowed = validTransitions[existingReport.status || 'draft'] || [];
        if (!allowed.includes(req.body.status)) {
          return res.status(400).json({ 
            message: `Invalid status transition from '${existingReport.status}' to '${req.body.status}'` 
          });
        }
      }
      
      const updateData: any = { ...req.body };
      
      // Handle new file uploads
      if (files?.beforePhotos?.length) {
        updateData.beforePhotos = [...(existingReport.beforePhotos || []), ...files.beforePhotos.map(f => `/uploads/${f.filename}`)];
      }
      if (files?.duringPhotos?.length) {
        updateData.duringPhotos = [...(existingReport.duringPhotos || []), ...files.duringPhotos.map(f => `/uploads/${f.filename}`)];
      }
      if (files?.afterPhotos?.length) {
        updateData.afterPhotos = [...(existingReport.afterPhotos || []), ...files.afterPhotos.map(f => `/uploads/${f.filename}`)];
      }
      if (files?.panelPhotos?.length) {
        updateData.panelPhotos = [...(existingReport.panelPhotos || []), ...files.panelPhotos.map(f => `/uploads/${f.filename}`)];
      }
      if (files?.inverterPhotos?.length) {
        updateData.inverterPhotos = [...(existingReport.inverterPhotos || []), ...files.inverterPhotos.map(f => `/uploads/${f.filename}`)];
      }
      if (files?.wiringPhotos?.length) {
        updateData.wiringPhotos = [...(existingReport.wiringPhotos || []), ...files.wiringPhotos.map(f => `/uploads/${f.filename}`)];
      }
      if (files?.meterPhotos?.length) {
        updateData.meterPhotos = [...(existingReport.meterPhotos || []), ...files.meterPhotos.map(f => `/uploads/${f.filename}`)];
      }
      
      // Handle integer fields
      if (updateData.panelsInstalled) updateData.panelsInstalled = parseInt(updateData.panelsInstalled);
      if (updateData.totalWorkHours) updateData.totalWorkHours = parseInt(updateData.totalWorkHours);
      if (updateData.crewSize) updateData.crewSize = parseInt(updateData.crewSize);
      if (updateData.customerRating) updateData.customerRating = parseInt(updateData.customerRating);
      
      // Handle boolean fields
      ['wiringCompleted', 'earthingCompleted', 'meterConnected', 'gridSyncCompleted', 
       'generationTestPassed', 'qualityChecklistCompleted', 'safetyChecklistCompleted', 
       'cleanupCompleted', 'customerBriefingDone'].forEach(field => {
        if (field in updateData) {
          updateData[field] = updateData[field] === 'true' || updateData[field] === true;
        }
      });
      
      // Set review timestamp if status is approved/rejected
      if (req.body.status === 'approved' || req.body.status === 'rejected') {
        updateData.reviewedAt = new Date().toISOString();
        updateData.reviewedBy = req.user?.id;
      }
      
      // Set submit timestamp if status changes to submitted
      if (req.body.status === 'submitted' && existingReport.status !== 'submitted') {
        updateData.submittedAt = new Date().toISOString();
      }
      
      const report = await storage.updateCompletionReport(req.params.id, updateData);
      res.json(report);
    } catch (error) {
      console.error("Update completion report error:", error);
      res.status(500).json({ message: "Failed to update completion report" });
    }
  });
  
  // Admin: Delete completion report
  app.delete("/api/admin/completion-reports/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteCompletionReport(req.params.id);
      res.json({ message: "Completion report deleted" });
    } catch (error) {
      console.error("Delete completion report error:", error);
      res.status(500).json({ message: "Failed to delete completion report" });
    }
  });
  
  // Admin: Review completion report (approve/reject)
  app.post("/api/admin/completion-reports/:id/review", requireAdmin, async (req, res) => {
    try {
      const { action, notes, rejectionReason } = req.body;
      const report = await storage.getCompletionReport(req.params.id);
      
      if (!report) {
        return res.status(404).json({ message: "Completion report not found" });
      }
      
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: "Action must be 'approve' or 'reject'" });
      }
      
      // Report must be submitted or under_review
      if (!['submitted', 'under_review'].includes(report.status || '')) {
        return res.status(400).json({ message: "Report must be submitted for review first" });
      }
      
      const updateData: any = {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy: req.user?.id,
        reviewNotes: notes || null,
        rejectionReason: action === 'reject' ? rejectionReason : null,
      };
      
      const updated = await storage.updateCompletionReport(req.params.id, updateData);
      
      // If approved, also mark the execution order as completed
      if (action === 'approve' && report.executionOrderId) {
        await storage.updateSiteExecutionOrder(report.executionOrderId, {
          status: 'completed',
          actualEndDate: new Date().toISOString() as any,
          progressPercentage: 100,
        });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Review completion report error:", error);
      res.status(500).json({ message: "Failed to review completion report" });
    }
  });

  // ==================== CUSTOMER PARTNER ROUTES ====================
  
  // Lookup customer eligibility for Customer Partner registration
  app.post("/api/customer-partner/lookup", async (req, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      
      // Find customer by phone who has approved/completed installation
      const allCustomers = await storage.getAllCustomers();
      const customer = allCustomers.find(c => 
        c.phone === phone && 
        (c.status === "approved" || c.status === "completed")
      );
      
      if (!customer) {
        return res.status(404).json({ 
          eligible: false,
          message: "No eligible customer found. Your solar application must be approved to join the Customer Partner Program." 
        });
      }
      
      // Check capacity is at least 3kW
      const capacity = parseInt(customer.proposedCapacity || "0");
      if (capacity < 3) {
        return res.status(400).json({ 
          eligible: false,
          message: "Only customers with 3kW or above installations can become Customer Partners." 
        });
      }
      
      // Check if already registered as customer partner
      const existingUser = await storage.getUserByPhone(phone);
      if (existingUser && existingUser.role === "customer_partner") {
        return res.status(400).json({ 
          eligible: false,
          message: "You are already registered as a Customer Partner. Please login instead." 
        });
      }
      
      // Return sanitized customer data for auto-population
      res.json({
        eligible: true,
        customer: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email || "",
          address: customer.address,
          district: customer.district,
          state: customer.state,
          proposedCapacity: customer.proposedCapacity,
          panelType: customer.panelType,
          completedAt: customer.completedAt,
        }
      });
    } catch (error) {
      console.error("Customer Partner lookup error:", error);
      res.status(500).json({ message: "Failed to verify eligibility" });
    }
  });
  
  // Register as Customer Partner (for independent customers who completed installation)
  app.post("/api/customer-partner/register", async (req, res) => {
    try {
      const { phone, password, email, username } = req.body;
      
      if (!phone || !password || !username) {
        return res.status(400).json({ message: "Phone, username and password are required" });
      }
      
      // Check if username is already taken
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username is already taken. Please choose a different one." });
      }
      
      // Find customer by phone who has approved/completed installation
      const allCustomers = await storage.getAllCustomers();
      const customer = allCustomers.find(c => 
        c.phone === phone && 
        (c.status === "approved" || c.status === "completed")
      );
      
      if (!customer) {
        return res.status(400).json({ 
          message: "No eligible customer found. Your solar application must be approved (3kW or above) to join the Customer Partner Program." 
        });
      }
      
      // Check capacity is at least 3kW
      const capacity = parseInt(customer.proposedCapacity || "0");
      if (capacity < 3) {
        return res.status(400).json({ 
          message: "Only customers with 3kW or above installations can become Customer Partners." 
        });
      }
      
      // Check if already registered as customer partner
      const existingUser = await storage.getUserByPhone(phone);
      if (existingUser && existingUser.role === "customer_partner") {
        return res.status(400).json({ message: "You are already registered as a Customer Partner" });
      }
      
      // Generate referral code based on customer name
      const baseCode = customer.name.replace(/\s+/g, "").slice(0, 6).toUpperCase();
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const referralCode = `CP${baseCode}${randomSuffix}`;
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      
      // Create customer partner user
      const newUser = await storage.createUser({
        username: username,
        password: hashedPassword,
        name: customer.name,
        email: email || customer.email || "",
        phone: customer.phone,
        role: "customer_partner",
        district: customer.district,
        state: customer.state,
        address: customer.address,
        status: "approved", // Auto-approve since they have completed installation
        referralCode,
        linkedCustomerId: customer.id,
      });
      
      // Set session
      req.session.userId = newUser.id;
      
      res.status(201).json({ 
        message: "Successfully registered as Customer Partner!",
        user: { 
          id: newUser.id, 
          name: newUser.name, 
          role: newUser.role,
          referralCode: newUser.referralCode 
        } 
      });
    } catch (error) {
      console.error("Customer Partner registration error:", error);
      res.status(500).json({ message: "Failed to register as Customer Partner" });
    }
  });
  
  // Get Customer Partner dashboard stats
  app.get("/api/customer-partner/stats", requireCustomerPartner, async (req, res) => {
    try {
      const user = (req as any).user;
      
      // Get referrals made by this customer partner
      const allCustomers = await storage.getAllCustomers();
      const referredCustomers = allCustomers.filter(c => c.referrerCustomerId === user.linkedCustomerId);
      
      // Get commissions for this customer partner
      const commissions = await storage.getCommissionsByPartnerId(user.id, "customer_partner");
      
      const paidEarnings = commissions.reduce((sum, c) => sum + (c.status === "paid" ? c.commissionAmount : 0), 0);
      const pendingEarnings = commissions.reduce((sum, c) => sum + (c.status === "pending" || c.status === "approved" ? c.commissionAmount : 0), 0);
      
      const stats = {
        totalReferrals: referredCustomers.length,
        completedReferrals: referredCustomers.filter(c => c.status === "completed").length,
        pendingReferrals: referredCustomers.filter(c => c.status !== "completed").length,
        eligibleReferrals: referredCustomers.filter(c => 
          c.status === "completed" && parseInt(c.proposedCapacity || "0") >= 3
        ).length,
        totalEarnings: paidEarnings + pendingEarnings,
        paidEarnings,
        pendingEarnings,
        referralCode: user.referralCode,
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Get Customer Partner stats error:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });
  
  // Get Customer Partner referrals list
  app.get("/api/customer-partner/referrals", requireCustomerPartner, async (req, res) => {
    try {
      const user = (req as any).user;
      
      // Get customers referred by this customer partner
      const allCustomers = await storage.getAllCustomers();
      const referredCustomers = allCustomers
        .filter(c => c.referrerCustomerId === user.linkedCustomerId)
        .map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          district: c.district,
          state: c.state,
          capacity: c.proposedCapacity,
          status: c.status,
          panelType: c.panelType,
          createdAt: c.createdAt,
          isEligibleForReward: c.status === "completed" && parseInt(c.proposedCapacity || "0") >= 3,
        }));
      
      res.json(referredCustomers);
    } catch (error) {
      console.error("Get Customer Partner referrals error:", error);
      res.status(500).json({ message: "Failed to get referrals" });
    }
  });
  
  // Get Customer Partner commissions
  app.get("/api/customer-partner/commissions", requireCustomerPartner, async (req, res) => {
    try {
      const user = (req as any).user;
      const commissions = await storage.getCommissionsByPartnerId(user.id, "customer_partner");
      res.json(commissions);
    } catch (error) {
      console.error("Get Customer Partner commissions error:", error);
      res.status(500).json({ message: "Failed to get commissions" });
    }
  });
  
  // Get Customer Partner profile
  app.get("/api/customer-partner/profile", requireCustomerPartner, async (req, res) => {
    try {
      const user = (req as any).user;
      
      // Get linked customer record for additional details
      let linkedCustomer = null;
      if (user.linkedCustomerId) {
        linkedCustomer = await storage.getCustomer(user.linkedCustomerId);
      }
      
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        district: user.district,
        state: user.state,
        referralCode: user.referralCode,
        createdAt: user.createdAt,
        linkedCustomer: linkedCustomer ? {
          capacity: linkedCustomer.proposedCapacity,
          panelType: linkedCustomer.panelType,
          installationDate: linkedCustomer.installationDate,
        } : null,
      });
    } catch (error) {
      console.error("Get Customer Partner profile error:", error);
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  return httpServer;
}
