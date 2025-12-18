import { 
  users, 
  customers, 
  type User, 
  type InsertUser, 
  type Customer, 
  type InsertCustomer 
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
}

export const storage = new DatabaseStorage();
