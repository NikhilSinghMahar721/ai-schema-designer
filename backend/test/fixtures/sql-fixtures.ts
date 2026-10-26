/**
 * Additional test fixtures for SQL generator tests.
 * Circular references, defaults, and edge cases.
 */

import type { Schema } from '../../src/schema/schema.types.js';

/** Two tables that reference each other (circular FK dependency) */
export const circularRefs: Schema = {
  tables: [
    {
      id: 't_employees',
      name: 'employees',
      columns: [
        { id: 'c_emp_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true, autoIncrement: true },
        { id: 'c_emp_name', name: 'emp_name', type: 'VARCHAR', length: 100, primaryKey: false, nullable: false, unique: false },
        { id: 'c_emp_dept_id', name: 'dept_id', type: 'INTEGER', primaryKey: false, nullable: true, unique: false },
      ],
    },
    {
      id: 't_departments',
      name: 'departments',
      columns: [
        { id: 'c_dept_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true, autoIncrement: true },
        { id: 'c_dept_name', name: 'dept_name', type: 'VARCHAR', length: 100, primaryKey: false, nullable: false, unique: false },
        { id: 'c_dept_manager_id', name: 'manager_id', type: 'INTEGER', primaryKey: false, nullable: true, unique: false },
      ],
    },
  ],
  relationships: [
    { id: 'r_emp_dept', fromTable: 't_employees', fromColumn: 'c_emp_dept_id', toTable: 't_departments', toColumn: 'c_dept_id', onDelete: 'SET NULL' },
    { id: 'r_dept_manager', fromTable: 't_departments', fromColumn: 'c_dept_manager_id', toTable: 't_employees', toColumn: 'c_emp_id', onDelete: 'SET NULL' },
  ],
};

/** Schema with string defaults containing special characters */
export const stringDefaults: Schema = {
  tables: [
    {
      id: 't_config',
      name: 'config',
      columns: [
        { id: 'c_config_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true, autoIncrement: true },
        { id: 'c_config_tag', name: 'tag', type: 'VARCHAR', length: 200, primaryKey: false, nullable: false, unique: false, defaultValue: "it's a test" },
        { id: 'c_config_enabled', name: 'enabled', type: 'BOOLEAN', primaryKey: false, nullable: false, unique: false, defaultValue: false },
        { id: 'c_config_score', name: 'score', type: 'DECIMAL', precision: 5, scale: 2, primaryKey: false, nullable: true, unique: false, defaultValue: null },
      ],
    },
  ],
  relationships: [],
};

/** Self-referencing table (e.g. categories with parent_id) */
export const selfReference: Schema = {
  tables: [
    {
      id: 't_categories',
      name: 'categories',
      columns: [
        { id: 'c_cat_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true, autoIncrement: true },
        { id: 'c_cat_name', name: 'cat_name', type: 'VARCHAR', length: 100, primaryKey: false, nullable: false, unique: false },
        { id: 'c_cat_parent_id', name: 'parent_id', type: 'INTEGER', primaryKey: false, nullable: true, unique: false },
      ],
    },
  ],
  relationships: [
    { id: 'r_cat_parent', fromTable: 't_categories', fromColumn: 'c_cat_parent_id', toTable: 't_categories', toColumn: 'c_cat_id', onDelete: 'CASCADE' },
  ],
};
