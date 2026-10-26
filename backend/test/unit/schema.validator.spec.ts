import { describe, it, expect } from 'vitest';
import { SchemaZ } from '../../src/schema/schema.types.js';
import { validateSemantics, SchemaValidationError } from '../../src/schema/schema.validator.js';
import {
  validMinimal,
  validLibrary,
  validAllTypes,
  invalidDuplicateTableNames,
  invalidDuplicateColumnNames,
  invalidNoPrimaryKey,
  invalidFkBadTable,
  invalidFkBadColumn,
  invalidFkTargetNotPkOrUnique,
  invalidFkTypeMismatch,
  invalidLengthOnNonVarchar,
  invalidAutoIncrementNonPk,
  invalidReservedTableName,
} from '../fixtures/schemas.js';

// ─── Valid schemas should pass both Zod and semantic validation ──────

describe('Valid schemas', () => {
  it('validMinimal passes Zod parse and semantic validation', () => {
    const parsed = SchemaZ.parse(validMinimal);
    expect(() => validateSemantics(parsed)).not.toThrow();
  });

  it('validLibrary passes Zod parse and semantic validation', () => {
    const parsed = SchemaZ.parse(validLibrary);
    expect(() => validateSemantics(parsed)).not.toThrow();
  });

  it('validAllTypes passes Zod parse and semantic validation', () => {
    const parsed = SchemaZ.parse(validAllTypes);
    expect(() => validateSemantics(parsed)).not.toThrow();
  });
});

// ─── Invalid schemas should be rejected by semantic validation ──────

describe('Invalid schemas — semantic validation', () => {
  it('rejects duplicate table names', () => {
    expect(() => validateSemantics(invalidDuplicateTableNames)).toThrow(SchemaValidationError);
    try {
      validateSemantics(invalidDuplicateTableNames);
    } catch (e) {
      expect((e as SchemaValidationError).errors).toEqual(
        expect.arrayContaining([expect.stringContaining('Duplicate table name')]),
      );
    }
  });

  it('rejects duplicate column names within a table', () => {
    expect(() => validateSemantics(invalidDuplicateColumnNames)).toThrow(SchemaValidationError);
  });

  it('rejects table with no primary key', () => {
    expect(() => validateSemantics(invalidNoPrimaryKey)).toThrow(SchemaValidationError);
    try {
      validateSemantics(invalidNoPrimaryKey);
    } catch (e) {
      expect((e as SchemaValidationError).errors).toEqual(
        expect.arrayContaining([expect.stringContaining('no primary key')]),
      );
    }
  });

  it('rejects FK referencing non-existent table', () => {
    expect(() => validateSemantics(invalidFkBadTable)).toThrow(SchemaValidationError);
  });

  it('rejects FK referencing non-existent column', () => {
    expect(() => validateSemantics(invalidFkBadColumn)).toThrow(SchemaValidationError);
  });

  it('rejects FK where toColumn is not PK or unique', () => {
    expect(() => validateSemantics(invalidFkTargetNotPkOrUnique)).toThrow(SchemaValidationError);
  });

  it('rejects FK with type mismatch', () => {
    expect(() => validateSemantics(invalidFkTypeMismatch)).toThrow(SchemaValidationError);
  });

  it('rejects length on non-VARCHAR column', () => {
    expect(() => validateSemantics(invalidLengthOnNonVarchar)).toThrow(SchemaValidationError);
  });

  it('rejects autoIncrement on non-PK column', () => {
    expect(() => validateSemantics(invalidAutoIncrementNonPk)).toThrow(SchemaValidationError);
  });

  it('rejects SQL reserved word as table name', () => {
    expect(() => validateSemantics(invalidReservedTableName)).toThrow(SchemaValidationError);
  });
});

// ─── Zod structural validation ──────────────────────────────────────

describe('Zod structural validation', () => {
  it('rejects non-JSON input', () => {
    expect(() => SchemaZ.parse('not json')).toThrow();
  });

  it('rejects empty tables array', () => {
    expect(() => SchemaZ.parse({ tables: [], relationships: [] })).toThrow();
  });

  it('rejects unknown column type', () => {
    expect(() =>
      SchemaZ.parse({
        tables: [
          {
            id: 't_1',
            name: 'test',
            columns: [
              { id: 'c_1', name: 'col', type: 'MONEY', primaryKey: true, nullable: false, unique: false },
            ],
          },
        ],
        relationships: [],
      }),
    ).toThrow();
  });

  it('rejects table name with uppercase', () => {
    expect(() =>
      SchemaZ.parse({
        tables: [
          {
            id: 't_1',
            name: 'Users',
            columns: [
              { id: 'c_1', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: false },
            ],
          },
        ],
        relationships: [],
      }),
    ).toThrow();
  });

  it('rejects invalid onDelete value', () => {
    expect(() =>
      SchemaZ.parse({
        tables: [
          {
            id: 't_1',
            name: 'a',
            columns: [{ id: 'c_1', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: false }],
          },
          {
            id: 't_2',
            name: 'b',
            columns: [
              { id: 'c_2', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: false },
              { id: 'c_3', name: 'a_id', type: 'INTEGER', primaryKey: false, nullable: false, unique: false },
            ],
          },
        ],
        relationships: [
          { id: 'r_1', fromTable: 't_2', fromColumn: 'c_3', toTable: 't_1', toColumn: 'c_1', onDelete: 'DELETE' },
        ],
      }),
    ).toThrow();
  });
});
