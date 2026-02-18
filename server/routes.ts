import { Express, Request, Response } from "express";
import express from "express";
import { createServer, Server } from "http";
import { issueFormSchema, supportFormSchema } from "@shared/schema";
import { z } from "zod";
import { nanoid } from "nanoid";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const N8N_WEBHOOK_BASE_URL = process.env.N8N_WEBHOOK_BASE_URL;
const N8N_AUTH_HEADER = process.env.N8N_AUTH_HEADER ?? "x-reportr-key";
const N8N_AUTH_TOKEN = process.env.N8N_AUTH_TOKEN;

function ensureN8nConfigured(res: Response): boolean {
  if (!N8N_WEBHOOK_BASE_URL) {
    res.status(500).json({
      message: "n8n backend is not configured",
      requiredEnv: "N8N_WEBHOOK_BASE_URL",
    });
    return false;
  }
  return true;
}

function withPathParams(pathTemplate: string, params: Record<string, string>): string {
  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, encodeURIComponent(value)),
    pathTemplate,
  );
}

async function callN8n(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");
  if (N8N_AUTH_TOKEN) {
    headers.set(N8N_AUTH_HEADER, N8N_AUTH_TOKEN);
  }

  const response = await fetch(`${N8N_WEBHOOK_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : { message: await response.text() };

  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

function relayN8nResponse(res: Response, result: Awaited<ReturnType<typeof callN8n>>) {
  res.status(result.status).json(result.body);
}

function buildAnonymousContext(req: Request) {
  return {
    anonymous: true,
    requester: {
      ip:
        req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
        req.ip ||
        "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
    },
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  app.get("/api/health", async (_req: Request, res: Response) => {
    if (!ensureN8nConfigured(res)) return;

    try {
      const result = await callN8n("/health", { method: "GET" });
      relayN8nResponse(res, result);
    } catch {
      res.status(503).json({ status: "unhealthy", message: "Failed to reach n8n backend" });
    }
  });

  app.get("/api/issues", async (_req: Request, res: Response) => {
    if (!ensureN8nConfigured(res)) return;

    try {
      const result = await callN8n("/issues", { method: "GET" });
      relayN8nResponse(res, result);
    } catch {
      res.status(500).json({ message: "Failed to retrieve issues" });
    }
  });

  app.get("/api/issues/nearby", async (req: Request, res: Response) => {
    if (!ensureN8nConfigured(res)) return;

    try {
      const schema = z.object({
        lat: z.coerce.number(),
        lng: z.coerce.number(),
        radius: z.coerce.number().default(5),
      });

      const query = schema.parse(req.query);
      const searchParams = new URLSearchParams({
        lat: query.lat.toString(),
        lng: query.lng.toString(),
        radius: query.radius.toString(),
      });

      const result = await callN8n(`/issues/nearby?${searchParams.toString()}`, { method: "GET" });
      relayN8nResponse(res, result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to retrieve nearby issues" });
    }
  });

  app.get("/api/issues/:id", async (req: Request, res: Response) => {
    if (!ensureN8nConfigured(res)) return;

    try {
      const path = withPathParams("/issues/:id", { id: req.params.id });
      const result = await callN8n(path, { method: "GET" });
      relayN8nResponse(res, result);
    } catch {
      res.status(500).json({ message: "Failed to retrieve issue" });
    }
  });

  app.post("/api/issues", upload.single("photo"), async (req: Request, res: Response) => {
    if (!ensureN8nConfigured(res)) return;

    try {
      const reportId = nanoid(10);
      const photoAttachment = req.file
        ? {
            filename: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            base64: req.file.buffer.toString("base64"),
          }
        : undefined;

      const issueData = {
        ...req.body,
        reportId,
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude),
      };

      const validatedData = issueFormSchema.parse(issueData);

      const result = await callN8n("/issues", {
        method: "POST",
        body: JSON.stringify({
          ...validatedData,
          photoAttachment,
          ...buildAnonymousContext(req),
        }),
      });

      relayN8nResponse(res, result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid issue data", errors: error.errors });
      }

      res.status(500).json({ message: "Failed to create issue" });
    }
  });

  app.post("/api/issues/:id/support", async (req: Request, res: Response) => {
    if (!ensureN8nConfigured(res)) return;

    try {
      const id = parseInt(req.params.id);
      const supportData = supportFormSchema.parse({
        issueId: id,
        deviceId: req.body.deviceId,
      });

      const path = withPathParams("/issues/:id/support", { id: id.toString() });
      const result = await callN8n(path, {
        method: "POST",
        body: JSON.stringify({
          ...supportData,
          ...buildAnonymousContext(req),
        }),
      });

      relayN8nResponse(res, result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid support data", errors: error.errors });
      }

      res.status(500).json({ message: "Failed to support this issue" });
    }
  });

  app.get("/api/issues/:id/support/:deviceId", async (req: Request, res: Response) => {
    if (!ensureN8nConfigured(res)) return;

    try {
      const id = parseInt(req.params.id);
      const { deviceId } = req.params;

      if (!id || isNaN(id) || !deviceId) {
        return res.status(400).json({ message: "Invalid issue ID or device ID" });
      }

      const path = withPathParams("/issues/:id/support/:deviceId", {
        id: id.toString(),
        deviceId,
      });

      const result = await callN8n(path, { method: "GET" });
      relayN8nResponse(res, result);
    } catch {
      res.status(500).json({ message: "Failed to check support status" });
    }
  });

  app.delete("/api/issues/:id/support", async (req: Request, res: Response) => {
    if (!ensureN8nConfigured(res)) return;

    try {
      const id = parseInt(req.params.id);
      const { deviceId } = req.body;

      if (!id || isNaN(id) || !deviceId) {
        return res.status(400).json({ message: "Invalid issue ID or device ID" });
      }

      const path = withPathParams("/issues/:id/support", { id: id.toString() });
      const result = await callN8n(path, {
        method: "DELETE",
        body: JSON.stringify({
          deviceId,
          ...buildAnonymousContext(req),
        }),
      });

      relayN8nResponse(res, result);
    } catch {
      res.status(500).json({ message: "Failed to revoke support for this issue" });
    }
  });

  return httpServer;
}
