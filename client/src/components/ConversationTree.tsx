import { useMemo, useCallback, type CSSProperties } from 'react'
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

interface ConversationTreeProps {
  conversations: Conversation[]
  loading: boolean
  onNodeSelect: (nodeData: ConversationNodeData) => void
  selectedSessionId?: string
}

export default function ConversationTree({
  conversations,
  loading,
  onNodeSelect,
  selectedSessionId: _selectedSessionId,
}: ConversationTreeProps) {
  const { layoutNodes, layoutEdges } = useMemo(() => {
    if (!conversations || conversations.length === 0) {
      return { layoutNodes: [], layoutEdges: [] }
    }
    const { nodes, edges } = buildConversationTree(conversations)
    return { layoutNodes: nodes, layoutEdges: edges }
  }, [conversations])

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges)

  useMemo(() => {
    setNodes(layoutNodes)
    setEdges(layoutEdges)
  }, [layoutNodes, layoutEdges, setNodes, setEdges])

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeSelect(node.data as unknown as ConversationNodeData)
    },
    [onNodeSelect],
  )

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

  const minimapStyle: CSSProperties = {
    background: theme.glass.panelBg,
    borderRadius: 8,
    border: `1px solid ${theme.glass.borderColor}`,
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
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
        <MiniMap
          nodeColor={(node: Node) =>
            node.data?.isFork
              ? `rgba(${theme.node.accentPurple},0.6)`
              : `rgba(${theme.node.accentBlue},0.6)`
          }
          style={minimapStyle}
          maskColor={theme.minimap.maskColor}
        />
      </ReactFlow>
    </div>
  )
}
