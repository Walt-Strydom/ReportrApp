import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { issueFormSchema, supportFormSchema } from "@shared/schema";
import { z } from "zod";
import { nanoid } from "nanoid";
import { ZodError } from "zod-validation-error";
import multer from "multer";
import path from "path";
import fs from "fs";
import { sendNewIssueEmail, sendSupportEmail } from "./emailService";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

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

  return httpServer;
}

// This is required for multer import to work correctly
import express from 'express';
