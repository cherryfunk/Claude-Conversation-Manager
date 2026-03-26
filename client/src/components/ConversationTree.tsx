import { useMemo, useEffect, useCallback, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import type { Node } from '@xyflow/react'
import { buildConversationTree, type ConversationNodeData } from '../lib/buildTree'
import ConversationNode from './ConversationNode'
import theme from '../lib/theme'
import type { Conversation } from '@ccm/shared'

const nodeTypes = { conversationBar: ConversationNode }

type MinimapMode = 'always' | 'hidden'

// Hide: map with X
function IconHide() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2.5" />
    </svg>
  )
}

// Show: full map
function IconShow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  )
}

const modeIcons: Record<MinimapMode, () => React.ReactElement> = {
  hidden: IconHide,
  always: IconShow,
}

const modeTooltips: Record<MinimapMode, string> = {
  hidden: 'Hide',
  always: 'Show always',
}

interface ConversationTreeProps {
  conversations: Conversation[]
  loading: boolean
  onNodeSelect: (nodeData: ConversationNodeData) => void
  selectedSessionId?: string
  sidebarWidth: number
}

export default function ConversationTree({
  conversations,
  loading,
  onNodeSelect,
  selectedSessionId: _selectedSessionId,
  sidebarWidth,
}: ConversationTreeProps) {
  const [minimapMode, setMinimapMode] = useState<MinimapMode>('always')

  const { layoutNodes, layoutEdges } = useMemo(() => {
    if (!conversations || conversations.length === 0) {
      return { layoutNodes: [], layoutEdges: [] }
    }
    const { nodes, edges } = buildConversationTree(conversations)
    return { layoutNodes: nodes, layoutEdges: edges }
  }, [conversations])

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges)

  useEffect(() => {
    setNodes(layoutNodes)
    setEdges(layoutEdges)
  }, [layoutNodes, layoutEdges, setNodes, setEdges])

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeSelect(node.data as unknown as ConversationNodeData)
    },
    [onNodeSelect],
  )

  const selectMinimapMode = useCallback((mode: MinimapMode) => {
    setMinimapMode(mode)
  }, [])

  if (!conversations || conversations.length === 0) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.text.dimmed,
          fontSize: 14,
        }}
      >
        {loading ? 'Loading...' : 'Select a project from the sidebar'}
      </div>
    )
  }

  const allModes: MinimapMode[] = ['hidden', 'always']
  const ActiveIcon = modeIcons[minimapMode]

  return (
    <div
      style={{ position: 'absolute', inset: 0, '--controls-left': `${sidebarWidth + 12}px` } as React.CSSProperties}
      className={undefined}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color={theme.canvas.gridColor} gap={20} />
        <Controls />
        {minimapMode !== 'hidden' && (
          <MiniMap
            nodeColor={(node: Node) =>
              node.data?.isFork
                ? `rgba(${theme.node.accentPurple},0.8)`
                : `rgba(${theme.node.accentBlue},0.8)`
            }
            maskColor="rgba(0,0,0,0.25)"
            nodeStrokeWidth={0}
            pannable
            zoomable
          />
        )}
      </ReactFlow>

      {/* Toolbar — top-left, slides with sidebar, same offset as controls */}
      <div
        className="ccm-toolbar-hover"
        style={{ position: 'absolute', top: 12, left: `var(--controls-left, 12px)`, zIndex: 20, transition: 'left 0.25s ease' }}
      >
        {/* Collapsed: just the active icon */}
        <div className="ccm-toolbar-collapsed">
          <div className="ccm-toolbar-group">
            <button
              className="ccm-toolbar-btn"
              style={{ color: minimapMode === 'hidden' ? theme.text.dimmed : theme.text.secondary }}
            >
              <ActiveIcon />
            </button>
          </div>
        </div>

        {/* Expanded: all 3 icons */}
        <div className="ccm-toolbar-expanded">
          <div className="ccm-toolbar-group">
            {allModes.map((mode) => {
              const Icon = modeIcons[mode]
              const isActive = minimapMode === mode
              return (
                <button
                  key={mode}
                  className="ccm-toolbar-btn"
                  title={modeTooltips[mode]}
                  onClick={() => selectMinimapMode(mode)}
                  style={{
                    background: isActive ? `rgba(${theme.node.accentIndigo}, 0.25)` : undefined,
                    color: isActive ? theme.text.primary : theme.text.muted,
                  }}
                >
                  <Icon />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
