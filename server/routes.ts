import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { identifyChip, generateChipAnalysis, generateProgrammingGuide } from "./services/openai";
import { insertChipSchema, insertConnectionHistorySchema, insertAiQuerySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Chip routes
  app.get("/api/chips", async (req, res) => {
    try {
      const search = req.query.search as string;
      const chips = await storage.getChips(search);
      res.json(chips);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chips" });
    }
  });

  app.get("/api/chips/:id", async (req, res) => {
    try {
      const chip = await storage.getChip(req.params.id);
      if (!chip) {
        return res.status(404).json({ message: "Chip not found" });
      }
      res.json(chip);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chip" });
    }
  });

  app.post("/api/chips", async (req, res) => {
    try {
      const validatedChip = insertChipSchema.parse(req.body);
      const chip = await storage.createChip(validatedChip);
      res.json(chip);
    } catch (error) {
      res.status(400).json({ message: "Invalid chip data" });
    }
  });

  app.put("/api/chips/:id", async (req, res) => {
    try {
      const validatedChip = insertChipSchema.partial().parse(req.body);
      const chip = await storage.updateChip(req.params.id, validatedChip);
      res.json(chip);
    } catch (error) {
      res.status(400).json({ message: "Invalid chip data" });
    }
  });

  app.delete("/api/chips/:id", async (req, res) => {
    try {
      await storage.deleteChip(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete chip" });
    }
  });

  // AI routes
  app.post("/api/ai/identify", async (req, res) => {
    try {
      const { manufacturerId, deviceId, description, context } = req.body;
      const result = await identifyChip({ manufacturerId, deviceId, description, context });
      
      // Save to AI queries
      await storage.createAiQuery({
        query: `Identify chip: MFG=${manufacturerId}, DEV=${deviceId}`,
        response: JSON.stringify(result),
        model: 'gpt-4o',
        tokens: 500, // Approximate
      });
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { query, chipContext } = req.body;
      const analysis = await generateChipAnalysis(query, chipContext);
      
      // Save to AI queries
      await storage.createAiQuery({
        query,
        response: analysis,
        model: 'gpt-4o',
        tokens: 800, // Approximate
        chipId: chipContext?.id,
      });
      
      res.json({ analysis });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/ai/programming-guide", async (req, res) => {
    try {
      const { chipInfo, operation } = req.body;
      const guide = await generateProgrammingGuide(chipInfo, operation);
      res.json({ guide });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/ai/queries", async (req, res) => {
    try {
      const queries = await storage.getAiQueries();
      res.json(queries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI queries" });
    }
  });

  // Connection history routes
  app.get("/api/connections", async (req, res) => {
    try {
      const connections = await storage.getConnectionHistory();
      res.json(connections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch connection history" });
    }
  });

  app.post("/api/connections", async (req, res) => {
    try {
      const validatedConnection = insertConnectionHistorySchema.parse(req.body);
      const connection = await storage.createConnectionHistory(validatedConnection);
      res.json(connection);
    } catch (error) {
      res.status(400).json({ message: "Invalid connection data" });
    }
  });

  app.put("/api/connections/:id", async (req, res) => {
    try {
      const validatedConnection = insertConnectionHistorySchema.partial().parse(req.body);
      const connection = await storage.updateConnectionHistory(req.params.id, validatedConnection);
      res.json(connection);
    } catch (error) {
      res.status(400).json({ message: "Invalid connection data" });
    }
  });

  // Firmware files routes
  app.get("/api/firmware", async (req, res) => {
    try {
      const chipId = req.query.chipId as string;
      const files = await storage.getFirmwareFiles(chipId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch firmware files" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      webserial: typeof navigator !== 'undefined' && 'serial' in navigator,
      webusb: typeof navigator !== 'undefined' && 'usb' in navigator,
      timestamp: new Date().toISOString()
    });
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'serial_data':
            // Broadcast serial data to all connected clients
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'serial_data',
                  data: data.data,
                  timestamp: new Date().toISOString()
                }));
              }
            });
            break;
            
          case 'device_status':
            // Broadcast device status updates
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'device_status',
                  status: data.status,
                  device: data.device,
                  timestamp: new Date().toISOString()
                }));
              }
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}
