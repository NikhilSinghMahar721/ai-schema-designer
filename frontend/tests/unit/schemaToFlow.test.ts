/**
 * T13.10 — Frontend unit: schemaToFlow round-trip tests.
 */

import { describe, it, expect } from 'vitest';
import { schemaToFlow, flowToSchema, computeAutoLayout } from '@/lib/schemaToFlow';
import type { Schema } from '@/features/designer/types';

const sampleSchema: Schema = {
  tables: [
    {
      id: 't_users',
      name: 'users',
      columns: [
        { id: 'c_users_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true, autoIncrement: true },
        { id: 'c_users_email', name: 'email', type: 'VARCHAR', length: 254, primaryKey: false, nullable: false, unique: true },
      ],
    },
    {
      id: 't_orders',
      name: 'orders',
      columns: [
        { id: 'c_orders_id', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, unique: true, autoIncrement: true },
        { id: 'c_orders_user_id', name: 'user_id', type: 'INTEGER', primaryKey: false, nullable: false, unique: false },
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
  ],
};

describe('schemaToFlow', () => {
  it('transforms schema to nodes and edges', () => {
    const { nodes, edges } = schemaToFlow(sampleSchema);

    expect(nodes).toHaveLength(2);
    expect(edges).toHaveLength(1);

    expect(nodes[0].id).toBe('t_users');
    expect(nodes[0].type).toBe('tableNode');
    expect(nodes[0].data.table.name).toBe('users');
    expect(nodes[0].position).toBeDefined();

    expect(edges[0].id).toBe('r_orders_users');
    expect(edges[0].source).toBe('t_orders');
    expect(edges[0].target).toBe('t_users');
    expect(edges[0].sourceHandle).toBe('c_orders_user_id');
    expect(edges[0].targetHandle).toBe('c_users_id');
    expect(edges[0].type).toBe('smoothstep');
  });

  it('uses cached positions when provided', () => {
    const cached = { t_users: { x: 100, y: 200 } };
    const { nodes } = schemaToFlow(sampleSchema, cached);

    const usersNode = nodes.find((n) => n.id === 't_users');
    expect(usersNode?.position).toEqual({ x: 100, y: 200 });

    // orders should get auto-layout position
    const ordersNode = nodes.find((n) => n.id === 't_orders');
    expect(ordersNode?.position).toBeDefined();
  });

  it('returns empty nodes/edges for empty schema', () => {
    const emptySchema: Schema = { tables: [], relationships: [] };
    const { nodes, edges } = schemaToFlow(emptySchema);
    expect(nodes).toEqual([]);
    expect(edges).toEqual([]);
  });
});

describe('flowToSchema', () => {
  it('round-trips schema through flow and back', () => {
    const { nodes, edges } = schemaToFlow(sampleSchema);
    const reconstructed = flowToSchema(nodes, edges, sampleSchema);

    expect(reconstructed.tables).toHaveLength(2);
    expect(reconstructed.relationships).toHaveLength(1);
    expect(reconstructed.tables[0].name).toBe('users');
    expect(reconstructed.tables[1].name).toBe('orders');
    expect(reconstructed.relationships[0].onDelete).toBe('CASCADE');
  });

  it('preserves table data from nodes', () => {
    const { nodes } = schemaToFlow(sampleSchema);
    const reconstructed = flowToSchema(nodes, [], sampleSchema);

    expect(reconstructed.tables[0].columns).toHaveLength(2);
    expect(reconstructed.tables[0].columns[0].name).toBe('id');
    expect(reconstructed.tables[0].columns[0].primaryKey).toBe(true);
  });

  it('handles missing fallback gracefully', () => {
    const { nodes, edges } = schemaToFlow(sampleSchema);
    const reconstructed = flowToSchema(nodes, edges);

    expect(reconstructed.tables).toHaveLength(2);
    expect(reconstructed.relationships).toHaveLength(1);
  });
});

describe('computeAutoLayout', () => {
  it('returns positions for all tables', () => {
    const positions = computeAutoLayout(sampleSchema);
    expect(positions['t_users']).toBeDefined();
    expect(positions['t_orders']).toBeDefined();
  });

  it('returns empty for empty schema', () => {
    const positions = computeAutoLayout({ tables: [], relationships: [] });
    expect(positions).toEqual({});
  });

  it('returns deterministic positions', () => {
    const a = computeAutoLayout(sampleSchema);
    const b = computeAutoLayout(sampleSchema);
    expect(a).toEqual(b);
  });
});