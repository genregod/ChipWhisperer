import { 
  chips, 
  connectionHistory, 
  aiQueries, 
  firmwareFiles,
  users,
  type Chip, 
  type InsertChip,
  type ConnectionHistory,
  type InsertConnectionHistory,
  type AiQuery,
  type InsertAiQuery,
  type FirmwareFile,
  type InsertFirmwareFile,
  type User, 
  type InsertUser 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, or, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Chip methods
  getChips(search?: string): Promise<Chip[]>;
  getChip(id: string): Promise<Chip | undefined>;
  createChip(chip: InsertChip): Promise<Chip>;
  updateChip(id: string, chip: Partial<InsertChip>): Promise<Chip>;
  deleteChip(id: string): Promise<void>;
  getChipByIds(manufacturerId: string, deviceId: string): Promise<Chip | undefined>;
  
  // Connection history methods
  getConnectionHistory(): Promise<ConnectionHistory[]>;
  createConnectionHistory(connection: InsertConnectionHistory): Promise<ConnectionHistory>;
  updateConnectionHistory(id: string, connection: Partial<InsertConnectionHistory>): Promise<ConnectionHistory>;
  
  // AI query methods
  getAiQueries(): Promise<AiQuery[]>;
  createAiQuery(query: InsertAiQuery): Promise<AiQuery>;
  
  // Firmware file methods
  getFirmwareFiles(chipId?: string): Promise<FirmwareFile[]>;
  createFirmwareFile(file: InsertFirmwareFile): Promise<FirmwareFile>;
  deleteFirmwareFile(id: string): Promise<void>;
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

  async getChips(search?: string): Promise<Chip[]> {
    if (search) {
      return await db
        .select()
        .from(chips)
        .where(
          or(
            like(chips.manufacturer, `%${search}%`),
            like(chips.partNumber, `%${search}%`),
            like(chips.capacity, `%${search}%`)
          )
        )
        .orderBy(desc(chips.createdAt));
    }
    return await db.select().from(chips).orderBy(desc(chips.createdAt));
  }

  async getChip(id: string): Promise<Chip | undefined> {
    const [chip] = await db.select().from(chips).where(eq(chips.id, id));
    return chip || undefined;
  }

  async createChip(chip: InsertChip): Promise<Chip> {
    const [newChip] = await db
      .insert(chips)
      .values({ ...chip, updatedAt: new Date() })
      .returning();
    return newChip;
  }

  async updateChip(id: string, chip: Partial<InsertChip>): Promise<Chip> {
    const [updatedChip] = await db
      .update(chips)
      .set({ ...chip, updatedAt: new Date() })
      .where(eq(chips.id, id))
      .returning();
    return updatedChip;
  }

  async deleteChip(id: string): Promise<void> {
    await db.delete(chips).where(eq(chips.id, id));
  }

  async getChipByIds(manufacturerId: string, deviceId: string): Promise<Chip | undefined> {
    const [chip] = await db
      .select()
      .from(chips)
      .where(and(
        eq(chips.manufacturerId, manufacturerId),
        eq(chips.deviceId, deviceId)
      ));
    return chip || undefined;
  }

  async getConnectionHistory(): Promise<ConnectionHistory[]> {
    return await db.select().from(connectionHistory).orderBy(desc(connectionHistory.connectedAt));
  }

  async createConnectionHistory(connection: InsertConnectionHistory): Promise<ConnectionHistory> {
    const [newConnection] = await db
      .insert(connectionHistory)
      .values(connection)
      .returning();
    return newConnection;
  }

  async updateConnectionHistory(id: string, connection: Partial<InsertConnectionHistory>): Promise<ConnectionHistory> {
    const [updatedConnection] = await db
      .update(connectionHistory)
      .set(connection)
      .where(eq(connectionHistory.id, id))
      .returning();
    return updatedConnection;
  }

  async getAiQueries(): Promise<AiQuery[]> {
    return await db.select().from(aiQueries).orderBy(desc(aiQueries.createdAt));
  }

  async createAiQuery(query: InsertAiQuery): Promise<AiQuery> {
    const [newQuery] = await db
      .insert(aiQueries)
      .values(query)
      .returning();
    return newQuery;
  }

  async getFirmwareFiles(chipId?: string): Promise<FirmwareFile[]> {
    if (chipId) {
      return await db
        .select()
        .from(firmwareFiles)
        .where(eq(firmwareFiles.chipId, chipId))
        .orderBy(desc(firmwareFiles.uploadedAt));
    }
    return await db.select().from(firmwareFiles).orderBy(desc(firmwareFiles.uploadedAt));
  }

  async createFirmwareFile(file: InsertFirmwareFile): Promise<FirmwareFile> {
    const [newFile] = await db
      .insert(firmwareFiles)
      .values(file)
      .returning();
    return newFile;
  }

  async deleteFirmwareFile(id: string): Promise<void> {
    await db.delete(firmwareFiles).where(eq(firmwareFiles.id, id));
  }
}

export const storage = new DatabaseStorage();
