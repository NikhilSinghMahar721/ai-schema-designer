/**
 * Test fixtures: valid and invalid schemas for unit/integration testing.
 * 3 valid schemas + 10 invalid ones as required by T1.4.
 */

import type { Schema } from '../../src/schema/schema.types.js';

// ─── VALID SCHEMAS ──────────────────────────────────────────────────────

/** Minimal valid schema: one table, one PK column, no relationships */
export const validMinimal: Schema = {
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
      ],
    },
  ],
  relationships: [],
};

/** Library schema: books, authors, members, borrows with FK relationships */
export const validLibrary: Schema = {
  tables: [
    {
      id: 't_authors',
      name: 'authors',
      columns: [
        { id: 'c_authors_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true, autoIncrement: true },
        { id: 'c_authors_name', name: 'full_name', type: 'VARCHAR', length: 120, primaryKey: false, nullable: false, unique: false },
      ],
    },
    {
      id: 't_books',
      name: 'books',
      columns: [
        { id: 'c_books_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true, autoIncrement: true },
        { id: 'c_books_title', name: 'title', type: 'VARCHAR', length: 255, primaryKey: false, nullable: false, unique: false },
        { id: 'c_books_author_id', name: 'author_id', type: 'INTEGER', primaryKey: false, nullable: false, unique: false },
      ],
    },
    {
      id: 't_members',
      name: 'members',
      columns: [
        { id: 'c_members_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true, autoIncrement: true },
        { id: 'c_members_email', name: 'email', type: 'VARCHAR', length: 254, primaryKey: false, nullable: false, unique: true },
      ],
    },
    {
      id: 't_borrows',
      name: 'borrows',
      columns: [
        { id: 'c_borrows_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true, autoIncrement: true },
        { id: 'c_borrows_book_id', name: 'book_id', type: 'INTEGER', primaryKey: false, nullable: false, unique: false },
        { id: 'c_borrows_member_id', name: 'member_id', type: 'INTEGER', primaryKey: false, nullable: false, unique: false },
        { id: 'c_borrows_date', name: 'borrow_date', type: 'DATE', primaryKey: false, nullable: false, unique: false },
      ],
    },
  ],
  relationships: [
    { id: 'r_books_author', fromTable: 't_books', fromColumn: 'c_books_author_id', toTable: 't_authors', toColumn: 'c_authors_id', onDelete: 'CASCADE' },
    { id: 'r_borrows_book', fromTable: 't_borrows', fromColumn: 'c_borrows_book_id', toTable: 't_books', toColumn: 'c_books_id', onDelete: 'CASCADE' },
    { id: 'r_borrows_member', fromTable: 't_borrows', fromColumn: 'c_borrows_member_id', toTable: 't_members', toColumn: 'c_members_id', onDelete: 'RESTRICT' },
  ],
};

/** Schema using all column types, DECIMAL with precision/scale, UUID PK, defaults */
export const validAllTypes: Schema = {
  tables: [
    {
      id: 't_products',
      name: 'products',
      columns: [
        { id: 'c_products_id', name: 'id', type: 'UUID', primaryKey: true, nullable: false, unique: true },
        { id: 'c_products_name', name: 'product_name', type: 'VARCHAR', length: 200, primaryKey: false, nullable: false, unique: false },
        { id: 'c_products_description', name: 'description', type: 'TEXT', primaryKey: false, nullable: true, unique: false },
        { id: 'c_products_price', name: 'price', type: 'DECIMAL', precision: 10, scale: 2, primaryKey: false, nullable: false, unique: false },
        { id: 'c_products_quantity', name: 'quantity', type: 'BIGINT', primaryKey: false, nullable: false, unique: false, defaultValue: 0 },
        { id: 'c_products_active', name: 'active', type: 'BOOLEAN', primaryKey: false, nullable: false, unique: false, defaultValue: true },
        { id: 'c_products_created_at', name: 'created_at', type: 'TIMESTAMP', primaryKey: false, nullable: false, unique: false },
        { id: 'c_products_launch_date', name: 'launch_date', type: 'DATE', primaryKey: false, nullable: true, unique: false },
      ],
    },
  ],
  relationships: [],
};

// ─── INVALID SCHEMAS ────────────────────────────────────────────────────

/** 1. Duplicate table names */
export const invalidDuplicateTableNames: Schema = {
  tables: [
    {
      id: 't_a',
      name: 'users',
      columns: [
        { id: 'c_a_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true },
      ],
    },
    {
      id: 't_b',
      name: 'users',
      columns: [
        { id: 'c_b_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true },
      ],
    },
  ],
  relationships: [],
};

/** 2. Duplicate column names within a table */
export const invalidDuplicateColumnNames: Schema = {
  tables: [
    {
      id: 't_users',
      name: 'users',
      columns: [
        { id: 'c_users_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true },
        { id: 'c_users_id2', name: 'id', type: 'VARCHAR', length: 50, primaryKey: false, nullable: false, unique: false },
      ],
    },
  ],
  relationships: [],
};

/** 3. Table with no primary key */
export const invalidNoPrimaryKey: Schema = {
  tables: [
    {
      id: 't_users',
      name: 'users',
      columns: [
        { id: 'c_users_name', name: 'name', type: 'VARCHAR', length: 100, primaryKey: false, nullable: false, unique: false },
      ],
    },
  ],
  relationships: [],
};

/** 4. FK references a non-existent table id */
export const invalidFkBadTable: Schema = {
  tables: [
    {
      id: 't_orders',
      name: 'orders',
      columns: [
        { id: 'c_orders_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true },
        { id: 'c_orders_user_id', name: 'user_id', type: 'INTEGER', primaryKey: false, nullable: false, unique: false },
      ],
    },
  ],
  relationships: [
    { id: 'r_1', fromTable: 't_orders', fromColumn: 'c_orders_user_id', toTable: 't_nonexistent', toColumn: 'c_nonexistent_id', onDelete: 'CASCADE' },
  ],
};

/** 5. FK references a non-existent column id */
export const invalidFkBadColumn: Schema = {
  tables: [
    {
      id: 't_users',
      name: 'users',
      columns: [
        { id: 'c_users_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true },
      ],
    },
    {
      id: 't_orders',
      name: 'orders',
      columns: [
        { id: 'c_orders_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true },
        { id: 'c_orders_user_id', name: 'user_id', type: 'INTEGER', primaryKey: false, nullable: false, unique: false },
      ],
    },
  ],
  relationships: [
    { id: 'r_1', fromTable: 't_orders', fromColumn: 'c_orders_user_id', toTable: 't_users', toColumn: 'c_nonexistent', onDelete: 'CASCADE' },
  ],
};

/** 6. FK toColumn is neither PK nor unique */
export const invalidFkTargetNotPkOrUnique: Schema = {
  tables: [
    {
      id: 't_users',
      name: 'users',
      columns: [
        { id: 'c_users_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true },
        { id: 'c_users_email', name: 'email', type: 'VARCHAR', length: 254, primaryKey: false, nullable: false, unique: false },
      ],
    },
    {
      id: 't_orders',
      name: 'orders',
      columns: [
        { id: 'c_orders_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true },
        { id: 'c_orders_user_email', name: 'user_email', type: 'VARCHAR', length: 254, primaryKey: false, nullable: false, unique: false },
      ],
    },
  ],
  relationships: [
    { id: 'r_1', fromTable: 't_orders', fromColumn: 'c_orders_user_email', toTable: 't_users', toColumn: 'c_users_email', onDelete: 'CASCADE' },
  ],
};

/** 7. FK type mismatch (VARCHAR FK → INTEGER PK) */
export const invalidFkTypeMismatch: Schema = {
  tables: [
    {
      id: 't_users',
      name: 'users',
      columns: [
        { id: 'c_users_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true },
      ],
    },
    {
      id: 't_orders',
      name: 'orders',
      columns: [
        { id: 'c_orders_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true },
        { id: 'c_orders_user_id', name: 'user_id', type: 'VARCHAR', length: 50, primaryKey: false, nullable: false, unique: false },
      ],
    },
  ],
  relationships: [
    { id: 'r_1', fromTable: 't_orders', fromColumn: 'c_orders_user_id', toTable: 't_users', toColumn: 'c_users_id', onDelete: 'CASCADE' },
  ],
};

/** 8. length on a non-VARCHAR column */
export const invalidLengthOnNonVarchar: Schema = {
  tables: [
    {
      id: 't_items',
      name: 'items',
      columns: [
        { id: 'c_items_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true },
        { id: 'c_items_count', name: 'count', type: 'INTEGER', primaryKey: false, nullable: false, unique: false, length: 10 },
      ],
    },
  ],
  relationships: [],
};

/** 9. autoIncrement on a non-PK column */
export const invalidAutoIncrementNonPk: Schema = {
  tables: [
    {
      id: 't_items',
      name: 'items',
      columns: [
        { id: 'c_items_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true },
        { id: 'c_items_seq', name: 'seq', type: 'INTEGER', primaryKey: false, nullable: false, unique: false, autoIncrement: true },
      ],
    },
  ],
  relationships: [],
};

/** 10. Table name is a SQL reserved word */
export const invalidReservedTableName: Schema = {
  tables: [
    {
      id: 't_select',
      name: 'select',
      columns: [
        { id: 'c_select_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true },
      ],
    },
  ],
  relationships: [],
};
