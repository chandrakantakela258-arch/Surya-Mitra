import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles: admin, bdp (Business Development Partner), ddp (District Development Partner)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  role: text("role").notNull().default("ddp"), // admin, bdp, ddp
  district: text("district"),
  state: text("state"),
  address: text("address"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  parentId: varchar("parent_id"), // For DDP, this is the BDP who onboarded them
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  parent: one(users, {
    fields: [users.parentId],
    references: [users.id],
    relationName: "parentChild",
  }),
  children: many(users, { relationName: "parentChild" }),
  customers: many(customers),
}));

// Customer data for PM Surya Ghar Yojana
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  district: text("district").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  
  // Electricity details
  electricityBoard: text("electricity_board"),
  consumerNumber: text("consumer_number"),
  sanctionedLoad: text("sanctioned_load"), // in kW
  avgMonthlyBill: integer("avg_monthly_bill"), // in INR
  
  // Roof details
  roofType: text("roof_type"), // RCC, Tin, Tile, etc.
  roofArea: integer("roof_area"), // in sq ft
  panelType: text("panel_type").default("dcr"), // dcr or non_dcr
  proposedCapacity: text("proposed_capacity"), // in kW
  
  // Application status
  status: text("status").notNull().default("pending"), // pending, verified, approved, installation_scheduled, completed
  
  // Partner who registered this customer
  ddpId: varchar("ddp_id").notNull(),
  
  // Documents
  documents: text("documents").array(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customersRelations = relations(customers, ({ one, many }) => ({
  ddp: one(users, {
    fields: [customers.ddpId],
    references: [users.id],
  }),
  milestones: many(milestones),
}));

// Customer Journey Milestones
export const milestones = pgTable("milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  milestone: text("milestone").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const milestonesRelations = relations(milestones, ({ one }) => ({
  customer: one(customers, {
    fields: [milestones.customerId],
    references: [customers.id],
  }),
}));

// Partner Bank Details for Razorpay Payouts
export const bankAccounts = pgTable("bank_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().unique(),
  accountHolderName: text("account_holder_name").notNull(),
  accountNumber: text("account_number").notNull(),
  ifscCode: text("ifsc_code").notNull(),
  bankName: text("bank_name"),
  razorpayContactId: text("razorpay_contact_id"), // Razorpay contact ID
  razorpayFundAccountId: text("razorpay_fund_account_id"), // Razorpay fund account ID
  verified: text("verified").default("pending"), // pending, verified, failed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bankAccountsRelations = relations(bankAccounts, ({ one }) => ({
  partner: one(users, {
    fields: [bankAccounts.partnerId],
    references: [users.id],
  }),
}));

// Razorpay Payout Transactions
export const payouts = pgTable("payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull(),
  commissionId: varchar("commission_id"), // Link to commission record if applicable
  amount: integer("amount").notNull(), // in INR
  razorpayPayoutId: text("razorpay_payout_id"), // Razorpay payout ID
  razorpayStatus: text("razorpay_status"), // processing, processed, reversed, cancelled
  mode: text("mode").default("IMPS"), // IMPS, NEFT, RTGS, UPI
  utr: text("utr"), // Unique Transaction Reference
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  failureReason: text("failure_reason"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payoutsRelations = relations(payouts, ({ one }) => ({
  partner: one(users, {
    fields: [payouts.partnerId],
    references: [users.id],
  }),
  commission: one(commissions, {
    fields: [payouts.commissionId],
    references: [commissions.id],
  }),
}));

// Partner Commissions
export const commissions = pgTable("commissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull(),
  partnerType: text("partner_type").notNull().default("ddp"), // ddp or bdp
  customerId: varchar("customer_id").notNull(),
  capacityKw: integer("capacity_kw").notNull(),
  commissionAmount: integer("commission_amount").notNull(), // in INR
  status: text("status").notNull().default("pending"), // pending, approved, paid
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const commissionsRelations = relations(commissions, ({ one }) => ({
  partner: one(users, {
    fields: [commissions.partnerId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [commissions.customerId],
    references: [customers.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
  createdAt: true,
});

export const insertCommissionSchema = createInsertSchema(commissions).omit({
  id: true,
  createdAt: true,
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  razorpayContactId: true,
  razorpayFundAccountId: true,
});

export const insertPayoutSchema = createInsertSchema(payouts).omit({
  id: true,
  createdAt: true,
});

// Extended schemas with validation
export const registerUserSchema = insertUserSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const customerFormSchema = insertCustomerSchema
  .omit({ ddpId: true })
  .extend({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    address: z.string().min(5, "Address must be at least 5 characters"),
    district: z.string().min(2, "District is required"),
    state: z.string().min(2, "State is required"),
    pincode: z.string().length(6, "Pincode must be 6 digits"),
  });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type Milestone = typeof milestones.$inferSelect;
export type InsertCommission = z.infer<typeof insertCommissionSchema>;
export type Commission = typeof commissions.$inferSelect;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertPayout = z.infer<typeof insertPayoutSchema>;
export type Payout = typeof payouts.$inferSelect;

// Indian states for dropdown
export const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh"
];

// Customer status options
export const customerStatuses = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "approved", label: "Approved" },
  { value: "installation_scheduled", label: "Installation Scheduled" },
  { value: "completed", label: "Completed" },
];

// Roof types
export const roofTypes = [
  "RCC (Reinforced Cement Concrete)",
  "Tin/Metal Sheet",
  "Tile",
  "Asbestos",
  "Wooden",
  "Other"
];

// Installation milestones for customer journey
export const installationMilestones = [
  { key: "application_submitted", label: "Application Submitted", description: "Customer registration completed" },
  { key: "documents_verified", label: "Documents Verified", description: "All required documents verified" },
  { key: "site_survey", label: "Site Survey", description: "Technical survey of installation site" },
  { key: "approval_received", label: "Approval Received", description: "DISCOM/Government approval received" },
  { key: "installation_scheduled", label: "Installation Scheduled", description: "Installation date confirmed" },
  { key: "installation_complete", label: "Installation Complete", description: "Solar panels installed" },
  { key: "grid_connected", label: "Grid Connected", description: "System connected to electricity grid" },
  { key: "subsidy_applied", label: "Subsidy Applied", description: "Subsidy application submitted" },
  { key: "subsidy_received", label: "Subsidy Received", description: "Subsidy amount credited" },
];

// Panel types
export const panelTypes = [
  { value: "dcr", label: "DCR Panel (Domestic Content)" },
  { value: "non_dcr", label: "Non-DCR Panel" },
];

// Fixed commission amounts for DCR panels 3kW and 5kW (in INR)
export const dcrFixedCommission: Record<number, { ddp: number; bdp: number }> = {
  3: { ddp: 20000, bdp: 10000 },
  5: { ddp: 35000, bdp: 15000 },
};

// Per-kW commission rates for DCR panels above 5kW (up to 10kW)
export const dcrPerKwRates = { ddp: 6000, bdp: 3000 };

// Per-kW commission rates for Non-DCR panels (above 5kW)
export const nonDcrPerKwRates = { ddp: 4000, bdp: 2000 };

// Non-DCR panel cost per kW
export const nonDcrCostPerKw = 55000;

// Calculate DDP commission based on capacity and panel type
export function calculateCommission(capacityKw: number, panelType: string = "dcr"): number {
  if (panelType === "non_dcr") {
    // Non-DCR: Rs 4,000 per kW
    return capacityKw * nonDcrPerKwRates.ddp;
  }
  
  // DCR Panel logic
  const fixedSchedule = dcrFixedCommission[capacityKw];
  if (fixedSchedule) {
    return fixedSchedule.ddp;
  }
  
  // DCR above 5kW: Rs 6,000 per kW
  if (capacityKw > 5 && capacityKw <= 10) {
    return capacityKw * dcrPerKwRates.ddp;
  }
  
  return 0;
}

// Calculate BDP commission based on capacity and panel type
export function calculateBdpCommission(capacityKw: number, panelType: string = "dcr"): number {
  if (panelType === "non_dcr") {
    // Non-DCR: Rs 2,000 per kW
    return capacityKw * nonDcrPerKwRates.bdp;
  }
  
  // DCR Panel logic
  const fixedSchedule = dcrFixedCommission[capacityKw];
  if (fixedSchedule) {
    return fixedSchedule.bdp;
  }
  
  // DCR above 5kW: Rs 3,000 per kW
  if (capacityKw > 5 && capacityKw <= 10) {
    return capacityKw * dcrPerKwRates.bdp;
  }
  
  return 0;
}

// Export commission schedule for UI display (backwards compatibility)
export const commissionSchedule = dcrFixedCommission;
