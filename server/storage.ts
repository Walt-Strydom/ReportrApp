import { 
  users, type User, type InsertUser, 
  issues, type Issue, type InsertIssue, 
  upvotes, type Upvote, type InsertUpvote
} from "@shared/schema";
import { nanoid } from "nanoid";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Issue methods
  getIssues(): Promise<Issue[]>;
  getIssueById(id: number): Promise<Issue | undefined>;
  getIssuesByLocation(lat: number, lng: number, radius: number): Promise<Issue[]>;
  createIssue(issue: InsertIssue): Promise<Issue>;
  updateIssue(id: number, issue: Partial<Issue>): Promise<Issue | undefined>;
  incrementUpvote(id: number): Promise<Issue | undefined>;
  
  // Upvote methods
  createUpvote(upvote: InsertUpvote): Promise<Upvote>;
  getUpvoteByDeviceAndIssue(deviceId: string, issueId: number): Promise<Upvote | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private issues: Map<number, Issue>;
  private upvotes: Map<number, Upvote>;
  private userCurrentId: number;
  private issueCurrentId: number;
  private upvoteCurrentId: number;

  constructor() {
    this.users = new Map();
    this.issues = new Map();
    this.upvotes = new Map();
    this.userCurrentId = 1;
    this.issueCurrentId = 1;
    this.upvoteCurrentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Issue methods
  async getIssues(): Promise<Issue[]> {
    return Array.from(this.issues.values());
  }

  async getIssueById(id: number): Promise<Issue | undefined> {
    return this.issues.get(id);
  }

  async getIssuesByLocation(lat: number, lng: number, radius: number): Promise<Issue[]> {
    // Simplified implementation - in a real app this would use proper geo calculations
    return Array.from(this.issues.values()).filter(issue => {
      const distance = this.calculateDistance(
        lat, lng,
        issue.latitude, issue.longitude
      );
      return distance <= radius;
    });
  }

  async createIssue(insertIssue: InsertIssue): Promise<Issue> {
    const id = this.issueCurrentId++;
    const reportId = nanoid(10); // Generate a unique report ID for reference
    
    const issue: Issue = { 
      ...insertIssue, 
      id, 
      reportId: insertIssue.reportId || reportId,
      upvotes: 0,
      createdAt: new Date()
    };
    
    this.issues.set(id, issue);
    return issue;
  }

  async updateIssue(id: number, partialIssue: Partial<Issue>): Promise<Issue | undefined> {
    const issue = this.issues.get(id);
    if (!issue) return undefined;
    
    const updatedIssue = { ...issue, ...partialIssue };
    this.issues.set(id, updatedIssue);
    return updatedIssue;
  }

  async incrementUpvote(id: number): Promise<Issue | undefined> {
    const issue = this.issues.get(id);
    if (!issue) return undefined;
    
    const updatedIssue = { 
      ...issue, 
      upvotes: issue.upvotes + 1 
    };
    
    this.issues.set(id, updatedIssue);
    return updatedIssue;
  }

  // Upvote methods
  async createUpvote(insertUpvote: InsertUpvote): Promise<Upvote> {
    const id = this.upvoteCurrentId++;
    const upvote: Upvote = { 
      ...insertUpvote, 
      id,
      createdAt: new Date()
    };
    
    this.upvotes.set(id, upvote);
    return upvote;
  }

  async getUpvoteByDeviceAndIssue(deviceId: string, issueId: number): Promise<Upvote | undefined> {
    return Array.from(this.upvotes.values()).find(
      (upvote) => upvote.deviceId === deviceId && upvote.issueId === issueId
    );
  }

  // Helper method to calculate distance between two points using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

// Database Storage implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
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

  // Issue methods
  async getIssues(): Promise<Issue[]> {
    return await db.select().from(issues).orderBy(desc(issues.createdAt));
  }

  async getIssueById(id: number): Promise<Issue | undefined> {
    const [issue] = await db.select().from(issues).where(eq(issues.id, id));
    return issue || undefined;
  }

  async getIssuesByLocation(lat: number, lng: number, radius: number): Promise<Issue[]> {
    // Get all issues and filter by distance (simplified approach)
    const allIssues = await this.getIssues();
    
    return allIssues.filter(issue => {
      const distance = this.calculateDistance(
        lat, lng, 
        issue.latitude, issue.longitude
      );
      return distance <= radius;
    });
  }

  async createIssue(insertIssue: InsertIssue): Promise<Issue> {
    const reportId = insertIssue.reportId || nanoid(10);
    
    // Ensure status is set
    const issueData = { 
      ...insertIssue, 
      reportId,
      status: insertIssue.status || "reported" 
    };
    
    const [issue] = await db
      .insert(issues)
      .values(issueData)
      .returning();
      
    return issue;
  }

  async updateIssue(id: number, partialIssue: Partial<Issue>): Promise<Issue | undefined> {
    const [updatedIssue] = await db
      .update(issues)
      .set(partialIssue)
      .where(eq(issues.id, id))
      .returning();
      
    return updatedIssue || undefined;
  }

  async incrementUpvote(id: number): Promise<Issue | undefined> {
    const issue = await this.getIssueById(id);
    if (!issue) return undefined;
    
    const [updatedIssue] = await db
      .update(issues)
      .set({ upvotes: issue.upvotes + 1 })
      .where(eq(issues.id, id))
      .returning();
      
    return updatedIssue || undefined;
  }

  // Upvote methods
  async createUpvote(insertUpvote: InsertUpvote): Promise<Upvote> {
    const [upvote] = await db
      .insert(upvotes)
      .values(insertUpvote)
      .returning();
      
    return upvote;
  }

  async getUpvoteByDeviceAndIssue(deviceId: string, issueId: number): Promise<Upvote | undefined> {
    const [upvote] = await db
      .select()
      .from(upvotes)
      .where(and(
        eq(upvotes.deviceId, deviceId),
        eq(upvotes.issueId, issueId)
      ));
      
    return upvote || undefined;
  }

  // Helper method to calculate distance between two points using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

// Use database storage instead of memory storage
export const storage = new DatabaseStorage();
