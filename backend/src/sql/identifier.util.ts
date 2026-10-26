/**
 * Identifier validation, reserved-word checking, and quoting helpers.
 * Used by both the schema validator and the SQL generator.
 */

// Strict identifier pattern from requirements.md §6
export const NAME_RE = /^[a-z_][a-z0-9_]{0,62}$/;

/**
 * SQL reserved words (combined PostgreSQL + MySQL).
 * Not exhaustive but covers the most common keywords that would collide
 * with table or column names.
 */
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

/**
 * Returns true if `name` matches the allowed identifier pattern.
 */
export function isValidName(name: string): boolean {
  return NAME_RE.test(name);
}

/**
 * Returns true if `name` is a SQL reserved word.
 */
export function isReservedWord(name: string): boolean {
  return RESERVED_WORDS.has(name.toUpperCase());
}

/**
 * Asserts that a name is a safe SQL identifier (valid pattern + not reserved).
 * Throws if invalid.
 */
export function assertSafeIdentifier(name: string): void {
  if (!isValidName(name)) {
    throw new Error(`unsafe_identifier: "${name}" does not match the allowed pattern`);
  }
  if (isReservedWord(name)) {
    throw new Error(`reserved_word: "${name}" is a SQL reserved word`);
  }
}

/**
 * Quote an identifier for PostgreSQL: "name" (double-quote escaping).
 */
export function quotePg(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/**
 * Quote an identifier for MySQL: `name` (backtick escaping).
 */
export function quoteMysql(name: string): string {
  return `\`${name.replace(/`/g, '``')}\``;
}
