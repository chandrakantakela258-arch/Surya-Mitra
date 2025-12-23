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
  newsPosts,
  panelModels,
  leaderboard,
  referrals,
  notificationTemplates,
  vendors,
  customerVendorAssignments,
  siteExpenses,
  bankLoanSubmissions,
  customerFileSubmissions,
  passwordResetOtps,
  customerSessions,
  documents,
  type User, 
  type InsertUser, 
  type Customer,
  type CustomerWithPartnerInfo,
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
  type NewsPost,
  type InsertNewsPost,
  type PanelModel,
  type InsertPanelModel,
  type Leaderboard,
  type InsertLeaderboard,
  type Referral,
  type InsertReferral,
  type NotificationTemplate,
  type InsertNotificationTemplate,
  type Vendor,
  type InsertVendor,
  type CustomerVendorAssignment,
  type InsertCustomerVendorAssignment,
  type SiteExpense,
  type InsertSiteExpense,
  type BankLoanSubmission,
  type InsertBankLoanSubmission,
  type CustomerFileSubmission,
  type InsertCustomerFileSubmission,
  type PasswordResetOtp,
  type InsertPasswordResetOtp,
  type BankLoanApproval,
  type InsertBankLoanApproval,
  bankLoanApprovals,
  type LoanDisbursement,
  type InsertLoanDisbursement,
  loanDisbursements,
  type VendorPurchaseOrder,
  type InsertVendorPurchaseOrder,
  vendorPurchaseOrders,
  type GoodsDelivery,
  type InsertGoodsDelivery,
  goodsDeliveries,
  type SiteExecutionOrder,
  type InsertSiteExecutionOrder,
  siteExecutionOrders,
  type SiteExecutionCompletionReport,
  type InsertSiteExecutionCompletionReport,
  siteExecutionCompletionReports,
  type SiteSurvey,
  type InsertSiteSurvey,
  siteSurveys,
  type MeterInstallationReport,
  type InsertMeterInstallationReport,
  meterInstallationReports,
  type PortalSubmissionReport,
  type InsertPortalSubmissionReport,
  remainingPaymentReports,
  type RemainingPaymentReport,
  type InsertRemainingPaymentReport,
  subsidyApplicationReports,
  type SubsidyApplicationReport,
  type InsertSubsidyApplicationReport,
  subsidyDisbursementReports,
  type SubsidyDisbursementReport,
  type InsertSubsidyDisbursementReport,
  portalSubmissionReports,
  installationMilestones,
  calculateCommission,
  calculateBdpCommission,
  defaultIncentiveTargets,
  type Document as DocumentType,
  type InsertDocument,
  serviceRequests,
  type ServiceRequest,
  type InsertServiceRequest,
  customerTestimonials,
  type CustomerTestimonial,
  type InsertCustomerTestimonial,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray, isNull, not, or, lt, asc } from "drizzle-orm";

export interface IStorage {
  // User/Partner operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  deleteUser(id: string): Promise<boolean>;
  updateUserStatus(id: string, status: string): Promise<User | undefined>;
  updateUserPassword(id: string, password: string): Promise<User | undefined>;
  
  // BDP operations - get their DDPs
  getPartnersByParentId(parentId: string): Promise<User[]>;
  
  // Customer operations
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  getCustomersByDdpId(ddpId: string): Promise<Customer[]>;
  getAllCustomersByBdpId(bdpId: string): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, data: Partial<Customer>): Promise<Customer | undefined>;
  updateCustomerStatus(id: string, status: string): Promise<Customer | undefined>;
  
  // Customer Portal Session operations
  createCustomerSession(session: { customerId: string; sessionToken: string; expiresAt: Date }): Promise<void>;
  getCustomerSessionByToken(token: string): Promise<{ customerId: string; expiresAt: Date } | undefined>;
  deleteCustomerSession(token: string): Promise<void>;
  
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
  getAllUsers(): Promise<User[]>;
  getRecentPartners(limit: number): Promise<User[]>;
  getAllCustomers(): Promise<Customer[]>;
  getAllCustomersWithPartnerInfo(): Promise<CustomerWithPartnerInfo[]>;
  getCustomersByDdpIdWithPartnerInfo(ddpId: string): Promise<CustomerWithPartnerInfo[]>;
  getAllCustomersByBdpIdWithPartnerInfo(bdpId: string): Promise<CustomerWithPartnerInfo[]>;
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
  
  // News & Updates operations
  getAllNewsPosts(): Promise<NewsPost[]>;
  getPublishedNewsPosts(): Promise<NewsPost[]>;
  getNewsPost(id: string): Promise<NewsPost | undefined>;
  getNewsPostBySlug(slug: string): Promise<NewsPost | undefined>;
  createNewsPost(post: InsertNewsPost): Promise<NewsPost>;
  updateNewsPost(id: string, data: Partial<NewsPost>): Promise<NewsPost | undefined>;
  deleteNewsPost(id: string): Promise<boolean>;
  incrementNewsViewCount(id: string): Promise<void>;
  
  // Panel Models operations
  getAllPanelModels(): Promise<PanelModel[]>;
  getActivePanelModels(): Promise<PanelModel[]>;
  getPanelModel(id: string): Promise<PanelModel | undefined>;
  createPanelModel(model: InsertPanelModel): Promise<PanelModel>;
  updatePanelModel(id: string, data: Partial<PanelModel>): Promise<PanelModel | undefined>;
  deletePanelModel(id: string): Promise<boolean>;
  
  // Leaderboard operations
  getLeaderboard(period: string, year: number, month?: number): Promise<(Leaderboard & { partner?: User })[]>;
  updateLeaderboard(period: string, year: number, month?: number): Promise<void>;
  
  // Referral operations
  getReferralsByReferrerId(referrerId: string): Promise<Referral[]>;
  getReferralByCode(code: string): Promise<Referral | undefined>;
  getReferralByReferredPartnerId(partnerId: string): Promise<Referral | undefined>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  updateReferralStatus(id: string, status: string, conversionDate?: Date): Promise<Referral | undefined>;
  updatePartnerReferralInstallationCount(referralId: string, count: number): Promise<Referral | undefined>;
  checkAndConvertPartnerReferral(partnerId: string): Promise<{ converted: boolean; referral?: Referral }>;
  generateReferralCode(partnerId: string): Promise<string>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
  updateUserReferralCode(userId: string, code: string): Promise<User | undefined>;
  
  // Notification Template operations
  getAllNotificationTemplates(): Promise<NotificationTemplate[]>;
  getActiveNotificationTemplates(): Promise<NotificationTemplate[]>;
  getNotificationTemplateByTrigger(trigger: string, triggerValue?: string): Promise<NotificationTemplate[]>;
  createNotificationTemplate(template: InsertNotificationTemplate): Promise<NotificationTemplate>;
  updateNotificationTemplate(id: string, data: Partial<NotificationTemplate>): Promise<NotificationTemplate | undefined>;
  deleteNotificationTemplate(id: string): Promise<boolean>;
  
  // Map data operations
  getInstallationLocations(): Promise<{ state: string; district: string; count: number; latitude?: string; longitude?: string }[]>;
  getCustomersWithLocations(): Promise<Customer[]>;
  getAllCustomersWithLocations(): Promise<Customer[]>;
  getPartnersForMap(): Promise<User[]>;
  updateCustomerLocation(id: string, latitude: string, longitude: string): Promise<Customer | undefined>;
  
  // Site media operations
  updateCustomerSiteMedia(id: string, sitePictures?: string[], siteVideo?: string): Promise<Customer | undefined>;
  
  // Lead scoring operations
  updateCustomerLeadScore(id: string, score: number, details: string): Promise<Customer | undefined>;
  
  // Vendor operations
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  getVendors(): Promise<Vendor[]>;
  getVendorsByType(vendorType: string): Promise<Vendor[]>;
  getApprovedVendors(): Promise<Vendor[]>;
  getVendor(id: string): Promise<Vendor | undefined>;
  updateVendorStatus(id: string, status: string, notes?: string): Promise<Vendor | undefined>;
  
  // Vendor Assignment operations
  createVendorAssignment(assignment: InsertCustomerVendorAssignment): Promise<CustomerVendorAssignment>;
  getVendorAssignmentsByCustomer(customerId: string): Promise<CustomerVendorAssignment[]>;
  getVendorAssignmentsByVendor(vendorId: string): Promise<CustomerVendorAssignment[]>;
  updateVendorAssignment(id: string, data: Partial<CustomerVendorAssignment>): Promise<CustomerVendorAssignment | undefined>;
  deleteVendorAssignment(id: string): Promise<void>;
  
  // Site Expense operations
  createSiteExpense(expense: InsertSiteExpense): Promise<SiteExpense>;
  getSiteExpenses(): Promise<SiteExpense[]>;
  getSiteExpense(id: string): Promise<SiteExpense | undefined>;
  getSiteExpenseByCustomerId(customerId: string): Promise<SiteExpense | undefined>;
  getSiteExpenseBySiteId(siteId: string): Promise<SiteExpense | undefined>;
  updateSiteExpense(id: string, data: Partial<SiteExpense>): Promise<SiteExpense | undefined>;
  generateSiteId(): Promise<string>;
  
  // Bank Loan Submission operations
  createBankLoanSubmission(submission: InsertBankLoanSubmission): Promise<BankLoanSubmission>;
  getBankLoanSubmissions(): Promise<BankLoanSubmission[]>;
  getBankLoanSubmission(id: string): Promise<BankLoanSubmission | undefined>;
  getBankLoanSubmissionsByCustomerId(customerId: string): Promise<BankLoanSubmission[]>;
  updateBankLoanSubmission(id: string, data: Partial<BankLoanSubmission>): Promise<BankLoanSubmission | undefined>;
  deleteBankLoanSubmission(id: string): Promise<void>;
  
  // Customer File Submission operations (Step 1 of Customer Journey)
  createCustomerFileSubmission(submission: InsertCustomerFileSubmission): Promise<CustomerFileSubmission>;
  getCustomerFileSubmissions(): Promise<CustomerFileSubmission[]>;
  getCustomerFileSubmission(id: string): Promise<CustomerFileSubmission | undefined>;
  getCustomerFileSubmissionsByCustomerId(customerId: string): Promise<CustomerFileSubmission[]>;
  updateCustomerFileSubmission(id: string, data: Partial<CustomerFileSubmission>): Promise<CustomerFileSubmission | undefined>;
  deleteCustomerFileSubmission(id: string): Promise<void>;
  
  // Bank Loan Approval operations (Step 3 of Customer Journey)
  createBankLoanApproval(approval: InsertBankLoanApproval): Promise<BankLoanApproval>;
  getBankLoanApprovals(): Promise<BankLoanApproval[]>;
  getBankLoanApproval(id: string): Promise<BankLoanApproval | undefined>;
  getBankLoanApprovalsByCustomerId(customerId: string): Promise<BankLoanApproval[]>;
  updateBankLoanApproval(id: string, data: Partial<BankLoanApproval>): Promise<BankLoanApproval | undefined>;
  deleteBankLoanApproval(id: string): Promise<void>;
  
  // Loan Disbursement operations (Step 4 of Customer Journey)
  createLoanDisbursement(disbursement: InsertLoanDisbursement): Promise<LoanDisbursement>;
  getLoanDisbursements(): Promise<LoanDisbursement[]>;
  getLoanDisbursement(id: string): Promise<LoanDisbursement | undefined>;
  getLoanDisbursementsByCustomerId(customerId: string): Promise<LoanDisbursement[]>;
  updateLoanDisbursement(id: string, data: Partial<LoanDisbursement>): Promise<LoanDisbursement | undefined>;
  deleteLoanDisbursement(id: string): Promise<void>;
  
  // Password Reset OTP operations
  createPasswordResetOtp(otp: InsertPasswordResetOtp): Promise<PasswordResetOtp>;
  getPasswordResetOtp(phone: string): Promise<PasswordResetOtp | undefined>;
  markPasswordResetOtpUsed(id: string): Promise<void>;
  deleteExpiredPasswordResetOtps(): Promise<void>;
  
  // Document Management operations
  createDocument(doc: InsertDocument): Promise<DocumentType>;
  getDocument(id: string): Promise<DocumentType | undefined>;
  getDocumentsByCustomerId(customerId: string): Promise<DocumentType[]>;
  getDocumentsByPartnerId(partnerId: string): Promise<DocumentType[]>;
  getAllDocuments(): Promise<DocumentType[]>;
  updateDocument(id: string, data: Partial<DocumentType>): Promise<DocumentType | undefined>;
  verifyDocument(id: string, verifiedById: string): Promise<DocumentType | undefined>;
  deleteDocument(id: string): Promise<boolean>;
  
  // Service Request operations
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  getServiceRequests(): Promise<ServiceRequest[]>;
  getServiceRequest(id: string): Promise<ServiceRequest | undefined>;
  getServiceRequestsByCustomerId(customerId: string): Promise<ServiceRequest[]>;
  updateServiceRequest(id: string, data: Partial<ServiceRequest>): Promise<ServiceRequest | undefined>;
  assignServiceRequestToVendor(id: string, vendorId: string, assignedBy: string, scheduledVisitDate?: Date): Promise<ServiceRequest | undefined>;
  recordServiceResolution(id: string, data: { vendorNotes?: string; resolutionNotes?: string; vendorSelfieWithCustomer?: string; resolutionPhotos?: string[] }): Promise<ServiceRequest | undefined>;
  submitServiceFeedback(id: string, rating: number, feedbackText?: string): Promise<ServiceRequest | undefined>;
  generateServiceRequestNumber(): Promise<string>;
  
  // Customer Testimonial operations
  createCustomerTestimonial(testimonial: InsertCustomerTestimonial): Promise<CustomerTestimonial>;
  getCustomerTestimonials(): Promise<CustomerTestimonial[]>;
  getApprovedTestimonials(): Promise<CustomerTestimonial[]>;
  getFeaturedTestimonials(): Promise<CustomerTestimonial[]>;
  getCustomerTestimonial(id: string): Promise<CustomerTestimonial | undefined>;
  getTestimonialsByCustomerId(customerId: string): Promise<CustomerTestimonial[]>;
  updateCustomerTestimonial(id: string, data: Partial<CustomerTestimonial>): Promise<CustomerTestimonial | undefined>;
  approveTestimonial(id: string, approvedBy: string): Promise<CustomerTestimonial | undefined>;
  markTestimonialShared(id: string, platform: 'facebook' | 'instagram'): Promise<CustomerTestimonial | undefined>;
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

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async updateUserStatus(id: string, status: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ status })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserPassword(id: string, password: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ password })
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

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.phone, phone));
    return customer || undefined;
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer | undefined> {
    const [customer] = await db
      .update(customers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return customer || undefined;
  }

  async getCustomersByDdpId(ddpId: string): Promise<Customer[]> {
    // Exclude independent customers (website_direct) - they are admin-only
    return db
      .select()
      .from(customers)
      .where(and(
        eq(customers.ddpId, ddpId),
        or(
          isNull(customers.source),
          not(eq(customers.source, "website_direct"))
        )
      ))
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
    // Exclude independent customers (website_direct) - they are admin-only
    const allCustomers = await db
      .select()
      .from(customers)
      .where(and(
        inArray(customers.ddpId, ddpIds),
        or(
          isNull(customers.source),
          not(eq(customers.source, "website_direct"))
        )
      ))
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

  // Customer Portal Session operations
  async createCustomerSession(session: { customerId: string; sessionToken: string; expiresAt: Date }): Promise<void> {
    await db.insert(customerSessions).values({
      customerId: session.customerId,
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
    });
  }

  async getCustomerSessionByToken(token: string): Promise<{ customerId: string; expiresAt: Date } | undefined> {
    const [session] = await db
      .select()
      .from(customerSessions)
      .where(eq(customerSessions.sessionToken, token));
    return session ? { customerId: session.customerId, expiresAt: session.expiresAt } : undefined;
  }

  async deleteCustomerSession(token: string): Promise<void> {
    await db.delete(customerSessions).where(eq(customerSessions.sessionToken, token));
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

  async getAllUsers(): Promise<User[]> {
    return db
      .select()
      .from(users)
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

  async getAllCustomersWithPartnerInfo(): Promise<CustomerWithPartnerInfo[]> {
    const customerList = await db
      .select()
      .from(customers)
      .orderBy(desc(customers.createdAt));
    
    return this.enrichCustomersWithPartnerInfo(customerList);
  }

  async getCustomersByDdpIdWithPartnerInfo(ddpId: string): Promise<CustomerWithPartnerInfo[]> {
    const customerList = await db
      .select()
      .from(customers)
      .where(and(
        eq(customers.ddpId, ddpId),
        or(
          isNull(customers.source),
          not(eq(customers.source, "website_direct"))
        )
      ))
      .orderBy(desc(customers.createdAt));
    
    return this.enrichCustomersWithPartnerInfo(customerList);
  }

  async getAllCustomersByBdpIdWithPartnerInfo(bdpId: string): Promise<CustomerWithPartnerInfo[]> {
    const ddps = await this.getPartnersByParentId(bdpId);
    const ddpIds = ddps.map((d) => d.id);
    
    if (ddpIds.length === 0) {
      return [];
    }
    
    const customerList = await db
      .select()
      .from(customers)
      .where(and(
        inArray(customers.ddpId, ddpIds),
        or(
          isNull(customers.source),
          not(eq(customers.source, "website_direct"))
        )
      ))
      .orderBy(desc(customers.createdAt));
    
    return this.enrichCustomersWithPartnerInfo(customerList);
  }

  private async enrichCustomersWithPartnerInfo(customerList: Customer[]): Promise<CustomerWithPartnerInfo[]> {
    if (customerList.length === 0) {
      return [];
    }
    
    // Get unique DDP IDs
    const ddpIds = Array.from(new Set(customerList.map((c) => c.ddpId)));
    
    // Fetch all DDPs in one query
    const ddpUsers = await db
      .select()
      .from(users)
      .where(inArray(users.id, ddpIds));
    
    // Get unique BDP IDs from the DDPs
    const bdpIds = Array.from(new Set(ddpUsers.map((d) => d.parentId).filter((id): id is string => id !== null)));
    
    // Fetch all BDPs in one query
    const bdpUsers = bdpIds.length > 0 
      ? await db.select().from(users).where(inArray(users.id, bdpIds))
      : [];
    
    // Create lookup maps
    const ddpMap = new Map(ddpUsers.map((d) => [d.id, d]));
    const bdpMap = new Map(bdpUsers.map((b) => [b.id, b]));
    
    // Enrich customers with partner info
    return customerList.map((customer) => {
      const ddp = ddpMap.get(customer.ddpId);
      const bdp = ddp?.parentId ? bdpMap.get(ddp.parentId) : undefined;
      
      return {
        ...customer,
        ddpName: ddp?.name || null,
        ddpPhone: ddp?.phone || null,
        bdpName: bdp?.name || null,
        bdpPhone: bdp?.phone || null,
      };
    });
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

  // ===== NEWS & UPDATES OPERATIONS =====
  async getAllNewsPosts(): Promise<NewsPost[]> {
    return await db.select().from(newsPosts).orderBy(desc(newsPosts.createdAt));
  }

  async getPublishedNewsPosts(): Promise<NewsPost[]> {
    return await db.select().from(newsPosts)
      .where(eq(newsPosts.isPublished, "true"))
      .orderBy(desc(newsPosts.publishedAt));
  }

  async getNewsPost(id: string): Promise<NewsPost | undefined> {
    const [post] = await db.select().from(newsPosts).where(eq(newsPosts.id, id));
    return post || undefined;
  }

  async getNewsPostBySlug(slug: string): Promise<NewsPost | undefined> {
    const [post] = await db.select().from(newsPosts).where(eq(newsPosts.slug, slug));
    return post || undefined;
  }

  async createNewsPost(post: InsertNewsPost): Promise<NewsPost> {
    const [created] = await db.insert(newsPosts).values(post).returning();
    return created;
  }

  async updateNewsPost(id: string, data: Partial<NewsPost>): Promise<NewsPost | undefined> {
    const [updated] = await db.update(newsPosts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(newsPosts.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteNewsPost(id: string): Promise<boolean> {
    const result = await db.delete(newsPosts).where(eq(newsPosts.id, id));
    return true;
  }

  async incrementNewsViewCount(id: string): Promise<void> {
    await db.update(newsPosts)
      .set({ viewCount: sql`COALESCE(${newsPosts.viewCount}, 0) + 1` })
      .where(eq(newsPosts.id, id));
  }

  // ===== PANEL MODELS OPERATIONS =====
  async getAllPanelModels(): Promise<PanelModel[]> {
    return await db.select().from(panelModels).orderBy(panelModels.sortOrder);
  }

  async getActivePanelModels(): Promise<PanelModel[]> {
    return await db.select().from(panelModels)
      .where(eq(panelModels.isActive, "active"))
      .orderBy(panelModels.sortOrder);
  }

  async getPanelModel(id: string): Promise<PanelModel | undefined> {
    const [model] = await db.select().from(panelModels).where(eq(panelModels.id, id));
    return model || undefined;
  }

  async createPanelModel(model: InsertPanelModel): Promise<PanelModel> {
    const [created] = await db.insert(panelModels).values(model).returning();
    return created;
  }

  async updatePanelModel(id: string, data: Partial<PanelModel>): Promise<PanelModel | undefined> {
    const [updated] = await db.update(panelModels)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(panelModels.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePanelModel(id: string): Promise<boolean> {
    await db.delete(panelModels).where(eq(panelModels.id, id));
    return true;
  }

  // ===== LEADERBOARD OPERATIONS =====
  async getLeaderboard(period: string, year: number, month?: number): Promise<(Leaderboard & { partner?: User })[]> {
    let conditions = and(
      eq(leaderboard.period, period),
      eq(leaderboard.year, year)
    );
    
    if (month !== undefined) {
      conditions = and(conditions, eq(leaderboard.month, month));
    }
    
    const entries = await db.select().from(leaderboard)
      .where(conditions!)
      .orderBy(leaderboard.rank);
    
    // Fetch partner details for each entry
    const result: (Leaderboard & { partner?: User })[] = [];
    for (const entry of entries) {
      const partner = await this.getUser(entry.partnerId);
      result.push({ ...entry, partner });
    }
    
    return result;
  }

  async updateLeaderboard(period: string, year: number, month?: number): Promise<void> {
    // Get all approved partners with their performance
    const partners = await db.select().from(users)
      .where(and(
        eq(users.status, "approved"),
        inArray(users.role, ["ddp", "bdp"])
      ));
    
    // Calculate points and rankings for each partner
    const rankings: { partnerId: string; partnerType: string; points: number; installations: number; capacity: number; commission: number; referrals: number }[] = [];
    
    for (const partner of partners) {
      const commissionData = await this.getCommissionSummaryByPartnerId(partner.id, partner.role);
      const referralsCount = await db.select().from(referrals)
        .where(and(
          eq(referrals.referrerId, partner.id),
          eq(referrals.status, "converted")
        ));
      
      // Points calculation: installations * 10 + capacity * 5 + referrals * 20
      const points = (commissionData.totalInstallations * 10) + (referralsCount.length * 20);
      
      rankings.push({
        partnerId: partner.id,
        partnerType: partner.role,
        points,
        installations: commissionData.totalInstallations,
        capacity: 0, // Will be calculated from performance metrics if needed
        commission: commissionData.totalEarned,
        referrals: referralsCount.length
      });
    }
    
    // Sort by points descending
    rankings.sort((a, b) => b.points - a.points);
    
    // Delete existing leaderboard entries for this period
    let deleteConditions = and(
      eq(leaderboard.period, period),
      eq(leaderboard.year, year)
    );
    if (month !== undefined) {
      deleteConditions = and(deleteConditions, eq(leaderboard.month, month));
    }
    await db.delete(leaderboard).where(deleteConditions!);
    
    // Insert new rankings
    for (let i = 0; i < rankings.length; i++) {
      const r = rankings[i];
      let badge: string | null = null;
      if (i === 0) badge = "gold";
      else if (i === 1) badge = "silver";
      else if (i === 2) badge = "bronze";
      else if (i < 10) badge = "rising_star";
      
      await db.insert(leaderboard).values({
        partnerId: r.partnerId,
        partnerType: r.partnerType,
        period,
        year,
        month: month || null,
        rank: i + 1,
        points: r.points,
        totalInstallations: r.installations,
        totalCapacityKw: r.capacity,
        totalCommission: r.commission,
        totalReferrals: r.referrals,
        badge
      });
    }
  }

  // ===== REFERRAL OPERATIONS =====
  async getReferralsByReferrerId(referrerId: string): Promise<Referral[]> {
    return await db.select().from(referrals)
      .where(eq(referrals.referrerId, referrerId))
      .orderBy(desc(referrals.createdAt));
  }

  async getReferralByCode(code: string): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals)
      .where(eq(referrals.referralCode, code));
    return referral || undefined;
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    const [created] = await db.insert(referrals).values(referral).returning();
    return created;
  }

  async updateReferralStatus(id: string, status: string, conversionDate?: Date): Promise<Referral | undefined> {
    const updateData: any = { status };
    if (conversionDate) {
      updateData.conversionDate = conversionDate;
    }
    const [updated] = await db.update(referrals)
      .set(updateData)
      .where(eq(referrals.id, id))
      .returning();
    return updated || undefined;
  }

  async getReferralByReferredPartnerId(partnerId: string): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals)
      .where(and(
        eq(referrals.referredPartnerId, partnerId),
        eq(referrals.referredType, "partner")
      ));
    return referral || undefined;
  }

  async updatePartnerReferralInstallationCount(referralId: string, count: number): Promise<Referral | undefined> {
    const [updated] = await db.update(referrals)
      .set({ partnerInstallationCount: count })
      .where(eq(referrals.id, referralId))
      .returning();
    return updated || undefined;
  }

  async checkAndConvertPartnerReferral(partnerId: string): Promise<{ converted: boolean; referral?: Referral }> {
    // Check if this partner was referred by someone
    const referral = await this.getReferralByReferredPartnerId(partnerId);
    if (!referral || referral.status === "converted") {
      return { converted: false };
    }

    // Count completed installations under this partner's team
    const completedInstallations = await db.select({ count: sql<number>`COUNT(*)::int` })
      .from(customers)
      .where(and(
        eq(customers.ddpId, partnerId),
        eq(customers.status, "completed")
      ));
    
    const count = completedInstallations[0]?.count || 0;

    // Update the installation count on the referral
    await this.updatePartnerReferralInstallationCount(referral.id, count);

    // Check if threshold is reached (15 installations)
    const PARTNER_REFERRAL_THRESHOLD = 15;
    if (count >= PARTNER_REFERRAL_THRESHOLD && referral.status === "pending") {
      // Convert the referral and set reward
      const PARTNER_REFERRAL_REWARD = 2000; // Rs 2,000
      const [converted] = await db.update(referrals)
        .set({
          status: "converted",
          conversionDate: new Date(),
          rewardAmount: PARTNER_REFERRAL_REWARD,
          notes: `Converted after ${count} installations completed`
        })
        .where(eq(referrals.id, referral.id))
        .returning();
      return { converted: true, referral: converted };
    }

    return { converted: false, referral };
  }

  async generateReferralCode(partnerId: string): Promise<string> {
    // Generate a unique referral code
    const partner = await this.getUser(partnerId);
    const prefix = partner?.name?.substring(0, 3).toUpperCase() || "REF";
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${randomPart}`;
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(eq(users.referralCode, code));
    return user || undefined;
  }

  async updateUserReferralCode(userId: string, code: string): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ referralCode: code })
      .where(eq(users.id, userId))
      .returning();
    return updated || undefined;
  }

  // ===== NOTIFICATION TEMPLATE OPERATIONS =====
  async getAllNotificationTemplates(): Promise<NotificationTemplate[]> {
    return await db.select().from(notificationTemplates).orderBy(notificationTemplates.name);
  }

  async getActiveNotificationTemplates(): Promise<NotificationTemplate[]> {
    return await db.select().from(notificationTemplates)
      .where(eq(notificationTemplates.isActive, "true"));
  }

  async getNotificationTemplateByTrigger(trigger: string, triggerValue?: string): Promise<NotificationTemplate[]> {
    let conditions = eq(notificationTemplates.trigger, trigger);
    if (triggerValue) {
      conditions = and(conditions, eq(notificationTemplates.triggerValue, triggerValue))!;
    }
    return await db.select().from(notificationTemplates)
      .where(and(conditions, eq(notificationTemplates.isActive, "true")));
  }

  async createNotificationTemplate(template: InsertNotificationTemplate): Promise<NotificationTemplate> {
    const [created] = await db.insert(notificationTemplates).values(template).returning();
    return created;
  }

  async updateNotificationTemplate(id: string, data: Partial<NotificationTemplate>): Promise<NotificationTemplate | undefined> {
    const [updated] = await db.update(notificationTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(notificationTemplates.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteNotificationTemplate(id: string): Promise<boolean> {
    await db.delete(notificationTemplates).where(eq(notificationTemplates.id, id));
    return true;
  }

  // ===== MAP DATA OPERATIONS =====
  async getInstallationLocations(): Promise<{ state: string; district: string; count: number; latitude?: string; longitude?: string }[]> {
    // Group customers by state and district
    const result = await db.select({
      state: customers.state,
      district: customers.district,
      count: sql<number>`COUNT(*)::int`,
      latitude: sql<string>`MAX(${customers.latitude})`,
      longitude: sql<string>`MAX(${customers.longitude})`
    })
    .from(customers)
    .where(eq(customers.status, "completed"))
    .groupBy(customers.state, customers.district);
    
    return result.map(r => ({
      state: r.state,
      district: r.district,
      count: r.count,
      latitude: r.latitude || undefined,
      longitude: r.longitude || undefined
    }));
  }

  async getCustomersWithLocations(): Promise<Customer[]> {
    return await db.select().from(customers)
      .where(and(
        eq(customers.status, "completed"),
        sql`${customers.latitude} IS NOT NULL`
      ));
  }
  
  async getAllCustomersWithLocations(): Promise<Customer[]> {
    return await db.select().from(customers)
      .where(sql`${customers.latitude} IS NOT NULL`);
  }
  
  async getPartnersForMap(): Promise<User[]> {
    return await db.select().from(users)
      .where(and(
        sql`${users.role} IN ('bdp', 'ddp')`,
        eq(users.status, "approved")
      ));
  }

  async updateCustomerLocation(id: string, latitude: string, longitude: string): Promise<Customer | undefined> {
    const [updated] = await db.update(customers)
      .set({ latitude, longitude, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updated || undefined;
  }
  
  async updateCustomerSiteMedia(id: string, sitePictures?: string[], siteVideo?: string): Promise<Customer | undefined> {
    const updateData: Partial<{ sitePictures: string[]; siteVideo: string; updatedAt: Date }> = { updatedAt: new Date() };
    if (sitePictures !== undefined) updateData.sitePictures = sitePictures;
    if (siteVideo !== undefined) updateData.siteVideo = siteVideo;
    
    const [updated] = await db.update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning();
    return updated || undefined;
  }
  
  async updateCustomerLeadScore(id: string, score: number, details: string): Promise<Customer | undefined> {
    const [updated] = await db.update(customers)
      .set({ 
        leadScore: score, 
        leadScoreDetails: details,
        leadScoreUpdatedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(customers.id, id))
      .returning();
    return updated || undefined;
  }
  
  // Vendor operations
  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [created] = await db.insert(vendors).values(vendor).returning();
    return created;
  }
  
  async getVendors(): Promise<Vendor[]> {
    return await db.select().from(vendors).orderBy(desc(vendors.createdAt));
  }
  
  async getVendor(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor || undefined;
  }
  
  async updateVendorStatus(id: string, status: string, notes?: string): Promise<Vendor | undefined> {
    const updateData: Partial<Vendor> = { status, updatedAt: new Date() };
    if (notes !== undefined) updateData.notes = notes;
    
    // Generate vendor code when approving
    if (status === "approved") {
      const vendor = await this.getVendor(id);
      if (vendor && !vendor.vendorCode) {
        const vendorCode = await this.generateVendorCode(vendor.vendorType || "solar_installation");
        updateData.vendorCode = vendorCode;
      }
    }
    
    const [updated] = await db.update(vendors)
      .set(updateData)
      .where(eq(vendors.id, id))
      .returning();
    return updated || undefined;
  }
  
  async generateVendorCode(vendorType: string): Promise<string> {
    const { getVendorCodePrefix } = await import("@shared/schema");
    const prefix = getVendorCodePrefix(vendorType);
    
    // Count existing vendors of this type with vendor codes
    const result = await db.select({ count: sql<number>`COUNT(*)::int` })
      .from(vendors)
      .where(sql`vendor_code LIKE ${prefix + '-%'}`);
    
    const count = (result[0]?.count || 0) + 1;
    return `${prefix}-${String(count).padStart(3, '0')}`;
  }
  
  async getVendorsByType(vendorType: string): Promise<Vendor[]> {
    return await db.select().from(vendors)
      .where(eq(vendors.vendorType, vendorType))
      .orderBy(desc(vendors.createdAt));
  }
  
  async getApprovedVendors(): Promise<Vendor[]> {
    return await db.select().from(vendors)
      .where(eq(vendors.status, "approved"))
      .orderBy(desc(vendors.createdAt));
  }
  
  // Vendor Assignment operations
  async createVendorAssignment(assignment: InsertCustomerVendorAssignment): Promise<CustomerVendorAssignment> {
    const [created] = await db.insert(customerVendorAssignments).values(assignment).returning();
    return created;
  }
  
  async getVendorAssignmentsByCustomer(customerId: string): Promise<CustomerVendorAssignment[]> {
    return await db.select().from(customerVendorAssignments)
      .where(eq(customerVendorAssignments.customerId, customerId))
      .orderBy(desc(customerVendorAssignments.createdAt));
  }
  
  async getVendorAssignmentsByVendor(vendorId: string): Promise<CustomerVendorAssignment[]> {
    return await db.select().from(customerVendorAssignments)
      .where(eq(customerVendorAssignments.vendorId, vendorId))
      .orderBy(desc(customerVendorAssignments.createdAt));
  }
  
  async updateVendorAssignment(id: string, data: Partial<CustomerVendorAssignment>): Promise<CustomerVendorAssignment | undefined> {
    const [updated] = await db.update(customerVendorAssignments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customerVendorAssignments.id, id))
      .returning();
    return updated || undefined;
  }
  
  async deleteVendorAssignment(id: string): Promise<void> {
    await db.delete(customerVendorAssignments).where(eq(customerVendorAssignments.id, id));
  }
  
  // Site Expense operations
  async generateSiteId(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await db.select({ count: sql<number>`COUNT(*)::int` }).from(siteExpenses);
    const count = (result[0]?.count || 0) + 1;
    return `DS-${year}-${String(count).padStart(4, '0')}`;
  }
  
  async createSiteExpense(expense: InsertSiteExpense): Promise<SiteExpense> {
    const [created] = await db.insert(siteExpenses).values(expense).returning();
    return created;
  }
  
  async getSiteExpenses(): Promise<SiteExpense[]> {
    return await db.select().from(siteExpenses).orderBy(desc(siteExpenses.createdAt));
  }
  
  async getSiteExpense(id: string): Promise<SiteExpense | undefined> {
    const [expense] = await db.select().from(siteExpenses).where(eq(siteExpenses.id, id));
    return expense || undefined;
  }
  
  async getSiteExpenseByCustomerId(customerId: string): Promise<SiteExpense | undefined> {
    const [expense] = await db.select().from(siteExpenses).where(eq(siteExpenses.customerId, customerId));
    return expense || undefined;
  }
  
  async getSiteExpenseBySiteId(siteId: string): Promise<SiteExpense | undefined> {
    const [expense] = await db.select().from(siteExpenses).where(eq(siteExpenses.siteId, siteId));
    return expense || undefined;
  }
  
  async updateSiteExpense(id: string, data: Partial<SiteExpense>): Promise<SiteExpense | undefined> {
    // First fetch existing record to merge values
    const existing = await this.getSiteExpense(id);
    if (!existing) return undefined;
    
    // Merge with existing values
    const merged = {
      solarPanelsCost: data.solarPanelsCost ?? existing.solarPanelsCost,
      inverterCost: data.inverterCost ?? existing.inverterCost,
      electricalCost: data.electricalCost ?? existing.electricalCost,
      civilWorkCost: data.civilWorkCost ?? existing.civilWorkCost,
      electricianCost: data.electricianCost ?? existing.electricianCost,
      meterCost: data.meterCost ?? existing.meterCost,
      meterInstallationCost: data.meterInstallationCost ?? existing.meterInstallationCost,
      logisticCost: data.logisticCost ?? existing.logisticCost,
      bankLoanApprovalCost: data.bankLoanApprovalCost ?? existing.bankLoanApprovalCost,
      discomApprovalCost: data.discomApprovalCost ?? existing.discomApprovalCost,
      bdpCommission: data.bdpCommission ?? existing.bdpCommission,
      ddpCommission: data.ddpCommission ?? existing.ddpCommission,
      referralPayment: data.referralPayment ?? existing.referralPayment,
      incentivePayment: data.incentivePayment ?? existing.incentivePayment,
      miscellaneousExpense: data.miscellaneousExpense ?? existing.miscellaneousExpense,
      customerPaymentReceived: data.customerPaymentReceived ?? existing.customerPaymentReceived,
    };
    
    // Calculate totals from merged values
    const totalExpenses = 
      Number(merged.solarPanelsCost || 0) +
      Number(merged.inverterCost || 0) +
      Number(merged.electricalCost || 0) +
      Number(merged.civilWorkCost || 0) +
      Number(merged.electricianCost || 0) +
      Number(merged.meterCost || 0) +
      Number(merged.meterInstallationCost || 0) +
      Number(merged.logisticCost || 0) +
      Number(merged.bankLoanApprovalCost || 0) +
      Number(merged.discomApprovalCost || 0) +
      Number(merged.bdpCommission || 0) +
      Number(merged.ddpCommission || 0) +
      Number(merged.referralPayment || 0) +
      Number(merged.incentivePayment || 0) +
      Number(merged.miscellaneousExpense || 0);
    
    const customerPayment = Number(merged.customerPaymentReceived || 0);
    const profit = customerPayment - totalExpenses;
    const profitMargin = customerPayment > 0 ? (profit / customerPayment) * 100 : 0;
    
    const updateData = {
      ...data,
      totalExpenses: String(totalExpenses),
      profit: String(profit),
      profitMargin: String(profitMargin.toFixed(2)),
      updatedAt: new Date(),
    };
    
    const [updated] = await db.update(siteExpenses)
      .set(updateData)
      .where(eq(siteExpenses.id, id))
      .returning();
    return updated || undefined;
  }
  
  // Bank Loan Submission operations
  async createBankLoanSubmission(submission: InsertBankLoanSubmission): Promise<BankLoanSubmission> {
    const [created] = await db.insert(bankLoanSubmissions).values(submission).returning();
    return created;
  }
  
  async getBankLoanSubmissions(): Promise<BankLoanSubmission[]> {
    return await db.select().from(bankLoanSubmissions).orderBy(desc(bankLoanSubmissions.createdAt));
  }
  
  async getBankLoanSubmission(id: string): Promise<BankLoanSubmission | undefined> {
    const [submission] = await db.select().from(bankLoanSubmissions).where(eq(bankLoanSubmissions.id, id));
    return submission || undefined;
  }
  
  async getBankLoanSubmissionsByCustomerId(customerId: string): Promise<BankLoanSubmission[]> {
    return await db.select().from(bankLoanSubmissions)
      .where(eq(bankLoanSubmissions.customerId, customerId))
      .orderBy(desc(bankLoanSubmissions.createdAt));
  }
  
  async updateBankLoanSubmission(id: string, data: Partial<BankLoanSubmission>): Promise<BankLoanSubmission | undefined> {
    const [updated] = await db.update(bankLoanSubmissions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bankLoanSubmissions.id, id))
      .returning();
    return updated || undefined;
  }
  
  async deleteBankLoanSubmission(id: string): Promise<void> {
    await db.delete(bankLoanSubmissions).where(eq(bankLoanSubmissions.id, id));
  }
  
  // Password Reset OTP operations
  async createPasswordResetOtp(otp: InsertPasswordResetOtp): Promise<PasswordResetOtp> {
    // First delete any existing OTPs for this phone
    await db.delete(passwordResetOtps).where(eq(passwordResetOtps.phone, otp.phone));
    const [created] = await db.insert(passwordResetOtps).values(otp).returning();
    return created;
  }
  
  async getPasswordResetOtp(phone: string): Promise<PasswordResetOtp | undefined> {
    const [otp] = await db.select().from(passwordResetOtps)
      .where(and(
        eq(passwordResetOtps.phone, phone),
        eq(passwordResetOtps.used, false)
      ))
      .orderBy(desc(passwordResetOtps.createdAt));
    return otp || undefined;
  }
  
  async markPasswordResetOtpUsed(id: string): Promise<void> {
    await db.update(passwordResetOtps)
      .set({ used: true })
      .where(eq(passwordResetOtps.id, id));
  }
  
  async deleteExpiredPasswordResetOtps(): Promise<void> {
    await db.delete(passwordResetOtps)
      .where(sql`${passwordResetOtps.expiresAt} < NOW()`);
  }
  
  // Customer File Submission operations (Step 1 of Customer Journey)
  async createCustomerFileSubmission(submission: InsertCustomerFileSubmission): Promise<CustomerFileSubmission> {
    const [created] = await db.insert(customerFileSubmissions).values(submission).returning();
    return created;
  }
  
  async getCustomerFileSubmissions(): Promise<CustomerFileSubmission[]> {
    return await db.select().from(customerFileSubmissions).orderBy(desc(customerFileSubmissions.createdAt));
  }
  
  async getCustomerFileSubmission(id: string): Promise<CustomerFileSubmission | undefined> {
    const [submission] = await db.select().from(customerFileSubmissions).where(eq(customerFileSubmissions.id, id));
    return submission || undefined;
  }
  
  async getCustomerFileSubmissionsByCustomerId(customerId: string): Promise<CustomerFileSubmission[]> {
    return await db.select().from(customerFileSubmissions)
      .where(eq(customerFileSubmissions.customerId, customerId))
      .orderBy(desc(customerFileSubmissions.createdAt));
  }
  
  async updateCustomerFileSubmission(id: string, data: Partial<CustomerFileSubmission>): Promise<CustomerFileSubmission | undefined> {
    const [updated] = await db.update(customerFileSubmissions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customerFileSubmissions.id, id))
      .returning();
    return updated || undefined;
  }
  
  async deleteCustomerFileSubmission(id: string): Promise<void> {
    await db.delete(customerFileSubmissions).where(eq(customerFileSubmissions.id, id));
  }

  // Bank Loan Approval operations (Step 3)
  async createBankLoanApproval(approval: InsertBankLoanApproval): Promise<BankLoanApproval> {
    const [created] = await db.insert(bankLoanApprovals).values(approval).returning();
    return created;
  }

  async getBankLoanApprovals(): Promise<BankLoanApproval[]> {
    return await db.select().from(bankLoanApprovals).orderBy(desc(bankLoanApprovals.createdAt));
  }

  async getBankLoanApproval(id: string): Promise<BankLoanApproval | undefined> {
    const [approval] = await db.select().from(bankLoanApprovals).where(eq(bankLoanApprovals.id, id));
    return approval || undefined;
  }

  async getBankLoanApprovalsByCustomerId(customerId: string): Promise<BankLoanApproval[]> {
    return await db.select().from(bankLoanApprovals)
      .where(eq(bankLoanApprovals.customerId, customerId))
      .orderBy(desc(bankLoanApprovals.createdAt));
  }

  async updateBankLoanApproval(id: string, data: Partial<BankLoanApproval>): Promise<BankLoanApproval | undefined> {
    const [updated] = await db.update(bankLoanApprovals)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bankLoanApprovals.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteBankLoanApproval(id: string): Promise<void> {
    await db.delete(bankLoanApprovals).where(eq(bankLoanApprovals.id, id));
  }

  // Loan Disbursement operations (Step 4)
  async createLoanDisbursement(disbursement: InsertLoanDisbursement): Promise<LoanDisbursement> {
    const [created] = await db.insert(loanDisbursements).values(disbursement).returning();
    return created;
  }

  async getLoanDisbursements(): Promise<LoanDisbursement[]> {
    return await db.select().from(loanDisbursements).orderBy(desc(loanDisbursements.createdAt));
  }

  async getLoanDisbursement(id: string): Promise<LoanDisbursement | undefined> {
    const [disbursement] = await db.select().from(loanDisbursements).where(eq(loanDisbursements.id, id));
    return disbursement || undefined;
  }

  async getLoanDisbursementsByCustomerId(customerId: string): Promise<LoanDisbursement[]> {
    return await db.select().from(loanDisbursements)
      .where(eq(loanDisbursements.customerId, customerId))
      .orderBy(desc(loanDisbursements.createdAt));
  }

  async updateLoanDisbursement(id: string, data: Partial<LoanDisbursement>): Promise<LoanDisbursement | undefined> {
    const [updated] = await db.update(loanDisbursements)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(loanDisbursements.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteLoanDisbursement(id: string): Promise<void> {
    await db.delete(loanDisbursements).where(eq(loanDisbursements.id, id));
  }

  // Step 5: Vendor Purchase Order operations
  async createVendorPurchaseOrder(order: any): Promise<VendorPurchaseOrder> {
    const orderData = {
      ...order,
      orderDate: order.orderDate ? new Date(order.orderDate) : new Date(),
      expectedDeliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate) : null,
      advanceDate: order.advanceDate ? new Date(order.advanceDate) : null,
      balancePaidDate: order.balancePaidDate ? new Date(order.balancePaidDate) : null,
      deliveryDate: order.deliveryDate ? new Date(order.deliveryDate) : null,
    };
    const [created] = await db.insert(vendorPurchaseOrders).values(orderData).returning();
    return created;
  }

  async getVendorPurchaseOrders(): Promise<VendorPurchaseOrder[]> {
    return await db.select().from(vendorPurchaseOrders).orderBy(desc(vendorPurchaseOrders.createdAt));
  }

  async getVendorPurchaseOrder(id: string): Promise<VendorPurchaseOrder | undefined> {
    const [order] = await db.select().from(vendorPurchaseOrders).where(eq(vendorPurchaseOrders.id, id));
    return order || undefined;
  }

  async getVendorPurchaseOrdersByCustomerId(customerId: string): Promise<VendorPurchaseOrder[]> {
    return await db.select().from(vendorPurchaseOrders)
      .where(eq(vendorPurchaseOrders.customerId, customerId))
      .orderBy(desc(vendorPurchaseOrders.createdAt));
  }

  async getVendorPurchaseOrdersByVendorId(vendorId: string): Promise<VendorPurchaseOrder[]> {
    return await db.select().from(vendorPurchaseOrders)
      .where(eq(vendorPurchaseOrders.vendorId, vendorId))
      .orderBy(desc(vendorPurchaseOrders.createdAt));
  }

  async updateVendorPurchaseOrder(id: string, data: Partial<VendorPurchaseOrder>): Promise<VendorPurchaseOrder | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.orderDate && typeof data.orderDate === 'string') {
      updateData.orderDate = new Date(data.orderDate);
    }
    if (data.expectedDeliveryDate && typeof data.expectedDeliveryDate === 'string') {
      updateData.expectedDeliveryDate = new Date(data.expectedDeliveryDate);
    }
    if (data.advanceDate && typeof data.advanceDate === 'string') {
      updateData.advanceDate = new Date(data.advanceDate);
    }
    if (data.balancePaidDate && typeof data.balancePaidDate === 'string') {
      updateData.balancePaidDate = new Date(data.balancePaidDate);
    }
    if (data.deliveryDate && typeof data.deliveryDate === 'string') {
      updateData.deliveryDate = new Date(data.deliveryDate);
    }
    const [updated] = await db.update(vendorPurchaseOrders)
      .set(updateData)
      .where(eq(vendorPurchaseOrders.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteVendorPurchaseOrder(id: string): Promise<void> {
    await db.delete(vendorPurchaseOrders).where(eq(vendorPurchaseOrders.id, id));
  }

  async generatePoNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const orders = await db.select().from(vendorPurchaseOrders);
    const count = orders.length + 1;
    return `PO-${year}${month}-${String(count).padStart(4, '0')}`;
  }

  // Step 6: Goods Delivery operations
  async createGoodsDelivery(delivery: any): Promise<GoodsDelivery> {
    const deliveryData = {
      ...delivery,
      scheduledDate: delivery.scheduledDate ? new Date(delivery.scheduledDate) : new Date(),
      actualDeliveryDate: delivery.actualDeliveryDate ? new Date(delivery.actualDeliveryDate) : null,
    };
    const [created] = await db.insert(goodsDeliveries).values(deliveryData).returning();
    return created;
  }

  async getGoodsDeliveries(): Promise<GoodsDelivery[]> {
    return await db.select().from(goodsDeliveries).orderBy(desc(goodsDeliveries.createdAt));
  }

  async getGoodsDelivery(id: string): Promise<GoodsDelivery | undefined> {
    const [delivery] = await db.select().from(goodsDeliveries).where(eq(goodsDeliveries.id, id));
    return delivery || undefined;
  }

  async getGoodsDeliveriesByCustomerId(customerId: string): Promise<GoodsDelivery[]> {
    return await db.select().from(goodsDeliveries)
      .where(eq(goodsDeliveries.customerId, customerId))
      .orderBy(desc(goodsDeliveries.createdAt));
  }

  async getGoodsDeliveriesByPurchaseOrderId(purchaseOrderId: string): Promise<GoodsDelivery[]> {
    return await db.select().from(goodsDeliveries)
      .where(eq(goodsDeliveries.purchaseOrderId, purchaseOrderId))
      .orderBy(desc(goodsDeliveries.createdAt));
  }

  async updateGoodsDelivery(id: string, data: Partial<GoodsDelivery>): Promise<GoodsDelivery | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.scheduledDate && typeof data.scheduledDate === 'string') {
      updateData.scheduledDate = new Date(data.scheduledDate);
    }
    if (data.actualDeliveryDate && typeof data.actualDeliveryDate === 'string') {
      updateData.actualDeliveryDate = new Date(data.actualDeliveryDate);
    }
    const [updated] = await db.update(goodsDeliveries)
      .set(updateData)
      .where(eq(goodsDeliveries.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteGoodsDelivery(id: string): Promise<void> {
    await db.delete(goodsDeliveries).where(eq(goodsDeliveries.id, id));
  }

  async generateDeliveryNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const deliveries = await db.select().from(goodsDeliveries);
    const count = deliveries.length + 1;
    return `DEL-${year}${month}-${String(count).padStart(4, '0')}`;
  }

  // Step 7: Site Execution Orders operations
  async createSiteExecutionOrder(order: any): Promise<SiteExecutionOrder> {
    const orderData = {
      ...order,
      scheduledStartDate: order.scheduledStartDate ? new Date(order.scheduledStartDate) : new Date(),
      scheduledEndDate: order.scheduledEndDate ? new Date(order.scheduledEndDate) : null,
      actualStartDate: order.actualStartDate ? new Date(order.actualStartDate) : null,
      actualEndDate: order.actualEndDate ? new Date(order.actualEndDate) : null,
      qualityCheckDate: order.qualityCheckDate ? new Date(order.qualityCheckDate) : null,
      customerSignoffDate: order.customerSignoffDate ? new Date(order.customerSignoffDate) : null,
    };
    const [created] = await db.insert(siteExecutionOrders).values(orderData).returning();
    return created;
  }

  async getSiteExecutionOrders(): Promise<SiteExecutionOrder[]> {
    return await db.select().from(siteExecutionOrders).orderBy(desc(siteExecutionOrders.createdAt));
  }

  async getSiteExecutionOrder(id: string): Promise<SiteExecutionOrder | undefined> {
    const [order] = await db.select().from(siteExecutionOrders).where(eq(siteExecutionOrders.id, id));
    return order || undefined;
  }

  async getSiteExecutionOrdersByCustomerId(customerId: string): Promise<SiteExecutionOrder[]> {
    return await db.select().from(siteExecutionOrders)
      .where(eq(siteExecutionOrders.customerId, customerId))
      .orderBy(desc(siteExecutionOrders.createdAt));
  }

  async getSiteExecutionOrdersByVendorId(vendorId: string): Promise<SiteExecutionOrder[]> {
    return await db.select().from(siteExecutionOrders)
      .where(eq(siteExecutionOrders.vendorId, vendorId))
      .orderBy(desc(siteExecutionOrders.createdAt));
  }

  async updateSiteExecutionOrder(id: string, data: Partial<SiteExecutionOrder>): Promise<SiteExecutionOrder | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.scheduledStartDate && typeof data.scheduledStartDate === 'string') {
      updateData.scheduledStartDate = new Date(data.scheduledStartDate);
    }
    if (data.scheduledEndDate && typeof data.scheduledEndDate === 'string') {
      updateData.scheduledEndDate = new Date(data.scheduledEndDate);
    }
    if (data.actualStartDate && typeof data.actualStartDate === 'string') {
      updateData.actualStartDate = new Date(data.actualStartDate);
    }
    if (data.actualEndDate && typeof data.actualEndDate === 'string') {
      updateData.actualEndDate = new Date(data.actualEndDate);
    }
    if (data.qualityCheckDate && typeof data.qualityCheckDate === 'string') {
      updateData.qualityCheckDate = new Date(data.qualityCheckDate);
    }
    if (data.customerSignoffDate && typeof data.customerSignoffDate === 'string') {
      updateData.customerSignoffDate = new Date(data.customerSignoffDate);
    }
    const [updated] = await db.update(siteExecutionOrders)
      .set(updateData)
      .where(eq(siteExecutionOrders.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSiteExecutionOrder(id: string): Promise<void> {
    await db.delete(siteExecutionOrders).where(eq(siteExecutionOrders.id, id));
  }

  async generateExecutionOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const orders = await db.select().from(siteExecutionOrders);
    const count = orders.length + 1;
    return `EXO-${year}${month}-${String(count).padStart(4, '0')}`;
  }

  // Step 8: Site Execution Completion Reports operations
  async createCompletionReport(report: any): Promise<SiteExecutionCompletionReport> {
    const reportData = {
      ...report,
      completionDate: report.completionDate ? new Date(report.completionDate) : new Date(),
      submittedAt: report.submittedAt ? new Date(report.submittedAt) : null,
      reviewedAt: report.reviewedAt ? new Date(report.reviewedAt) : null,
    };
    const [created] = await db.insert(siteExecutionCompletionReports).values(reportData).returning();
    return created;
  }

  async getCompletionReports(): Promise<SiteExecutionCompletionReport[]> {
    return await db.select().from(siteExecutionCompletionReports).orderBy(desc(siteExecutionCompletionReports.createdAt));
  }

  async getCompletionReport(id: string): Promise<SiteExecutionCompletionReport | undefined> {
    const [report] = await db.select().from(siteExecutionCompletionReports).where(eq(siteExecutionCompletionReports.id, id));
    return report || undefined;
  }

  async getCompletionReportByOrderId(executionOrderId: string): Promise<SiteExecutionCompletionReport | undefined> {
    const [report] = await db.select().from(siteExecutionCompletionReports)
      .where(eq(siteExecutionCompletionReports.executionOrderId, executionOrderId));
    return report || undefined;
  }

  async getCompletionReportsByVendorId(vendorId: string): Promise<SiteExecutionCompletionReport[]> {
    return await db.select().from(siteExecutionCompletionReports)
      .where(eq(siteExecutionCompletionReports.vendorId, vendorId))
      .orderBy(desc(siteExecutionCompletionReports.createdAt));
  }

  async updateCompletionReport(id: string, data: Partial<SiteExecutionCompletionReport>): Promise<SiteExecutionCompletionReport | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.completionDate && typeof data.completionDate === 'string') {
      updateData.completionDate = new Date(data.completionDate);
    }
    if (data.submittedAt && typeof data.submittedAt === 'string') {
      updateData.submittedAt = new Date(data.submittedAt);
    }
    if (data.reviewedAt && typeof data.reviewedAt === 'string') {
      updateData.reviewedAt = new Date(data.reviewedAt);
    }
    const [updated] = await db.update(siteExecutionCompletionReports)
      .set(updateData)
      .where(eq(siteExecutionCompletionReports.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCompletionReport(id: string): Promise<void> {
    await db.delete(siteExecutionCompletionReports).where(eq(siteExecutionCompletionReports.id, id));
  }

  async generateCompletionReportNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const reports = await db.select().from(siteExecutionCompletionReports);
    const count = reports.length + 1;
    return `CRP-${year}${month}-${String(count).padStart(4, '0')}`;
  }

  // Step 3: Site Surveys operations
  async createSiteSurvey(survey: any): Promise<SiteSurvey> {
    const surveyData = {
      ...survey,
      scheduledDate: survey.scheduledDate ? new Date(survey.scheduledDate) : new Date(),
      actualDate: survey.actualDate ? new Date(survey.actualDate) : null,
      bankSurveyDate: survey.bankSurveyDate ? new Date(survey.bankSurveyDate) : null,
      discomSurveyDate: survey.discomSurveyDate ? new Date(survey.discomSurveyDate) : null,
      roofArea: survey.roofArea ? parseInt(survey.roofArea) : null,
    };
    const [created] = await db.insert(siteSurveys).values(surveyData).returning();
    return created;
  }

  async getSiteSurveys(): Promise<SiteSurvey[]> {
    return await db.select().from(siteSurveys).orderBy(desc(siteSurveys.createdAt));
  }

  async getSiteSurvey(id: string): Promise<SiteSurvey | undefined> {
    const [survey] = await db.select().from(siteSurveys).where(eq(siteSurveys.id, id));
    return survey || undefined;
  }

  async getSiteSurveyByCustomerId(customerId: string): Promise<SiteSurvey | undefined> {
    const [survey] = await db.select().from(siteSurveys)
      .where(eq(siteSurveys.customerId, customerId));
    return survey || undefined;
  }

  async updateSiteSurvey(id: string, data: Partial<SiteSurvey>): Promise<SiteSurvey | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.scheduledDate && typeof data.scheduledDate === 'string') {
      updateData.scheduledDate = new Date(data.scheduledDate);
    }
    if (data.actualDate && typeof data.actualDate === 'string') {
      updateData.actualDate = new Date(data.actualDate);
    }
    if (data.bankSurveyDate && typeof data.bankSurveyDate === 'string') {
      updateData.bankSurveyDate = new Date(data.bankSurveyDate);
    }
    if (data.discomSurveyDate && typeof data.discomSurveyDate === 'string') {
      updateData.discomSurveyDate = new Date(data.discomSurveyDate);
    }
    if (updateData.roofArea) updateData.roofArea = parseInt(updateData.roofArea);
    
    const [updated] = await db.update(siteSurveys)
      .set(updateData)
      .where(eq(siteSurveys.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSiteSurvey(id: string): Promise<void> {
    await db.delete(siteSurveys).where(eq(siteSurveys.id, id));
  }

  async generateSiteSurveyNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const surveys = await db.select().from(siteSurveys);
    const count = surveys.length + 1;
    return `SRV-${year}${month}-${String(count).padStart(4, '0')}`;
  }

  // Step 10: Meter Installation Reports (Grid Connection)
  async getMeterInstallationReports(): Promise<MeterInstallationReport[]> {
    return await db.select().from(meterInstallationReports).orderBy(desc(meterInstallationReports.createdAt));
  }

  async getMeterInstallationReport(id: string): Promise<MeterInstallationReport | undefined> {
    const [report] = await db.select().from(meterInstallationReports).where(eq(meterInstallationReports.id, id));
    return report || undefined;
  }

  async getMeterInstallationReportByCustomerId(customerId: string): Promise<MeterInstallationReport | undefined> {
    const [report] = await db.select().from(meterInstallationReports)
      .where(eq(meterInstallationReports.customerId, customerId));
    return report || undefined;
  }

  async createMeterInstallationReport(data: any): Promise<MeterInstallationReport> {
    const insertData: any = { ...data };
    if (data.meterInstallationDate && typeof data.meterInstallationDate === 'string') {
      insertData.meterInstallationDate = new Date(data.meterInstallationDate);
    }
    if (data.gridConnectionDate && typeof data.gridConnectionDate === 'string') {
      insertData.gridConnectionDate = new Date(data.gridConnectionDate);
    }
    if (data.synchronizationDate && typeof data.synchronizationDate === 'string') {
      insertData.synchronizationDate = new Date(data.synchronizationDate);
    }
    if (data.discomApprovalDate && typeof data.discomApprovalDate === 'string') {
      insertData.discomApprovalDate = new Date(data.discomApprovalDate);
    }
    if (data.numberOfPanels) insertData.numberOfPanels = parseInt(data.numberOfPanels);
    
    const [report] = await db.insert(meterInstallationReports).values(insertData).returning();
    return report;
  }

  async updateMeterInstallationReport(id: string, data: Partial<MeterInstallationReport>): Promise<MeterInstallationReport | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.meterInstallationDate && typeof data.meterInstallationDate === 'string') {
      updateData.meterInstallationDate = new Date(data.meterInstallationDate);
    }
    if (data.gridConnectionDate && typeof data.gridConnectionDate === 'string') {
      updateData.gridConnectionDate = new Date(data.gridConnectionDate);
    }
    if (data.synchronizationDate && typeof data.synchronizationDate === 'string') {
      updateData.synchronizationDate = new Date(data.synchronizationDate);
    }
    if (data.discomApprovalDate && typeof data.discomApprovalDate === 'string') {
      updateData.discomApprovalDate = new Date(data.discomApprovalDate);
    }
    if (updateData.numberOfPanels) updateData.numberOfPanels = parseInt(updateData.numberOfPanels);
    
    const [updated] = await db.update(meterInstallationReports)
      .set(updateData)
      .where(eq(meterInstallationReports.id, id))
      .returning();
    return updated;
  }

  async deleteMeterInstallationReport(id: string): Promise<void> {
    await db.delete(meterInstallationReports).where(eq(meterInstallationReports.id, id));
  }

  async generateMeterInstallationReportNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const reports = await db.select().from(meterInstallationReports);
    const count = reports.length + 1;
    return `MIR-${year}${month}-${String(count).padStart(4, '0')}`;
  }

  // Portal Submission Reports (Step 11)
  async getPortalSubmissionReports(): Promise<PortalSubmissionReport[]> {
    return await db.select().from(portalSubmissionReports).orderBy(desc(portalSubmissionReports.createdAt));
  }

  async getPortalSubmissionReport(id: string): Promise<PortalSubmissionReport | undefined> {
    const [report] = await db.select().from(portalSubmissionReports).where(eq(portalSubmissionReports.id, id));
    return report || undefined;
  }

  async getPortalSubmissionReportByCustomerId(customerId: string): Promise<PortalSubmissionReport | undefined> {
    const [report] = await db.select().from(portalSubmissionReports)
      .where(eq(portalSubmissionReports.customerId, customerId));
    return report || undefined;
  }

  async createPortalSubmissionReport(data: any): Promise<PortalSubmissionReport> {
    const insertData: any = { ...data };
    const dateFields = [
      'submissionDate', 'gridConnectionDate', 'completionCertificateDate',
      'portalAcknowledgmentDate', 'disbursementDate', 'documentVerificationDate',
      'physicalVerificationDate', 'expectedDisbursementDate', 'lastFollowUpDate', 'nextFollowUpDate'
    ];
    for (const field of dateFields) {
      if (data[field] && typeof data[field] === 'string') {
        insertData[field] = new Date(data[field]);
      }
    }
    const intFields = ['centralSubsidyAmount', 'stateSubsidyAmount', 'totalSubsidyClaimed', 'subsidyApprovedAmount', 'disbursementAmount', 'actualProcessingDays'];
    for (const field of intFields) {
      if (data[field]) insertData[field] = parseInt(data[field]);
    }
    const [report] = await db.insert(portalSubmissionReports).values(insertData).returning();
    return report;
  }

  async updatePortalSubmissionReport(id: string, data: any): Promise<PortalSubmissionReport> {
    const updateData: any = { ...data, updatedAt: new Date() };
    const dateFields = [
      'submissionDate', 'gridConnectionDate', 'completionCertificateDate',
      'portalAcknowledgmentDate', 'disbursementDate', 'documentVerificationDate',
      'physicalVerificationDate', 'expectedDisbursementDate', 'lastFollowUpDate', 'nextFollowUpDate'
    ];
    for (const field of dateFields) {
      if (data[field] && typeof data[field] === 'string') {
        updateData[field] = new Date(data[field]);
      }
    }
    const intFields = ['centralSubsidyAmount', 'stateSubsidyAmount', 'totalSubsidyClaimed', 'subsidyApprovedAmount', 'disbursementAmount', 'actualProcessingDays'];
    for (const field of intFields) {
      if (data[field]) updateData[field] = parseInt(data[field]);
    }
    const [report] = await db.update(portalSubmissionReports).set(updateData).where(eq(portalSubmissionReports.id, id)).returning();
    return report;
  }

  async deletePortalSubmissionReport(id: string): Promise<void> {
    await db.delete(portalSubmissionReports).where(eq(portalSubmissionReports.id, id));
  }

  async generatePortalSubmissionReportNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const reports = await db.select().from(portalSubmissionReports);
    const count = reports.length + 1;
    return `PSR-${year}${month}-${String(count).padStart(4, '0')}`;
  }

  // Remaining Payment Reports (Step 12)
  async getRemainingPaymentReports(): Promise<RemainingPaymentReport[]> {
    return await db.select().from(remainingPaymentReports).orderBy(desc(remainingPaymentReports.createdAt));
  }

  async getRemainingPaymentReport(id: string): Promise<RemainingPaymentReport | undefined> {
    const [report] = await db.select().from(remainingPaymentReports).where(eq(remainingPaymentReports.id, id));
    return report;
  }

  async getRemainingPaymentReportByCustomerId(customerId: string): Promise<RemainingPaymentReport | undefined> {
    const [report] = await db.select().from(remainingPaymentReports)
      .where(eq(remainingPaymentReports.customerId, customerId));
    return report;
  }

  async getOverdueRemainingPayments(): Promise<RemainingPaymentReport[]> {
    const today = new Date();
    return await db.select().from(remainingPaymentReports)
      .where(and(
        eq(remainingPaymentReports.status, 'pending'),
        lt(remainingPaymentReports.remainingPaymentDueDate, today)
      ))
      .orderBy(asc(remainingPaymentReports.remainingPaymentDueDate));
  }

  async createRemainingPaymentReport(data: any): Promise<RemainingPaymentReport> {
    const dateFields = [
      'completionDate', 'subsidyReceivedDate', 'advancePaymentDate', 
      'remainingPaymentDueDate', 'reminderSentDate', 'paymentReceivedDate',
      'lastFollowUpDate', 'nextFollowUpDate', 'commissionReleaseDate'
    ];
    const insertData: any = { ...data };
    for (const field of dateFields) {
      if (data[field] && typeof data[field] === 'string') {
        insertData[field] = new Date(data[field]);
      }
    }
    const intFields = [
      'subsidyAmount', 'totalSystemCost', 'advancePaymentReceived', 'subsidyAdjusted',
      'remainingPaymentAmount', 'reminderCount', 'paymentReceivedAmount', 'totalReceivedTillDate',
      'balanceAmount', 'daysOverdue', 'ddpCommissionAmount', 'bdpCommissionAmount'
    ];
    for (const field of intFields) {
      if (data[field]) insertData[field] = parseInt(data[field]);
    }
    const [report] = await db.insert(remainingPaymentReports).values(insertData).returning();
    return report;
  }

  async updateRemainingPaymentReport(id: string, data: any): Promise<RemainingPaymentReport> {
    const updateData: any = { ...data, updatedAt: new Date() };
    const dateFields = [
      'completionDate', 'subsidyReceivedDate', 'advancePaymentDate', 
      'remainingPaymentDueDate', 'reminderSentDate', 'paymentReceivedDate',
      'lastFollowUpDate', 'nextFollowUpDate', 'commissionReleaseDate'
    ];
    for (const field of dateFields) {
      if (data[field] && typeof data[field] === 'string') {
        updateData[field] = new Date(data[field]);
      }
    }
    const intFields = [
      'subsidyAmount', 'totalSystemCost', 'advancePaymentReceived', 'subsidyAdjusted',
      'remainingPaymentAmount', 'reminderCount', 'paymentReceivedAmount', 'totalReceivedTillDate',
      'balanceAmount', 'daysOverdue', 'ddpCommissionAmount', 'bdpCommissionAmount'
    ];
    for (const field of intFields) {
      if (data[field]) updateData[field] = parseInt(data[field]);
    }
    const [report] = await db.update(remainingPaymentReports).set(updateData)
      .where(eq(remainingPaymentReports.id, id)).returning();
    return report;
  }

  async deleteRemainingPaymentReport(id: string): Promise<void> {
    await db.delete(remainingPaymentReports).where(eq(remainingPaymentReports.id, id));
  }

  async generateRemainingPaymentReportNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const reports = await db.select().from(remainingPaymentReports);
    const count = reports.length + 1;
    return `RPR-${year}${month}-${String(count).padStart(4, '0')}`;
  }

  // Subsidy Application Reports (Step 13)
  async getSubsidyApplicationReports(): Promise<SubsidyApplicationReport[]> {
    return await db.select().from(subsidyApplicationReports).orderBy(desc(subsidyApplicationReports.createdAt));
  }

  async getSubsidyApplicationReport(id: string): Promise<SubsidyApplicationReport | undefined> {
    const [report] = await db.select().from(subsidyApplicationReports).where(eq(subsidyApplicationReports.id, id));
    return report;
  }

  async getSubsidyApplicationReportByCustomerId(customerId: string): Promise<SubsidyApplicationReport | undefined> {
    const [report] = await db.select().from(subsidyApplicationReports)
      .where(eq(subsidyApplicationReports.customerId, customerId));
    return report;
  }

  async createSubsidyApplicationReport(data: any): Promise<SubsidyApplicationReport> {
    const dateFields = [
      'applicationDate', 'completionCertificateDate', 'gridConnectionDate',
      'applicationAcknowledgmentDate', 'documentVerificationDate', 'lastFollowUpDate', 'nextFollowUpDate'
    ];
    const insertData: any = { ...data };
    for (const field of dateFields) {
      if (data[field] && typeof data[field] === 'string') {
        insertData[field] = new Date(data[field]);
      }
    }
    const intFields = ['centralSubsidyAmount', 'stateSubsidyAmount', 'totalSubsidyApplied'];
    for (const field of intFields) {
      if (data[field]) insertData[field] = parseInt(data[field]);
    }
    const [report] = await db.insert(subsidyApplicationReports).values(insertData).returning();
    return report;
  }

  async updateSubsidyApplicationReport(id: string, data: any): Promise<SubsidyApplicationReport> {
    const updateData: any = { ...data, updatedAt: new Date() };
    const dateFields = [
      'applicationDate', 'completionCertificateDate', 'gridConnectionDate',
      'applicationAcknowledgmentDate', 'documentVerificationDate', 'lastFollowUpDate', 'nextFollowUpDate'
    ];
    for (const field of dateFields) {
      if (data[field] && typeof data[field] === 'string') {
        updateData[field] = new Date(data[field]);
      }
    }
    const intFields = ['centralSubsidyAmount', 'stateSubsidyAmount', 'totalSubsidyApplied'];
    for (const field of intFields) {
      if (data[field]) updateData[field] = parseInt(data[field]);
    }
    const [report] = await db.update(subsidyApplicationReports).set(updateData)
      .where(eq(subsidyApplicationReports.id, id)).returning();
    return report;
  }

  async deleteSubsidyApplicationReport(id: string): Promise<void> {
    await db.delete(subsidyApplicationReports).where(eq(subsidyApplicationReports.id, id));
  }

  async generateSubsidyApplicationReportNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const reports = await db.select().from(subsidyApplicationReports);
    const count = reports.length + 1;
    return `SAR-${year}${month}-${String(count).padStart(4, '0')}`;
  }

  // Subsidy Disbursement Reports (Step 14 - Final)
  async getSubsidyDisbursementReports(): Promise<SubsidyDisbursementReport[]> {
    return await db.select().from(subsidyDisbursementReports).orderBy(desc(subsidyDisbursementReports.createdAt));
  }

  async getSubsidyDisbursementReport(id: string): Promise<SubsidyDisbursementReport | undefined> {
    const [report] = await db.select().from(subsidyDisbursementReports).where(eq(subsidyDisbursementReports.id, id));
    return report;
  }

  async getSubsidyDisbursementReportByCustomerId(customerId: string): Promise<SubsidyDisbursementReport | undefined> {
    const [report] = await db.select().from(subsidyDisbursementReports)
      .where(eq(subsidyDisbursementReports.customerId, customerId));
    return report;
  }

  async createSubsidyDisbursementReport(data: any): Promise<SubsidyDisbursementReport> {
    const dateFields = [
      'disbursementDate', 'verificationDate', 'commissionReleaseDate',
      'expectedDisbursementDate', 'lastFollowUpDate', 'nextFollowUpDate'
    ];
    const insertData: any = { ...data };
    for (const field of dateFields) {
      if (data[field] && typeof data[field] === 'string') {
        insertData[field] = new Date(data[field]);
      }
    }
    const intFields = [
      'centralSubsidyApproved', 'stateSubsidyApproved', 'totalSubsidyApproved',
      'disbursementAmount', 'actualProcessingDays',
      'ddpCommissionReleased', 'bdpCommissionReleased', 'cpCommissionReleased'
    ];
    for (const field of intFields) {
      if (data[field]) insertData[field] = parseInt(data[field]);
    }
    const [report] = await db.insert(subsidyDisbursementReports).values(insertData).returning();
    return report;
  }

  async updateSubsidyDisbursementReport(id: string, data: any): Promise<SubsidyDisbursementReport> {
    const updateData: any = { ...data, updatedAt: new Date() };
    const dateFields = [
      'disbursementDate', 'verificationDate', 'commissionReleaseDate',
      'expectedDisbursementDate', 'lastFollowUpDate', 'nextFollowUpDate'
    ];
    for (const field of dateFields) {
      if (data[field] && typeof data[field] === 'string') {
        updateData[field] = new Date(data[field]);
      }
    }
    const intFields = [
      'centralSubsidyApproved', 'stateSubsidyApproved', 'totalSubsidyApproved',
      'disbursementAmount', 'actualProcessingDays',
      'ddpCommissionReleased', 'bdpCommissionReleased', 'cpCommissionReleased'
    ];
    for (const field of intFields) {
      if (data[field]) updateData[field] = parseInt(data[field]);
    }
    const [report] = await db.update(subsidyDisbursementReports).set(updateData)
      .where(eq(subsidyDisbursementReports.id, id)).returning();
    return report;
  }

  async deleteSubsidyDisbursementReport(id: string): Promise<void> {
    await db.delete(subsidyDisbursementReports).where(eq(subsidyDisbursementReports.id, id));
  }

  async generateSubsidyDisbursementReportNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const reports = await db.select().from(subsidyDisbursementReports);
    const count = reports.length + 1;
    return `SDR-${year}${month}-${String(count).padStart(4, '0')}`;
  }

  // Document Management operations
  async createDocument(doc: InsertDocument): Promise<DocumentType> {
    const [document] = await db.insert(documents).values(doc).returning();
    return document;
  }

  async getDocument(id: string): Promise<DocumentType | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async getDocumentsByCustomerId(customerId: string): Promise<DocumentType[]> {
    return await db.select().from(documents)
      .where(eq(documents.customerId, customerId))
      .orderBy(desc(documents.createdAt));
  }

  async getDocumentsByPartnerId(partnerId: string): Promise<DocumentType[]> {
    return await db.select().from(documents)
      .where(eq(documents.partnerId, partnerId))
      .orderBy(desc(documents.createdAt));
  }

  async getAllDocuments(): Promise<DocumentType[]> {
    return await db.select().from(documents).orderBy(desc(documents.createdAt));
  }

  async updateDocument(id: string, data: Partial<DocumentType>): Promise<DocumentType | undefined> {
    const [document] = await db.update(documents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  async verifyDocument(id: string, verifiedById: string): Promise<DocumentType | undefined> {
    const [document] = await db.update(documents)
      .set({ 
        isVerified: true, 
        verifiedById, 
        verifiedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return true;
  }

  // Service Request operations
  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    const requestNumber = await this.generateServiceRequestNumber();
    const [result] = await db.insert(serviceRequests).values({ ...request, requestNumber }).returning();
    return result;
  }

  async getServiceRequests(): Promise<ServiceRequest[]> {
    return await db.select().from(serviceRequests).orderBy(desc(serviceRequests.createdAt));
  }

  async getServiceRequest(id: string): Promise<ServiceRequest | undefined> {
    const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, id));
    return request;
  }

  async getServiceRequestsByCustomerId(customerId: string): Promise<ServiceRequest[]> {
    return await db.select().from(serviceRequests)
      .where(eq(serviceRequests.customerId, customerId))
      .orderBy(desc(serviceRequests.createdAt));
  }

  async updateServiceRequest(id: string, data: Partial<ServiceRequest>): Promise<ServiceRequest | undefined> {
    const [request] = await db.update(serviceRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(serviceRequests.id, id))
      .returning();
    return request;
  }

  async assignServiceRequestToVendor(id: string, vendorId: string, assignedBy: string, scheduledVisitDate?: Date): Promise<ServiceRequest | undefined> {
    const [request] = await db.update(serviceRequests)
      .set({
        assignedVendorId: vendorId,
        assignedBy,
        assignedAt: new Date(),
        status: 'assigned',
        scheduledVisitDate: scheduledVisitDate || null,
        updatedAt: new Date(),
      })
      .where(eq(serviceRequests.id, id))
      .returning();
    return request;
  }

  async recordServiceResolution(id: string, data: { vendorNotes?: string; resolutionNotes?: string; vendorSelfieWithCustomer?: string; resolutionPhotos?: string[] }): Promise<ServiceRequest | undefined> {
    const [request] = await db.update(serviceRequests)
      .set({
        ...data,
        status: 'resolved',
        resolvedAt: new Date(),
        actualVisitDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(serviceRequests.id, id))
      .returning();
    return request;
  }

  async submitServiceFeedback(id: string, rating: number, feedbackText?: string): Promise<ServiceRequest | undefined> {
    const [request] = await db.update(serviceRequests)
      .set({
        customerFeedbackRating: rating,
        customerFeedbackText: feedbackText || null,
        feedbackSubmittedAt: new Date(),
        status: 'closed',
        updatedAt: new Date(),
      })
      .where(eq(serviceRequests.id, id))
      .returning();
    return request;
  }

  async generateServiceRequestNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const requests = await db.select().from(serviceRequests);
    const count = requests.length + 1;
    return `SR-${year}${month}-${String(count).padStart(4, '0')}`;
  }

  // Customer Testimonial operations
  async createCustomerTestimonial(testimonial: InsertCustomerTestimonial): Promise<CustomerTestimonial> {
    const [result] = await db.insert(customerTestimonials).values(testimonial).returning();
    return result;
  }

  async getCustomerTestimonials(): Promise<CustomerTestimonial[]> {
    return await db.select().from(customerTestimonials).orderBy(desc(customerTestimonials.createdAt));
  }

  async getApprovedTestimonials(): Promise<CustomerTestimonial[]> {
    return await db.select().from(customerTestimonials)
      .where(or(eq(customerTestimonials.status, 'approved'), eq(customerTestimonials.status, 'featured')))
      .orderBy(desc(customerTestimonials.createdAt));
  }

  async getFeaturedTestimonials(): Promise<CustomerTestimonial[]> {
    return await db.select().from(customerTestimonials)
      .where(eq(customerTestimonials.isFeatured, true))
      .orderBy(desc(customerTestimonials.createdAt));
  }

  async getCustomerTestimonial(id: string): Promise<CustomerTestimonial | undefined> {
    const [testimonial] = await db.select().from(customerTestimonials).where(eq(customerTestimonials.id, id));
    return testimonial;
  }

  async getTestimonialsByCustomerId(customerId: string): Promise<CustomerTestimonial[]> {
    return await db.select().from(customerTestimonials)
      .where(eq(customerTestimonials.customerId, customerId))
      .orderBy(desc(customerTestimonials.createdAt));
  }

  async updateCustomerTestimonial(id: string, data: Partial<CustomerTestimonial>): Promise<CustomerTestimonial | undefined> {
    const [testimonial] = await db.update(customerTestimonials)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customerTestimonials.id, id))
      .returning();
    return testimonial;
  }

  async approveTestimonial(id: string, approvedBy: string): Promise<CustomerTestimonial | undefined> {
    const [testimonial] = await db.update(customerTestimonials)
      .set({
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(customerTestimonials.id, id))
      .returning();
    return testimonial;
  }

  async markTestimonialShared(id: string, platform: 'facebook' | 'instagram'): Promise<CustomerTestimonial | undefined> {
    const updateData: any = { updatedAt: new Date() };
    if (platform === 'facebook') {
      updateData.sharedOnFacebook = true;
      updateData.facebookShareDate = new Date();
    } else {
      updateData.sharedOnInstagram = true;
      updateData.instagramShareDate = new Date();
    }
    const [testimonial] = await db.update(customerTestimonials)
      .set(updateData)
      .where(eq(customerTestimonials.id, id))
      .returning();
    return testimonial;
  }
}

export const storage = new DatabaseStorage();
