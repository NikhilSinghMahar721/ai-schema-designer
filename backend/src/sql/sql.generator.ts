/**
 * Deterministic SQL generator: validated Schema JSON → CREATE TABLE statements.
 * Supports PostgreSQL (required) and MySQL (nice to have).
 *
 * Rules from requirements.md §8:
 * - Tables emitted in dependency order (referenced tables first).
 * - Circular references use ALTER TABLE … ADD CONSTRAINT after all CREATE TABLEs.
 * - Identifiers are validated AND quoted.
 * - Default values emitted only as safe literals.
 * - Output ends with a newline and is stable (sorted by dependency, then name).
 */

import type { Schema, Table, Column, Relationship, Dialect } from '../schema/schema.types.js';
import { quotePg, quoteMysql, assertSafeIdentifier } from './identifier.util.js';
import { sqlType, autoIncrementSyntax } from './type-map.js';

// ── Helpers ───────────────────────────────────────────────────────────

type QuoteFn = (name: string) => string;

function quoteFor(dialect: Dialect): QuoteFn {
  return dialect === 'postgresql' ? quotePg : quoteMysql;
}

// ── Safe default literal formatting ──────────────────────────────────

/**
 * Converts a defaultValue to a safe SQL literal string.
 * - strings: single-quote escaped (replace ' with '')
 * - numbers: validated, emitted as-is
 * - booleans: TRUE / FALSE
 * - null: NULL
 * Throws on anything else.
 */
function safeLiteral(value: string | number | boolean | null): string {
  if (value === null) return 'NULL';

  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`unsafe_default: non-finite number "${value}"`);
    }
    return String(value);
  }

  if (typeof value === 'string') {
    // Escape single quotes by doubling them
    const escaped = value.replace(/'/g, "''");
    return `'${escaped}'`;
  }

  throw new Error(`unsafe_default: unsupported type "${typeof value}"`);
}

// ── Dependency ordering ──────────────────────────────────────────────

/**
 * Topological sort of tables based on FK relationships.
 * Returns { ordered: Table[], deferred: Relationship[] }.
 * `deferred` contains relationships that form cycles and must use ALTER TABLE.
 */
function topologicalSort(
  tables: Table[],
  relationships: Relationship[],
): { ordered: Table[]; deferred: Relationship[] } {
  const tableById = new Map<string, Table>();
  for (const t of tables) tableById.set(t.id, t);

  // Build adjacency: fromTable depends on toTable
  const deps = new Map<string, Set<string>>();
  for (const t of tables) deps.set(t.id, new Set());

  const relsByFromTable = new Map<string, Relationship[]>();
  for (const r of relationships) {
    if (!relsByFromTable.has(r.fromTable)) relsByFromTable.set(r.fromTable, []);
    relsByFromTable.get(r.fromTable)!.push(r);
  }

  for (const r of relationships) {
    // Self-references are not a dependency issue for ordering
    if (r.fromTable !== r.toTable) {
      deps.get(r.fromTable)?.add(r.toTable);
    }
  }

  // Kahn's algorithm
  const inDegree = new Map<string, number>();
  for (const t of tables) inDegree.set(t.id, 0);
  for (const [, targets] of deps) {
    for (const target of targets) {
      inDegree.set(target, (inDegree.get(target) ?? 0) + 0);
      // Actually: the dependency is "fromTable depends on toTable",
      // so toTable must come first. We invert: inDegree counts how many
      // tables must come before this one.
    }
  }

  // Recalculate properly: for each dep edge (from → to), `from` has +1 indegree
  for (const t of tables) inDegree.set(t.id, 0);
  for (const [from, tos] of deps) {
    inDegree.set(from, (inDegree.get(from) ?? 0) + tos.size);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  // Sort the initial queue alphabetically by table name for deterministic output
  queue.sort((a, b) => {
    const nameA = tableById.get(a)!.name;
    const nameB = tableById.get(b)!.name;
    return nameA.localeCompare(nameB);
  });

  const ordered: Table[] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    ordered.push(tableById.get(id)!);

    // Find tables that depend on this one and reduce their in-degree
    for (const [depId, depSet] of deps) {
      if (depSet.has(id)) {
        depSet.delete(id);
        const newDeg = (inDegree.get(depId) ?? 1) - 1;
        inDegree.set(depId, newDeg);
        if (newDeg === 0 && !visited.has(depId)) {
          // Insert in sorted position for determinism
          const depName = tableById.get(depId)!.name;
          let inserted = false;
          for (let i = 0; i < queue.length; i++) {
            if (tableById.get(queue[i])!.name.localeCompare(depName) > 0) {
              queue.splice(i, 0, depId);
              inserted = true;
              break;
            }
          }
          if (!inserted) queue.push(depId);
        }
      }
    }
  }

  // Any tables not visited are part of cycles — add them sorted by name
  const remaining = tables
    .filter((t) => !visited.has(t.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  ordered.push(...remaining);

  // Deferred relationships: those whose fromTable or toTable is in a cycle,
  // or where the toTable wasn't visited before fromTable.
  const orderIndex = new Map<string, number>();
  ordered.forEach((t, i) => orderIndex.set(t.id, i));

  const deferred: Relationship[] = [];
  const inline: Relationship[] = [];

  for (const r of relationships) {
    const fromIdx = orderIndex.get(r.fromTable) ?? -1;
    const toIdx = orderIndex.get(r.toTable) ?? -1;

    // Self-references can be inline
    if (r.fromTable === r.toTable) {
      inline.push(r);
      continue;
    }

    // If the referenced table appears after the referencing table, defer
    if (toIdx >= fromIdx) {
      // This means toTable wasn't created before fromTable — part of a cycle
      if (!visited.has(r.fromTable) || !visited.has(r.toTable) || toIdx > fromIdx) {
        // Actually if toIdx > fromIdx it means toTable is created AFTER fromTable,
        // but we ordered by dependency, so toTable should be BEFORE fromTable.
        // Wait — toTable should have LOWER index since it's created first.
        // If toIdx >= fromIdx and they're different tables, something is wrong.
        // Let me re-think: ordered[0] is created first. If fromTable depends on toTable,
        // toTable should have a LOWER index. So if toIdx > fromIdx, it's a problem.
        // But if toIdx < fromIdx, it's fine (toTable created first).
        // If toIdx === fromIdx, that means same table (self-ref), handled above.
        deferred.push(r);
      } else {
        inline.push(r);
      }
    } else {
      // toIdx < fromIdx: toTable created before fromTable — can be inline
      inline.push(r);
    }
  }

  return { ordered, deferred };
}

// ── Column definition ────────────────────────────────────────────────

function columnDef(col: Column, dialect: Dialect, quote: QuoteFn): string {
  assertSafeIdentifier(col.name);

  const parts: string[] = [quote(col.name), sqlType(col, dialect)];

  if (col.autoIncrement) {
    parts.push(autoIncrementSyntax(dialect));
  }

  if (!col.nullable) {
    parts.push('NOT NULL');
  }

  if (col.unique && !col.primaryKey) {
    parts.push('UNIQUE');
  }

  if (col.defaultValue !== undefined) {
    parts.push(`DEFAULT ${safeLiteral(col.defaultValue)}`);
  }

  return parts.join(' ');
}

// ── CREATE TABLE ─────────────────────────────────────────────────────

function createTable(
  table: Table,
  inlineRels: Relationship[],
  schema: Schema,
  dialect: Dialect,
  quote: QuoteFn,
): string {
  assertSafeIdentifier(table.name);

  const lines: string[] = [];

  // Column definitions
  for (const col of table.columns) {
    lines.push(`  ${columnDef(col, dialect, quote)}`);
  }

  // Primary key constraint
  const pkCols = table.columns.filter((c) => c.primaryKey);
  if (pkCols.length > 0) {
    const pkNames = pkCols.map((c) => quote(c.name)).join(', ');
    lines.push(`  PRIMARY KEY (${pkNames})`);
  }

  // Inline foreign key constraints
  const tableRels = inlineRels.filter((r) => r.fromTable === table.id);
  for (const rel of tableRels) {
    const fromCol = findColumnById(schema, rel.fromColumn);
    const toTable = findTableById(schema, rel.toTable);
    const toCol = findColumnById(schema, rel.toColumn);

    if (fromCol && toTable && toCol) {
      assertSafeIdentifier(toTable.name);
      lines.push(
        `  FOREIGN KEY (${quote(fromCol.name)}) REFERENCES ${quote(toTable.name)}(${quote(toCol.name)}) ON DELETE ${rel.onDelete}`,
      );
    }
  }

  return `CREATE TABLE ${quote(table.name)} (\n${lines.join(',\n')}\n);`;
}

// ── ALTER TABLE for deferred FKs ─────────────────────────────────────

function alterTableFk(
  rel: Relationship,
  schema: Schema,
  dialect: Dialect,
  quote: QuoteFn,
): string {
  const fromTable = findTableById(schema, rel.fromTable);
  const fromCol = findColumnById(schema, rel.fromColumn);
  const toTable = findTableById(schema, rel.toTable);
  const toCol = findColumnById(schema, rel.toColumn);

  if (!fromTable || !fromCol || !toTable || !toCol) {
    throw new Error(`Cannot resolve relationship "${rel.id}" for ALTER TABLE`);
  }

  assertSafeIdentifier(fromTable.name);
  assertSafeIdentifier(toTable.name);

  // Constraint name: fk_<fromTable>_<fromColumn>
  const constraintName = `fk_${fromTable.name}_${fromCol.name}`;

  return `ALTER TABLE ${quote(fromTable.name)} ADD CONSTRAINT ${quote(constraintName)} FOREIGN KEY (${quote(fromCol.name)}) REFERENCES ${quote(toTable.name)}(${quote(toCol.name)}) ON DELETE ${rel.onDelete};`;
}

// ── Lookup helpers ───────────────────────────────────────────────────

function findTableById(schema: Schema, id: string): Table | undefined {
  return schema.tables.find((t) => t.id === id);
}

function findColumnById(schema: Schema, id: string): Column | undefined {
  for (const table of schema.tables) {
    const col = table.columns.find((c) => c.id === id);
    if (col) return col;
  }
  return undefined;
}

// ── Main export ──────────────────────────────────────────────────────

/**
 * Generates SQL DDL from a validated Schema.
 * The schema MUST have been validated (Zod + semantics) before calling this.
 */
export function generateSql(schema: Schema, dialect: Dialect): string {
  const quote = quoteFor(dialect);
  const { ordered, deferred } = topologicalSort(schema.tables, schema.relationships);

  // Determine which relationships are inline (not deferred)
  const deferredIds = new Set(deferred.map((r) => r.id));
  const inlineRels = schema.relationships.filter((r) => !deferredIds.has(r.id));

  const statements: string[] = [];

  // CREATE TABLE statements in dependency order
  for (const table of ordered) {
    statements.push(createTable(table, inlineRels, schema, dialect, quote));
  }

  // ALTER TABLE statements for deferred (circular) FKs
  for (const rel of deferred) {
    statements.push(alterTableFk(rel, schema, dialect, quote));
  }

  return statements.join('\n\n') + '\n';
}
