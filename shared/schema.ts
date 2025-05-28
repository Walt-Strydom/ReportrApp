import { pgTable, text, serial, integer, timestamp, doublePrecision, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Define the Issue type
export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // pothole, streetlight, trafficlight, other
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  address: text("address").notNull(),
  notes: text("notes"),
  photoUrl: text("photo_url"),
  status: text("status").default("reported").notNull(), // reported, in_progress, resolved
  upvotes: integer("upvotes").default(0).notNull(),
  reportId: text("report_id").notNull().unique(), // Unique ID for reference in emails
  emailSentTo: text("email_sent_to"), // Email address(es) the report was sent to
  emailDelivered: text("email_delivered").default("false"), // "true"/"false" - email delivery status
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define the Support type to track issue support
export const upvotes = pgTable("upvotes", {
  id: serial("id").primaryKey(),
  issueId: integer("issue_id").notNull(),
  deviceId: text("device_id").notNull(), // Anonymous identifier for the device
  emailSentTo: text("email_sent_to"), // Email address(es) the support notification was sent to
  emailDelivered: text("email_delivered").default("false"), // "true"/"false" - email delivery status
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Create schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertIssueSchema = createInsertSchema(issues).omit({
  id: true,
  upvotes: true,
  createdAt: true,
});

export const insertUpvoteSchema = createInsertSchema(upvotes).omit({
  id: true,
  createdAt: true,
});

// Create types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertIssue = z.infer<typeof insertIssueSchema>;
export type Issue = typeof issues.$inferSelect;

export type InsertUpvote = z.infer<typeof insertUpvoteSchema>;
export type Upvote = typeof upvotes.$inferSelect;

// Create schemas with validation
export const issueFormSchema = insertIssueSchema.extend({
  // Accept any string for type since we have many issue types now
  type: z.string({
    required_error: "Please select an issue type",
  }),
  latitude: z.number({
    required_error: "Location is required",
  }),
  longitude: z.number({
    required_error: "Location is required",
  }),
  address: z.string({
    required_error: "Address is required",
  }).min(5, "Address is too short"),
  notes: z.string().optional(),
  photoUrl: z.string().optional(),
  reportId: z.string(),
  status: z.enum(["reported", "in_progress", "resolved"]).default("reported"),
});

export const supportFormSchema = insertUpvoteSchema.extend({
  issueId: z.number({
    required_error: "Issue ID is required",
  }),
  deviceId: z.string({
    required_error: "Device ID is required",
  }),
});
