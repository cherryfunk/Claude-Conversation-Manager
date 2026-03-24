import { format } from 'date-fns'
import theme, { panelStyle, buttonStyle } from '../lib/theme'
import type { ConversationNodeData } from '../lib/buildTree'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1048576) return `${Math.round(bytes / 1024)}K`
  return `${(bytes / 1048576).toFixed(1)}M`
}

interface NodeDetailProps {
  conversation: ConversationNodeData
  onClose: () => void
}

export default function NodeDetail({ conversation, onClose }: NodeDetailProps) {
  if (!conversation) return null

  const startDate = conversation.firstTimestamp
    ? format(new Date(conversation.firstTimestamp), 'MMM d, yyyy HH:mm')
    : ''
  const endDate = conversation.lastTimestamp
    ? format(new Date(conversation.lastTimestamp), 'MMM d, yyyy HH:mm')
    : ''

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 340,
        height: '100%',
        ...panelStyle(),
        borderTop: 'none',
        borderBottom: 'none',
        borderRight: 'none',
        overflow: 'auto',
        zIndex: 10,
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${theme.glass.borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14, color: theme.text.primary, textShadow: theme.text.shadow, flex: 1 }}>
          {conversation.title}
        </div>
        <button
          onClick={onClose}
          style={{
            ...buttonStyle(),
            borderRadius: 4,
            fontSize: 14,
            cursor: 'pointer',
            marginLeft: 8,
            padding: '2px 8px',
          }}
        >
          x
        </button>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ marginBottom: 16 }}>
          <InfoRow label="Session ID" value={conversation.sessionId} mono />
          <InfoRow label="Started" value={startDate} />
          <InfoRow label="Last active" value={endDate} />
          <InfoRow label="Messages" value={String(conversation.messageCount)} />
          <InfoRow label="File size" value={formatSize(conversation.fileSize)} />
        </div>
        {conversation.isFork && conversation.forkedFrom && (
          <div
            style={{
              background: `rgba(${theme.node.accentPurple},0.1)`,
              border: `1px solid rgba(${theme.node.accentPurple},0.2)`,
              borderRadius: 8,
              padding: '10px 12px',
              marginTop: 12,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: `rgba(${theme.node.accentPurple},0.8)`,
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Branched from
            </div>
            <div style={{ fontSize: 11, color: `rgba(${theme.node.accentPurple},0.6)` }}>
              {conversation.forkedFrom.title ?? conversation.forkedFrom.sessionId}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface InfoRowProps {
  label: string
  value: string
  mono?: boolean
}

function InfoRow({ label, value, mono }: InfoRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '4px 0',
        fontSize: 12,
        borderBottom: `1px solid ${theme.glass.borderColor}`,
      }}
    >
      <span style={{ color: theme.text.muted, textShadow: theme.text.shadowLight }}>{label}</span>
      <span
        style={{
          color: theme.text.secondary,
          textShadow: theme.text.shadowLight,
          fontFamily: mono ? 'monospace' : 'inherit',
          fontSize: mono ? 10 : 12,
          maxWidth: 180,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </span>
    </div>
  )
}
