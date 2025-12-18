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

export const customersRelations = relations(customers, ({ one }) => ({
  ddp: one(users, {
    fields: [customers.ddpId],
    references: [users.id],
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
