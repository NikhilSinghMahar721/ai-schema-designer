'use client';

/**
 * DiagramCanvas.tsx — Central interactive visual workspace.
 * Implements React Flow with custom TableNode components, auto-layout,
 * interactive relationship drawing (handles), zoom/pan controls,
 * drag persistence, undo/redo, and floating overlay inspector.
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

export interface DiagramCanvasProps {
  isInspectorOpen?: boolean;
  onToggleInspector?: () => void;
  onOpenPrompt?: () => void;
}

function DiagramCanvasInner({
  isInspectorOpen: controlledInspectorOpen,
  onToggleInspector,
  onOpenPrompt,
}: DiagramCanvasProps) {
  const {
    schema,
    nodePositions,
    isGenerating,
    updateNodePosition,
    addTable,
    addRelationship,
    setSelectedTable,
    setSelectedRelationship,
    clearSelection,
    loadSample,
    undo,
    redo,
  } = useSchemaStore();

  const [localInspectorOpen, setLocalInspectorOpen] = useState(false);

  const isControlled = controlledInspectorOpen !== undefined;
  const inspectorOpen = isControlled ? controlledInspectorOpen : localInspectorOpen;

  const openInspector = useCallback(() => {
    if (isControlled) {
      if (!controlledInspectorOpen && onToggleInspector) {
        onToggleInspector();
      }
    } else {
      setLocalInspectorOpen(true);
    }
  }, [isControlled, controlledInspectorOpen, onToggleInspector]);

  const closeInspector = useCallback(() => {
    if (isControlled) {
      if (controlledInspectorOpen && onToggleInspector) {
        onToggleInspector();
      }
    } else {
      setLocalInspectorOpen(false);
    }
  }, [isControlled, controlledInspectorOpen, onToggleInspector]);

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
      openInspector();
    },
    [addRelationship, openInspector],
  );

  // Node click -> Select table
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      setSelectedTable(node.id);
      openInspector();
    },
    [setSelectedTable, openInspector],
  );

  // Edge click -> Select relationship
  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (_, edge) => {
      setSelectedRelationship(edge.id);
      openInspector();
    },
    [setSelectedRelationship, openInspector],
  );

  // Pane click -> Clear selection
  const handlePaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // Global Keyboard shortcuts: Undo (Ctrl+Z) / Redo (Ctrl+Y or Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  return (
    <div className="flex-1 w-full h-full bg-zinc-950 overflow-hidden relative">
      {/* Loading overlay during AI schema synthesis */}
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

      {/* Blank canvas empty state */}
      {!isGenerating && schema.tables.length === 0 && (
        <div className="absolute inset-0 z-20 bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-400 shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2 3.5 3 8 3s8-1 8-3V7M4 7c0 2 3.5 3 8 3s8-1 8-3M4 7c0-2 3.5-3 8-3s8 1 8 3m0 5c0 2-3.5 3-8 3s-8-1-8-3" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-white mb-1.5">
            Blank Schema Canvas
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mb-6 leading-relaxed">
            Your canvas is empty. Generate a complete relational architecture with AI, add tables manually, or load a sample dataset.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                addTable();
                openInspector();
              }}
              className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Table</span>
            </button>

            {onOpenPrompt && (
              <button
                type="button"
                onClick={onOpenPrompt}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Prompt with AI</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => loadSample()}
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800 text-xs font-medium transition-colors cursor-pointer"
            >
              Load Sample
            </button>
          </div>
        </div>
      )}

      {/* Main Full-Screen React Flow Canvas */}
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
        <Controls className="!bg-zinc-900 !border-zinc-800 !text-zinc-200 !shadow-xl [&>button]:!bg-zinc-900 [&>button]:!border-zinc-800 [&>button]:!text-zinc-200 hover:[&>button]:!bg-zinc-800 !rounded-lg overflow-hidden" />
        <MiniMap
          nodeStrokeColor="#3b82f6"
          nodeColor="#18181b"
          maskColor="rgba(9, 9, 11, 0.85)"
          className="!bg-zinc-900 !border-zinc-800 !rounded-lg overflow-hidden hidden md:block !shadow-xl"
        />
      </ReactFlow>

      {/* Floating Contextual Inspector (Does not squash canvas) */}
      {inspectorOpen && (
        <div className="absolute top-4 right-4 z-30 w-80 sm:w-96 max-h-[calc(100%-2rem)] flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-md shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-150">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800 bg-zinc-950/80 shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>Inspector</span>
            </div>
            <button
              type="button"
              onClick={closeInspector}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close Inspector"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <EditPanel />
          </div>
        </div>
      )}
    </div>
  );
}

export function DiagramCanvas(props: DiagramCanvasProps) {
  return (
    <ReactFlowProvider>
      <DiagramCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
