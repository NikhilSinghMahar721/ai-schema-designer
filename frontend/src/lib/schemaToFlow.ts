/**
 * schemaToFlow.ts — Transforms schema JSON to React Flow Nodes & Edges, and back.
 * Implements deterministic auto-layout and supports persisting manual drag positions.
 */

import { MarkerType, type Edge, type Node } from '@xyflow/react';
import type { Schema, Table, Relationship, OnDeleteAction } from '../features/designer/types';

export interface TableNodeData {
  table: Table;
  [key: string]: unknown;
}

export type TableNodeType = Node<TableNodeData, 'tableNode'>;

/**
 * Calculates automatic layout positions for tables using a level-based grid.
 * Independent tables (or root referenced tables) are placed first, with dependent
 * tables organized logically to minimize overlapping edges.
 */
export function computeAutoLayout(
  schema: Schema,
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const { tables, relationships } = schema;

  if (tables.length === 0) return positions;

  // Build in-degree (how many other tables reference this table)
  // Tables with high in-degree (like 'users') are central models
  const inDegree: Record<string, number> = {};
  const outDegree: Record<string, number> = {};
  for (const t of tables) {
    inDegree[t.id] = 0;
    outDegree[t.id] = 0;
  }

  for (const rel of relationships) {
    if (outDegree[rel.fromTable] !== undefined) {
      outDegree[rel.fromTable]++;
    }
    if (inDegree[rel.toTable] !== undefined) {
      inDegree[rel.toTable]++;
    }
  }

  // Sort tables: referenced tables first, then by number of columns
  const sorted = [...tables].sort((a, b) => {
    // Tables referenced by others come first (roots / lookup entities)
    const refDiff = (inDegree[b.id] ?? 0) - (inDegree[a.id] ?? 0);
    if (refDiff !== 0) return refDiff;
    return (outDegree[a.id] ?? 0) - (outDegree[b.id] ?? 0);
  });

  // Lay out in a responsive grid
  const COLS = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(tables.length))));
  const COL_WIDTH = 380;
  const START_X = 60;
  const START_Y = 60;

  // Track height per column
  const columnHeights = new Array(COLS).fill(START_Y);

  sorted.forEach((table) => {
    // Choose column with smallest current height
    let bestCol = 0;
    let minH = columnHeights[0];
    for (let c = 1; c < COLS; c++) {
      if (columnHeights[c] < minH) {
        minH = columnHeights[c];
        bestCol = c;
      }
    }

    const x = START_X + bestCol * COL_WIDTH;
    const y = columnHeights[bestCol];

    positions[table.id] = { x, y };

    // Estimate table height: header (~50px) + column rows (~38px each) + padding (~40px)
    const estimatedHeight = 60 + table.columns.length * 38 + 40;
    columnHeights[bestCol] += estimatedHeight + 40; // 40px margin between vertical cards
  });

  return positions;
}

/**
 * Transforms Schema into React Flow nodes and edges.
 * Uses existing cached positions if provided; otherwise computes auto-layout.
 */
export function schemaToFlow(
  schema: Schema,
  cachedPositions?: Record<string, { x: number; y: number }>,
): {
  nodes: TableNodeType[];
  edges: Edge[];
} {
  const autoLayout = computeAutoLayout(schema);

  const nodes: TableNodeType[] = schema.tables.map((table) => {
    const position =
      cachedPositions && cachedPositions[table.id]
        ? cachedPositions[table.id]
        : autoLayout[table.id] ?? { x: 80, y: 80 };

    return {
      id: table.id,
      type: 'tableNode',
      position,
      data: {
        table,
      },
      dragHandle: '.table-drag-handle',
    };
  });

  const edges: Edge[] = schema.relationships.map((rel) => {
    const edgeColor =
      rel.onDelete === 'CASCADE'
        ? '#3b82f6' // precision blue
        : rel.onDelete === 'SET NULL'
        ? '#10b981' // emerald
        : '#f59e0b'; // amber

    return {
      id: rel.id,
      source: rel.fromTable,
      target: rel.toTable,
      sourceHandle: rel.fromColumn,
      targetHandle: rel.toColumn,
      type: 'smoothstep',
      animated: false,
      style: {
        stroke: edgeColor,
        strokeWidth: 1.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 12,
        height: 12,
        color: edgeColor,
      },
      data: {
        id: rel.id,
        onDelete: rel.onDelete,
        fromTable: rel.fromTable,
        fromColumn: rel.fromColumn,
        toTable: rel.toTable,
        toColumn: rel.toColumn,
      },
      label: rel.onDelete,
      labelStyle: {
        fill: '#a1a1aa',
        fontSize: 10,
        fontWeight: 600,
        fontFamily: 'monospace',
      },
      labelBgStyle: {
        fill: '#18181b',
        fillOpacity: 0.95,
        stroke: '#27272a',
        strokeWidth: 1,
        rx: 4,
        ry: 4,
      },
      labelBgPadding: [4, 2] as [number, number],
    };
  });

  return { nodes, edges };
}

/**
 * Reverse mapping: Reconstructs a Schema from React Flow nodes and edges,
 * preserving schema integrity and custom properties.
 */
export function flowToSchema(
  nodes: Node[],
  edges: Edge[],
  fallbackSchema?: Schema,
): Schema {
  const tableMap = new Map<string, Table>();

  // Map original tables for reference to preserve unedited metadata
  if (fallbackSchema) {
    for (const t of fallbackSchema.tables) {
      tableMap.set(t.id, t);
    }
  }

  const tables: Table[] = [];

  for (const node of nodes) {
    if (node.type === 'tableNode' && node.data?.table) {
      tables.push(node.data.table as Table);
    } else if (tableMap.has(node.id)) {
      tables.push(tableMap.get(node.id)!);
    }
  }

  const relationships: Relationship[] = edges.map((edge) => {
    const data = (edge.data || {}) as Record<string, unknown>;
    const onDelete = (data.onDelete as OnDeleteAction) || 'CASCADE';

    return {
      id: edge.id,
      fromTable: edge.source,
      fromColumn: (edge.sourceHandle as string) || (data.fromColumn as string) || '',
      toTable: edge.target,
      toColumn: (edge.targetHandle as string) || (data.toColumn as string) || '',
      onDelete,
    };
  });

  return {
    tables,
    relationships,
  };
}
