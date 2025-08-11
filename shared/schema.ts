import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const chips = pgTable("chips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  manufacturer: text("manufacturer").notNull(),
  partNumber: text("part_number").notNull(),
  capacity: text("capacity").notNull(),
  packageType: text("package_type").notNull(),
  interface: text("interface").notNull(),
  manufacturerId: text("manufacturer_id"),
  deviceId: text("device_id"),
  voltage: text("voltage"),
  features: jsonb("features").default(sql`'[]'::jsonb`),
  pinout: jsonb("pinout"),
  datasheet: text("datasheet"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const connectionHistory = pgTable("connection_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceName: text("device_name").notNull(),
  deviceType: text("device_type").notNull(), // 'serial' | 'usb' | 'spi'
  port: text("port"),
  baudRate: integer("baud_rate"),
  configuration: jsonb("configuration"),
  connectedAt: timestamp("connected_at").defaultNow(),
  disconnectedAt: timestamp("disconnected_at"),
  duration: integer("duration"), // in seconds
  status: text("status").notNull().default('success'), // 'success' | 'failed' | 'timeout'
});

export const aiQueries = pgTable("ai_queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  query: text("query").notNull(),
  response: text("response").notNull(),
  model: text("model").notNull().default('gpt-4o'),
  tokens: integer("tokens"),
  chipId: varchar("chip_id").references(() => chips.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const firmwareFiles = pgTable("firmware_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  size: integer("size").notNull(),
  checksum: text("checksum").notNull(),
  chipId: varchar("chip_id").references(() => chips.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Relations
export const chipsRelations = relations(chips, ({ many }) => ({
  aiQueries: many(aiQueries),
  firmwareFiles: many(firmwareFiles),
}));

export const aiQueriesRelations = relations(aiQueries, ({ one }) => ({
  chip: one(chips, {
    fields: [aiQueries.chipId],
    references: [chips.id],
  }),
}));

export const firmwareFilesRelations = relations(firmwareFiles, ({ one }) => ({
  chip: one(chips, {
    fields: [firmwareFiles.chipId],
    references: [chips.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertChipSchema = createInsertSchema(chips).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConnectionHistorySchema = createInsertSchema(connectionHistory).omit({
  id: true,
  connectedAt: true,
});

export const insertAiQuerySchema = createInsertSchema(aiQueries).omit({
  id: true,
  createdAt: true,
});

export const insertFirmwareFileSchema = createInsertSchema(firmwareFiles).omit({
  id: true,
  uploadedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertChip = z.infer<typeof insertChipSchema>;
export type Chip = typeof chips.$inferSelect;

export type InsertConnectionHistory = z.infer<typeof insertConnectionHistorySchema>;
export type ConnectionHistory = typeof connectionHistory.$inferSelect;

export type InsertAiQuery = z.infer<typeof insertAiQuerySchema>;
export type AiQuery = typeof aiQueries.$inferSelect;

export type InsertFirmwareFile = z.infer<typeof insertFirmwareFileSchema>;
export type FirmwareFile = typeof firmwareFiles.$inferSelect;
