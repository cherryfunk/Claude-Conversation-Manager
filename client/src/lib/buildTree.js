// Build a conversation-level tree: nodes = conversation bars on a timeline
// Each node is a horizontal bar: left edge = start time, right edge = end time
// Branches start at the x-position where the fork happened

export function buildConversationTree(conversations) {
  if (!conversations || conversations.length === 0) return { nodes: [], edges: [] }

  // Sort by first timestamp (oldest first)
  const sorted = [...conversations].sort(
    (a, b) =>
      new Date(a.firstTimestamp || 0).getTime() -
      new Date(b.firstTimestamp || 0).getTime()
  )

  // Compute global time range
  const allTimes = sorted.flatMap((c) => [
    new Date(c.firstTimestamp || 0).getTime(),
    new Date(c.lastTimestamp || 0).getTime(),
  ]).filter((t) => t > 0)
  const minTime = Math.min(...allTimes)
  const maxTime = Math.max(...allTimes)
  const timeRange = maxTime - minTime || 1

  const CANVAS_WIDTH = 2400
  const X_PADDING = 40
  const LANE_HEIGHT = 100
  const BAR_HEIGHT = 50
  const MIN_BAR_WIDTH = 60 // minimum width so tiny conversations are still visible

  function timeToX(ts) {
    const t = new Date(ts).getTime()
    return X_PADDING + ((t - minTime) / timeRange) * (CANVAS_WIDTH - X_PADDING * 2)
  }

  // Build fork map: childSessionId -> parentSessionId
  const forkMap = new Map()
  for (const conv of sorted) {
    if (conv.forkedFrom) {
      forkMap.set(conv.sessionId, conv.forkedFrom.sessionId)
    }
  }

  // Assign lanes - roots get their own lane, forks get a new lane below
  const laneAssignment = new Map()
  let nextLane = 0

  // Roots first (no parent)
  for (const conv of sorted) {
    if (!forkMap.has(conv.sessionId)) {
      laneAssignment.set(conv.sessionId, nextLane)
      nextLane++
    }
  }
  // Then forks
  for (const conv of sorted) {
    if (forkMap.has(conv.sessionId)) {
      laneAssignment.set(conv.sessionId, nextLane)
      nextLane++
    }
  }

  const nodes = []
  const edges = []

  for (const conv of sorted) {
    const startX = conv.firstTimestamp ? timeToX(conv.firstTimestamp) : X_PADDING
    const endX = conv.lastTimestamp ? timeToX(conv.lastTimestamp) : startX + MIN_BAR_WIDTH
    const barWidth = Math.max(endX - startX, MIN_BAR_WIDTH)
    const lane = laneAssignment.get(conv.sessionId) || 0
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

    // Fork edge: source from the parent bar, target to the child bar
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
