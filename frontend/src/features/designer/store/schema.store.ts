/**
 * Zustand store for schema design state.
 * Holds the current Schema JSON as the single source of truth.
 * Loads a rich hard-coded sample schema so the UI and diagram canvas
 * can be interacted with before AI generation is called.
 */

import { create } from 'zustand';
import type { Schema, Dialect } from '../types';
import { api, ApiClientError } from '../../../lib/api';

/**
 * Hard-coded sample schema (E-commerce with users, products, orders, order_items).
 * Fully valid according to backend validation rules.
 */
export const SAMPLE_SCHEMA: Schema = {
  tables: [
    {
      id: 't_users',
      name: 'users',
      columns: [
        {
          id: 'c_users_id',
          name: 'id',
          type: 'INTEGER',
          primaryKey: true,
          nullable: false,
          unique: true,
          autoIncrement: true,
        },
        {
          id: 'c_users_email',
          name: 'email',
          type: 'VARCHAR',
          length: 254,
          primaryKey: false,
          nullable: false,
          unique: true,
        },
        {
          id: 'c_users_name',
          name: 'full_name',
          type: 'VARCHAR',
          length: 100,
          primaryKey: false,
          nullable: false,
          unique: false,
        },
        {
          id: 'c_users_created_at',
          name: 'created_at',
          type: 'TIMESTAMP',
          primaryKey: false,
          nullable: false,
          unique: false,
        },
      ],
    },
    {
      id: 't_products',
      name: 'products',
      columns: [
        {
          id: 'c_products_id',
          name: 'id',
          type: 'INTEGER',
          primaryKey: true,
          nullable: false,
          unique: true,
          autoIncrement: true,
        },
        {
          id: 'c_products_name',
          name: 'name',
          type: 'VARCHAR',
          length: 200,
          primaryKey: false,
          nullable: false,
          unique: false,
        },
        {
          id: 'c_products_price',
          name: 'price',
          type: 'DECIMAL',
          precision: 10,
          scale: 2,
          primaryKey: false,
          nullable: false,
          unique: false,
        },
        {
          id: 'c_products_stock',
          name: 'stock_quantity',
          type: 'INTEGER',
          primaryKey: false,
          nullable: false,
          unique: false,
        },
      ],
    },
    {
      id: 't_orders',
      name: 'orders',
      columns: [
        {
          id: 'c_orders_id',
          name: 'id',
          type: 'INTEGER',
          primaryKey: true,
          nullable: false,
          unique: true,
          autoIncrement: true,
        },
        {
          id: 'c_orders_user_id',
          name: 'user_id',
          type: 'INTEGER',
          primaryKey: false,
          nullable: false,
          unique: false,
        },
        {
          id: 'c_orders_status',
          name: 'status',
          type: 'VARCHAR',
          length: 50,
          primaryKey: false,
          nullable: false,
          unique: false,
        },
        {
          id: 'c_orders_created_at',
          name: 'created_at',
          type: 'TIMESTAMP',
          primaryKey: false,
          nullable: false,
          unique: false,
        },
      ],
    },
    {
      id: 't_order_items',
      name: 'order_items',
      columns: [
        {
          id: 'c_order_items_id',
          name: 'id',
          type: 'INTEGER',
          primaryKey: true,
          nullable: false,
          unique: true,
          autoIncrement: true,
        },
        {
          id: 'c_order_items_order_id',
          name: 'order_id',
          type: 'INTEGER',
          primaryKey: false,
          nullable: false,
          unique: false,
        },
        {
          id: 'c_order_items_product_id',
          name: 'product_id',
          type: 'INTEGER',
          primaryKey: false,
          nullable: false,
          unique: false,
        },
        {
          id: 'c_order_items_quantity',
          name: 'quantity',
          type: 'INTEGER',
          primaryKey: false,
          nullable: false,
          unique: false,
        },
      ],
    },
  ],
  relationships: [
    {
      id: 'r_orders_users',
      fromTable: 't_orders',
      fromColumn: 'c_orders_user_id',
      toTable: 't_users',
      toColumn: 'c_users_id',
      onDelete: 'CASCADE',
    },
    {
      id: 'r_order_items_orders',
      fromTable: 't_order_items',
      fromColumn: 'c_order_items_order_id',
      toTable: 't_orders',
      toColumn: 'c_orders_id',
      onDelete: 'CASCADE',
    },
    {
      id: 'r_order_items_products',
      fromTable: 't_order_items',
      fromColumn: 'c_order_items_product_id',
      toTable: 't_products',
      toColumn: 'c_products_id',
      onDelete: 'RESTRICT',
    },
  ],
};

interface SchemaStoreState {
  schema: Schema;
  dialect: Dialect;
  isGenerating: boolean;
  error: string | null;
  generatedAt: Date | null;

  // Actions
  setSchema: (schema: Schema) => void;
  setDialect: (dialect: Dialect) => void;
  setError: (error: string | null) => void;
  loadSample: () => void;
  clearSchema: () => void;
  generateFromDescription: (description: string) => Promise<boolean>;
}

export const useSchemaStore = create<SchemaStoreState>((set, get) => ({
  schema: SAMPLE_SCHEMA,
  dialect: 'postgresql',
  isGenerating: false,
  error: null,
  generatedAt: new Date(),

  setSchema: (schema) => set({ schema, error: null }),
  setDialect: (dialect) => set({ dialect }),
  setError: (error) => set({ error }),
  loadSample: () => set({ schema: SAMPLE_SCHEMA, error: null }),
  clearSchema: () =>
    set({
      schema: { tables: [], relationships: [] },
      error: null,
    }),

  generateFromDescription: async (description: string) => {
    const { dialect } = get();
    set({ isGenerating: true, error: null });

    try {
      const generatedSchema = await api.generateSchema(description, dialect);
      set({
        schema: generatedSchema,
        isGenerating: false,
        error: null,
        generatedAt: new Date(),
      });
      return true;
    } catch (err: unknown) {
      let message = 'Failed to generate schema';
      if (err instanceof ApiClientError) {
        message = err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      set({ error: message, isGenerating: false });
      return false;
    }
  },
}));
