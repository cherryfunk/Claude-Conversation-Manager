import { useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import { buildConversationTree } from '../lib/buildTree.js'
import ConversationNode from './ConversationNode.jsx'
import theme from '../lib/theme.js'

const nodeTypes = { conversationBar: ConversationNode }

export default function ConversationTree({
  conversations,
  loading,
  onNodeSelect,
  selectedSessionId,
}) {
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
    (_event, node) => {
      onNodeSelect(node.data)
    },
    [onNodeSelect]
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
          nodeColor={(node) =>
            node.data?.isFork
              ? `rgba(${theme.node.accentPurple},0.6)`
              : `rgba(${theme.node.accentBlue},0.6)`
          }
          style={{
            background: theme.minimap.background,
            borderRadius: 8,
            border: `1px solid ${theme.minimap.borderColor}`,
          }}
          maskColor={theme.minimap.maskColor}
        />
      </ReactFlow>
    </div>
  )
}
