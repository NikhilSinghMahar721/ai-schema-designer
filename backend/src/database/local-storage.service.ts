import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { User } from '@prisma/client';

export interface StoredSavedSchema {
  id: string;
  userId: string;
  name: string;
  dialect: string;
  schemaJson: any;
  createdAt: string;
  updatedAt: string;
}

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface LocalDbData {
  users: StoredUser[];
  savedSchemas: StoredSavedSchema[];
}

@Injectable()
export class LocalStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly dataDir: string;
  private readonly dbFilePath: string;
  private memoryCache: LocalDbData = { users: [], savedSchemas: [] };
  private isLoaded = false;

  constructor() {
    this.dataDir = path.resolve(process.cwd(), 'data');
    this.dbFilePath = path.join(this.dataDir, 'local-db.json');
    this.ensureInitialized();
  }

  private ensureInitialized(): void {
    if (this.isLoaded) return;
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        this.memoryCache = JSON.parse(raw);
      } else {
        this.memoryCache = { users: [], savedSchemas: [] };
        this.persist();
      }
      this.isLoaded = true;
      this.logger.log(`Initialized local file storage at ${this.dbFilePath}`);
    } catch (err) {
      this.logger.error('Failed to initialize local-db.json, using in-memory store', err);
      this.memoryCache = { users: [], savedSchemas: [] };
      this.isLoaded = true;
    }
  }

  private persist(): void {
    try {
      fs.writeFileSync(this.dbFilePath, JSON.stringify(this.memoryCache, null, 2), 'utf-8');
    } catch (err) {
      this.logger.error('Failed to persist to local-db.json', err);
    }
  }

  // --- Users Collection ---
  readonly users = {
    findByEmail: async (email: string): Promise<User | null> => {
      this.ensureInitialized();
      const normalized = email.trim().toLowerCase();
      const found = this.memoryCache.users.find((u) => u.email === normalized);
      if (!found) return null;
      return {
        id: found.id,
        email: found.email,
        passwordHash: found.passwordHash,
        createdAt: new Date(found.createdAt),
      };
    },

    findById: async (id: string): Promise<User | null> => {
      this.ensureInitialized();
      const found = this.memoryCache.users.find((u) => u.id === id);
      if (!found) return null;
      return {
        id: found.id,
        email: found.email,
        passwordHash: found.passwordHash,
        createdAt: new Date(found.createdAt),
      };
    },

    create: async (data: { email: string; passwordHash: string }): Promise<User> => {
      this.ensureInitialized();
      const normalized = data.email.trim().toLowerCase();
      const newUser: StoredUser = {
        id: randomUUID(),
        email: normalized,
        passwordHash: data.passwordHash,
        createdAt: new Date().toISOString(),
      };
      this.memoryCache.users.push(newUser);
      this.persist();
      return {
        id: newUser.id,
        email: newUser.email,
        passwordHash: newUser.passwordHash,
        createdAt: new Date(newUser.createdAt),
      };
    },

    delete: async (id: string): Promise<User> => {
      this.ensureInitialized();
      const index = this.memoryCache.users.findIndex((u) => u.id === id);
      if (index === -1) {
        throw new Error('User not found');
      }
      const [removed] = this.memoryCache.users.splice(index, 1);
      // Cascade delete saved schemas
      this.memoryCache.savedSchemas = this.memoryCache.savedSchemas.filter(
        (s) => s.userId !== id,
      );
      this.persist();
      return {
        id: removed.id,
        email: removed.email,
        passwordHash: removed.passwordHash,
        createdAt: new Date(removed.createdAt),
      };
    },
  };

  // --- Saved Schemas Collection ---
  readonly savedSchemas = {
    findMany: async (args: {
      where: { userId: string };
      select?: Record<string, boolean>;
      orderBy?: { updatedAt?: 'asc' | 'desc' };
    }) => {
      this.ensureInitialized();
      let matched = this.memoryCache.savedSchemas.filter(
        (s) => s.userId === args.where.userId,
      );

      matched.sort((a, b) => {
        const timeA = new Date(a.updatedAt).getTime();
        const timeB = new Date(b.updatedAt).getTime();
        return args.orderBy?.updatedAt === 'asc' ? timeA - timeB : timeB - timeA;
      });

      return matched.map((s) => ({
        id: s.id,
        name: s.name,
        dialect: s.dialect,
        schemaJson: s.schemaJson,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      }));
    },

    findFirst: async (args: {
      where: { id: string; userId: string };
    }) => {
      this.ensureInitialized();
      const found = this.memoryCache.savedSchemas.find(
        (s) => s.id === args.where.id && s.userId === args.where.userId,
      );
      if (!found) return null;
      return {
        id: found.id,
        userId: found.userId,
        name: found.name,
        dialect: found.dialect,
        schemaJson: found.schemaJson,
        createdAt: new Date(found.createdAt),
        updatedAt: new Date(found.updatedAt),
      };
    },

    count: async (args: { where: { userId: string } }) => {
      this.ensureInitialized();
      return this.memoryCache.savedSchemas.filter(
        (s) => s.userId === args.where.userId,
      ).length;
    },

    create: async (args: {
      data: {
        userId: string;
        name: string;
        dialect: string;
        schemaJson: any;
      };
    }) => {
      this.ensureInitialized();
      const now = new Date().toISOString();
      const newSchema: StoredSavedSchema = {
        id: randomUUID(),
        userId: args.data.userId,
        name: args.data.name,
        dialect: args.data.dialect,
        schemaJson: args.data.schemaJson,
        createdAt: now,
        updatedAt: now,
      };
      this.memoryCache.savedSchemas.push(newSchema);
      this.persist();
      return {
        id: newSchema.id,
        userId: newSchema.userId,
        name: newSchema.name,
        dialect: newSchema.dialect,
        schemaJson: newSchema.schemaJson,
        createdAt: new Date(newSchema.createdAt),
        updatedAt: new Date(newSchema.updatedAt),
      };
    },

    update: async (args: {
      where: { id: string };
      data: {
        name?: string;
        dialect?: string;
        schemaJson?: any;
      };
    }) => {
      this.ensureInitialized();
      const item = this.memoryCache.savedSchemas.find((s) => s.id === args.where.id);
      if (!item) {
        throw new Error('Saved schema not found');
      }
      if (args.data.name !== undefined) item.name = args.data.name;
      if (args.data.dialect !== undefined) item.dialect = args.data.dialect;
      if (args.data.schemaJson !== undefined) item.schemaJson = args.data.schemaJson;
      item.updatedAt = new Date().toISOString();
      this.persist();
      return {
        id: item.id,
        userId: item.userId,
        name: item.name,
        dialect: item.dialect,
        schemaJson: item.schemaJson,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      };
    },

    delete: async (args: { where: { id: string } }) => {
      this.ensureInitialized();
      const index = this.memoryCache.savedSchemas.findIndex((s) => s.id === args.where.id);
      if (index === -1) {
        throw new Error('Saved schema not found');
      }
      const [removed] = this.memoryCache.savedSchemas.splice(index, 1);
      this.persist();
      return {
        id: removed.id,
        userId: removed.userId,
        name: removed.name,
        dialect: removed.dialect,
        schemaJson: removed.schemaJson,
        createdAt: new Date(removed.createdAt),
        updatedAt: new Date(removed.updatedAt),
      };
    },
  };
}

