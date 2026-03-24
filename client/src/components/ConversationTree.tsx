import { useMemo, useCallback, useRef, type CSSProperties } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
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
  const { nodes, edges } = useMemo(() => {
    if (!conversations || conversations.length === 0) {
      return { nodes: [], edges: [] }
    }
    return buildConversationTree(conversations)
  }, [conversations])

  // Fingerprint of conversation data to force ReactFlow remount when content changes
  // (ReactFlow's internal store doesn't reliably re-render nodes with same IDs but new data)
  const revisionRef = useRef(0)
  const prevFingerprintRef = useRef('')
  const fingerprint = useMemo(
    () => conversations.map(c => `${c.sessionId}:${c.title}:${c.messageCount}`).join('|'),
    [conversations],
  )
  if (fingerprint !== prevFingerprintRef.current) {
    prevFingerprintRef.current = fingerprint
    revisionRef.current++
  }

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
        key={revisionRef.current}
        nodes={nodes}
        edges={edges}
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
