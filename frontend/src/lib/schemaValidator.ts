/**
 * Client-side validation rules mirroring backend schema.validator.ts and identifier.util.ts.
 * Note: Backend remains the authoritative validator, but this client validator gives
 * instant inline feedback as the user edits tables, columns, and relationships.
 */

import type { Schema, Column, ColumnType } from '../features/designer/types';

export const NAME_RE = /^[a-z_][a-z0-9_]{0,62}$/;

export const RESERVED_WORDS = new Set([
  'ABORT', 'ABS', 'ABSOLUTE', 'ACCESS', 'ACTION', 'ADD', 'ADMIN', 'AFTER',
  'AGGREGATE', 'ALL', 'ALSO', 'ALTER', 'ALWAYS', 'ANALYSE', 'ANALYZE', 'AND',
  'ANY', 'ARRAY', 'AS', 'ASC', 'ASSERTION', 'ASSIGNMENT', 'ASYMMETRIC', 'AT',
  'AUTHORIZATION', 'BACKWARD', 'BEFORE', 'BEGIN', 'BETWEEN', 'BIGINT', 'BINARY',
  'BIT', 'BOOLEAN', 'BOTH', 'BY', 'CACHE', 'CALL', 'CALLED', 'CASCADE',
  'CASCADED', 'CASE', 'CAST', 'CATALOG', 'CHAIN', 'CHANGE', 'CHAR', 'CHARACTER',
  'CHECK', 'CHECKPOINT', 'CLASS', 'CLOSE', 'CLUSTER', 'COALESCE', 'COLLATE',
  'COLLATION', 'COLUMN', 'COLUMNS', 'COMMENT', 'COMMIT', 'COMMITTED',
  'CONCURRENTLY', 'CONDITION', 'CONFIGURATION', 'CONNECT', 'CONNECTION',
  'CONSTRAINT', 'CONSTRAINTS', 'CONTENT', 'CONTINUE', 'CONVERSION', 'COPY',
  'CORRESPONDING', 'COST', 'CREATE', 'CROSS', 'CSV', 'CUBE', 'CURRENT',
  'CURRENT_DATE', 'CURRENT_ROLE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP',
  'CURRENT_USER', 'CURSOR', 'CYCLE', 'DATA', 'DATABASE', 'DATABASES', 'DATE',
  'DAY', 'DEALLOCATE', 'DEC', 'DECIMAL', 'DECLARE', 'DEFAULT', 'DEFAULTS',
  'DEFERRABLE', 'DEFERRED', 'DEFINER', 'DELETE', 'DELIMITER', 'DELIMITERS',
  'DENSE_RANK', 'DESC', 'DESCRIBE', 'DETERMINISTIC', 'DICTIONARY', 'DISABLE',
  'DISCARD', 'DISTINCT', 'DO', 'DOMAIN', 'DOUBLE', 'DROP', 'DUAL', 'EACH',
  'ELSE', 'ELSEIF', 'ENABLE', 'ENCODING', 'ENCRYPTED', 'END', 'ENUM', 'ESCAPE',
  'EVENT', 'EXCEPT', 'EXCHANGE', 'EXCLUDE', 'EXCLUDING', 'EXCLUSIVE', 'EXECUTE',
  'EXISTS', 'EXIT', 'EXPLAIN', 'EXTENSION', 'EXTERNAL', 'EXTRACT', 'FALSE',
  'FAMILY', 'FETCH', 'FILTER', 'FIRST', 'FLOAT', 'FOLLOWING', 'FOR', 'FORCE',
  'FOREIGN', 'FORWARD', 'FOUND', 'FREE', 'FREEZE', 'FROM', 'FULL', 'FUNCTION',
  'FUNCTIONS', 'GENERATED', 'GET', 'GLOBAL', 'GOTO', 'GRANT', 'GRANTED',
  'GROUP', 'GROUPING', 'HANDLER', 'HAVING', 'HEADER', 'HOLD', 'HOUR',
  'IDENTITY', 'IF', 'IGNORE', 'ILIKE', 'IMMEDIATE', 'IMMUTABLE', 'IMPLICIT',
  'IMPORT', 'IN', 'INCLUDING', 'INCREMENT', 'INDEX', 'INDEXES', 'INDICATOR',
  'INFILE', 'INHERIT', 'INHERITS', 'INITIALLY', 'INLINE', 'INNER', 'INOUT',
  'INPUT', 'INSENSITIVE', 'INSERT', 'INSTEAD', 'INT', 'INTEGER', 'INTERSECT',
  'INTERVAL', 'INTO', 'INVOKER', 'IS', 'ISNULL', 'ISOLATION', 'ITERATE',
  'JOIN', 'KEY', 'KEYS', 'KILL', 'LABEL', 'LANGUAGE', 'LARGE', 'LAST',
  'LATERAL', 'LEADING', 'LEAVE', 'LEFT', 'LEVEL', 'LIKE', 'LIMIT', 'LINES',
  'LISTEN', 'LOAD', 'LOCAL', 'LOCALTIME', 'LOCALTIMESTAMP', 'LOCATION', 'LOCK',
  'LOCKED', 'LOOP', 'MAPPING', 'MATCH', 'MATERIALIZED', 'MAXVALUE', 'MERGE',
  'METHOD', 'MINUTE', 'MINVALUE', 'MOD', 'MODE', 'MODIFIES', 'MONTH', 'MOVE',
  'NAME', 'NAMES', 'NATIONAL', 'NATURAL', 'NCHAR', 'NEW', 'NEXT', 'NO', 'NONE',
  'NOT', 'NOTHING', 'NOTIFY', 'NOTNULL', 'NOWAIT', 'NULL', 'NULLIF', 'NULLS',
  'NUMERIC', 'OBJECT', 'OF', 'OFF', 'OFFSET', 'OIDS', 'OLD', 'ON', 'ONLY',
  'OPEN', 'OPERATOR', 'OPTION', 'OPTIONS', 'OR', 'ORDER', 'ORDINALITY', 'OUT',
  'OUTER', 'OUTPUT', 'OVER', 'OVERLAPS', 'OVERLAY', 'OVERRIDING', 'OWNED',
  'OWNER', 'PARALLEL', 'PARSER', 'PARTIAL', 'PARTITION', 'PASSING', 'PASSWORD',
  'PLACING', 'PLANS', 'POLICY', 'POSITION', 'PRECEDING', 'PRECISION', 'PREPARE',
  'PREPARED', 'PRESERVE', 'PRIMARY', 'PRIOR', 'PRIVILEGES', 'PROCEDURAL',
  'PROCEDURE', 'PROGRAM', 'PUBLICATION', 'PURGE', 'QUOTE', 'RANGE', 'RANK',
  'READ', 'READS', 'REAL', 'REASSIGN', 'RECHECK', 'RECURSIVE', 'REF',
  'REFERENCES', 'REFERENCING', 'REFRESH', 'REINDEX', 'RELATIVE', 'RELEASE',
  'RENAME', 'REPEAT', 'REPEATABLE', 'REPLACE', 'REPLICA', 'REQUIRE', 'RESET',
  'RESIGNAL', 'RESTART', 'RESTRICT', 'RETURN', 'RETURNING', 'RETURNS',
  'REVOKE', 'RIGHT', 'ROLE', 'ROLLBACK', 'ROLLUP', 'ROUTINE', 'ROW',
  'ROW_NUMBER', 'ROWS', 'RULE', 'SAVEPOINT', 'SCHEMA', 'SCHEMAS', 'SCROLL',
  'SEARCH', 'SECOND', 'SECURITY', 'SELECT', 'SENSITIVE', 'SEPARATOR',
  'SEQUENCE', 'SEQUENCES', 'SERIALIZABLE', 'SERVER', 'SESSION', 'SESSION_USER',
  'SET', 'SETOF', 'SETS', 'SHARE', 'SHOW', 'SIGNAL', 'SIMILAR', 'SIMPLE',
  'SKIP', 'SMALLINT', 'SNAPSHOT', 'SOME', 'SPECIFIC', 'SQL', 'SQLEXCEPTION',
  'SQLSTATE', 'SQLWARNING', 'STABLE', 'STANDALONE', 'START', 'STATEMENT',
  'STATISTICS', 'STDIN', 'STDOUT', 'STORAGE', 'STORED', 'STRICT', 'STRIP',
  'SUBSCRIPTION', 'SUBSTRING', 'SYMMETRIC', 'SYSID', 'SYSTEM', 'TABLE',
  'TABLES', 'TABLESAMPLE', 'TABLESPACE', 'TEMP', 'TEMPLATE', 'TEMPORARY',
  'TERMINATED', 'TEXT', 'THEN', 'TIES', 'TIME', 'TIMESTAMP', 'TO', 'TRAILING',
  'TRANSACTION', 'TRANSFORM', 'TREAT', 'TRIGGER', 'TRIM', 'TRUE', 'TRUNCATE',
  'TRUSTED', 'TYPE', 'TYPES', 'UNDO', 'UNBOUNDED', 'UNCOMMITTED', 'UNENCRYPTED',
  'UNION', 'UNIQUE', 'UNKNOWN', 'UNLISTEN', 'UNLOCK', 'UNLOGGED', 'UNSIGNED',
  'UNTIL', 'UPDATE', 'USAGE', 'USE', 'USER', 'USING', 'VACUUM', 'VALID',
  'VALIDATE', 'VALIDATOR', 'VALUE', 'VALUES', 'VARCHAR', 'VARIADIC', 'VARYING',
  'VERBOSE', 'VERSION', 'VIEW', 'VIEWS', 'VIRTUAL', 'VOLATILE', 'WHEN', 'WHERE',
  'WHILE', 'WHITESPACE', 'WINDOW', 'WITH', 'WITHIN', 'WITHOUT', 'WORK', 'WRAPPER',
  'WRITE', 'XML', 'XMLATTRIBUTES', 'XMLCONCAT', 'XMLELEMENT', 'XMLEXISTS',
  'XMLFOREST', 'XMLNAMESPACES', 'XMLPARSE', 'XMLPI', 'XMLROOT', 'XMLSERIALIZE',
  'XMLTABLE', 'XOR', 'YEAR', 'YES', 'ZEROFILL', 'ZONE',
]);

export function isValidName(name: string): boolean {
  return NAME_RE.test(name);
}

export function isReservedWord(name: string): boolean {
  return RESERVED_WORDS.has(name.toUpperCase());
}

export function areTypesCompatible(fkType: ColumnType, refType: ColumnType): boolean {
  if (fkType === refType) return true;
  const integerTypes = new Set<ColumnType>(['INTEGER', 'BIGINT']);
  return integerTypes.has(fkType) && integerTypes.has(refType);
}

/**
 * Validates a schema according to backend rules.
 * Returns an array of error messages (empty array means valid).
 */
export function validateSchemaClient(schema: Schema): string[] {
  const errors: string[] = [];

  // Limits
  if (schema.tables.length > 30) {
    errors.push(`Maximum 30 tables allowed (current: ${schema.tables.length})`);
  }
  if (schema.relationships.length > 100) {
    errors.push(`Maximum 100 relationships allowed (current: ${schema.relationships.length})`);
  }

  const tableNames = new Set<string>();
  const tableIdMap = new Map<string, string>();
  const columnIdMap = new Map<string, { tableName: string; column: Column }>();

  for (const table of schema.tables) {
    // Table name format & uniqueness
    if (!isValidName(table.name)) {
      errors.push(`Table name "${table.name}" must start with a lowercase letter or underscore, containing only lowercase letters, digits, or underscores (max 63 chars).`);
    }
    if (isReservedWord(table.name)) {
      errors.push(`Table name "${table.name}" is a SQL reserved word.`);
    }
    if (tableNames.has(table.name)) {
      errors.push(`Duplicate table name: "${table.name}"`);
    }
    tableNames.add(table.name);

    tableIdMap.set(table.id, table.name);

    if (table.columns.length === 0) {
      errors.push(`Table "${table.name}" must have at least 1 column.`);
    }
    if (table.columns.length > 50) {
      errors.push(`Table "${table.name}" exceeds limit of 50 columns.`);
    }

    const colNames = new Set<string>();
    let hasPK = false;

    for (const col of table.columns) {
      if (!isValidName(col.name)) {
        errors.push(`Column name "${col.name}" in "${table.name}" is not a valid identifier.`);
      }
      if (isReservedWord(col.name)) {
        errors.push(`Column name "${col.name}" in "${table.name}" is a SQL reserved word.`);
      }
      if (colNames.has(col.name)) {
        errors.push(`Duplicate column name "${col.name}" in table "${table.name}".`);
      }
      colNames.add(col.name);

      columnIdMap.set(col.id, { tableName: table.name, column: col });

      if (col.primaryKey) {
        hasPK = true;
      }

      if (col.length !== undefined && col.type !== 'VARCHAR') {
        errors.push(`Column "${col.name}" in "${table.name}": "length" is only allowed for VARCHAR.`);
      }
      if (col.type === 'VARCHAR' && col.length !== undefined && (col.length < 1 || col.length > 1000)) {
        errors.push(`Column "${col.name}" in "${table.name}": VARCHAR length must be between 1 and 1000.`);
      }

      if ((col.precision !== undefined || col.scale !== undefined) && col.type !== 'DECIMAL') {
        errors.push(`Column "${col.name}" in "${table.name}": precision and scale are only allowed for DECIMAL.`);
      }

      if (col.autoIncrement) {
        if (!col.primaryKey) {
          errors.push(`Column "${col.name}" in "${table.name}": autoIncrement requires primaryKey.`);
        }
        if (col.type !== 'INTEGER' && col.type !== 'BIGINT') {
          errors.push(`Column "${col.name}" in "${table.name}": autoIncrement is only allowed on INTEGER or BIGINT.`);
        }
      }
    }

    if (!hasPK && table.columns.length > 0) {
      errors.push(`Table "${table.name}" has no primary key column.`);
    }
  }

  // Validate relationships
  for (const rel of schema.relationships) {
    const fromTableName = tableIdMap.get(rel.fromTable);
    const toTableName = tableIdMap.get(rel.toTable);

    if (!fromTableName) {
      errors.push(`Relationship references missing source table id "${rel.fromTable}".`);
      continue;
    }
    if (!toTableName) {
      errors.push(`Relationship references missing target table id "${rel.toTable}".`);
      continue;
    }

    const fromColInfo = columnIdMap.get(rel.fromColumn);
    const toColInfo = columnIdMap.get(rel.toColumn);

    if (!fromColInfo || fromColInfo.tableName !== fromTableName) {
      errors.push(`Relationship references missing or misaligned source column "${rel.fromColumn}" in "${fromTableName}".`);
    }
    if (!toColInfo || toColInfo.tableName !== toTableName) {
      errors.push(`Relationship references missing or misaligned target column "${rel.toColumn}" in "${toTableName}".`);
    }

    if (toColInfo && !(toColInfo.column.primaryKey || toColInfo.column.unique)) {
      errors.push(`Target column "${toColInfo.column.name}" in "${toTableName}" must be PRIMARY KEY or UNIQUE to be referenced by FK.`);
    }

    if (fromColInfo && toColInfo) {
      if (!areTypesCompatible(fromColInfo.column.type, toColInfo.column.type)) {
        errors.push(
          `Type mismatch in relation from "${fromTableName}.${fromColInfo.column.name}" (${fromColInfo.column.type}) to "${toTableName}.${toColInfo.column.name}" (${toColInfo.column.type}).`,
        );
      }
    }
  }

  return errors;
}
