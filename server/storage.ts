import { 
  users, 
  customers, 
  milestones,
  commissions,
  type User, 
  type InsertUser, 
  type Customer, 
  type InsertCustomer,
  type Milestone,
  type InsertMilestone,
  type Commission,
  type InsertCommission,
  installationMilestones,
  calculateCommission
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
  getCommissionsByPartnerId(partnerId: string): Promise<Commission[]>;
  getCommissionSummaryByPartnerId(partnerId: string): Promise<{
    totalEarned: number;
    totalPending: number;
    totalPaid: number;
    totalInstallations: number;
  }>;
  createCommission(commission: InsertCommission): Promise<Commission>;
  updateCommissionStatus(id: string, status: string): Promise<Commission | undefined>;
  createCommissionForCustomer(customerId: string, partnerId: string): Promise<Commission | null>;
  
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
  
  async getCommissionsByPartnerId(partnerId: string): Promise<Commission[]> {
    return db
      .select()
      .from(commissions)
      .where(eq(commissions.partnerId, partnerId))
      .orderBy(desc(commissions.createdAt));
  }
  
  async getCommissionSummaryByPartnerId(partnerId: string): Promise<{
    totalEarned: number;
    totalPending: number;
    totalPaid: number;
    totalInstallations: number;
  }> {
    const partnerCommissions = await this.getCommissionsByPartnerId(partnerId);
    
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
  
  async createCommissionForCustomer(customerId: string, partnerId: string): Promise<Commission | null> {
    const customer = await this.getCustomer(customerId);
    if (!customer || !customer.proposedCapacity) {
      return null;
    }
    
    const capacityKw = Math.round(parseFloat(customer.proposedCapacity) || 0);
    if (capacityKw <= 0) {
      return null;
    }
    
    const existingCommissions = await db
      .select()
      .from(commissions)
      .where(and(
        eq(commissions.customerId, customerId),
        eq(commissions.partnerId, partnerId)
      ));
    
    if (existingCommissions.length > 0) {
      return existingCommissions[0];
    }
    
    const commissionAmount = calculateCommission(capacityKw);
    
    return this.createCommission({
      partnerId,
      customerId,
      capacityKw,
      commissionAmount,
      status: "pending",
      paidAt: null,
      notes: null,
    });
  }
}

export const storage = new DatabaseStorage();
