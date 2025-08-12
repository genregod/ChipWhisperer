import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws as any;

const isDevelopment = process.env.NODE_ENV === 'development';

if (!process.env.DATABASE_URL) {
  if (isDevelopment) {
    console.warn('⚠️  DATABASE_URL not set. Some features may not work.');
    console.warn('   For full functionality, set up a PostgreSQL database and add DATABASE_URL to .env');
    console.warn('   The frontend will still work for hardware debugging features.');
  } else {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
}

// Create database connection or mock for development
let pool: Pool | null = null;
let db: any;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.warn('Database connection failed:', error instanceof Error ? error.message : String(error));
    if (isDevelopment) {
      console.warn('Running in development mode without database...');
      db = createMockDb();
    } else {
      throw error;
    }
  }
} else {
  if (isDevelopment) {
    db = createMockDb();
  }
}

// Mock database for development
function createMockDb() {
  return {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve([]),
        orderBy: () => Promise.resolve([]),
        limit: () => Promise.resolve([])
      })
    }),
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([])
      })
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([])
        })
      })
    }),
    delete: () => ({
      where: () => ({
        returning: () => Promise.resolve([])
      })
    })
  };
}

export { pool, db };