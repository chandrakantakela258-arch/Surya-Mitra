import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean } from "drizzle-orm/pg-core";
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
  referralCode: text("referral_code").unique(), // Unique referral code for referral program
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
  
  // Customer Bank Details for Razorpay Payouts
  accountHolderName: text("account_holder_name"),
  accountNumber: text("account_number"),
  ifscCode: text("ifsc_code"),
  bankName: text("bank_name"),
  upiId: text("upi_id"),
  
  // Location for map view
  latitude: text("latitude"),
  longitude: text("longitude"),
  installationDate: timestamp("installation_date"),
  
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

// Products Catalog (Marketing materials, Solar packages, etc.)
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // solar_package, marketing_material, accessory
  price: integer("price").notNull(), // in INR (paise for decimals, or whole rupees)
  imageUrl: text("image_url"),
  isActive: text("is_active").default("active"), // active, inactive
  stock: integer("stock").default(0), // -1 for unlimited (services)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  customerId: varchar("customer_id"), // Optional - for registered customers
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  customerAddress: text("customer_address"),
  totalAmount: integer("total_amount").notNull(), // in INR
  status: text("status").notNull().default("pending"), // pending, paid, processing, shipped, delivered, cancelled
  razorpayOrderId: text("razorpay_order_id"),
  ddpId: varchar("ddp_id"), // Partner who created the order
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  ddp: one(users, {
    fields: [orders.ddpId],
    references: [users.id],
  }),
  items: many(orderItems),
  payments: many(payments),
}));

// Order Items
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  productId: varchar("product_id"),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(),
  totalPrice: integer("total_price").notNull(),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// Payments (Razorpay transactions)
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpayOrderId: text("razorpay_order_id"),
  razorpaySignature: text("razorpay_signature"),
  amount: integer("amount").notNull(), // in INR
  currency: text("currency").default("INR"),
  method: text("method"), // card, upi, netbanking, wallet
  status: text("status").notNull().default("pending"), // pending, captured, failed, refunded
  failureReason: text("failure_reason"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

// Partner Commissions
export const commissions = pgTable("commissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull(),
  partnerType: text("partner_type").notNull().default("ddp"), // ddp or bdp
  customerId: varchar("customer_id"), // Optional - null for product sales like inverters
  source: text("source").notNull().default("installation"), // installation, inverter, bonus
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

// Notifications for application status updates
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  customerId: varchar("customer_id"),
  type: text("type").notNull(), // status_update, milestone_complete, commission_earned, general
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: text("is_read").default("false"), // true, false
  channel: text("channel").default("in_app"), // in_app, email, sms
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [notifications.customerId],
    references: [customers.id],
  }),
}));

// User Preferences for dashboard customization and onboarding
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  tutorialCompleted: text("tutorial_completed").default("false"),
  dashboardLayout: text("dashboard_layout"), // JSON string of widget order
  emailNotifications: text("email_notifications").default("true"),
  smsNotifications: text("sms_notifications").default("true"),
  whatsappNotifications: text("whatsapp_notifications").default("true"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

// Partner of the Month
export const partnerOfMonth = pgTable("partner_of_month", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull(),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  achievement: text("achievement").notNull(), // Description of why selected
  customersCount: integer("customers_count").default(0),
  totalCommission: integer("total_commission").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const partnerOfMonthRelations = relations(partnerOfMonth, ({ one }) => ({
  partner: one(users, {
    fields: [partnerOfMonth.partnerId],
    references: [users.id],
  }),
}));

// Partner Incentive Targets
export const incentiveTargets = pgTable("incentive_targets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull(),
  partnerType: text("partner_type").notNull().default("ddp"), // ddp or bdp
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  targetInstallations: integer("target_installations").notNull().default(5),
  targetCapacityKw: integer("target_capacity_kw").notNull().default(15),
  achievedInstallations: integer("achieved_installations").notNull().default(0),
  achievedCapacityKw: integer("achieved_capacity_kw").notNull().default(0),
  bonusAmount: integer("bonus_amount").default(0), // Bonus earned if target achieved
  status: text("status").notNull().default("active"), // active, achieved, expired
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const incentiveTargetsRelations = relations(incentiveTargets, ({ one }) => ({
  partner: one(users, {
    fields: [incentiveTargets.partnerId],
    references: [users.id],
  }),
}));

// Partner Performance Metrics (monthly snapshots)
export const performanceMetrics = pgTable("performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull(),
  partnerType: text("partner_type").notNull().default("ddp"),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  totalInstallations: integer("total_installations").notNull().default(0),
  totalCapacityKw: integer("total_capacity_kw").notNull().default(0),
  dcrInstallations: integer("dcr_installations").notNull().default(0),
  nonDcrInstallations: integer("non_dcr_installations").notNull().default(0),
  invertersSold: integer("inverters_sold").notNull().default(0),
  totalCommissionEarned: integer("total_commission_earned").notNull().default(0),
  installationCommission: integer("installation_commission").notNull().default(0),
  inverterCommission: integer("inverter_commission").notNull().default(0),
  bonusEarned: integer("bonus_earned").notNull().default(0),
  rank: integer("rank"), // Rank among all partners for that month
  createdAt: timestamp("created_at").defaultNow(),
});

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  partner: one(users, {
    fields: [performanceMetrics.partnerId],
    references: [users.id],
  }),
}));

// Chatbot FAQ entries
export const chatbotFaq = pgTable("chatbot_faq", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category").notNull(), // general, subsidy, installation, payment, partner
  keywords: text("keywords").array(),
  isActive: text("is_active").default("active"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Feedback - for bug reports and feature suggestions
export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // null if from anonymous visitor
  userEmail: text("user_email"), // for anonymous users or contact email
  userName: text("user_name"), // for anonymous users
  type: text("type").notNull().default("suggestion"), // bug, suggestion, complaint, other
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  priority: text("priority").default("medium"), // low, medium, high, critical
  status: text("status").notNull().default("pending"), // pending, reviewed, resolved
  page: text("page"), // which page the feedback was submitted from
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}));

// ===== NEW FEATURES TABLES =====

// 1. News & Updates Section
export const newsPosts = pgTable("news_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("news"), // news, update, announcement, policy
  imageUrl: text("image_url"),
  authorId: varchar("author_id"),
  isPublished: text("is_published").default("false"),
  publishedAt: timestamp("published_at"),
  tags: text("tags").array(),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsPostsRelations = relations(newsPosts, ({ one }) => ({
  author: one(users, {
    fields: [newsPosts.authorId],
    references: [users.id],
  }),
}));

// 2. Panel Models for Comparison Tool
export const panelModels = pgTable("panel_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  type: text("type").notNull().default("dcr"), // dcr, non_dcr
  capacityWatt: integer("capacity_watt").notNull(), // Wattage per panel
  efficiency: text("efficiency"), // e.g., "21.5%"
  warranty: text("warranty"), // e.g., "25 years"
  pricePerWatt: integer("price_per_watt"), // in INR
  dimensions: text("dimensions"), // e.g., "2000mm x 1000mm x 40mm"
  weight: text("weight"), // e.g., "22 kg"
  technology: text("technology"), // Mono PERC, Poly, Bifacial, etc.
  features: text("features").array(), // Array of feature strings
  imageUrl: text("image_url"),
  specifications: text("specifications"), // JSON string with detailed specs
  isActive: text("is_active").default("active"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 3. Partner Leaderboard (uses existing performanceMetrics, add ranking table)
export const leaderboard = pgTable("leaderboard", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull(),
  partnerType: text("partner_type").notNull().default("ddp"),
  period: text("period").notNull(), // monthly, quarterly, yearly
  month: integer("month"),
  quarter: integer("quarter"),
  year: integer("year").notNull(),
  totalInstallations: integer("total_installations").notNull().default(0),
  totalCapacityKw: integer("total_capacity_kw").notNull().default(0),
  totalCommission: integer("total_commission").notNull().default(0),
  totalReferrals: integer("total_referrals").notNull().default(0),
  rank: integer("rank").notNull(),
  badge: text("badge"), // gold, silver, bronze, rising_star
  points: integer("points").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leaderboardRelations = relations(leaderboard, ({ one }) => ({
  partner: one(users, {
    fields: [leaderboard.partnerId],
    references: [users.id],
  }),
}));

// 4. Referral Program
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull(), // Partner who made the referral
  referredType: text("referred_type").notNull(), // customer, partner
  referredCustomerId: varchar("referred_customer_id"), // If referral is a customer
  referredPartnerId: varchar("referred_partner_id"), // If referral is a partner
  referralCode: text("referral_code").notNull(),
  status: text("status").notNull().default("pending"), // pending, converted, expired
  rewardAmount: integer("reward_amount"), // Reward in INR
  rewardStatus: text("reward_status").default("pending"), // pending, paid
  conversionDate: timestamp("conversion_date"),
  expiresAt: timestamp("expires_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
  }),
  referredCustomer: one(customers, {
    fields: [referrals.referredCustomerId],
    references: [customers.id],
  }),
  referredPartner: one(users, {
    fields: [referrals.referredPartnerId],
    references: [users.id],
  }),
}));

// 5. Notification Templates for automated notifications
export const notificationTemplates = pgTable("notification_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  trigger: text("trigger").notNull(), // status_change, milestone_complete, referral_converted
  triggerValue: text("trigger_value"), // e.g., "approved", "completed"
  channel: text("channel").notNull(), // email, sms, whatsapp, all
  subject: text("subject"), // For email
  template: text("template").notNull(), // Message template with placeholders
  isActive: text("is_active").default("true"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPartnerOfMonthSchema = createInsertSchema(partnerOfMonth).omit({
  id: true,
  createdAt: true,
});

export const insertIncentiveTargetSchema = createInsertSchema(incentiveTargets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPerformanceMetricsSchema = createInsertSchema(performanceMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertChatbotFaqSchema = createInsertSchema(chatbotFaq).omit({
  id: true,
  createdAt: true,
});

export const insertNewsPostSchema = createInsertSchema(newsPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
});

export const insertPanelModelSchema = createInsertSchema(panelModels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeaderboardSchema = createInsertSchema(leaderboard).omit({
  id: true,
  createdAt: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  adminNotes: true,
}).extend({
  type: z.enum(["bug", "suggestion", "complaint", "other"]),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(20, "Message must be at least 20 characters"),
});

export const feedbackTypes = [
  { value: "bug", label: "Report a Bug" },
  { value: "suggestion", label: "Suggestion" },
  { value: "complaint", label: "Complaint" },
  { value: "other", label: "Other" },
];

export const feedbackStatuses = ["pending", "reviewed", "resolved"] as const;

export const updateFeedbackStatusSchema = z.object({
  status: z.enum(feedbackStatuses),
  adminNotes: z.string().optional(),
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
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertPartnerOfMonth = z.infer<typeof insertPartnerOfMonthSchema>;
export type PartnerOfMonth = typeof partnerOfMonth.$inferSelect;
export type InsertChatbotFaq = z.infer<typeof insertChatbotFaqSchema>;
export type ChatbotFaq = typeof chatbotFaq.$inferSelect;
export type InsertIncentiveTarget = z.infer<typeof insertIncentiveTargetSchema>;
export type IncentiveTarget = typeof incentiveTargets.$inferSelect;
export type InsertPerformanceMetrics = z.infer<typeof insertPerformanceMetricsSchema>;
export type PerformanceMetrics = typeof performanceMetrics.$inferSelect;
export type InsertNewsPost = z.infer<typeof insertNewsPostSchema>;
export type NewsPost = typeof newsPosts.$inferSelect;
export type InsertPanelModel = z.infer<typeof insertPanelModelSchema>;
export type PanelModel = typeof panelModels.$inferSelect;
export type InsertLeaderboard = z.infer<typeof insertLeaderboardSchema>;
export type Leaderboard = typeof leaderboard.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertNotificationTemplate = z.infer<typeof insertNotificationTemplateSchema>;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;

// Commission source types
export const commissionSources = [
  { value: "installation", label: "Solar Installation" },
  { value: "inverter", label: "Inverter Sale" },
  { value: "bonus", label: "Performance Bonus" },
];

// Monthly incentive target defaults
export const defaultIncentiveTargets = {
  ddp: { installations: 5, capacityKw: 15, bonusAmount: 5000 },
  bdp: { installations: 10, capacityKw: 30, bonusAmount: 10000 },
};

// Product categories
export const productCategories = [
  { value: "solar_package", label: "Solar Package" },
  { value: "marketing_material", label: "Marketing Material" },
  { value: "accessory", label: "Accessory" },
];

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

// SunPunch 3-in-1 Inverter commission rates (per unit sold)
export const inverterCommission = { ddp: 4000, bdp: 1000 };

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
