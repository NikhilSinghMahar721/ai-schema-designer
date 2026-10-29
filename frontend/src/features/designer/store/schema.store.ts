/**
 * Zustand store for schema design state.
 * Holds the current Schema JSON as the single source of truth.
 * Supports full interactive editing, client-side validation, auto-layout,
 * undo/redo history, and selection state.
 */

import { create } from 'zustand';
import type {
  Schema,
  Table,
  Column,
  Relationship,
  OnDeleteAction,
  Dialect,
} from '../types';
import { api, ApiClientError } from '../../../lib/api';
import { validateSchemaClient } from '../../../lib/schemaValidator';
import { computeAutoLayout } from '../../../lib/schemaToFlow';
import {
  computeSchemaDiff,
  type SchemaDiffSummary,
} from '../../../lib/schemaDiff';

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

const MAX_HISTORY = 30;

export interface SchemaStoreState {
  schema: Schema;
  dialect: Dialect;
  isGenerating: boolean;
  isRefining: boolean;
  error: string | null;
  errorStatus: number | null;
  generatedAt: Date | null;
  validationErrors: string[];

  // Diagram layout positions & selections
  nodePositions: Record<string, { x: number; y: number }>;
  selectedTableId: string | null;
  selectedColumnId: string | null;
  selectedRelationshipId: string | null;

  // History for undo/redo (T6.8)
  past: Schema[];
  future: Schema[];

  // Base Schema Actions
  setSchema: (schema: Schema, recordHistory?: boolean) => void;
  setDialect: (dialect: Dialect) => void;
  setError: (error: string | null) => void;
  loadSample: () => void;
  clearSchema: () => void;
  generateFromDescription: (description: string) => Promise<boolean>;
  refineFromInstruction: (
    instruction: string,
  ) => Promise<{ success: boolean; diff?: SchemaDiffSummary; error?: string }>;
  exportJson: () => void;
  importJson: (jsonString: string) => { success: boolean; error?: string };

  // Selection Actions
  setSelectedTable: (tableId: string | null) => void;
  setSelectedColumn: (tableId: string | null, columnId: string | null) => void;
  setSelectedRelationship: (relId: string | null) => void;
  clearSelection: () => void;

  // Node Positions
  updateNodePosition: (tableId: string, position: { x: number; y: number }) => void;
  recalculateAutoLayout: () => void;

  // Table CRUD Actions (T6.4, T6.5)
  addTable: (name?: string) => string;
  updateTableName: (tableId: string, name: string) => void;
  deleteTable: (tableId: string) => void;

  // Column CRUD Actions (T6.4, T6.5)
  addColumn: (tableId: string, column?: Partial<Column>) => string;
  updateColumn: (tableId: string, columnId: string, updates: Partial<Column>) => void;
  deleteColumn: (tableId: string, columnId: string) => void;

  // Relationship CRUD Actions (T6.6)
  addRelationship: (
    rel: Omit<Relationship, 'id' | 'onDelete'> & { id?: string; onDelete?: OnDeleteAction },
  ) => string | null;
  updateRelationship: (relId: string, updates: Partial<Relationship>) => void;
  deleteRelationship: (relId: string) => void;

  // Undo / Redo Actions (T6.8)
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useSchemaStore = create<SchemaStoreState>((set, get) => {
  const initialSchema = SAMPLE_SCHEMA;
  const initialPositions = computeAutoLayout(initialSchema);
  const initialValidation = validateSchemaClient(initialSchema);

  // Helper to push history
  const commitSchema = (newSchema: Schema) => {
    const { schema, past } = get();
    const newPast = [...past, schema].slice(-MAX_HISTORY);
    const validationErrors = validateSchemaClient(newSchema);

    set({
      schema: newSchema,
      past: newPast,
      future: [],
      validationErrors,
      error: null,
      errorStatus: null,
    });
  };

  return {
    schema: initialSchema,
    dialect: 'postgresql',
    isGenerating: false,
    isRefining: false,
    error: null,
    errorStatus: null,
    generatedAt: new Date(),
    validationErrors: initialValidation,

    nodePositions: initialPositions,
    selectedTableId: null,
    selectedColumnId: null,
    selectedRelationshipId: null,

    past: [],
    future: [],

    setSchema: (newSchema: Schema, recordHistory = true) => {
      const validationErrors = validateSchemaClient(newSchema);
      if (recordHistory) {
        commitSchema(newSchema);
      } else {
        set({
          schema: newSchema,
          validationErrors,
          error: null,
          errorStatus: null,
        });
      }
    },

    setDialect: (dialect: Dialect) => set({ dialect }),
    setError: (error: string | null, statusCode?: number | null) =>
      set({ error, errorStatus: statusCode ?? null }),

    loadSample: () => {
      const newPositions = computeAutoLayout(SAMPLE_SCHEMA);
      commitSchema(SAMPLE_SCHEMA);
      set({
        nodePositions: newPositions,
        selectedTableId: null,
        selectedColumnId: null,
        selectedRelationshipId: null,
      });
    },

    clearSchema: () => {
      const emptySchema: Schema = { tables: [], relationships: [] };
      commitSchema(emptySchema);
      set({
        nodePositions: {},
        selectedTableId: null,
        selectedColumnId: null,
        selectedRelationshipId: null,
      });
    },

    generateFromDescription: async (description: string) => {
      const { dialect } = get();
      set({ isGenerating: true, error: null, errorStatus: null });

      try {
        const generatedSchema = await api.generateSchema(description, dialect);
        const newPositions = computeAutoLayout(generatedSchema);
        commitSchema(generatedSchema);
        set({
          isGenerating: false,
          error: null,
          errorStatus: null,
          generatedAt: new Date(),
          nodePositions: newPositions,
          selectedTableId: null,
          selectedColumnId: null,
          selectedRelationshipId: null,
        });
        return true;
      } catch (err: unknown) {
        let message = 'Failed to generate schema';
        let statusCode: number | null = null;
        if (err instanceof ApiClientError) {
          message = err.message;
          statusCode = err.status;
        } else if (err instanceof Error) {
          message = err.message;
        }
        set({ error: message, errorStatus: statusCode, isGenerating: false });
        return false;
      }
    },

    refineFromInstruction: async (instruction: string) => {
      const { schema } = get();
      set({ isRefining: true, error: null, errorStatus: null });

      try {
        const refinedSchema = await api.refineSchema(schema, instruction);
        const diff = computeSchemaDiff(schema, refinedSchema);

        // Compute layout for any newly added tables while preserving existing coordinates
        const currentPositions = { ...get().nodePositions };
        const autoLayout = computeAutoLayout(refinedSchema);
        for (const table of refinedSchema.tables) {
          if (!currentPositions[table.id]) {
            currentPositions[table.id] = autoLayout[table.id] ?? {
              x: 100,
              y: 100,
            };
          }
        }

        commitSchema(refinedSchema);
        set({
          isRefining: false,
          error: null,
          errorStatus: null,
          nodePositions: currentPositions,
          generatedAt: new Date(),
        });

        return { success: true, diff };
      } catch (err: unknown) {
        let message = 'Failed to refine schema';
        let statusCode: number | null = null;
        if (err instanceof ApiClientError) {
          message = err.message;
          statusCode = err.status;
        } else if (err instanceof Error) {
          message = err.message;
        }
        set({ error: message, errorStatus: statusCode, isRefining: false });
        return { success: false, error: message };
      }
    },

    exportJson: () => {
      const { schema } = get();
      const jsonStr = JSON.stringify(schema, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `schema_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },

    importJson: (jsonString: string) => {
      try {
        const parsed = JSON.parse(jsonString) as Schema;
        if (!parsed || !Array.isArray(parsed.tables) || !Array.isArray(parsed.relationships)) {
          return {
            success: false,
            error: 'Invalid schema JSON format: "tables" and "relationships" arrays required.',
          };
        }

        const errors = validateSchemaClient(parsed);
        if (errors.length > 0) {
          return {
            success: false,
            error: `Schema validation failed: ${errors[0]}`,
          };
        }

        const newPositions = computeAutoLayout(parsed);
        commitSchema(parsed);
        set({
          nodePositions: newPositions,
          selectedTableId: null,
          selectedColumnId: null,
          selectedRelationshipId: null,
          error: null,
          errorStatus: null,
        });

        return { success: true };
      } catch (err: unknown) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Invalid JSON file',
        };
      }
    },

    setSelectedTable: (tableId) =>
      set({
        selectedTableId: tableId,
        selectedColumnId: null,
        selectedRelationshipId: null,
      }),

    setSelectedColumn: (tableId, columnId) =>
      set({
        selectedTableId: tableId,
        selectedColumnId: columnId,
        selectedRelationshipId: null,
      }),

    setSelectedRelationship: (relId) =>
      set({
        selectedRelationshipId: relId,
        selectedTableId: null,
        selectedColumnId: null,
      }),

    clearSelection: () =>
      set({
        selectedTableId: null,
        selectedColumnId: null,
        selectedRelationshipId: null,
      }),

    updateNodePosition: (tableId, position) => {
      set((state) => ({
        nodePositions: {
          ...state.nodePositions,
          [tableId]: position,
        },
      }));
    },

    recalculateAutoLayout: () => {
      const { schema } = get();
      const newPositions = computeAutoLayout(schema);
      set({ nodePositions: newPositions });
    },

    // Table Actions
    addTable: (customName) => {
      const { schema } = get();
      let index = schema.tables.length + 1;
      let name = customName || `table_${index}`;

      // Ensure unique name
      while (schema.tables.some((t) => t.name === name)) {
        index++;
        name = `table_${index}`;
      }

      const tableId = `t_${name}`;
      const primaryKeyColId = `c_${name}_id`;

      const newTable: Table = {
        id: tableId,
        name,
        columns: [
          {
            id: primaryKeyColId,
            name: 'id',
            type: 'INTEGER',
            primaryKey: true,
            nullable: false,
            unique: true,
            autoIncrement: true,
          },
        ],
      };

      const newSchema: Schema = {
        ...schema,
        tables: [...schema.tables, newTable],
      };

      // Place new table at reasonable coordinates
      const positions = { ...get().nodePositions };
      positions[tableId] = {
        x: 100 + (schema.tables.length % 3) * 360,
        y: 100 + Math.floor(schema.tables.length / 3) * 280,
      };

      commitSchema(newSchema);
      set({
        nodePositions: positions,
        selectedTableId: tableId,
        selectedColumnId: primaryKeyColId,
      });

      return tableId;
    },

    updateTableName: (tableId, newName) => {
      const { schema } = get();
      const table = schema.tables.find((t) => t.id === tableId);
      if (!table || table.name === newName) return;

      const newSchema: Schema = {
        ...schema,
        tables: schema.tables.map((t) =>
          t.id === tableId ? { ...t, name: newName } : t,
        ),
      };

      commitSchema(newSchema);
    },

    deleteTable: (tableId) => {
      const { schema, selectedTableId } = get();
      const newSchema: Schema = {
        tables: schema.tables.filter((t) => t.id !== tableId),
        relationships: schema.relationships.filter(
          (r) => r.fromTable !== tableId && r.toTable !== tableId,
        ),
      };

      commitSchema(newSchema);

      if (selectedTableId === tableId) {
        set({ selectedTableId: null, selectedColumnId: null });
      }
    },

    // Column Actions
    addColumn: (tableId, columnData) => {
      const { schema } = get();
      const table = schema.tables.find((t) => t.id === tableId);
      if (!table) return '';

      let colIdx = table.columns.length + 1;
      let name = columnData?.name || `column_${colIdx}`;
      while (table.columns.some((c) => c.name === name)) {
        colIdx++;
        name = `column_${colIdx}`;
      }

      const columnId = `c_${table.name}_${name}_${Date.now().toString().slice(-4)}`;

      const newCol: Column = {
        id: columnId,
        name,
        type: columnData?.type || 'VARCHAR',
        length: columnData?.type === 'VARCHAR' || !columnData?.type ? 255 : undefined,
        primaryKey: columnData?.primaryKey ?? false,
        nullable: columnData?.nullable ?? true,
        unique: columnData?.unique ?? false,
        autoIncrement: columnData?.autoIncrement ?? false,
        ...columnData,
      };

      const newSchema: Schema = {
        ...schema,
        tables: schema.tables.map((t) =>
          t.id === tableId ? { ...t, columns: [...t.columns, newCol] } : t,
        ),
      };

      commitSchema(newSchema);
      set({ selectedTableId: tableId, selectedColumnId: columnId });
      return columnId;
    },

    updateColumn: (tableId, columnId, updates) => {
      const { schema } = get();
      const table = schema.tables.find((t) => t.id === tableId);
      if (!table) return;

      const newSchema: Schema = {
        ...schema,
        tables: schema.tables.map((t) => {
          if (t.id !== tableId) return t;
          return {
            ...t,
            columns: t.columns.map((c) => {
              if (c.id !== columnId) return c;
              const merged = { ...c, ...updates };

              // Clean type-specific fields if type changed
              if (updates.type && updates.type !== 'VARCHAR') {
                delete merged.length;
              }
              if (updates.type && updates.type !== 'DECIMAL') {
                delete merged.precision;
                delete merged.scale;
              }
              if (updates.type && updates.type !== 'INTEGER' && updates.type !== 'BIGINT') {
                delete merged.autoIncrement;
              }

              return merged;
            }),
          };
        }),
      };

      commitSchema(newSchema);
    },

    deleteColumn: (tableId, columnId) => {
      const { schema, selectedColumnId } = get();
      const newSchema: Schema = {
        tables: schema.tables.map((t) =>
          t.id === tableId
            ? { ...t, columns: t.columns.filter((c) => c.id !== columnId) }
            : t,
        ),
        relationships: schema.relationships.filter(
          (r) => r.fromColumn !== columnId && r.toColumn !== columnId,
        ),
      };

      commitSchema(newSchema);
      if (selectedColumnId === columnId) {
        set({ selectedColumnId: null });
      }
    },

    // Relationship Actions
    addRelationship: (relData) => {
      const { schema } = get();

      // Don't duplicate exact relationships
      const exists = schema.relationships.some(
        (r) =>
          r.fromTable === relData.fromTable &&
          r.fromColumn === relData.fromColumn &&
          r.toTable === relData.toTable &&
          r.toColumn === relData.toColumn,
      );
      if (exists) return null;

      const id = relData.id || `r_${Date.now().toString().slice(-6)}`;
      const newRel: Relationship = {
        id,
        fromTable: relData.fromTable,
        fromColumn: relData.fromColumn,
        toTable: relData.toTable,
        toColumn: relData.toColumn,
        onDelete: relData.onDelete || 'CASCADE',
      };

      const newSchema: Schema = {
        ...schema,
        relationships: [...schema.relationships, newRel],
      };

      commitSchema(newSchema);
      set({ selectedRelationshipId: id });
      return id;
    },

    updateRelationship: (relId, updates) => {
      const { schema } = get();
      const newSchema: Schema = {
        ...schema,
        relationships: schema.relationships.map((r) =>
          r.id === relId ? { ...r, ...updates } : r,
        ),
      };

      commitSchema(newSchema);
    },

    deleteRelationship: (relId) => {
      const { schema, selectedRelationshipId } = get();
      const newSchema: Schema = {
        ...schema,
        relationships: schema.relationships.filter((r) => r.id !== relId),
      };

      commitSchema(newSchema);
      if (selectedRelationshipId === relId) {
        set({ selectedRelationshipId: null });
      }
    },

    // Undo / Redo (T6.8)
    undo: () => {
      const { past, schema, future } = get();
      if (past.length === 0) return;

      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      const validationErrors = validateSchemaClient(previous);

      set({
        schema: previous,
        past: newPast,
        future: [schema, ...future],
        validationErrors,
        error: null,
      });
    },

    redo: () => {
      const { past, schema, future } = get();
      if (future.length === 0) return;

      const next = future[0];
      const newFuture = future.slice(1);
      const validationErrors = validateSchemaClient(next);

      set({
        schema: next,
        past: [...past, schema],
        future: newFuture,
        validationErrors,
        error: null,
      });
    },

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,
  };
});
