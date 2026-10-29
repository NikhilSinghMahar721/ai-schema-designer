'use client';

/**
 * DiagramCanvas.tsx — Central interactive visual workspace.
 * Implements React Flow with custom TableNode components, auto-layout,
 * interactive relationship drawing (handles), zoom/pan controls,
 * drag persistence, undo/redo, and inline inspector panel.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Connection,
  type NodeMouseHandler,
  type EdgeMouseHandler,
  type OnNodeDrag,
  type NodeTypes,
} from '@xyflow/react';
import { TableNode } from './TableNode';
import { EditPanel } from './EditPanel';
import { useSchemaStore } from '../store/schema.store';
import { schemaToFlow } from '../../../lib/schemaToFlow';

const nodeTypes: NodeTypes = {
  tableNode: TableNode,
};

function DiagramCanvasInner() {
  const {
    schema,
    nodePositions,
    isGenerating,
    validationErrors,
    selectedTableId,
    selectedRelationshipId,
    updateNodePosition,
    recalculateAutoLayout,
    addTable,
    addRelationship,
    setSelectedTable,
    setSelectedRelationship,
    clearSelection,
    loadSample,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useSchemaStore();

  const [showInspector, setShowInspector] = useState(true);

  // Compute flow nodes and edges from store schema & positions
  const initialFlow = useMemo(
    () => schemaToFlow(schema, nodePositions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow.edges);

  // Keep React Flow nodes and edges in sync with store changes
  useEffect(() => {
    const flow = schemaToFlow(schema, nodePositions);
    setNodes(flow.nodes);
    setEdges(flow.edges);
  }, [schema, nodePositions, setNodes, setEdges]);

  // Node Drag Stop — Persist user coordinates
  const handleNodeDragStop: OnNodeDrag = useCallback(
    (_, node) => {
      updateNodePosition(node.id, node.position);
    },
    [updateNodePosition],
  );

  // Connect columns to create foreign key relationship
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (
        !connection.source ||
        !connection.target ||
        !connection.sourceHandle ||
        !connection.targetHandle
      ) {
        return;
      }

      addRelationship({
        fromTable: connection.source,
        fromColumn: connection.sourceHandle,
        toTable: connection.target,
        toColumn: connection.targetHandle,
        onDelete: 'CASCADE',
      });
      setShowInspector(true);
    },
    [addRelationship],
  );

  // Node click -> Select table
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      setSelectedTable(node.id);
      setShowInspector(true);
    },
    [setSelectedTable],
  );

  // Edge click -> Select relationship
  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (_, edge) => {
      setSelectedRelationship(edge.id);
      setShowInspector(true);
    },
    [setSelectedRelationship],
  );

  // Pane click -> Clear selection
  const handlePaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // Global Keyboard shortcuts: Undo (Ctrl+Z) / Redo (Ctrl+Y or Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in inputs or textareas
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === 'y' ||
          (e.shiftKey && e.key.toLowerCase() === 'z'))
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const totalTables = schema.tables.length;
  const totalColumns = schema.tables.reduce(
    (acc, t) => acc + t.columns.length,
    0,
  );
  const totalRelationships = schema.relationships.length;
  const hasErrors = validationErrors.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden relative">
      {/* Top Controls Toolbar */}
      <div className="h-14 border-b border-zinc-800 px-4 sm:px-6 flex items-center justify-between bg-zinc-900/90 backdrop-blur z-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Quick Add Table */}
          <button
            type="button"
            onClick={() => {
              addTable();
              setShowInspector(true);
            }}
            className="py-1.5 px-3 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Add Table</span>
          </button>

          {/* Auto Layout */}
          <button
            type="button"
            onClick={recalculateAutoLayout}
            title="Auto-organize table positions"
            className="py-1.5 px-2.5 rounded-md bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 text-xs flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            <span className="hidden sm:inline">Auto Layout</span>
          </button>

          {/* Undo / Redo */}
          <div className="flex items-center bg-zinc-800/80 rounded-md border border-zinc-700/80 p-0.5">
            <button
              type="button"
              disabled={!canUndo()}
              onClick={undo}
              title="Undo (Ctrl+Z)"
              className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
            </button>
            <button
              type="button"
              disabled={!canRedo()}
              onClick={redo}
              title="Redo (Ctrl+Y)"
              className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
                />
              </svg>
            </button>
          </div>

          {/* Counter Badges */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs">
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono text-[11px]">
              {totalTables} {totalTables === 1 ? 'Table' : 'Tables'}
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono text-[11px]">
              {totalColumns} Cols
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono text-[11px]">
              {totalRelationships} Relations
            </span>
          </div>
        </div>

        {/* Right side status & inspector toggle */}
        <div className="flex items-center gap-2">
          {/* Validation Status */}
          <button
            type="button"
            onClick={() => setShowInspector(true)}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium border flex items-center gap-1.5 transition-colors ${
              hasErrors
                ? 'bg-amber-950/40 text-amber-300 border-amber-800/80 hover:bg-amber-950/60'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                hasErrors ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
              }`}
            />
            <span>
              {hasErrors
                ? `${validationErrors.length} ${
                    validationErrors.length === 1 ? 'Issue' : 'Issues'
                  }`
                : 'Valid'}
            </span>
          </button>

          {/* Toggle Inspector Button */}
          <button
            type="button"
            onClick={() => setShowInspector(!showInspector)}
            className={`py-1.5 px-3 rounded-md border text-xs font-medium transition-colors flex items-center gap-1.5 ${
              showInspector || selectedTableId || selectedRelationshipId
                ? 'bg-zinc-800 border-zinc-700 text-white'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="hidden sm:inline">Inspector</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Area (Canvas + Dockable Inspector) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* React Flow Canvas */}
        <div className="flex-1 h-full relative">
          {isGenerating && (
            <div className="absolute inset-0 z-30 bg-zinc-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-8">
              <div className="relative mb-4">
                <div className="w-10 h-10 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">
                Synthesizing Relational Model...
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm text-center">
                Generating tables, columns, primary and foreign key constraints.
              </p>
            </div>
          )}

          {/* Empty state when no tables exist */}
          {!isGenerating && schema.tables.length === 0 && (
            <div className="absolute inset-0 z-20 bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
              <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2 3.5 3 8 3s8-1 8-3V7M4 7c0 2 3.5 3 8 3s8-1 8-3M4 7c0-2 3.5-3 8-3s8 1 8 3m0 5c0 2-3.5 3-8 3s-8-1-8-3" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">
                Start Designing Your Schema
              </h3>
              <p className="text-xs text-zinc-400 max-w-xs mb-6 leading-relaxed">
                Describe your application requirement on the left, or add your first table manually using the button below.
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => addTable()}
                  className="px-4 py-2 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-medium transition-colors shadow-sm"
                >
                  + Add Table
                </button>
                <button
                  type="button"
                  onClick={() => loadSample()}
                  className="px-4 py-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-medium transition-colors"
                >
                  Load Sample
                </button>
              </div>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={handleNodeDragStop}
            onConnect={handleConnect}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onPaneClick={handlePaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={1.8}
            defaultEdgeOptions={{
              type: 'smoothstep',
            }}
            proOptions={{ hideAttribution: true }}
            className="bg-zinc-950"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1.5}
              color="#27272a"
            />
            <Controls className="!bg-zinc-900 !border-zinc-800 !text-zinc-200 !shadow-xl [&>button]:!bg-zinc-900 [&>button]:!border-zinc-800 [&>button]:!text-zinc-200 hover:[&>button]:!bg-zinc-800" />
            <MiniMap
              nodeStrokeColor="#3b82f6"
              nodeColor="#18181b"
              maskColor="rgba(9, 9, 11, 0.85)"
              className="!bg-zinc-900 !border-zinc-800 !rounded-lg overflow-hidden hidden md:block"
            />
          </ReactFlow>
        </div>

        {/* Dockable / Collapsible Edit Inspector Panel */}
        {showInspector && (
          <div className="w-80 md:w-96 border-l border-zinc-800 h-full z-10 shrink-0 shadow-2xl transition-all">
            <EditPanel />
          </div>
        )}
      </div>
    </div>
  );
}

export function DiagramCanvas() {
  return (
    <ReactFlowProvider>
      <DiagramCanvasInner />
    </ReactFlowProvider>
  );
}
