import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { format } from 'date-fns'
import theme, { glassBlur } from '../lib/theme'
import type { ConversationNodeData } from '../lib/buildTree'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1048576) return `${Math.round(bytes / 1024)}K`
  return `${(bytes / 1048576).toFixed(1)}M`
}

function ConversationBarNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as ConversationNodeData
  const { title, firstTimestamp, lastTimestamp, messageCount, fileSize, isFork, barWidth } = nodeData

  const startStr = firstTimestamp
    ? format(new Date(firstTimestamp), 'MMM d HH:mm')
    : ''
  const endStr = lastTimestamp
    ? format(new Date(lastTimestamp), 'MMM d HH:mm')
    : ''

  const isNarrow = barWidth < 120
  const accent = isFork ? theme.node.accentPurple : theme.node.accentBlue

  return (
    <div
      style={{
        background: selected
          ? `rgba(${accent},${theme.node.selectedFillOpacity})`
          : `rgba(${accent},${theme.node.fillOpacity})`,
        border: `1px solid ${selected ? `rgba(${accent},${theme.node.selectedBorderOpacity})` : `rgba(${accent},${theme.node.borderOpacity})`}`,
        borderRadius: 8,
        padding: '6px 10px',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        cursor: 'pointer',
        ...glassBlur(),
        boxShadow: selected
          ? `0 0 0 1px rgba(${accent},0.4), 0 4px 12px rgba(0,0,0,0.3)`
          : '0 1px 4px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.15s ease',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="fork-in"
        style={{ background: `rgba(${accent},0.8)`, width: 6, height: 6, border: 'none' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="fork-out"
        style={{ background: `rgba(${accent},0.8)`, width: 6, height: 6, border: 'none' }}
      />

      <div
        style={{
          fontWeight: 600,
          fontSize: isNarrow ? 10 : 11,
          color: theme.text.secondary,
          textShadow: theme.text.shadowLight,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </div>

      {!isNarrow && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: 9,
            color: theme.text.dimmed,
          }}
        >
          <span>{startStr}</span>
          <span style={{ color: theme.text.dimmed }}>
            {messageCount} msgs / {formatSize(fileSize)}
          </span>
          <span>{endStr}</span>
        </div>
      )}
    </div>
  )
}

export default memo(ConversationBarNode)
