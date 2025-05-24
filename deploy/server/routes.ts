import { Express, Request, Response } from "express";
import express from "express";
import { createServer, Server } from "http";
import { storage } from "./storage";
import { issueFormSchema, supportFormSchema } from "@shared/schema";
import { z } from "zod";
import { nanoid } from "nanoid";
import { ZodError } from "zod-validation-error";
import multer from "multer";
import path from "path";
import fs from "fs";
import { differenceInDays } from 'date-fns';
import { sendNewIssueEmail, sendSupportEmail, sendReminderEmail } from "./emailService";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(import.meta.dirname, "../uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  })
});

// Function to check for unresolved issues older than 45 days and send reminders
async function checkAndSendReminders() {
  try {
    // Get all issues
    const issues = await storage.getIssues();
    
    // Filter for unresolved issues older than 45 days
    const now = new Date();
    const unresolvedOldIssues = issues.filter(issue => {
      // Only include issues with status 'pending' or 'in-progress'
      const isUnresolved = issue.status === 'pending' || issue.status === 'in-progress';
      const creationDate = new Date(issue.createdAt);
      const daysOpen = differenceInDays(now, creationDate);
      
      // Check if the issue is at least 45 days old
      return isUnresolved && daysOpen >= 45;
    });
    
    console.log(`Found ${unresolvedOldIssues.length} unresolved issues older than 45 days`);
    
    // Send reminder emails for each old unresolved issue
    for (const issue of unresolvedOldIssues) {
      const result = await sendReminderEmail(issue);
      if (result.success) {
        console.log(`Sent reminder email for issue ID ${issue.id}, report ID ${issue.reportId}`);
      } else {
        console.error(`Failed to send reminder email for issue ID ${issue.id}:`, result.error);
      }
      
      // Add small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('Error checking for old issues:', error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Set up reminder check to run daily
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // in milliseconds
  
  // Run initial check after 1 minute (to allow server to fully start)
  setTimeout(checkAndSendReminders, 60 * 1000);
  
  // Then run every 24 hours
  setInterval(checkAndSendReminders, TWENTY_FOUR_HOURS);
  
  // Serve uploaded files
  app.use('/uploads', express.static(path.join(import.meta.dirname, '../uploads')));

  // Get all issues
  app.get('/api/issues', async (req: Request, res: Response) => {
    try {
      const issues = await storage.getIssues();
      res.json(issues);
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve issues' });
    }
  });

  // Get issues by location (with radius in km)
  app.get('/api/issues/nearby', async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        lat: z.coerce.number(),
        lng: z.coerce.number(),
        radius: z.coerce.number().default(5), // Default 5km radius
      });

      const query = schema.parse(req.query);
      const issues = await storage.getIssuesByLocation(query.lat, query.lng, query.radius);
      res.json(issues);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid query parameters', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to retrieve nearby issues' });
    }
  });

  // Get issue by ID
  app.get('/api/issues/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const issue = await storage.getIssueById(id);
      
      if (!issue) {
        return res.status(404).json({ message: 'Issue not found' });
      }
      
      res.json(issue);
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve issue' });
    }
  });

  // Create new issue
  app.post('/api/issues', upload.single('photo'), async (req: Request, res: Response) => {
    try {
      // Parse the form data
      const photoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
      
      // Create issue with generated reportId
      const reportId = nanoid(10);
      const issueData = {
        ...req.body,
        photoUrl,
        reportId,
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude),
      };
      
      // Validate the input
      const validatedData = issueFormSchema.parse(issueData);
      
      // Create issue in storage
      const issue = await storage.createIssue(validatedData);
      
      // Send email notification using Resend API
      try {
        const emailResult = await sendNewIssueEmail(issue);
        console.log('Email notification sent:', emailResult.success ? 'Success' : 'Failed');
        if (!emailResult.success) {
          console.error('Email sending error:', emailResult.error);
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Continue with response even if email fails
      }
      
      res.status(201).json(issue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid issue data', 
          errors: error.errors 
        });
      }
      
      console.error('Issue creation error:', error);
      res.status(500).json({ message: 'Failed to create issue' });
    }
  });

  // Support an issue
  app.post('/api/issues/:id/support', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const issue = await storage.getIssueById(id);
      
      if (!issue) {
        return res.status(404).json({ message: 'Issue not found' });
      }
      
      // Validate support data
      const upvoteData = supportFormSchema.parse({
        issueId: id,
        deviceId: req.body.deviceId
      });
      
      // Check if this device already supported this issue
      const existingUpvote = await storage.getUpvoteByDeviceAndIssue(
        upvoteData.deviceId,
        upvoteData.issueId
      );
      
      if (existingUpvote) {
        return res.status(409).json({ message: 'You have already supported this issue' });
      }
      
      // Create support record
      await storage.createUpvote(upvoteData);
      
      // Increment support count on the issue
      const updatedIssue = await storage.incrementUpvote(id);
      
      // Use the updated issue or create a merged object with updated supporters count
      const issueForEmail = updatedIssue || {
        ...issue,
        upvotes: issue.upvotes + 1
      };
      
      // Send email notification using Resend API
      try {
        const emailResult = await sendSupportEmail(issueForEmail);
        console.log('Support email notification sent:', emailResult.success ? 'Success' : 'Failed');
        if (!emailResult.success) {
          console.error('Support email sending error:', emailResult.error);
        }
      } catch (emailError) {
        console.error('Failed to send support email notification:', emailError);
        // Continue with response even if email fails
      }
      
      res.json(updatedIssue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid support data', 
          errors: error.errors 
        });
      }
      
      console.error('Support error:', error);
      res.status(500).json({ message: 'Failed to support this issue' });
    }
  });
  
  // Check if a device has supported an issue
  app.get('/api/issues/:id/support/:deviceId', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deviceId = req.params.deviceId;
      
      // Validate input
      if (!id || isNaN(id) || !deviceId) {
        return res.status(400).json({ message: 'Invalid issue ID or device ID' });
      }
      
      const existingUpvote = await storage.getUpvoteByDeviceAndIssue(deviceId, id);
      
      if (existingUpvote) {
        return res.status(200).json({ supported: true });
      } else {
        return res.status(404).json({ supported: false });
      }
    } catch (error) {
      console.error('Support status check error:', error);
      res.status(500).json({ message: 'Failed to check support status' });
    }
  });
  
  // Revoke support for an issue
  app.delete('/api/issues/:id/support', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const issue = await storage.getIssueById(id);
      
      if (!issue) {
        return res.status(404).json({ message: 'Issue not found' });
      }
      
      // Validate the device ID
      const deviceId = req.body.deviceId;
      if (!deviceId) {
        return res.status(400).json({ message: 'Device ID is required' });
      }
      
      // Check if this device has supported this issue
      const existingUpvote = await storage.getUpvoteByDeviceAndIssue(deviceId, id);
      
      if (!existingUpvote) {
        return res.status(404).json({ message: 'No support record found for this issue' });
      }
      
      // Delete the support record
      const deleteResult = await storage.deleteUpvoteByDeviceAndIssue(deviceId, id);
      
      if (!deleteResult) {
        return res.status(500).json({ message: 'Failed to revoke support' });
      }
      
      // Decrement support count on the issue
      const updatedIssue = await storage.decrementUpvote(id);
      
      res.json(updatedIssue);
    } catch (error) {
      console.error('Revoke support error:', error);
      res.status(500).json({ message: 'Failed to revoke support for this issue' });
    }
  });

  return httpServer;
}
