import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles: admin, bdp (Business Development Partner), ddp (District Development Partner), customer_partner
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  role: text("role").notNull().default("ddp"), // admin, bdp, ddp, customer_partner
  district: text("district"),
  state: text("state"),
  address: text("address"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  parentId: varchar("parent_id"), // For DDP, this is the BDP who onboarded them
  referralCode: text("referral_code").unique(), // Unique referral code for referral program
  linkedCustomerId: varchar("linked_customer_id"), // For customer_partner, links to their customer record
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
  customerType: text("customer_type").default("residential"), // residential, commercial, industrial
  
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
  
  // Site Media (uploaded by DDP)
  sitePictures: text("site_pictures").array(), // 6 pictures from all angles
  siteVideo: text("site_video"), // 9:16 Instagram-style video URL (max 60 seconds)
  
  // AI Lead Scoring
  leadScore: integer("lead_score"), // 0-100 score
  leadScoreDetails: text("lead_score_details"), // JSON with scoring breakdown
  leadScoreUpdatedAt: timestamp("lead_score_updated_at"),
  
  // Customer Source and Referral Tracking
  source: text("source"), // website_direct, website_referral, partner (null means partner-added)
  referrerCustomerId: varchar("referrer_customer_id"), // For customer-to-customer referrals
  
  // Customer Portal Access
  portalEnabled: boolean("portal_enabled").default(false), // Whether customer can access portal
  portalAccessCode: text("portal_access_code"), // UUID for unique portal link
  passwordHash: text("password_hash"), // Bcrypt hashed password for portal login
  passwordSetAt: timestamp("password_set_at"), // When password was set
  otpCode: text("otp_code"), // Hashed OTP for password reset
  otpExpiry: timestamp("otp_expiry"), // OTP expiration time
  lastPortalLogin: timestamp("last_portal_login"),
  
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
  internalNotes: text("internal_notes"), // Notes only visible to admins/partners
  visibleToCustomer: boolean("visible_to_customer").default(true), // Whether this milestone is visible in customer portal
  updatedByRole: text("updated_by_role"), // admin, bdp, ddp
  updatedById: varchar("updated_by_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer Portal Sessions (for OTP-based login)
export const customerSessions = pgTable("customer_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
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
  upiId: text("upi_id"), // UPI ID for payouts (e.g. name@upi)
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
  price: integer("price").notNull(), // in INR - Plant Cost / Full Price
  bookingAmount: integer("booking_amount"), // in INR - Booking amount for payment (optional, defaults to price if not set)
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

// 4. Referral Program - Customer Partners Only
// Customer Partner referral rewards:
// - Customer Referral: Rs 10,000 for each successful installation of 3kW+ plant they refer
// - Partner Referral: Rs 10,000 when referred partner completes 15 successful installations
export const CUSTOMER_REFERRAL_REWARD = 10000; // Rs 10,000 per successful 3kW+ installation
export const PARTNER_REFERRAL_REWARD = 10000; // Rs 10,000 when partner completes 15 installations
export const PARTNER_REFERRAL_THRESHOLD = 15; // Installations required for partner referral reward
export const MINIMUM_CAPACITY_FOR_REFERRAL = 3; // Minimum 3kW for customer referral reward

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
  partnerInstallationCount: integer("partner_installation_count").default(0), // Track referred partner's installations
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

// 5. Document Management System for Compliance and Record-keeping
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  category: text("category").notNull(), // customer_id, customer_address, customer_electricity, site_survey, installation, completion, subsidy, invoice, agreement, other
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // in bytes
  url: text("url").notNull(), // File storage path/URL
  customerId: varchar("customer_id"), // Optional - linked to customer
  partnerId: varchar("partner_id"), // Optional - linked to partner
  uploadedById: varchar("uploaded_by_id").notNull(),
  uploadedByRole: text("uploaded_by_role").notNull(), // admin, bdp, ddp
  description: text("description"),
  isVerified: boolean("is_verified").default(false),
  verifiedById: varchar("verified_by_id"),
  verifiedAt: timestamp("verified_at"),
  expiresAt: timestamp("expires_at"), // For documents with expiry dates
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documentsRelations = relations(documents, ({ one }) => ({
  customer: one(customers, {
    fields: [documents.customerId],
    references: [customers.id],
  }),
  partner: one(users, {
    fields: [documents.partnerId],
    references: [users.id],
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedById],
    references: [users.id],
  }),
  verifiedBy: one(users, {
    fields: [documents.verifiedById],
    references: [users.id],
  }),
}));

// 6. Notification Templates for automated notifications
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

export const insertCustomerSessionSchema = createInsertSchema(customerSessions).omit({
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

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isVerified: true,
  verifiedById: true,
  verifiedAt: true,
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

// Extended customer type with DDP and BDP partner info
export type CustomerWithPartnerInfo = Customer & {
  ddpName?: string | null;
  ddpPhone?: string | null;
  bdpName?: string | null;
  bdpPhone?: string | null;
};
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
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Document categories
export const documentCategories = [
  { value: "customer_id", label: "Customer ID Proof" },
  { value: "customer_address", label: "Address Proof" },
  { value: "customer_electricity", label: "Electricity Bill" },
  { value: "site_survey", label: "Site Survey Report" },
  { value: "installation", label: "Installation Photos" },
  { value: "completion", label: "Completion Certificate" },
  { value: "subsidy", label: "Subsidy Documents" },
  { value: "invoice", label: "Invoice" },
  { value: "agreement", label: "Agreement/Contract" },
  { value: "bank_details", label: "Bank Details" },
  { value: "other", label: "Other" },
];

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

// Installation milestones for customer journey (14 steps)
export const installationMilestones = [
  { key: "application_submitted", label: "Application Submitted", description: "Customer registration completed", stage: "pre_installation" },
  { key: "documents_verified", label: "Documents Verified", description: "All required documents verified", stage: "pre_installation" },
  { key: "file_submission", label: "File Submission", description: "Application file submitted to DISCOM", stage: "pre_installation" },
  { key: "bank_loan", label: "Bank Loan", description: "Loan application and approval process", stage: "pre_installation" },
  { key: "site_survey", label: "Site Survey", description: "Technical survey of installation site", stage: "pre_installation" },
  { key: "discom_approval", label: "DISCOM Approval", description: "DISCOM/Government approval received", stage: "pre_installation" },
  { key: "material_procurement", label: "Material Procurement", description: "Solar panels and equipment procured", stage: "installation" },
  { key: "installation_scheduled", label: "Installation Scheduled", description: "Installation date confirmed", stage: "installation" },
  { key: "installation_complete", label: "Installation Complete", description: "Solar panels installed on roof", stage: "installation" },
  { key: "wiring_connection", label: "Wiring & Connection", description: "Electrical wiring and inverter connection", stage: "installation" },
  { key: "net_meter_application", label: "Net Meter Application", description: "Net metering application submitted", stage: "post_installation" },
  { key: "grid_connected", label: "Grid Connected", description: "System connected to electricity grid", stage: "post_installation" },
  { key: "subsidy_applied", label: "Subsidy Applied", description: "Subsidy application submitted to portal", stage: "post_installation" },
  { key: "subsidy_received", label: "Subsidy Received", description: "Subsidy amount credited to account", stage: "post_installation" },
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

// Site Installation Vendors - Register for solar installation work
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Vendor Type & Code
  vendorType: text("vendor_type").notNull().default("solar_installation"), // logistic, bank_loan_liaison, discom_net_metering, electrical, solar_installation
  vendorCode: text("vendor_code").unique(), // Auto-generated: LOG-001, BLN-001, DNM-001, ELC-001, SPI-001
  
  // Personal Details
  name: text("name").notNull(),
  fatherName: text("father_name"),
  dateOfBirth: text("date_of_birth"),
  phone: text("phone").notNull(),
  alternatePhone: text("alternate_phone"),
  email: text("email"),
  
  // Company Details
  companyName: text("company_name"),
  companyType: text("company_type"), // proprietorship, partnership, pvt_ltd, llp
  
  // Location
  state: text("state").notNull(), // Bihar, Jharkhand, Uttar Pradesh, Odisha
  district: text("district").notNull(),
  address: text("address").notNull(),
  pincode: text("pincode").notNull(),
  
  // Services offered
  services: text("services").array(), // installation, maintenance, repair, inspection
  
  // Experience Details
  experienceYears: text("experience_years"), // years of experience
  totalInstallations: integer("total_installations"), // number of installations completed
  previousCompanies: text("previous_companies"), // companies worked with before
  projectsCompleted: text("projects_completed"), // description of major projects
  specializations: text("specializations").array(), // rooftop, ground_mount, industrial, residential
  
  // Team Details
  teamSize: integer("team_size"), // number of technicians
  supervisorCount: integer("supervisor_count"),
  helperCount: integer("helper_count"),
  
  // Equipment & Tools
  equipmentOwned: text("equipment_owned").array(), // ladders, safety_gear, multimeter, crimping_tools, etc.
  hasTransportation: boolean("has_transportation").default(false),
  vehicleDetails: text("vehicle_details"),
  
  // Certifications & Training
  certifications: text("certifications").array(), // mnre_certified, skill_india, manufacturer_trained
  trainingDetails: text("training_details"),
  
  // Documents
  aadharNumber: text("aadhar_number"),
  panNumber: text("pan_number"),
  gstNumber: text("gst_number"),
  
  // Bank Details for Payment
  bankAccountName: text("bank_account_name"),
  bankAccountNumber: text("bank_account_number"),
  bankIfsc: text("bank_ifsc"),
  bankName: text("bank_name"),
  upiId: text("upi_id"),
  
  // Best Price Quotation (auto-populated to work orders when approved)
  bestPriceQuotation: text("best_price_quotation"), // Rate/price offered by vendor for their services
  quotationUnit: text("quotation_unit"), // per_kw, per_watt, per_trip, per_unit, lumpsum
  quotationDescription: text("quotation_description"), // Additional details about the quotation
  
  // Status
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  vendorCode: true, // Auto-generated when approved
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
});

// Vendor type options with code prefixes
export const vendorTypeOptions = [
  // Service Vendors
  { value: "logistic", label: "Logistic Vendor", prefix: "LOG", category: "service" },
  { value: "bank_loan_liaison", label: "Bank Loan Liaison Service", prefix: "BLN", category: "service" },
  { value: "discom_net_metering", label: "Discom Net Metering Liaison", prefix: "DNM", category: "service" },
  { value: "electrical", label: "Electrical Vendor", prefix: "ELC", category: "service" },
  { value: "solar_installation", label: "Solar Plant Installation & Erection", prefix: "SPI", category: "service" },
  // Supplier Vendors
  { value: "solar_panel_supplier", label: "Solar Panel Supplier", prefix: "SPS", category: "supplier" },
  { value: "inverter_supplier", label: "Inverter Supplier", prefix: "IVS", category: "supplier" },
  { value: "solar_mounting_supplier", label: "Solar Mounting Supplier", prefix: "SMS", category: "supplier" },
  { value: "electrical_supplier", label: "ACDB/DCDB & Electrical Supplier", prefix: "ELS", category: "supplier" },
  { value: "civil_material_supplier", label: "Civil Material Supplier", prefix: "CMS", category: "supplier" },
  { value: "accessories_supplier", label: "Other Accessories Supplier", prefix: "OAS", category: "supplier" },
  { value: "lithium_battery_supplier", label: "Lithium Ion Batteries Supplier", prefix: "LIB", category: "supplier" },
  { value: "tubular_battery_supplier", label: "Tubular Gel Batteries Supplier", prefix: "TGB", category: "supplier" },
];

// Get vendor types by category
export function getVendorTypesByCategory(category: "service" | "supplier") {
  return vendorTypeOptions.filter(opt => opt.category === category);
}

// Get vendor code prefix by type
export function getVendorCodePrefix(vendorType: string): string {
  const option = vendorTypeOptions.find(opt => opt.value === vendorType);
  return option?.prefix || "VND";
}

export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;

// Vendor service options
export const vendorServices = [
  { value: "installation", label: "Solar Panel Installation" },
  { value: "maintenance", label: "Maintenance & Cleaning" },
  { value: "repair", label: "Repair Services" },
  { value: "inspection", label: "Site Inspection" },
  { value: "electrical", label: "Electrical Work" },
  { value: "structure", label: "Structure & Mounting" },
  { value: "earthing", label: "Earthing Work" },
];

// Vendor specializations
export const vendorSpecializations = [
  { value: "rooftop_residential", label: "Rooftop - Residential" },
  { value: "rooftop_commercial", label: "Rooftop - Commercial" },
  { value: "ground_mount", label: "Ground Mount" },
  { value: "industrial", label: "Industrial Projects" },
  { value: "govt_projects", label: "Government Projects" },
];

// Vendor certifications
export const vendorCertifications = [
  { value: "mnre_certified", label: "MNRE Certified" },
  { value: "skill_india", label: "Skill India Certified" },
  { value: "manufacturer_trained", label: "Manufacturer Trained" },
  { value: "nsdc_certified", label: "NSDC Certified" },
  { value: "electrician_license", label: "Electrician License" },
];

// Equipment options
export const vendorEquipment = [
  { value: "ladders", label: "Ladders & Scaffolding" },
  { value: "safety_gear", label: "Safety Gear (Harness, Helmets)" },
  { value: "multimeter", label: "Multimeter & Testing Equipment" },
  { value: "crimping_tools", label: "Crimping & Wiring Tools" },
  { value: "drill_machine", label: "Drill Machine" },
  { value: "welding_machine", label: "Welding Machine" },
  { value: "earthing_kit", label: "Earthing Kit" },
];

// Company types
export const companyTypes = [
  { value: "individual", label: "Individual / Freelancer" },
  { value: "proprietorship", label: "Proprietorship Firm" },
  { value: "partnership", label: "Partnership Firm" },
  { value: "pvt_ltd", label: "Private Limited Company" },
  { value: "llp", label: "LLP" },
];

// States for vendor registration
export const vendorStates = [
  { value: "Bihar", label: "Bihar" },
  { value: "Jharkhand", label: "Jharkhand" },
  { value: "Uttar Pradesh", label: "Uttar Pradesh" },
  { value: "Odisha", label: "Odisha" },
];

// Customer Vendor Assignments - Track vendor job assignments per customer journey
export const customerVendorAssignments = pgTable("customer_vendor_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  
  // Job Role matching vendor type
  jobRole: text("job_role").notNull(), // vendor type value e.g., solar_panel_supplier, logistic, etc.
  
  // Journey Stage
  journeyStage: text("journey_stage").notNull().default("installation"), // pre_installation, installation, post_installation
  
  // Scheduling
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  
  // Status
  status: text("status").notNull().default("pending"), // pending, assigned, in_progress, completed, cancelled
  
  // Fulfillment Details
  notes: text("notes"),
  amountQuoted: decimal("amount_quoted", { precision: 12, scale: 2 }),
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }),
  invoiceNumber: text("invoice_number"),
  
  // Assignment tracking
  assignedBy: varchar("assigned_by").references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customerVendorAssignmentsRelations = relations(customerVendorAssignments, ({ one }) => ({
  customer: one(customers, {
    fields: [customerVendorAssignments.customerId],
    references: [customers.id],
  }),
  vendor: one(vendors, {
    fields: [customerVendorAssignments.vendorId],
    references: [vendors.id],
  }),
  assignedByUser: one(users, {
    fields: [customerVendorAssignments.assignedBy],
    references: [users.id],
  }),
}));

export const insertCustomerVendorAssignmentSchema = createInsertSchema(customerVendorAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomerVendorAssignment = z.infer<typeof insertCustomerVendorAssignmentSchema>;
export type CustomerVendorAssignment = typeof customerVendorAssignments.$inferSelect;

// Journey stages for vendor assignment
export const vendorJourneyStages = [
  { value: "pre_installation", label: "Pre-Installation" },
  { value: "installation", label: "Installation" },
  { value: "post_installation", label: "Post-Installation" },
];

// Vendor Payment Milestones - Defines when vendors receive payments
export const vendorPaymentMilestones = {
  bank_loan_liaison: [
    { milestone: "bank_disbursement", label: "Bank Disbursement", amount: 1500, description: "After bank loan is disbursed" },
    { milestone: "full_final_payment", label: "Full & Final Payment", amount: 1500, description: "After customer's full payment is completed" },
  ],
  discom_net_metering: [
    { milestone: "discom_survey_completed", label: "DISCOM Survey Completed", amount: 1000, description: "After DISCOM site survey is completed" },
    { milestone: "grid_connected", label: "Grid Connected", amount: 2000, description: "After successful grid connection" },
  ],
  logistic: [
    { milestone: "goods_delivered", label: "Goods Delivered", ratePerKw: 20, description: "After successful goods delivery confirmation (Rs 20/kW roundtrip)" },
  ],
  site_installation: [
    { milestone: "site_completion_report", label: "Site Completion Report Submitted", ratePerWatt: 2.5, description: "After site completion report is submitted on PM Surya Ghar Portal (Rs 2.5-3/watt)" },
  ],
};

// Site installation rate options (per watt)
export const siteInstallationRates = [
  { value: "2.5", label: "Rs 2.5/watt" },
  { value: "2.75", label: "Rs 2.75/watt" },
  { value: "3", label: "Rs 3/watt" },
];

// Vendor Payments - Track milestone-based vendor payments
export const vendorPayments = pgTable("vendor_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // References
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  assignmentId: varchar("assignment_id").references(() => customerVendorAssignments.id),
  
  // Payment Details
  vendorType: text("vendor_type").notNull(), // bank_loan_liaison, discom_net_metering
  milestone: text("milestone").notNull(), // bank_disbursement, full_final_payment, discom_survey_completed, grid_connected
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  
  // Status tracking
  status: text("status").notNull().default("pending"), // pending, ready_for_payout, processing, paid, cancelled
  
  // Milestone completion tracking
  milestoneCompletedAt: timestamp("milestone_completed_at"),
  milestoneCompletedBy: varchar("milestone_completed_by").references(() => users.id),
  
  // Payout tracking (Razorpay integration)
  payoutApprovedBy: varchar("payout_approved_by").references(() => users.id),
  payoutApprovedAt: timestamp("payout_approved_at"),
  razorpayPayoutId: text("razorpay_payout_id"),
  razorpayPayoutStatus: text("razorpay_payout_status"),
  paidAt: timestamp("paid_at"),
  
  // Notes
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vendorPaymentsRelations = relations(vendorPayments, ({ one }) => ({
  customer: one(customers, {
    fields: [vendorPayments.customerId],
    references: [customers.id],
  }),
  vendor: one(vendors, {
    fields: [vendorPayments.vendorId],
    references: [vendors.id],
  }),
  assignment: one(customerVendorAssignments, {
    fields: [vendorPayments.assignmentId],
    references: [customerVendorAssignments.id],
  }),
  milestoneCompletedByUser: one(users, {
    fields: [vendorPayments.milestoneCompletedBy],
    references: [users.id],
  }),
  payoutApprovedByUser: one(users, {
    fields: [vendorPayments.payoutApprovedBy],
    references: [users.id],
  }),
}));

export const insertVendorPaymentSchema = createInsertSchema(vendorPayments).omit({
  id: true,
  status: true,
  milestoneCompletedAt: true,
  milestoneCompletedBy: true,
  payoutApprovedBy: true,
  payoutApprovedAt: true,
  razorpayPayoutId: true,
  razorpayPayoutStatus: true,
  paidAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertVendorPayment = z.infer<typeof insertVendorPaymentSchema>;
export type VendorPayment = typeof vendorPayments.$inferSelect;

// Site Installation Expenses - Track all costs and profit per installation
export const siteExpenses = pgTable("site_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  siteId: text("site_id").notNull().unique(), // Auto-generated Site ID (e.g., DS-2024-0001)
  
  // Customer Payment Received
  customerPaymentReceived: decimal("customer_payment_received", { precision: 12, scale: 2 }).default("0"),
  
  // Installation Costs
  solarPanelsCost: decimal("solar_panels_cost", { precision: 12, scale: 2 }).default("0"),
  inverterCost: decimal("inverter_cost", { precision: 12, scale: 2 }).default("0"),
  electricalCost: decimal("electrical_cost", { precision: 12, scale: 2 }).default("0"),
  civilWorkCost: decimal("civil_work_cost", { precision: 12, scale: 2 }).default("0"),
  electricianCost: decimal("electrician_cost", { precision: 12, scale: 2 }).default("0"),
  meterCost: decimal("meter_cost", { precision: 12, scale: 2 }).default("0"),
  meterInstallationCost: decimal("meter_installation_cost", { precision: 12, scale: 2 }).default("0"),
  logisticCost: decimal("logistic_cost", { precision: 12, scale: 2 }).default("0"),
  bankLoanApprovalCost: decimal("bank_loan_approval_cost", { precision: 12, scale: 2 }).default("0"),
  discomApprovalCost: decimal("discom_approval_cost", { precision: 12, scale: 2 }).default("0"),
  
  // Commission Payments
  bdpCommission: decimal("bdp_commission", { precision: 12, scale: 2 }).default("0"),
  ddpCommission: decimal("ddp_commission", { precision: 12, scale: 2 }).default("0"),
  referralPayment: decimal("referral_payment", { precision: 12, scale: 2 }).default("0"),
  incentivePayment: decimal("incentive_payment", { precision: 12, scale: 2 }).default("0"),
  
  // Other Expenses
  miscellaneousExpense: decimal("miscellaneous_expense", { precision: 12, scale: 2 }).default("0"),
  miscellaneousNotes: text("miscellaneous_notes"),
  
  // Calculated Fields (stored for quick access)
  totalExpenses: decimal("total_expenses", { precision: 12, scale: 2 }).default("0"),
  profit: decimal("profit", { precision: 12, scale: 2 }).default("0"),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }).default("0"), // percentage
  
  // Status
  status: text("status").notNull().default("pending"), // pending, approved, completed
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const siteExpensesRelations = relations(siteExpenses, ({ one }) => ({
  customer: one(customers, {
    fields: [siteExpenses.customerId],
    references: [customers.id],
  }),
}));

export const insertSiteExpenseSchema = createInsertSchema(siteExpenses).omit({
  id: true,
  totalExpenses: true,
  profit: true,
  profitMargin: true,
  approvedBy: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSiteExpense = z.infer<typeof insertSiteExpenseSchema>;
export type SiteExpense = typeof siteExpenses.$inferSelect;

// Site expense categories for display
export const siteExpenseCategories = [
  { key: "solarPanelsCost", label: "Solar Panels Cost", group: "installation" },
  { key: "inverterCost", label: "Inverter Cost", group: "installation" },
  { key: "electricalCost", label: "Electrical Cost", group: "installation" },
  { key: "civilWorkCost", label: "Civil Work Execution Cost", group: "installation" },
  { key: "electricianCost", label: "Electrician Cost", group: "installation" },
  { key: "meterCost", label: "Meter Cost", group: "installation" },
  { key: "meterInstallationCost", label: "Meter Installation Cost", group: "installation" },
  { key: "logisticCost", label: "Logistic Cost", group: "other" },
  { key: "bankLoanApprovalCost", label: "Bank Loan Approval Cost", group: "other" },
  { key: "discomApprovalCost", label: "DISCOM Approval Cost", group: "other" },
  { key: "bdpCommission", label: "BDP Commission", group: "commission" },
  { key: "ddpCommission", label: "DDP Commission", group: "commission" },
  { key: "referralPayment", label: "Referral Payment", group: "commission" },
  { key: "incentivePayment", label: "Incentive Payment", group: "commission" },
  { key: "miscellaneousExpense", label: "Miscellaneous Expense", group: "other" },
];

// Bank Loan Submissions - Track bank loan applications for customers
export const bankLoanSubmissions = pgTable("bank_loan_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  
  // Bank Details
  bankName: text("bank_name").notNull(),
  bankBranch: text("bank_branch").notNull(),
  bankManagerName: text("bank_manager_name"),
  bankManagerMobile: text("bank_manager_mobile"),
  
  // Submission Details
  submissionDate: timestamp("submission_date").notNull(),
  status: text("status").notNull().default("submitted"), // submitted, processing, approved, rejected, disbursed
  loanAmount: decimal("loan_amount", { precision: 12, scale: 2 }),
  remarks: text("remarks"),
  
  // Tracking
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bankLoanSubmissionsRelations = relations(bankLoanSubmissions, ({ one }) => ({
  customer: one(customers, {
    fields: [bankLoanSubmissions.customerId],
    references: [customers.id],
  }),
  creator: one(users, {
    fields: [bankLoanSubmissions.createdBy],
    references: [users.id],
  }),
}));

export const insertBankLoanSubmissionSchema = createInsertSchema(bankLoanSubmissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBankLoanSubmission = z.infer<typeof insertBankLoanSubmissionSchema>;
export type BankLoanSubmission = typeof bankLoanSubmissions.$inferSelect;

// Step 3: Site Surveys - Bank Staff and Discom Representative site visits
export const siteSurveys = pgTable("site_surveys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  surveyNumber: text("survey_number").notNull().unique(),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  loanSubmissionId: varchar("loan_submission_id").references(() => bankLoanSubmissions.id),
  
  // Customer & Site Info
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  siteAddress: text("site_address").notNull(),
  district: text("district"),
  state: text("state"),
  pincode: text("pincode"),
  
  // Survey Scheduling
  scheduledDate: timestamp("scheduled_date").notNull(),
  actualDate: timestamp("actual_date"),
  surveyTime: text("survey_time"),
  
  // Bank Staff Details
  bankName: text("bank_name"),
  bankBranch: text("bank_branch"),
  bankStaffName: text("bank_staff_name"),
  bankStaffDesignation: text("bank_staff_designation"),
  bankStaffPhone: text("bank_staff_phone"),
  bankSurveyCompleted: boolean("bank_survey_completed").default(false),
  bankSurveyDate: timestamp("bank_survey_date"),
  bankSurveyNotes: text("bank_survey_notes"),
  bankApprovalStatus: text("bank_approval_status").default("pending"), // pending, approved, rejected
  
  // Discom Representative Details
  discomName: text("discom_name"),
  discomDivision: text("discom_division"),
  discomRepName: text("discom_rep_name"),
  discomRepDesignation: text("discom_rep_designation"),
  discomRepPhone: text("discom_rep_phone"),
  discomSurveyCompleted: boolean("discom_survey_completed").default(false),
  discomSurveyDate: timestamp("discom_survey_date"),
  discomSurveyNotes: text("discom_survey_notes"),
  discomApprovalStatus: text("discom_approval_status").default("pending"), // pending, approved, rejected
  
  // Site Assessment
  roofCondition: text("roof_condition"), // excellent, good, fair, poor
  roofType: text("roof_type"), // RCC, tin, tile, etc.
  roofArea: integer("roof_area"), // sq ft
  shadowAnalysis: text("shadow_analysis"), // none, minimal, moderate, significant
  structuralFeasibility: text("structural_feasibility"), // feasible, needs_reinforcement, not_feasible
  electricalFeasibility: text("electrical_feasibility"), // feasible, needs_upgrade, not_feasible
  
  // Meter & Connection Details
  existingMeterType: text("existing_meter_type"),
  meterLocation: text("meter_location"),
  sanctionedLoad: text("sanctioned_load"),
  proposedCapacity: text("proposed_capacity"),
  gridConnectionDistance: text("grid_connection_distance"),
  
  // Photo Uploads
  roofPhotos: text("roof_photos").array(),
  meterPhotos: text("meter_photos").array(),
  sitePhotos: text("site_photos").array(),
  
  // Survey Outcome
  status: text("status").default("scheduled"), // scheduled, in_progress, completed, cancelled
  overallRecommendation: text("overall_recommendation"), // approved, conditional, rejected
  recommendedCapacity: text("recommended_capacity"),
  specialConditions: text("special_conditions"),
  rejectionReason: text("rejection_reason"),
  
  remarks: text("remarks"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const siteSurveysRelations = relations(siteSurveys, ({ one }) => ({
  customer: one(customers, {
    fields: [siteSurveys.customerId],
    references: [customers.id],
  }),
  loanSubmission: one(bankLoanSubmissions, {
    fields: [siteSurveys.loanSubmissionId],
    references: [bankLoanSubmissions.id],
  }),
}));

export const insertSiteSurveySchema = createInsertSchema(siteSurveys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  actualDate: z.string().optional(),
  bankSurveyDate: z.string().optional(),
  discomSurveyDate: z.string().optional(),
});

export type InsertSiteSurvey = z.infer<typeof insertSiteSurveySchema>;
export type SiteSurvey = typeof siteSurveys.$inferSelect;

// Step 10: Meter Installation Completion Reports - Grid Connection
export const meterInstallationReports = pgTable("meter_installation_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportNumber: text("report_number").notNull().unique(),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  completionReportId: varchar("completion_report_id").references(() => siteExecutionCompletionReports.id),
  
  // Customer & Site Info
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  siteAddress: text("site_address").notNull(),
  district: text("district"),
  state: text("state"),
  pincode: text("pincode"),
  
  // Installation Details
  installedCapacity: text("installed_capacity"), // kW
  panelType: text("panel_type"), // DCR, Non-DCR
  inverterType: text("inverter_type"), // On-grid, Hybrid 3-in-1
  numberOfPanels: integer("number_of_panels"),
  
  // Meter Details
  oldMeterNumber: text("old_meter_number"),
  oldMeterReading: text("old_meter_reading"),
  newMeterNumber: text("new_meter_number"),
  newMeterType: text("new_meter_type"), // Net Meter, Bi-directional, Smart Meter
  newMeterMake: text("new_meter_make"),
  newMeterModel: text("new_meter_model"),
  meterSerialNumber: text("meter_serial_number"),
  meterInstallationDate: timestamp("meter_installation_date"),
  initialMeterReading: text("initial_meter_reading"),
  ctRatio: text("ct_ratio"), // Current Transformer ratio if applicable
  
  // Grid Connection Details
  discomName: text("discom_name"),
  discomDivision: text("discom_division"),
  consumerNumber: text("consumer_number"),
  sanctionedLoad: text("sanctioned_load"), // kW
  connectionType: text("connection_type"), // Single phase, Three phase
  supplyVoltage: text("supply_voltage"), // 230V, 415V
  gridConnectionDate: timestamp("grid_connection_date"),
  synchronizationDate: timestamp("synchronization_date"),
  
  // Discom Representative Details
  discomRepName: text("discom_rep_name"),
  discomRepDesignation: text("discom_rep_designation"),
  discomRepPhone: text("discom_rep_phone"),
  discomRepEmployeeId: text("discom_rep_employee_id"),
  
  // Technical Parameters
  dcCapacity: text("dc_capacity"), // kWp
  acCapacity: text("ac_capacity"), // kW
  dcAcRatio: text("dc_ac_ratio"),
  tiltAngle: text("tilt_angle"), // degrees
  azimuthAngle: text("azimuth_angle"), // degrees
  arrayConfiguration: text("array_configuration"),
  
  // Safety & Compliance
  earthingCompleted: boolean("earthing_completed").default(false),
  lightningArresterInstalled: boolean("lightning_arrester_installed").default(false),
  acdbInstalled: boolean("acdb_installed").default(false),
  dcdbInstalled: boolean("dcdb_installed").default(false),
  mcbRating: text("mcb_rating"),
  spdInstalled: boolean("spd_installed").default(false), // Surge Protection Device
  
  // Testing Results
  gridSyncTestPassed: boolean("grid_sync_test_passed").default(false),
  antiIslandingTestPassed: boolean("anti_islanding_test_passed").default(false),
  powerQualityTestPassed: boolean("power_quality_test_passed").default(false),
  exportLimitSet: boolean("export_limit_set").default(false),
  exportLimitValue: text("export_limit_value"), // kW
  
  // Documentation
  meterPhotos: text("meter_photos").array(), // URLs
  connectionPhotos: text("connection_photos").array(),
  testReportPhotos: text("test_report_photos").array(),
  discomCertificateUrl: text("discom_certificate_url"),
  netMeteringAgreementUrl: text("net_metering_agreement_url"),
  
  // Status & Approval
  status: text("status").default("pending"), // pending, meter_installed, testing, grid_connected, completed, rejected
  discomApprovalStatus: text("discom_approval_status").default("pending"), // pending, approved, rejected
  discomApprovalDate: timestamp("discom_approval_date"),
  rejectionReason: text("rejection_reason"),
  
  // Additional Info
  expectedGeneration: text("expected_generation"), // kWh/year
  warrantyPeriod: text("warranty_period"), // years
  maintenanceSchedule: text("maintenance_schedule"),
  remarks: text("remarks"),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMeterInstallationReportSchema = createInsertSchema(meterInstallationReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  meterInstallationDate: z.string().optional(),
  gridConnectionDate: z.string().optional(),
  synchronizationDate: z.string().optional(),
  discomApprovalDate: z.string().optional(),
});

export type InsertMeterInstallationReport = z.infer<typeof insertMeterInstallationReportSchema>;
export type MeterInstallationReport = typeof meterInstallationReports.$inferSelect;

// Step 11: PM Surya Ghar Portal Submission Reports
export const portalSubmissionReports = pgTable("portal_submission_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportNumber: text("report_number").notNull().unique(),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  meterInstallationReportId: varchar("meter_installation_report_id").references(() => meterInstallationReports.id),
  
  // Customer Info
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  siteAddress: text("site_address"),
  district: text("district"),
  state: text("state"),
  pincode: text("pincode"),
  
  // Portal Registration Details
  portalRegistrationId: text("portal_registration_id"), // PM Surya Ghar Portal ID
  portalApplicationNumber: text("portal_application_number"),
  discomName: text("discom_name"),
  consumerNumber: text("consumer_number"),
  
  // System Details (from installation)
  installedCapacity: text("installed_capacity"), // in kW
  panelType: text("panel_type"), // DCR or Non-DCR
  inverterCapacity: text("inverter_capacity"),
  gridConnectionDate: timestamp("grid_connection_date"),
  netMeterNumber: text("net_meter_number"),
  
  // Portal Submission Details
  submissionDate: timestamp("submission_date"),
  completionCertificateNumber: text("completion_certificate_number"),
  completionCertificateDate: timestamp("completion_certificate_date"),
  completionCertificateUrl: text("completion_certificate_url"),
  
  // Documents Uploaded to Portal
  meterPhotoUrl: text("meter_photo_url"),
  installationPhotoUrl: text("installation_photo_url"),
  sitePhotoUrl: text("site_photo_url"),
  netMeteringAgreementUrl: text("net_metering_agreement_url"),
  bankDetailsProofUrl: text("bank_details_proof_url"),
  aadharCardUrl: text("aadhar_card_url"),
  electricityBillUrl: text("electricity_bill_url"),
  
  // Portal Acknowledgment
  portalAcknowledgmentNumber: text("portal_acknowledgment_number"),
  portalAcknowledgmentDate: timestamp("portal_acknowledgment_date"),
  portalAcknowledgmentUrl: text("portal_acknowledgment_url"),
  
  // Subsidy Details
  subsidyScheme: text("subsidy_scheme").default("pm_surya_ghar"), // pm_surya_ghar, state_subsidy, combined
  centralSubsidyAmount: integer("central_subsidy_amount"), // Central govt subsidy in INR
  stateSubsidyAmount: integer("state_subsidy_amount"), // State govt subsidy in INR (Odisha +20000/kW, UP +10000/kW)
  totalSubsidyClaimed: integer("total_subsidy_claimed"), // Total claimed
  subsidyApprovedAmount: integer("subsidy_approved_amount"), // After verification
  subsidyRejectionReason: text("subsidy_rejection_reason"),
  
  // Bank Details for Subsidy Disbursement
  beneficiaryName: text("beneficiary_name"),
  beneficiaryAccountNumber: text("beneficiary_account_number"),
  beneficiaryIfsc: text("beneficiary_ifsc"),
  beneficiaryBankName: text("beneficiary_bank_name"),
  
  // Disbursement Details
  disbursementStatus: text("disbursement_status").default("pending"), // pending, processing, disbursed, failed
  disbursementReferenceNumber: text("disbursement_reference_number"),
  disbursementDate: timestamp("disbursement_date"),
  disbursementAmount: integer("disbursement_amount"),
  disbursementRemarks: text("disbursement_remarks"),
  
  // Verification Status
  documentVerificationStatus: text("document_verification_status").default("pending"), // pending, verified, rejected
  documentVerificationDate: timestamp("document_verification_date"),
  documentVerificationRemarks: text("document_verification_remarks"),
  
  // Physical Verification (by DISCOM/Govt)
  physicalVerificationRequired: boolean("physical_verification_required").default(true),
  physicalVerificationDate: timestamp("physical_verification_date"),
  physicalVerificationOfficer: text("physical_verification_officer"),
  physicalVerificationStatus: text("physical_verification_status").default("pending"), // pending, scheduled, completed, failed
  physicalVerificationRemarks: text("physical_verification_remarks"),
  
  // Status & Timeline
  status: text("status").default("pending"), // pending, submitted, under_review, docs_verified, physical_verified, approved, subsidy_disbursed, rejected
  expectedDisbursementDate: timestamp("expected_disbursement_date"),
  actualProcessingDays: integer("actual_processing_days"),
  rejectionReason: text("rejection_reason"),
  
  // Follow-up & Communication
  lastFollowUpDate: timestamp("last_follow_up_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  followUpRemarks: text("follow_up_remarks"),
  portalHelplineTicket: text("portal_helpline_ticket"),
  
  // Additional Info
  remarks: text("remarks"),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPortalSubmissionReportSchema = createInsertSchema(portalSubmissionReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  submissionDate: z.string().optional(),
  gridConnectionDate: z.string().optional(),
  completionCertificateDate: z.string().optional(),
  portalAcknowledgmentDate: z.string().optional(),
  disbursementDate: z.string().optional(),
  documentVerificationDate: z.string().optional(),
  physicalVerificationDate: z.string().optional(),
  expectedDisbursementDate: z.string().optional(),
  lastFollowUpDate: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
});

export type InsertPortalSubmissionReport = z.infer<typeof insertPortalSubmissionReportSchema>;
export type PortalSubmissionReport = typeof portalSubmissionReports.$inferSelect;

// Remaining Payment Reports - Step 12: Customer Remaining Payment tracking after portal submission
export const remainingPaymentReports = pgTable("remaining_payment_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportNumber: varchar("report_number").unique(),
  
  // Customer Details
  customerId: varchar("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  siteAddress: text("site_address"),
  district: text("district"),
  state: text("state"),
  pincode: text("pincode"),
  
  // Installation Details
  installedCapacity: text("installed_capacity"),
  panelType: text("panel_type"),
  consumerNumber: text("consumer_number"),
  discomName: text("discom_name"),
  
  // Portal Reference
  portalSubmissionReportId: varchar("portal_submission_report_id").references(() => portalSubmissionReports.id),
  portalApplicationNumber: text("portal_application_number"),
  completionDate: timestamp("completion_date"),
  subsidyReceivedDate: timestamp("subsidy_received_date"),
  subsidyAmount: integer("subsidy_amount"),
  
  // Total System Cost & Payment Breakdown
  totalSystemCost: integer("total_system_cost"),
  advancePaymentReceived: integer("advance_payment_received"),
  advancePaymentDate: timestamp("advance_payment_date"),
  subsidyAdjusted: integer("subsidy_adjusted"),
  remainingPaymentAmount: integer("remaining_payment_amount"),
  
  // Remaining Payment Details
  remainingPaymentDueDate: timestamp("remaining_payment_due_date"),
  paymentReminderSent: boolean("payment_reminder_sent").default(false),
  reminderSentDate: timestamp("reminder_sent_date"),
  reminderCount: integer("reminder_count").default(0),
  
  // Payment Collection
  paymentMode: text("payment_mode"), // cash, upi, neft, rtgs, cheque, razorpay
  paymentReferenceNumber: text("payment_reference_number"),
  paymentReceivedDate: timestamp("payment_received_date"),
  paymentReceivedAmount: integer("payment_received_amount"),
  paymentReceiptNumber: text("payment_receipt_number"),
  paymentReceiptUrl: text("payment_receipt_url"),
  
  // Partial Payments (if applicable)
  isPartialPayment: boolean("is_partial_payment").default(false),
  partialPayments: text("partial_payments"), // JSON array of partial payment records
  totalReceivedTillDate: integer("total_received_till_date"),
  balanceAmount: integer("balance_amount"),
  
  // Status & Follow-up
  status: text("status").default("pending"), // pending, reminder_sent, partially_paid, paid, overdue, waived
  daysOverdue: integer("days_overdue").default(0),
  lastFollowUpDate: timestamp("last_follow_up_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  followUpRemarks: text("follow_up_remarks"),
  
  // Commission Impact
  commissionHeld: boolean("commission_held").default(true),
  commissionReleaseDate: timestamp("commission_release_date"),
  ddpCommissionAmount: integer("ddp_commission_amount"),
  bdpCommissionAmount: integer("bdp_commission_amount"),
  
  // Additional Info
  customerFeedback: text("customer_feedback"),
  escalationRequired: boolean("escalation_required").default(false),
  escalationReason: text("escalation_reason"),
  remarks: text("remarks"),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRemainingPaymentReportSchema = createInsertSchema(remainingPaymentReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  completionDate: z.string().optional(),
  subsidyReceivedDate: z.string().optional(),
  advancePaymentDate: z.string().optional(),
  remainingPaymentDueDate: z.string().optional(),
  reminderSentDate: z.string().optional(),
  paymentReceivedDate: z.string().optional(),
  lastFollowUpDate: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
  commissionReleaseDate: z.string().optional(),
});

export type InsertRemainingPaymentReport = z.infer<typeof insertRemainingPaymentReportSchema>;
export type RemainingPaymentReport = typeof remainingPaymentReports.$inferSelect;

// Subsidy Application Reports - Step 13: Subsidy Application on PM Surya Ghar Portal
export const subsidyApplicationReports = pgTable("subsidy_application_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportNumber: varchar("report_number").unique(),
  
  // Customer Details
  customerId: varchar("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  siteAddress: text("site_address"),
  district: text("district"),
  state: text("state"),
  pincode: text("pincode"),
  
  // Installation Details
  installedCapacity: text("installed_capacity"),
  panelType: text("panel_type"),
  consumerNumber: text("consumer_number"),
  discomName: text("discom_name"),
  
  // Portal Details
  portalRegistrationId: text("portal_registration_id"),
  portalApplicationNumber: text("portal_application_number"),
  completionCertificateNumber: text("completion_certificate_number"),
  completionCertificateDate: timestamp("completion_certificate_date"),
  netMeterNumber: text("net_meter_number"),
  gridConnectionDate: timestamp("grid_connection_date"),
  
  // Subsidy Application Details
  applicationDate: timestamp("application_date"),
  subsidyScheme: text("subsidy_scheme").default("pm_surya_ghar"), // pm_surya_ghar, state_subsidy, combined
  centralSubsidyAmount: integer("central_subsidy_amount"),
  stateSubsidyAmount: integer("state_subsidy_amount"),
  totalSubsidyApplied: integer("total_subsidy_applied"),
  
  // Beneficiary Bank Details
  beneficiaryName: text("beneficiary_name"),
  beneficiaryAccountNumber: text("beneficiary_account_number"),
  beneficiaryIfsc: text("beneficiary_ifsc"),
  beneficiaryBankName: text("beneficiary_bank_name"),
  beneficiaryBankBranch: text("beneficiary_bank_branch"),
  
  // Document Uploads
  completionCertificateUrl: text("completion_certificate_url"),
  netMeteringAgreementUrl: text("net_metering_agreement_url"),
  bankPassbookUrl: text("bank_passbook_url"),
  aadharCardUrl: text("aadhar_card_url"),
  electricityBillUrl: text("electricity_bill_url"),
  installationPhotosUrl: text("installation_photos_url"),
  
  // Application Status
  applicationAcknowledgmentNumber: text("application_acknowledgment_number"),
  applicationAcknowledgmentDate: timestamp("application_acknowledgment_date"),
  documentVerificationStatus: text("document_verification_status").default("pending"), // pending, verified, rejected
  documentVerificationDate: timestamp("document_verification_date"),
  documentVerificationRemarks: text("document_verification_remarks"),
  
  // Status & Follow-up
  status: text("status").default("pending"), // pending, submitted, under_review, docs_verified, approved, rejected
  rejectionReason: text("rejection_reason"),
  lastFollowUpDate: timestamp("last_follow_up_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  followUpRemarks: text("follow_up_remarks"),
  portalHelplineTicket: text("portal_helpline_ticket"),
  remarks: text("remarks"),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubsidyApplicationReportSchema = createInsertSchema(subsidyApplicationReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  applicationDate: z.string().optional(),
  completionCertificateDate: z.string().optional(),
  gridConnectionDate: z.string().optional(),
  applicationAcknowledgmentDate: z.string().optional(),
  documentVerificationDate: z.string().optional(),
  lastFollowUpDate: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
});

export type InsertSubsidyApplicationReport = z.infer<typeof insertSubsidyApplicationReportSchema>;
export type SubsidyApplicationReport = typeof subsidyApplicationReports.$inferSelect;

// Subsidy Disbursement Reports - Step 14 (Final): Subsidy Disbursement into Customer Bank Account
export const subsidyDisbursementReports = pgTable("subsidy_disbursement_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportNumber: varchar("report_number").unique(),
  
  // Customer Details
  customerId: varchar("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  siteAddress: text("site_address"),
  district: text("district"),
  state: text("state"),
  pincode: text("pincode"),
  
  // Installation Details
  installedCapacity: text("installed_capacity"),
  panelType: text("panel_type"),
  consumerNumber: text("consumer_number"),
  
  // Reference to Subsidy Application
  subsidyApplicationReportId: varchar("subsidy_application_report_id").references(() => subsidyApplicationReports.id),
  portalApplicationNumber: text("portal_application_number"),
  subsidyScheme: text("subsidy_scheme"),
  
  // Approved Amounts
  centralSubsidyApproved: integer("central_subsidy_approved"),
  stateSubsidyApproved: integer("state_subsidy_approved"),
  totalSubsidyApproved: integer("total_subsidy_approved"),
  
  // Disbursement Details
  disbursementStatus: text("disbursement_status").default("pending"), // pending, processing, partial, completed, failed
  disbursementReferenceNumber: text("disbursement_reference_number"),
  disbursementDate: timestamp("disbursement_date"),
  disbursementAmount: integer("disbursement_amount"),
  disbursementMode: text("disbursement_mode"), // neft, rtgs, dbt
  
  // Beneficiary Bank Details (where subsidy was received)
  beneficiaryName: text("beneficiary_name"),
  beneficiaryAccountNumber: text("beneficiary_account_number"),
  beneficiaryIfsc: text("beneficiary_ifsc"),
  beneficiaryBankName: text("beneficiary_bank_name"),
  
  // Verification
  disbursementVerified: boolean("disbursement_verified").default(false),
  verificationDate: timestamp("verification_date"),
  verificationRemarks: text("verification_remarks"),
  bankStatementUrl: text("bank_statement_url"),
  
  // Commission Release (50% of remaining commission released after subsidy)
  commissionReleaseTriggered: boolean("commission_release_triggered").default(false),
  commissionReleaseDate: timestamp("commission_release_date"),
  ddpCommissionReleased: integer("ddp_commission_released"),
  bdpCommissionReleased: integer("bdp_commission_released"),
  cpCommissionReleased: integer("cp_commission_released"),
  
  // Status & Follow-up
  status: text("status").default("pending"), // pending, processing, disbursed, verified, completed
  expectedDisbursementDate: timestamp("expected_disbursement_date"),
  actualProcessingDays: integer("actual_processing_days"),
  lastFollowUpDate: timestamp("last_follow_up_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  followUpRemarks: text("follow_up_remarks"),
  remarks: text("remarks"),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubsidyDisbursementReportSchema = createInsertSchema(subsidyDisbursementReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  disbursementDate: z.string().optional(),
  verificationDate: z.string().optional(),
  commissionReleaseDate: z.string().optional(),
  expectedDisbursementDate: z.string().optional(),
  lastFollowUpDate: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
});

export type InsertSubsidyDisbursementReport = z.infer<typeof insertSubsidyDisbursementReportSchema>;
export type SubsidyDisbursementReport = typeof subsidyDisbursementReports.$inferSelect;

// Password Reset OTPs - Store OTPs for password reset
export const passwordResetOtps = pgTable("password_reset_otps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: text("phone").notNull(),
  otp: text("otp").notNull(),
  resetToken: text("reset_token"),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPasswordResetOtpSchema = createInsertSchema(passwordResetOtps).omit({
  id: true,
  createdAt: true,
});

export type InsertPasswordResetOtp = z.infer<typeof insertPasswordResetOtpSchema>;
export type PasswordResetOtp = typeof passwordResetOtps.$inferSelect;

// Bank loan submission statuses
export const bankLoanStatuses = [
  { value: "submitted", label: "Submitted" },
  { value: "processing", label: "Processing" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "disbursed", label: "Disbursed" },
];

// Customer File Submission statuses (Step 1 of Customer Journey)
export const customerFileStatuses = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "resubmission_required", label: "Resubmission Required" },
];

// Customer File Submissions - PM Surya Ghar (Step 1 of Customer Journey)
export const customerFileSubmissions = pgTable("customer_file_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  consumerNo: text("consumer_no").notNull(),
  billHolderName: text("bill_holder_name").notNull(),
  loanApplied: boolean("loan_applied").default(false),
  submissionDate: timestamp("submission_date").notNull(),
  status: text("status").default("submitted"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCustomerFileSubmissionSchema = createInsertSchema(customerFileSubmissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomerFileSubmission = z.infer<typeof insertCustomerFileSubmissionSchema>;
export type CustomerFileSubmission = typeof customerFileSubmissions.$inferSelect;

// Bank Loan Approval statuses (Step 3 of Customer Journey)
export const bankLoanApprovalStatuses = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "conditionally_approved", label: "Conditionally Approved" },
  { value: "rejected", label: "Rejected" },
];

// Bank Loan Approvals - Track bank loan approval date and time (Step 3 of Customer Journey)
export const bankLoanApprovals = pgTable("bank_loan_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id),
  bankLoanSubmissionId: varchar("bank_loan_submission_id").references(() => bankLoanSubmissions.id),
  customerName: text("customer_name").notNull(),
  bankName: text("bank_name").notNull(),
  bankBranch: text("bank_branch"),
  approvalDate: timestamp("approval_date").notNull(),
  approvalTime: text("approval_time"), // Store time as text like "14:30"
  approvedAmount: decimal("approved_amount", { precision: 12, scale: 2 }),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }),
  loanTenure: integer("loan_tenure"), // in months
  status: text("status").default("approved"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bankLoanApprovalsRelations = relations(bankLoanApprovals, ({ one }) => ({
  customer: one(customers, {
    fields: [bankLoanApprovals.customerId],
    references: [customers.id],
  }),
  bankLoanSubmission: one(bankLoanSubmissions, {
    fields: [bankLoanApprovals.bankLoanSubmissionId],
    references: [bankLoanSubmissions.id],
  }),
}));

export const insertBankLoanApprovalSchema = createInsertSchema(bankLoanApprovals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBankLoanApproval = z.infer<typeof insertBankLoanApprovalSchema>;
export type BankLoanApproval = typeof bankLoanApprovals.$inferSelect;

export const loanDisbursementStatuses = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "received", label: "Received" },
  { value: "partial", label: "Partial" },
  { value: "failed", label: "Failed" },
];

// Loan Disbursements - Track loan disbursement into Divyanshi account (Step 4 of Customer Journey)
export const loanDisbursements = pgTable("loan_disbursements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id),
  bankLoanApprovalId: varchar("bank_loan_approval_id").references(() => bankLoanApprovals.id),
  customerName: text("customer_name").notNull(),
  bankName: text("bank_name").notNull(),
  bankBranch: text("bank_branch"),
  disbursementDate: timestamp("disbursement_date").notNull(),
  disbursementTime: text("disbursement_time"), // Store time as text like "14:30"
  disbursedAmount: decimal("disbursed_amount", { precision: 12, scale: 2 }).notNull(),
  transactionReference: text("transaction_reference"), // UTR/NEFT/RTGS reference number
  divyanshiBankAccount: text("divyanshi_bank_account"), // Receiving account details
  status: text("status").default("received"), // pending, processing, received, failed, partial
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const loanDisbursementsRelations = relations(loanDisbursements, ({ one }) => ({
  customer: one(customers, {
    fields: [loanDisbursements.customerId],
    references: [customers.id],
  }),
  bankLoanApproval: one(bankLoanApprovals, {
    fields: [loanDisbursements.bankLoanApprovalId],
    references: [bankLoanApprovals.id],
  }),
}));

export const insertLoanDisbursementSchema = createInsertSchema(loanDisbursements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLoanDisbursement = z.infer<typeof insertLoanDisbursementSchema>;
export type LoanDisbursement = typeof loanDisbursements.$inferSelect;

// Step 5: Vendor Purchase Orders with Payment tracking
export const vendorPurchaseOrderStatuses = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent to Vendor" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "in_progress", label: "In Progress" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const vendorPaymentStatuses = [
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partially Paid" },
  { value: "paid", label: "Fully Paid" },
  { value: "refunded", label: "Refunded" },
] as const;

export const vendorPurchaseOrders = pgTable("vendor_purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  loanDisbursementId: varchar("loan_disbursement_id").references(() => loanDisbursements.id),
  
  // Order Details
  poNumber: text("po_number").notNull(), // Purchase Order Number
  customerName: text("customer_name").notNull(),
  vendorName: text("vendor_name").notNull(),
  orderDate: timestamp("order_date").notNull(),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  
  // Product Details
  panelType: text("panel_type"), // DCR, Non-DCR
  panelCapacity: text("panel_capacity"), // 3kW, 5kW, etc.
  inverterType: text("inverter_type"), // On-grid, Hybrid 3-in-1
  quantity: integer("quantity").default(1),
  
  // Order Amount
  orderAmount: decimal("order_amount", { precision: 12, scale: 2 }).notNull(),
  gstAmount: decimal("gst_amount", { precision: 12, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  
  // Payment Details
  advanceAmount: decimal("advance_amount", { precision: 12, scale: 2 }),
  advanceDate: timestamp("advance_date"),
  advanceReference: text("advance_reference"), // UTR/NEFT/RTGS reference
  
  balanceAmount: decimal("balance_amount", { precision: 12, scale: 2 }),
  balancePaidDate: timestamp("balance_paid_date"),
  balanceReference: text("balance_reference"),
  
  paymentStatus: text("payment_status").default("pending"), // pending, partial, paid, refunded
  orderStatus: text("order_status").default("draft"), // draft, sent, acknowledged, in_progress, delivered, completed, cancelled
  
  // Delivery Details
  deliveryDate: timestamp("delivery_date"),
  deliveryNotes: text("delivery_notes"),
  
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vendorPurchaseOrdersRelations = relations(vendorPurchaseOrders, ({ one }) => ({
  customer: one(customers, {
    fields: [vendorPurchaseOrders.customerId],
    references: [customers.id],
  }),
  vendor: one(vendors, {
    fields: [vendorPurchaseOrders.vendorId],
    references: [vendors.id],
  }),
  loanDisbursement: one(loanDisbursements, {
    fields: [vendorPurchaseOrders.loanDisbursementId],
    references: [loanDisbursements.id],
  }),
}));

export const insertVendorPurchaseOrderSchema = createInsertSchema(vendorPurchaseOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  orderDate: z.string().min(1, "Order date is required"),
  expectedDeliveryDate: z.string().optional(),
  advanceDate: z.string().optional(),
  balancePaidDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  orderAmount: z.string().min(1, "Order amount is required"),
  gstAmount: z.string().optional(),
  totalAmount: z.string().min(1, "Total amount is required"),
  advanceAmount: z.string().optional(),
  balanceAmount: z.string().optional(),
});

export type InsertVendorPurchaseOrder = z.infer<typeof insertVendorPurchaseOrderSchema>;
export type VendorPurchaseOrder = typeof vendorPurchaseOrders.$inferSelect;

// Step 6: Goods Delivery at Customer Site
export const goodsDeliveryStatuses = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "partially_delivered", label: "Partially Delivered" },
  { value: "failed", label: "Failed" },
  { value: "rescheduled", label: "Rescheduled" },
] as const;

export const goodsDeliveries = pgTable("goods_deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id),
  purchaseOrderId: varchar("purchase_order_id").references(() => vendorPurchaseOrders.id),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  
  // Customer & Delivery Info
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  deliveryAddress: text("delivery_address").notNull(),
  district: text("district"),
  state: text("state"),
  pincode: text("pincode"),
  
  // Scheduling
  scheduledDate: timestamp("scheduled_date").notNull(),
  scheduledTimeSlot: text("scheduled_time_slot"), // Morning, Afternoon, Evening
  actualDeliveryDate: timestamp("actual_delivery_date"),
  
  // Delivery Details
  status: text("status").default("scheduled"), // scheduled, in_transit, delivered, partially_delivered, failed, rescheduled
  deliveredBy: text("delivered_by"), // Delivery person name
  vehicleNumber: text("vehicle_number"),
  vehicleType: text("vehicle_type"), // Truck, Tempo, etc.
  
  // Product Details
  panelType: text("panel_type"),
  panelCapacity: text("panel_capacity"),
  inverterType: text("inverter_type"),
  quantityOrdered: integer("quantity_ordered").default(1),
  quantityDelivered: integer("quantity_delivered"),
  
  // Logistics Pricing
  logisticRate: decimal("logistic_rate", { precision: 10, scale: 2 }).default("20"), // Rs per kW (default Rs 20)
  deliveryDistanceKm: decimal("delivery_distance_km", { precision: 10, scale: 2 }), // One-way distance in km
  
  // Proof of Delivery
  receiverName: text("receiver_name"),
  receiverPhone: text("receiver_phone"),
  receiverSignature: text("receiver_signature"), // URL or base64
  deliveryPhotos: text("delivery_photos").array(), // Array of photo URLs
  
  // Site Verification
  siteVerificationBefore: text("site_verification_before").array(), // Photos before unloading
  siteVerificationAfter: text("site_verification_after").array(), // Photos after delivery
  verificationNotes: text("verification_notes"),
  
  // Linked PO Details
  poNumber: text("po_number"),
  vendorName: text("vendor_name"),
  
  remarks: text("remarks"),
  failureReason: text("failure_reason"), // If status is failed
  rescheduleReason: text("reschedule_reason"), // If rescheduled
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const goodsDeliveriesRelations = relations(goodsDeliveries, ({ one }) => ({
  customer: one(customers, {
    fields: [goodsDeliveries.customerId],
    references: [customers.id],
  }),
  purchaseOrder: one(vendorPurchaseOrders, {
    fields: [goodsDeliveries.purchaseOrderId],
    references: [vendorPurchaseOrders.id],
  }),
  vendor: one(vendors, {
    fields: [goodsDeliveries.vendorId],
    references: [vendors.id],
  }),
}));

export const insertGoodsDeliverySchema = createInsertSchema(goodsDeliveries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  actualDeliveryDate: z.string().optional(),
});

export type InsertGoodsDelivery = z.infer<typeof insertGoodsDeliverySchema>;
export type GoodsDelivery = typeof goodsDeliveries.$inferSelect;

// Step 7: Site Execution Orders to Vendors
export const siteExecutionOrderStatuses = [
  { value: "draft", label: "Draft" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const siteExecutionOrders = pgTable("site_execution_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  customerId: varchar("customer_id").references(() => customers.id),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  purchaseOrderId: varchar("purchase_order_id").references(() => vendorPurchaseOrders.id),
  deliveryId: varchar("delivery_id").references(() => goodsDeliveries.id),
  
  // Customer & Site Info
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  siteAddress: text("site_address").notNull(),
  district: text("district"),
  state: text("state"),
  pincode: text("pincode"),
  
  // Vendor Info
  vendorName: text("vendor_name"),
  vendorContactPerson: text("vendor_contact_person"),
  vendorPhone: text("vendor_phone"),
  
  // Scheduling
  scheduledStartDate: timestamp("scheduled_start_date").notNull(),
  scheduledEndDate: timestamp("scheduled_end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  estimatedDuration: integer("estimated_duration"), // in hours
  
  // Crew Assignment
  crewLeadName: text("crew_lead_name"),
  crewLeadPhone: text("crew_lead_phone"),
  crewSize: integer("crew_size"),
  crewMembers: text("crew_members").array(),
  
  // Scope of Work
  scopeOfWork: text("scope_of_work"),
  workDescription: text("work_description"),
  panelType: text("panel_type"),
  panelCapacity: text("panel_capacity"),
  inverterType: text("inverter_type"),
  numberOfPanels: integer("number_of_panels"),
  
  // Site Installation Rate (Rs per watt - for erection + electrical work)
  siteInstallationRate: text("site_installation_rate").default("2.5"), // Rs 2.5-3 per watt
  
  // Required Resources
  requiredMaterials: text("required_materials").array(),
  requiredTools: text("required_tools").array(),
  specialInstructions: text("special_instructions"),
  
  // Safety & Compliance
  safetyChecklistCompleted: boolean("safety_checklist_completed").default(false),
  safetyNotes: text("safety_notes"),
  permitsRequired: text("permits_required").array(),
  permitsObtained: boolean("permits_obtained").default(false),
  
  // Status & Progress
  status: text("status").default("draft"), // draft, assigned, in_progress, completed, on_hold, cancelled
  progressPercentage: integer("progress_percentage").default(0),
  progressNotes: text("progress_notes"),
  
  // Quality Checks
  qualityCheckCompleted: boolean("quality_check_completed").default(false),
  qualityCheckNotes: text("quality_check_notes"),
  qualityCheckDate: timestamp("quality_check_date"),
  qualityCheckedBy: text("quality_checked_by"),
  
  // Completion
  completionCertificate: text("completion_certificate"), // URL
  completionPhotos: text("completion_photos").array(),
  customerSignoff: text("customer_signoff"), // URL or base64
  customerSignoffDate: timestamp("customer_signoff_date"),
  customerFeedback: text("customer_feedback"),
  customerRating: integer("customer_rating"), // 1-5
  
  // Hold/Cancel Reasons
  holdReason: text("hold_reason"),
  cancelReason: text("cancel_reason"),
  
  remarks: text("remarks"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const siteExecutionOrdersRelations = relations(siteExecutionOrders, ({ one }) => ({
  customer: one(customers, {
    fields: [siteExecutionOrders.customerId],
    references: [customers.id],
  }),
  vendor: one(vendors, {
    fields: [siteExecutionOrders.vendorId],
    references: [vendors.id],
  }),
  purchaseOrder: one(vendorPurchaseOrders, {
    fields: [siteExecutionOrders.purchaseOrderId],
    references: [vendorPurchaseOrders.id],
  }),
  delivery: one(goodsDeliveries, {
    fields: [siteExecutionOrders.deliveryId],
    references: [goodsDeliveries.id],
  }),
}));

export const insertSiteExecutionOrderSchema = createInsertSchema(siteExecutionOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  scheduledStartDate: z.string().min(1, "Scheduled start date is required"),
  scheduledEndDate: z.string().optional(),
  actualStartDate: z.string().optional(),
  actualEndDate: z.string().optional(),
  qualityCheckDate: z.string().optional(),
  customerSignoffDate: z.string().optional(),
});

export type InsertSiteExecutionOrder = z.infer<typeof insertSiteExecutionOrderSchema>;
export type SiteExecutionOrder = typeof siteExecutionOrders.$inferSelect;

// Step 8: Site Execution Completion Reports - Vendor uploads completion report with pictures
export const siteExecutionCompletionReports = pgTable("site_execution_completion_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportNumber: text("report_number").notNull().unique(),
  executionOrderId: varchar("execution_order_id").references(() => siteExecutionOrders.id).notNull(),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  
  // Basic Info
  customerName: text("customer_name").notNull(),
  siteAddress: text("site_address").notNull(),
  completionDate: timestamp("completion_date").notNull(),
  
  // Work Summary
  workSummary: text("work_summary"),
  scopeCompletedAs: text("scope_completed_as"), // as_planned, with_modifications, partial
  deviationsNotes: text("deviations_notes"),
  
  // Materials & Labor
  materialsUsed: text("materials_used"),
  extraMaterialsUsed: text("extra_materials_used"),
  totalWorkHours: integer("total_work_hours"),
  crewSize: integer("crew_size"),
  
  // Installation Details
  panelsInstalled: integer("panels_installed"),
  inverterInstalled: text("inverter_installed"),
  wiringCompleted: boolean("wiring_completed").default(false),
  earthingCompleted: boolean("earthing_completed").default(false),
  meterConnected: boolean("meter_connected").default(false),
  gridSyncCompleted: boolean("grid_sync_completed").default(false),
  
  // Photo Uploads (URLs stored as array)
  beforePhotos: text("before_photos").array(),
  duringPhotos: text("during_photos").array(),
  afterPhotos: text("after_photos").array(),
  panelPhotos: text("panel_photos").array(),
  inverterPhotos: text("inverter_photos").array(),
  wiringPhotos: text("wiring_photos").array(),
  meterPhotos: text("meter_photos").array(),
  
  // Energy Readings
  meterReading: text("meter_reading"),
  generationTestPassed: boolean("generation_test_passed").default(false),
  testReadingKw: text("test_reading_kw"),
  
  // Quality & Safety Checklist
  qualityChecklistCompleted: boolean("quality_checklist_completed").default(false),
  safetyChecklistCompleted: boolean("safety_checklist_completed").default(false),
  cleanupCompleted: boolean("cleanup_completed").default(false),
  customerBriefingDone: boolean("customer_briefing_done").default(false),
  
  // Customer Acknowledgment
  customerSignature: text("customer_signature"), // base64 or URL
  customerName2: text("customer_name_signed"),
  customerPhone: text("customer_phone"),
  customerFeedback: text("customer_feedback"),
  customerRating: integer("customer_rating"), // 1-5
  
  // Vendor Acknowledgment
  vendorRepName: text("vendor_rep_name"),
  vendorRepPhone: text("vendor_rep_phone"),
  vendorSignature: text("vendor_signature"), // base64 or URL
  
  // Report Status & Review
  status: text("status").default("draft"), // draft, submitted, under_review, approved, rejected
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by"),
  reviewNotes: text("review_notes"),
  rejectionReason: text("rejection_reason"),
  
  remarks: text("remarks"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const siteExecutionCompletionReportsRelations = relations(siteExecutionCompletionReports, ({ one }) => ({
  executionOrder: one(siteExecutionOrders, {
    fields: [siteExecutionCompletionReports.executionOrderId],
    references: [siteExecutionOrders.id],
  }),
  vendor: one(vendors, {
    fields: [siteExecutionCompletionReports.vendorId],
    references: [vendors.id],
  }),
}));

export const insertSiteExecutionCompletionReportSchema = createInsertSchema(siteExecutionCompletionReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  completionDate: z.string().min(1, "Completion date is required"),
  submittedAt: z.string().optional(),
  reviewedAt: z.string().optional(),
});

export type InsertSiteExecutionCompletionReport = z.infer<typeof insertSiteExecutionCompletionReportSchema>;
export type SiteExecutionCompletionReport = typeof siteExecutionCompletionReports.$inferSelect;

// ===== SERVICE REQUESTS & CUSTOMER TESTIMONIALS =====

// Service Request Issue Types
export const serviceRequestIssueTypes = [
  { value: "electrical", label: "Electrical Issue" },
  { value: "inverter", label: "Inverter Issue" },
  { value: "power_generation", label: "Solar Power Generation Issue" },
  { value: "other", label: "Other Issue" },
];

// Service Request Statuses
export const serviceRequestStatuses = [
  { value: "pending", label: "Pending" },
  { value: "assigned", label: "Assigned to Vendor" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

// Service Requests - Customer can raise service/maintenance requests
export const serviceRequests = pgTable("service_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestNumber: text("request_number").notNull().unique(),
  customerId: varchar("customer_id").notNull(),
  
  // Issue Details
  issueType: text("issue_type").notNull(), // electrical, inverter, power_generation, other
  issueTitle: text("issue_title").notNull(),
  issueDescription: text("issue_description").notNull(),
  urgency: text("urgency").default("normal"), // low, normal, high, urgent
  
  // Customer Contact
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address").notNull(),
  
  // Status & Assignment
  status: text("status").notNull().default("pending"), // pending, assigned, in_progress, resolved, closed
  assignedVendorId: varchar("assigned_vendor_id"),
  assignedAt: timestamp("assigned_at"),
  assignedBy: varchar("assigned_by"),
  
  // Vendor Visit Details
  scheduledVisitDate: timestamp("scheduled_visit_date"),
  actualVisitDate: timestamp("actual_visit_date"),
  vendorNotes: text("vendor_notes"),
  vendorSelfieWithCustomer: text("vendor_selfie_with_customer"), // URL to selfie
  
  // Resolution Details
  resolutionNotes: text("resolution_notes"),
  resolvedAt: timestamp("resolved_at"),
  resolutionPhotos: text("resolution_photos").array(),
  
  // Customer Feedback on Resolution
  customerFeedbackRating: integer("customer_feedback_rating"), // 1-5 stars
  customerFeedbackText: text("customer_feedback_text"),
  feedbackSubmittedAt: timestamp("feedback_submitted_at"),
  
  // Admin Notes
  adminNotes: text("admin_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const serviceRequestsRelations = relations(serviceRequests, ({ one }) => ({
  customer: one(customers, {
    fields: [serviceRequests.customerId],
    references: [customers.id],
  }),
  assignedVendor: one(vendors, {
    fields: [serviceRequests.assignedVendorId],
    references: [vendors.id],
  }),
}));

export const insertServiceRequestSchema = createInsertSchema(serviceRequests).omit({
  id: true,
  requestNumber: true,
  status: true,
  assignedVendorId: true,
  assignedAt: true,
  assignedBy: true,
  scheduledVisitDate: true,
  actualVisitDate: true,
  vendorNotes: true,
  vendorSelfieWithCustomer: true,
  resolutionNotes: true,
  resolvedAt: true,
  resolutionPhotos: true,
  customerFeedbackRating: true,
  customerFeedbackText: true,
  feedbackSubmittedAt: true,
  adminNotes: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  issueType: z.enum(["electrical", "inverter", "power_generation", "other"]),
  issueTitle: z.string().min(5, "Issue title must be at least 5 characters"),
  issueDescription: z.string().min(20, "Please describe the issue in at least 20 characters"),
  urgency: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

export const serviceRequestFeedbackSchema = z.object({
  customerFeedbackRating: z.number().min(1).max(5),
  customerFeedbackText: z.string().optional(),
});

export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type ServiceRequest = typeof serviceRequests.$inferSelect;

// Customer Testimonials - Written testimonials and video testimonials
export const customerTestimonials = pgTable("customer_testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  
  // Customer Info
  customerName: text("customer_name").notNull(),
  customerDistrict: text("customer_district"),
  customerState: text("customer_state"),
  installedCapacity: text("installed_capacity"), // kW
  
  // Written Testimonial
  testimonialText: text("testimonial_text"),
  rating: integer("rating"), // 1-5 stars
  
  // Video Testimonial (60 seconds Instagram-style)
  videoUrl: text("video_url"),
  videoThumbnail: text("video_thumbnail"),
  videoDuration: integer("video_duration"), // in seconds, max 60
  
  // Solar Plant Photos
  plantPhotos: text("plant_photos").array(),
  
  // Social Sharing
  sharedOnFacebook: boolean("shared_on_facebook").default(false),
  sharedOnInstagram: boolean("shared_on_instagram").default(false),
  facebookShareDate: timestamp("facebook_share_date"),
  instagramShareDate: timestamp("instagram_share_date"),
  
  // Status & Approval
  status: text("status").notNull().default("pending"), // pending, approved, rejected, featured
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  isFeatured: boolean("is_featured").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customerTestimonialsRelations = relations(customerTestimonials, ({ one }) => ({
  customer: one(customers, {
    fields: [customerTestimonials.customerId],
    references: [customers.id],
  }),
}));

export const insertCustomerTestimonialSchema = createInsertSchema(customerTestimonials).omit({
  id: true,
  status: true,
  approvedBy: true,
  approvedAt: true,
  sharedOnFacebook: true,
  sharedOnInstagram: true,
  facebookShareDate: true,
  instagramShareDate: true,
  isFeatured: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  testimonialText: z.string().min(20, "Testimonial must be at least 20 characters").optional(),
  rating: z.number().min(1).max(5).optional(),
  videoDuration: z.number().max(60, "Video must be 60 seconds or less").optional(),
});

export type InsertCustomerTestimonial = z.infer<typeof insertCustomerTestimonialSchema>;
export type CustomerTestimonial = typeof customerTestimonials.$inferSelect;

// Re-export chat models for OpenAI integration
export * from "./models/chat";
