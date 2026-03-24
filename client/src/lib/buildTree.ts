import type { Node, Edge } from '@xyflow/react'
import type { Conversation, ForkInfo } from '@ccm/shared'

export interface ConversationNodeData {
  title: string
  sessionId: string
  firstTimestamp: string | null
  lastTimestamp: string | null
  messageCount: number
  fileSize: number
  isFork: boolean
  forkedFrom: ForkInfo | null
  barWidth: number
  [key: string]: unknown
}

interface TreeResult {
  nodes: Node<ConversationNodeData>[]
  edges: Edge[]
}

const MS_PER_DAY = 86_400_000
const PX_PER_DAY = 300
const MIN_BAR_WIDTH = PX_PER_DAY  // 1 day minimum
const X_PADDING = 40
const LANE_HEIGHT = 120
const BAR_HEIGHT = 60

export function buildConversationTree(conversations: Conversation[]): TreeResult {
  if (!conversations || conversations.length === 0) return { nodes: [], edges: [] }

  const sorted = [...conversations].sort(
    (a, b) =>
      new Date(a.firstTimestamp ?? 0).getTime() -
      new Date(b.firstTimestamp ?? 0).getTime(),
  )

  const allTimes = sorted
    .flatMap((c) => [
      new Date(c.firstTimestamp ?? 0).getTime(),
      new Date(c.lastTimestamp ?? 0).getTime(),
    ])
    .filter((t) => t > 0)
  const minTime = Math.min(...allTimes)

  function timeToX(ts: string): number {
    const t = new Date(ts).getTime()
    const days = (t - minTime) / MS_PER_DAY
    return X_PADDING + days * PX_PER_DAY
  }

  const forkMap = new Map<string, string>()
  for (const conv of sorted) {
    if (conv.forkedFrom) {
      forkMap.set(conv.sessionId, conv.forkedFrom.sessionId)
    }
  }

  const laneAssignment = new Map<string, number>()
  let nextLane = 0

  for (const conv of sorted) {
    if (!forkMap.has(conv.sessionId)) {
      laneAssignment.set(conv.sessionId, nextLane)
      nextLane++
    }
  }
  for (const conv of sorted) {
    if (forkMap.has(conv.sessionId)) {
      laneAssignment.set(conv.sessionId, nextLane)
      nextLane++
    }
  }

  const nodes: Node<ConversationNodeData>[] = []
  const edges: Edge[] = []

  for (const conv of sorted) {
    const startX = conv.firstTimestamp ? timeToX(conv.firstTimestamp) : X_PADDING
    const endX = conv.lastTimestamp ? timeToX(conv.lastTimestamp) : startX + MIN_BAR_WIDTH
    const barWidth = Math.max(endX - startX, MIN_BAR_WIDTH)
    const lane = laneAssignment.get(conv.sessionId) ?? 0
    const y = lane * LANE_HEIGHT

    const isFork = forkMap.has(conv.sessionId)

    nodes.push({
      id: conv.sessionId,
      type: 'conversationBar',
      position: { x: startX, y },
      data: {
        title: conv.title,
        sessionId: conv.sessionId,
        firstTimestamp: conv.firstTimestamp,
        lastTimestamp: conv.lastTimestamp,
        messageCount: conv.messageCount,
        fileSize: conv.fileSize,
        isFork,
        forkedFrom: conv.forkedFrom,
        barWidth,
      },
      style: { width: barWidth, height: BAR_HEIGHT },
    })

    if (conv.forkedFrom) {
      edges.push({
        id: `fork-${conv.forkedFrom.sessionId}-${conv.sessionId}`,
        source: conv.forkedFrom.sessionId,
        target: conv.sessionId,
        sourceHandle: 'fork-out',
        targetHandle: 'fork-in',
        style: { stroke: '#8b5cf6', strokeWidth: 2 },
        animated: true,
      })
    }
  }

  return { nodes, edges }
}
