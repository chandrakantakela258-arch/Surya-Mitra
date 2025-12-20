import { 
  users, 
  customers, 
  milestones,
  commissions,
  bankAccounts,
  payouts,
  products,
  orders,
  orderItems,
  payments,
  feedback,
  notifications,
  userPreferences,
  partnerOfMonth,
  chatbotFaq,
  incentiveTargets,
  performanceMetrics,
  type User, 
  type InsertUser, 
  type Customer, 
  type InsertCustomer,
  type Milestone,
  type InsertMilestone,
  type Commission,
  type InsertCommission,
  type BankAccount,
  type InsertBankAccount,
  type Payout,
  type InsertPayout,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Payment,
  type InsertPayment,
  type Feedback,
  type InsertFeedback,
  type Notification,
  type InsertNotification,
  type UserPreferences,
  type InsertUserPreferences,
  type PartnerOfMonth,
  type InsertPartnerOfMonth,
  type ChatbotFaq,
  type InsertChatbotFaq,
  type IncentiveTarget,
  type InsertIncentiveTarget,
  type PerformanceMetrics,
  type InsertPerformanceMetrics,
  installationMilestones,
  calculateCommission,
  calculateBdpCommission,
  defaultIncentiveTargets
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User/Partner operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStatus(id: string, status: string): Promise<User | undefined>;
  
  // BDP operations - get their DDPs
  getPartnersByParentId(parentId: string): Promise<User[]>;
  
  // Customer operations
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomersByDdpId(ddpId: string): Promise<Customer[]>;
  getAllCustomersByBdpId(bdpId: string): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomerStatus(id: string, status: string): Promise<Customer | undefined>;
  
  // Milestone operations
  getMilestonesByCustomerId(customerId: string): Promise<Milestone[]>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  completeMilestone(id: string, notes?: string): Promise<Milestone | undefined>;
  initializeCustomerMilestones(customerId: string): Promise<Milestone[]>;
  
  // Commission operations
  getCommissionsByPartnerId(partnerId: string, partnerType?: string): Promise<Commission[]>;
  getCommissionSummaryByPartnerId(partnerId: string, partnerType?: string): Promise<{
    totalEarned: number;
    totalPending: number;
    totalPaid: number;
    totalInstallations: number;
  }>;
  createCommission(commission: InsertCommission): Promise<Commission>;
  updateCommissionStatus(id: string, status: string): Promise<Commission | undefined>;
  createCommissionForCustomer(customerId: string, partnerId: string): Promise<{ ddpCommission: Commission | null; bdpCommission: Commission | null }>;
  
  // Stats
  getBdpStats(bdpId: string): Promise<{
    totalPartners: number;
    activePartners: number;
    totalCustomers: number;
    completedInstallations: number;
  }>;
  getDdpStats(ddpId: string): Promise<{
    totalCustomers: number;
    pendingApplications: number;
    approvedApplications: number;
    completedInstallations: number;
  }>;
  
  // Bank Account operations
  getBankAccountByPartnerId(partnerId: string): Promise<BankAccount | undefined>;
  createBankAccount(bankAccount: InsertBankAccount): Promise<BankAccount>;
  updateBankAccount(partnerId: string, data: Partial<BankAccount>): Promise<BankAccount | undefined>;
  
  // Payout operations
  getPayoutsByPartnerId(partnerId: string): Promise<Payout[]>;
  getAllPayouts(): Promise<Payout[]>;
  getPendingPayouts(): Promise<Payout[]>;
  createPayout(payout: InsertPayout): Promise<Payout>;
  updatePayout(id: string, data: Partial<Payout>): Promise<Payout | undefined>;
  getAllCommissions(): Promise<Commission[]>;
  getApprovedCommissions(): Promise<Commission[]>;
  
  // Product operations
  getAllProducts(): Promise<Product[]>;
  getActiveProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, data: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Order operations
  getAllOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByRazorpayId(razorpayOrderId: string): Promise<Order | undefined>;
  getOrdersByDdpId(ddpId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, data: Partial<Order>): Promise<Order | undefined>;
  
  // Order Item operations
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  
  // Payment operations
  getAllPayments(): Promise<Payment[]>;
  getPaymentsByOrderId(orderId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, data: Partial<Payment>): Promise<Payment | undefined>;
  getPaymentByRazorpayId(razorpayPaymentId: string): Promise<Payment | undefined>;

  // Admin operations
  getAdminStats(): Promise<{
    totalBDPs: number;
    totalDDPs: number;
    totalCustomers: number;
    pendingPartners: number;
    completedInstallations: number;
    totalCommissions: number;
    pendingCommissions: number;
  }>;
  getAllPartners(): Promise<User[]>;
  getRecentPartners(limit: number): Promise<User[]>;
  getAllCustomers(): Promise<Customer[]>;
  getRecentCustomers(limit: number): Promise<Customer[]>;
  
  // Feedback operations
  getAllFeedback(): Promise<Feedback[]>;
  getFeedbackByUserId(userId: string): Promise<Feedback[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  updateFeedbackStatus(id: string, status: string, adminNotes?: string): Promise<Feedback | undefined>;
  
  // Notification operations
  getNotificationsByUserId(userId: string): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsRead(userId: string): Promise<void>;
  
  // User Preferences operations
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  createOrUpdateUserPreferences(userId: string, data: Partial<InsertUserPreferences>): Promise<UserPreferences>;
  
  // Partner of the Month operations
  getCurrentPartnerOfMonth(): Promise<(PartnerOfMonth & { partner?: User }) | undefined>;
  getAllPartnersOfMonth(): Promise<(PartnerOfMonth & { partner?: User })[]>;
  createPartnerOfMonth(data: InsertPartnerOfMonth): Promise<PartnerOfMonth>;
  
  // Chatbot FAQ operations
  getActiveFaqs(): Promise<ChatbotFaq[]>;
  getAllFaqs(): Promise<ChatbotFaq[]>;
  createFaq(faq: InsertChatbotFaq): Promise<ChatbotFaq>;
  updateFaq(id: string, data: Partial<ChatbotFaq>): Promise<ChatbotFaq | undefined>;
  deleteFaq(id: string): Promise<boolean>;
  searchFaqs(query: string): Promise<ChatbotFaq[]>;
  
  // Incentive Target operations
  getIncentiveTargetsByPartnerId(partnerId: string, month?: number, year?: number): Promise<IncentiveTarget[]>;
  getCurrentIncentiveTarget(partnerId: string): Promise<IncentiveTarget | undefined>;
  createIncentiveTarget(target: InsertIncentiveTarget): Promise<IncentiveTarget>;
  updateIncentiveProgress(partnerId: string, installations: number, capacityKw: number): Promise<IncentiveTarget | undefined>;
  
  // Performance Metrics operations
  getPerformanceMetrics(partnerId: string, month?: number, year?: number): Promise<PerformanceMetrics[]>;
  getMonthlyPerformance(partnerId: string, months: number): Promise<PerformanceMetrics[]>;
  
  // Enhanced commission summary with breakdown
  getEnhancedCommissionSummary(partnerId: string, partnerType?: string): Promise<{
    totalEarned: number;
    totalPending: number;
    totalPaid: number;
    totalInstallations: number;
    installationCommission: number;
    inverterCommission: number;
    bonusCommission: number;
    currentMonthEarnings: number;
  }>;
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

  async updateUserStatus(id: string, status: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ status })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getPartnersByParentId(parentId: string): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(and(eq(users.parentId, parentId), eq(users.role, "ddp")))
      .orderBy(desc(users.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomersByDdpId(ddpId: string): Promise<Customer[]> {
    return db
      .select()
      .from(customers)
      .where(eq(customers.ddpId, ddpId))
      .orderBy(desc(customers.createdAt));
  }

  async getAllCustomersByBdpId(bdpId: string): Promise<Customer[]> {
    // Get all DDPs under this BDP
    const ddps = await this.getPartnersByParentId(bdpId);
    const ddpIds = ddps.map((d) => d.id);
    
    if (ddpIds.length === 0) {
      return [];
    }
    
    // Get all customers from those DDPs using inArray
    const allCustomers = await db
      .select()
      .from(customers)
      .where(inArray(customers.ddpId, ddpIds))
      .orderBy(desc(customers.createdAt));
    
    return allCustomers;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values(insertCustomer)
      .returning();
    return customer;
  }

  async updateCustomerStatus(id: string, status: string): Promise<Customer | undefined> {
    const [customer] = await db
      .update(customers)
      .set({ status, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return customer || undefined;
  }

  async getBdpStats(bdpId: string): Promise<{
    totalPartners: number;
    activePartners: number;
    totalCustomers: number;
    completedInstallations: number;
  }> {
    const partners = await this.getPartnersByParentId(bdpId);
    const allCustomers = await this.getAllCustomersByBdpId(bdpId);
    
    return {
      totalPartners: partners.length,
      activePartners: partners.filter((p) => p.status === "approved").length,
      totalCustomers: allCustomers.length,
      completedInstallations: allCustomers.filter((c) => c.status === "completed").length,
    };
  }

  async getDdpStats(ddpId: string): Promise<{
    totalCustomers: number;
    pendingApplications: number;
    approvedApplications: number;
    completedInstallations: number;
  }> {
    const customersList = await this.getCustomersByDdpId(ddpId);
    
    return {
      totalCustomers: customersList.length,
      pendingApplications: customersList.filter((c) => c.status === "pending").length,
      approvedApplications: customersList.filter((c) => c.status === "approved" || c.status === "installation_scheduled").length,
      completedInstallations: customersList.filter((c) => c.status === "completed").length,
    };
  }
  
  async getMilestonesByCustomerId(customerId: string): Promise<Milestone[]> {
    return db
      .select()
      .from(milestones)
      .where(eq(milestones.customerId, customerId))
      .orderBy(milestones.createdAt);
  }
  
  async createMilestone(insertMilestone: InsertMilestone): Promise<Milestone> {
    const [milestone] = await db
      .insert(milestones)
      .values(insertMilestone)
      .returning();
    return milestone;
  }
  
  async completeMilestone(id: string, notes?: string): Promise<Milestone | undefined> {
    const [milestone] = await db
      .update(milestones)
      .set({ 
        status: "completed", 
        completedAt: new Date(),
        notes: notes || null
      })
      .where(eq(milestones.id, id))
      .returning();
    return milestone || undefined;
  }
  
  async initializeCustomerMilestones(customerId: string): Promise<Milestone[]> {
    const existingMilestones = await this.getMilestonesByCustomerId(customerId);
    if (existingMilestones.length > 0) {
      return existingMilestones;
    }
    
    const createdMilestones: Milestone[] = [];
    for (const milestone of installationMilestones) {
      const created = await this.createMilestone({
        customerId,
        milestone: milestone.key,
        status: milestone.key === "application_submitted" ? "completed" : "pending",
        completedAt: milestone.key === "application_submitted" ? new Date() : null,
        notes: null,
      });
      createdMilestones.push(created);
    }
    return createdMilestones;
  }
  
  async getCommissionsByPartnerId(partnerId: string, partnerType?: string): Promise<Commission[]> {
    if (partnerType) {
      return db
        .select()
        .from(commissions)
        .where(and(
          eq(commissions.partnerId, partnerId),
          eq(commissions.partnerType, partnerType)
        ))
        .orderBy(desc(commissions.createdAt));
    }
    return db
      .select()
      .from(commissions)
      .where(eq(commissions.partnerId, partnerId))
      .orderBy(desc(commissions.createdAt));
  }
  
  async getCommissionSummaryByPartnerId(partnerId: string, partnerType?: string): Promise<{
    totalEarned: number;
    totalPending: number;
    totalPaid: number;
    totalInstallations: number;
  }> {
    const partnerCommissions = await this.getCommissionsByPartnerId(partnerId, partnerType);
    
    return {
      totalEarned: partnerCommissions.reduce((sum, c) => sum + c.commissionAmount, 0),
      totalPending: partnerCommissions
        .filter(c => c.status === "pending" || c.status === "approved")
        .reduce((sum, c) => sum + c.commissionAmount, 0),
      totalPaid: partnerCommissions
        .filter(c => c.status === "paid")
        .reduce((sum, c) => sum + c.commissionAmount, 0),
      totalInstallations: partnerCommissions.length,
    };
  }
  
  async createCommission(insertCommission: InsertCommission): Promise<Commission> {
    const [commission] = await db
      .insert(commissions)
      .values(insertCommission)
      .returning();
    return commission;
  }
  
  async updateCommissionStatus(id: string, status: string): Promise<Commission | undefined> {
    const updateData: any = { status };
    if (status === "paid") {
      updateData.paidAt = new Date();
    }
    
    const [commission] = await db
      .update(commissions)
      .set(updateData)
      .where(eq(commissions.id, id))
      .returning();
    return commission || undefined;
  }
  
  async createCommissionForCustomer(customerId: string, partnerId: string): Promise<{ ddpCommission: Commission | null; bdpCommission: Commission | null }> {
    const customer = await this.getCustomer(customerId);
    if (!customer || !customer.proposedCapacity) {
      return { ddpCommission: null, bdpCommission: null };
    }
    
    const capacityKw = Math.round(parseFloat(customer.proposedCapacity) || 0);
    if (capacityKw <= 0) {
      return { ddpCommission: null, bdpCommission: null };
    }
    
    let ddpCommission: Commission | null = null;
    let bdpCommission: Commission | null = null;
    
    // Check for existing DDP commission
    const existingDdpCommissions = await db
      .select()
      .from(commissions)
      .where(and(
        eq(commissions.customerId, customerId),
        eq(commissions.partnerId, partnerId),
        eq(commissions.partnerType, "ddp")
      ));
    
    const panelType = customer.panelType || "dcr";
    const ddpCommissionAmount = calculateCommission(capacityKw, panelType);
    
    if (existingDdpCommissions.length === 0) {
      // Create DDP commission
      ddpCommission = await this.createCommission({
        partnerId,
        partnerType: "ddp",
        customerId,
        source: "installation",
        capacityKw,
        commissionAmount: ddpCommissionAmount,
        status: "pending",
        paidAt: null,
        notes: null,
      });
      
      // Update incentive progress for DDP
      await this.updateIncentiveProgress(partnerId, 1, capacityKw);
    } else {
      ddpCommission = existingDdpCommissions[0];
    }
    
    // Always check and create BDP commission (even if DDP already existed)
    const ddp = await this.getUser(partnerId);
    if (ddp?.parentId) {
      const bdpCommissionAmount = calculateBdpCommission(capacityKw, panelType);
      
      // Check for existing BDP commission
      const existingBdpCommissions = await db
        .select()
        .from(commissions)
        .where(and(
          eq(commissions.customerId, customerId),
          eq(commissions.partnerId, ddp.parentId),
          eq(commissions.partnerType, "bdp")
        ));
      
      if (existingBdpCommissions.length === 0) {
        bdpCommission = await this.createCommission({
          partnerId: ddp.parentId,
          partnerType: "bdp",
          customerId,
          source: "installation",
          capacityKw,
          commissionAmount: bdpCommissionAmount,
          status: "pending",
          paidAt: null,
          notes: null,
        });
        
        // Update incentive progress for BDP
        await this.updateIncentiveProgress(ddp.parentId, 1, capacityKw);
      } else {
        bdpCommission = existingBdpCommissions[0];
      }
    }
    
    return { ddpCommission, bdpCommission };
  }

  // Admin operations
  async getAdminStats(): Promise<{
    totalBDPs: number;
    totalDDPs: number;
    totalCustomers: number;
    pendingPartners: number;
    completedInstallations: number;
    totalCommissions: number;
    pendingCommissions: number;
  }> {
    const [bdpCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.role, "bdp"));
    
    const [ddpCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.role, "ddp"));
    
    const [customerCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers);
    
    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(
        eq(users.status, "pending"),
        sql`${users.role} IN ('bdp', 'ddp')`
      ));
    
    const [completedCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(eq(customers.status, "completed"));
    
    const [totalCommissionsResult] = await db
      .select({ sum: sql<number>`COALESCE(SUM(commission_amount), 0)::int` })
      .from(commissions);
    
    const [pendingCommissionsResult] = await db
      .select({ sum: sql<number>`COALESCE(SUM(commission_amount), 0)::int` })
      .from(commissions)
      .where(eq(commissions.status, "pending"));
    
    return {
      totalBDPs: bdpCount?.count || 0,
      totalDDPs: ddpCount?.count || 0,
      totalCustomers: customerCount?.count || 0,
      pendingPartners: pendingCount?.count || 0,
      completedInstallations: completedCount?.count || 0,
      totalCommissions: totalCommissionsResult?.sum || 0,
      pendingCommissions: pendingCommissionsResult?.sum || 0,
    };
  }

  async getAllPartners(): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(sql`${users.role} IN ('bdp', 'ddp')`)
      .orderBy(desc(users.createdAt));
  }

  async getRecentPartners(limit: number): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(sql`${users.role} IN ('bdp', 'ddp')`)
      .orderBy(desc(users.createdAt))
      .limit(limit);
  }

  async getAllCustomers(): Promise<Customer[]> {
    return db
      .select()
      .from(customers)
      .orderBy(desc(customers.createdAt));
  }

  async getRecentCustomers(limit: number): Promise<Customer[]> {
    return db
      .select()
      .from(customers)
      .orderBy(desc(customers.createdAt))
      .limit(limit);
  }

  // Bank Account operations
  async getBankAccountByPartnerId(partnerId: string): Promise<BankAccount | undefined> {
    const [account] = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.partnerId, partnerId));
    return account || undefined;
  }

  async createBankAccount(insertBankAccount: InsertBankAccount): Promise<BankAccount> {
    const [account] = await db
      .insert(bankAccounts)
      .values(insertBankAccount)
      .returning();
    return account;
  }

  async updateBankAccount(partnerId: string, data: Partial<BankAccount>): Promise<BankAccount | undefined> {
    const [account] = await db
      .update(bankAccounts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bankAccounts.partnerId, partnerId))
      .returning();
    return account || undefined;
  }

  // Payout operations
  async getPayoutsByPartnerId(partnerId: string): Promise<Payout[]> {
    return db
      .select()
      .from(payouts)
      .where(eq(payouts.partnerId, partnerId))
      .orderBy(desc(payouts.createdAt));
  }

  async getAllPayouts(): Promise<Payout[]> {
    return db
      .select()
      .from(payouts)
      .orderBy(desc(payouts.createdAt));
  }

  async getPendingPayouts(): Promise<Payout[]> {
    return db
      .select()
      .from(payouts)
      .where(eq(payouts.status, "pending"))
      .orderBy(desc(payouts.createdAt));
  }

  async createPayout(insertPayout: InsertPayout): Promise<Payout> {
    const [payout] = await db
      .insert(payouts)
      .values(insertPayout)
      .returning();
    return payout;
  }

  async updatePayout(id: string, data: Partial<Payout>): Promise<Payout | undefined> {
    const [payout] = await db
      .update(payouts)
      .set(data)
      .where(eq(payouts.id, id))
      .returning();
    return payout || undefined;
  }

  async getAllCommissions(): Promise<Commission[]> {
    return db
      .select()
      .from(commissions)
      .orderBy(desc(commissions.createdAt));
  }

  async getApprovedCommissions(): Promise<Commission[]> {
    return db
      .select()
      .from(commissions)
      .where(eq(commissions.status, "approved"))
      .orderBy(desc(commissions.createdAt));
  }

  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt));
  }

  async getActiveProducts(): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(eq(products.isActive, "active"))
      .orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return true;
  }

  // Order operations
  async getAllOrders(): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrderByRazorpayId(razorpayOrderId: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.razorpayOrderId, razorpayOrderId));
    return order || undefined;
  }

  async getOrdersByDdpId(ddpId: string): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .where(eq(orders.ddpId, ddpId))
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async updateOrder(id: string, data: Partial<Order>): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  // Order Item operations
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(insertItem: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db
      .insert(orderItems)
      .values(insertItem)
      .returning();
    return item;
  }

  // Payment operations
  async getAllPayments(): Promise<Payment[]> {
    return db
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt));
  }

  async getPaymentsByOrderId(orderId: string): Promise<Payment[]> {
    return db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(desc(payments.createdAt));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async updatePayment(id: string, data: Partial<Payment>): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set(data)
      .where(eq(payments.id, id))
      .returning();
    return payment || undefined;
  }

  async getPaymentByRazorpayId(razorpayPaymentId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.razorpayPaymentId, razorpayPaymentId));
    return payment || undefined;
  }

  // Feedback operations
  async getAllFeedback(): Promise<Feedback[]> {
    return db
      .select()
      .from(feedback)
      .orderBy(desc(feedback.createdAt));
  }

  async getFeedbackByUserId(userId: string): Promise<Feedback[]> {
    return db
      .select()
      .from(feedback)
      .where(eq(feedback.userId, userId))
      .orderBy(desc(feedback.createdAt));
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db
      .insert(feedback)
      .values(insertFeedback)
      .returning();
    return newFeedback;
  }

  async updateFeedbackStatus(id: string, status: string, adminNotes?: string): Promise<Feedback | undefined> {
    const [updated] = await db
      .update(feedback)
      .set({ status, adminNotes, updatedAt: new Date() })
      .where(eq(feedback.id, id))
      .returning();
    return updated || undefined;
  }

  // Notification operations
  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, "false")));
    return Number(result[0]?.count || 0);
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async markNotificationRead(id: string): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: "true" })
      .where(eq(notifications.id, id))
      .returning();
    return notification || undefined;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: "true" })
      .where(eq(notifications.userId, userId));
  }

  // User Preferences operations
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return prefs || undefined;
  }

  async createOrUpdateUserPreferences(userId: string, data: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(userId);
    if (existing) {
      const [updated] = await db
        .update(userPreferences)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userPreferences.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userPreferences)
        .values({ userId, ...data })
        .returning();
      return created;
    }
  }

  // Partner of the Month operations
  async getCurrentPartnerOfMonth(): Promise<(PartnerOfMonth & { partner?: User }) | undefined> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const [pom] = await db
      .select()
      .from(partnerOfMonth)
      .where(and(eq(partnerOfMonth.month, currentMonth), eq(partnerOfMonth.year, currentYear)));
    
    if (!pom) return undefined;
    
    const partner = await this.getUser(pom.partnerId);
    return { ...pom, partner };
  }

  async getAllPartnersOfMonth(): Promise<(PartnerOfMonth & { partner?: User })[]> {
    const poms = await db
      .select()
      .from(partnerOfMonth)
      .orderBy(desc(partnerOfMonth.year), desc(partnerOfMonth.month));
    
    const result = [];
    for (const pom of poms) {
      const partner = await this.getUser(pom.partnerId);
      result.push({ ...pom, partner });
    }
    return result;
  }

  async createPartnerOfMonth(data: InsertPartnerOfMonth): Promise<PartnerOfMonth> {
    const [pom] = await db
      .insert(partnerOfMonth)
      .values(data)
      .returning();
    return pom;
  }

  // Chatbot FAQ operations
  async getActiveFaqs(): Promise<ChatbotFaq[]> {
    return db
      .select()
      .from(chatbotFaq)
      .where(eq(chatbotFaq.isActive, "active"))
      .orderBy(chatbotFaq.sortOrder, chatbotFaq.category);
  }

  async getAllFaqs(): Promise<ChatbotFaq[]> {
    return db
      .select()
      .from(chatbotFaq)
      .orderBy(chatbotFaq.sortOrder, chatbotFaq.category);
  }

  async createFaq(insertFaq: InsertChatbotFaq): Promise<ChatbotFaq> {
    const [faq] = await db
      .insert(chatbotFaq)
      .values(insertFaq)
      .returning();
    return faq;
  }

  async updateFaq(id: string, data: Partial<ChatbotFaq>): Promise<ChatbotFaq | undefined> {
    const [faq] = await db
      .update(chatbotFaq)
      .set(data)
      .where(eq(chatbotFaq.id, id))
      .returning();
    return faq || undefined;
  }

  async deleteFaq(id: string): Promise<boolean> {
    const result = await db.delete(chatbotFaq).where(eq(chatbotFaq.id, id));
    return true;
  }

  async searchFaqs(query: string): Promise<ChatbotFaq[]> {
    const lowerQuery = query.toLowerCase();
    const allFaqs = await this.getActiveFaqs();
    return allFaqs.filter(faq => 
      faq.question.toLowerCase().includes(lowerQuery) ||
      faq.answer.toLowerCase().includes(lowerQuery) ||
      faq.keywords?.some(k => k.toLowerCase().includes(lowerQuery))
    );
  }

  // Incentive Target operations
  async getIncentiveTargetsByPartnerId(partnerId: string, month?: number, year?: number): Promise<IncentiveTarget[]> {
    if (month && year) {
      return db
        .select()
        .from(incentiveTargets)
        .where(and(
          eq(incentiveTargets.partnerId, partnerId),
          eq(incentiveTargets.month, month),
          eq(incentiveTargets.year, year)
        ))
        .orderBy(desc(incentiveTargets.year), desc(incentiveTargets.month));
    }
    return db
      .select()
      .from(incentiveTargets)
      .where(eq(incentiveTargets.partnerId, partnerId))
      .orderBy(desc(incentiveTargets.year), desc(incentiveTargets.month));
  }

  async getCurrentIncentiveTarget(partnerId: string): Promise<IncentiveTarget | undefined> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const [target] = await db
      .select()
      .from(incentiveTargets)
      .where(and(
        eq(incentiveTargets.partnerId, partnerId),
        eq(incentiveTargets.month, currentMonth),
        eq(incentiveTargets.year, currentYear)
      ));
    
    // If no target exists for current month, create one
    if (!target) {
      const partner = await this.getUser(partnerId);
      const defaults = partner?.role === "bdp" ? defaultIncentiveTargets.bdp : defaultIncentiveTargets.ddp;
      
      const [newTarget] = await db
        .insert(incentiveTargets)
        .values({
          partnerId,
          partnerType: partner?.role || "ddp",
          month: currentMonth,
          year: currentYear,
          targetInstallations: defaults.installations,
          targetCapacityKw: defaults.capacityKw,
          achievedInstallations: 0,
          achievedCapacityKw: 0,
          bonusAmount: 0,
          status: "active",
        })
        .returning();
      
      return newTarget;
    }
    
    return target;
  }

  async createIncentiveTarget(target: InsertIncentiveTarget): Promise<IncentiveTarget> {
    const [newTarget] = await db
      .insert(incentiveTargets)
      .values(target)
      .returning();
    return newTarget;
  }

  async updateIncentiveProgress(partnerId: string, installations: number, capacityKw: number): Promise<IncentiveTarget | undefined> {
    const target = await this.getCurrentIncentiveTarget(partnerId);
    if (!target) return undefined;
    
    const newAchievedInstallations = target.achievedInstallations + installations;
    const newAchievedCapacityKw = target.achievedCapacityKw + capacityKw;
    
    // Check if target is achieved
    const targetAchieved = newAchievedInstallations >= target.targetInstallations && 
                           newAchievedCapacityKw >= target.targetCapacityKw;
    
    const partner = await this.getUser(partnerId);
    const defaults = partner?.role === "bdp" ? defaultIncentiveTargets.bdp : defaultIncentiveTargets.ddp;
    
    const [updated] = await db
      .update(incentiveTargets)
      .set({
        achievedInstallations: newAchievedInstallations,
        achievedCapacityKw: newAchievedCapacityKw,
        status: targetAchieved ? "achieved" : "active",
        bonusAmount: targetAchieved ? defaults.bonusAmount : 0,
        updatedAt: new Date(),
      })
      .where(eq(incentiveTargets.id, target.id))
      .returning();
    
    // If target achieved, create bonus commission
    if (targetAchieved && target.status !== "achieved") {
      await this.createCommission({
        partnerId,
        partnerType: partner?.role || "ddp",
        source: "bonus",
        capacityKw: newAchievedCapacityKw,
        commissionAmount: defaults.bonusAmount,
        status: "pending",
        notes: `Monthly target bonus for ${target.month}/${target.year}`,
      });
      
      // Create notification
      await this.createNotification({
        userId: partnerId,
        type: "commission_earned",
        title: "Monthly Target Achieved!",
        message: `Congratulations! You've achieved your monthly target and earned a bonus of Rs ${defaults.bonusAmount.toLocaleString()}.`,
      });
    }
    
    return updated;
  }

  // Performance Metrics operations
  async getPerformanceMetrics(partnerId: string, month?: number, year?: number): Promise<PerformanceMetrics[]> {
    if (month && year) {
      return db
        .select()
        .from(performanceMetrics)
        .where(and(
          eq(performanceMetrics.partnerId, partnerId),
          eq(performanceMetrics.month, month),
          eq(performanceMetrics.year, year)
        ));
    }
    return db
      .select()
      .from(performanceMetrics)
      .where(eq(performanceMetrics.partnerId, partnerId))
      .orderBy(desc(performanceMetrics.year), desc(performanceMetrics.month));
  }

  async getMonthlyPerformance(partnerId: string, months: number): Promise<PerformanceMetrics[]> {
    return db
      .select()
      .from(performanceMetrics)
      .where(eq(performanceMetrics.partnerId, partnerId))
      .orderBy(desc(performanceMetrics.year), desc(performanceMetrics.month))
      .limit(months);
  }

  // Enhanced commission summary with breakdown
  async getEnhancedCommissionSummary(partnerId: string, partnerType?: string): Promise<{
    totalEarned: number;
    totalPending: number;
    totalPaid: number;
    totalInstallations: number;
    installationCommission: number;
    inverterCommission: number;
    bonusCommission: number;
    currentMonthEarnings: number;
  }> {
    const allCommissions = await this.getCommissionsByPartnerId(partnerId, partnerType);
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    let totalEarned = 0;
    let totalPending = 0;
    let totalPaid = 0;
    let totalInstallations = 0;
    let installationCommission = 0;
    let inverterCommission = 0;
    let bonusCommission = 0;
    let currentMonthEarnings = 0;
    
    for (const c of allCommissions) {
      const amount = c.commissionAmount || 0;
      totalEarned += amount;
      
      if (c.status === "pending" || c.status === "approved") {
        totalPending += amount;
      } else if (c.status === "paid") {
        totalPaid += amount;
      }
      
      // Break down by source
      const source = (c as any).source || "installation";
      if (source === "installation") {
        installationCommission += amount;
        totalInstallations++;
      } else if (source === "inverter") {
        inverterCommission += amount;
      } else if (source === "bonus") {
        bonusCommission += amount;
      }
      
      // Check if commission is from current month
      const commissionDate = new Date(c.createdAt!);
      if (commissionDate.getMonth() + 1 === currentMonth && commissionDate.getFullYear() === currentYear) {
        currentMonthEarnings += amount;
      }
    }
    
    return {
      totalEarned,
      totalPending,
      totalPaid,
      totalInstallations,
      installationCommission,
      inverterCommission,
      bonusCommission,
      currentMonthEarnings,
    };
  }
}

export const storage = new DatabaseStorage();
