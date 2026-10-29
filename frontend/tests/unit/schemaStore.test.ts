/**
 * T13.10 — Frontend unit: schema store action tests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useSchemaStore, type SchemaStoreState } from '@/features/designer/store/schema.store';
import type { Schema } from '@/features/designer/types';

const baseSchema: Schema = {
  tables: [
    {
      id: 't_users',
      name: 'users',
      columns: [
        { id: 'c_users_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true, autoIncrement: true },
      ],
    },
  ],
  relationships: [],
};

describe('schema store', () => {
  beforeEach(() => {
    useSchemaStore.setState({
      schema: { tables: [], relationships: [] },
      dialect: 'postgresql',
      isGenerating: false,
      isRefining: false,
      error: null,
      errorStatus: null,
      generatedAt: null,
      validationErrors: [],
      nodePositions: {},
      selectedTableId: null,
      selectedColumnId: null,
      selectedRelationshipId: null,
      past: [],
      future: [],
    } as Partial<SchemaStoreState>);
  });

  it('addTable creates a table with a primary key column', () => {
    const { addTable } = useSchemaStore.getState();
    const id = addTable('customers');
    const { schema } = useSchemaStore.getState();
    expect(schema.tables).toHaveLength(1);
    expect(schema.tables[0].name).toBe('customers');
    expect(schema.tables[0].columns).toHaveLength(1);
    expect(schema.tables[0].columns[0].primaryKey).toBe(true);
    expect(id).toBeDefined();
  });

  it('addTable ensures unique names', () => {
    const { setSchema, addTable } = useSchemaStore.getState();
    setSchema({ tables: [], relationships: [] }, false);
    addTable('customers');
    addTable('customers');
    const { schema } = useSchemaStore.getState();
    expect(schema.tables).toHaveLength(2);
    expect(schema.tables[0].name).toBe('customers');
    // Second 'customers' falls back to auto-generated unique name
    expect(schema.tables[1].name).toMatch(/^table_\d+$/);
  });

  it('updateTableName renames a table', () => {
    const { addTable, updateTableName } = useSchemaStore.getState();
    const id = addTable('old_name');
    updateTableName(id, 'new_name');
    const { schema } = useSchemaStore.getState();
    expect(schema.tables[0].name).toBe('new_name');
  });

  it('deleteTable removes table and its relationships', () => {
    const { addTable, addColumn, addRelationship, deleteTable } = useSchemaStore.getState();
    const t1 = addTable('table_a');
    const t2 = addTable('table_b');
    addColumn(t1);
    addColumn(t2);
    addRelationship({ fromTable: t1, fromColumn: `${t1}_col_0`, toTable: t2, toColumn: `${t2}_col_0` });

    deleteTable(t1);
    const { schema } = useSchemaStore.getState();
    expect(schema.tables).toHaveLength(1);
    expect(schema.tables[0].name).toBe('table_b');
    expect(schema.relationships).toHaveLength(0);
  });

  it('addColumn adds a column to a table', () => {
    const { addTable, addColumn } = useSchemaStore.getState();
    const tId = addTable('products');
    const cId = addColumn(tId, { name: 'price', type: 'DECIMAL', precision: 10, scale: 2 });
    const { schema } = useSchemaStore.getState();
    expect(schema.tables[0].columns).toHaveLength(2);
    expect(schema.tables[0].columns[1].name).toBe('price');
    expect(cId).toBeDefined();
  });

  it('updateColumn updates column properties', () => {
    const { addTable, updateColumn } = useSchemaStore.getState();
    const tId = addTable('items');
    const cId = useSchemaStore.getState().schema.tables[0].columns[0].id;
    updateColumn(tId, cId, { nullable: true, unique: true });
    const col = useSchemaStore.getState().schema.tables[0].columns.find((c) => c.id === cId);
    expect(col?.nullable).toBe(true);
    expect(col?.unique).toBe(true);
  });

  it('deleteColumn removes column and relationships using it', () => {
    const { addTable, addColumn, addRelationship, deleteColumn } = useSchemaStore.getState();
    const t1 = addTable('a');
    const t2 = addTable('b');
    const newColId1 = addColumn(t1, { name: 'col_a', type: 'INTEGER' });
    addColumn(t2);
    const state = useSchemaStore.getState();
    const c2Id = state.schema.tables[1].columns[0].id;
    addRelationship({ fromTable: t1, fromColumn: newColId1, toTable: t2, toColumn: c2Id });

    deleteColumn(t1, newColId1);
    const { schema } = useSchemaStore.getState();
    expect(schema.tables[0].columns).toHaveLength(1); // PK column remains
    expect(schema.relationships).toHaveLength(0);
  });

  it('addRelationship creates a foreign key edge', () => {
    const { addTable, addColumn, addRelationship } = useSchemaStore.getState();
    const t1 = addTable('users');
    const t2 = addTable('orders');
    addColumn(t1);
    addColumn(t2);
    const state = useSchemaStore.getState();
    const c1Id = state.schema.tables[0].columns[0].id;
    const c2Id = state.schema.tables[1].columns[0].id;

    const relId = addRelationship({ fromTable: t2, fromColumn: c2Id, toTable: t1, toColumn: c1Id });
    const { schema } = useSchemaStore.getState();
    expect(schema.relationships).toHaveLength(1);
    expect(schema.relationships[0].onDelete).toBe('CASCADE');
    expect(relId).toBeDefined();
  });

  it('deleteRelationship removes a relationship', () => {
    const { addTable, addColumn, addRelationship, deleteRelationship } = useSchemaStore.getState();
    const t1 = addTable('a');
    const t2 = addTable('b');
    addColumn(t1);
    addColumn(t2);
    const state = useSchemaStore.getState();
    addRelationship({ fromTable: t1, fromColumn: state.schema.tables[0].columns[0].id, toTable: t2, toColumn: state.schema.tables[1].columns[0].id });

    const relId = useSchemaStore.getState().schema.relationships[0].id;
    deleteRelationship(relId);
    const { schema } = useSchemaStore.getState();
    expect(schema.relationships).toHaveLength(0);
  });

  it('undo reverts the last schema change', () => {
    const { setSchema, undo, canUndo } = useSchemaStore.getState();
    setSchema(baseSchema, true);
    expect(canUndo()).toBe(true);

    undo();
    const { schema } = useSchemaStore.getState();
    expect(schema.tables).toHaveLength(0);
    expect(canUndo()).toBe(false);
  });

  it('redo restores after undo', () => {
    const { setSchema, undo, redo, canRedo } = useSchemaStore.getState();
    setSchema(baseSchema, true);
    undo();
    expect(canRedo()).toBe(true);

    redo();
    const { schema } = useSchemaStore.getState();
    expect(schema.tables).toHaveLength(1);
    expect(schema.tables[0].name).toBe('users');
    expect(canRedo()).toBe(false);
  });

  it('validationErrors updates when schema changes', () => {
    const { setSchema } = useSchemaStore.getState();
    const invalidSchema: Schema = {
      tables: [
        {
          id: 't_bad',
          name: 'bad',
          columns: [{ id: 'c_bad', name: 'Bad', type: 'INTEGER', primaryKey: true, nullable: false, unique: false }],
        },
      ],
      relationships: [],
    };
    setSchema(invalidSchema, true);
    const { validationErrors } = useSchemaStore.getState();
    expect(validationErrors.length).toBeGreaterThan(0);
  });
});