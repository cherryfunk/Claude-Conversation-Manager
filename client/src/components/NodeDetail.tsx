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
        top: 16,
        right: 16,
        width: 280,
        ...panelStyle(),
        borderRadius: 12,
        overflow: 'hidden',
        zIndex: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          borderBottom: `1px solid ${theme.glass.borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13, color: theme.text.primary, textShadow: theme.text.shadow, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {conversation.title}
        </div>
        <button
          onClick={onClose}
          style={{
            ...buttonStyle(),
            borderRadius: 4,
            fontSize: 12,
            cursor: 'pointer',
            padding: '1px 6px',
            flexShrink: 0,
          }}
        >
          x
        </button>
      </div>
      <div style={{ padding: '8px 14px 6px' }}>
        <InfoRow label="Session ID" value={conversation.sessionId} mono />
        {startDate && <InfoRow label="Started" value={startDate} />}
        {endDate && <InfoRow label="Last active" value={endDate} />}
        <InfoRow label="Messages" value={String(conversation.messageCount)} />
        {conversation.isFork && conversation.forkedFrom ? (
          <>
            <InfoRow label="File size" value={formatSize(conversation.fileSize)} />
            <InfoRow label="Branched from" value={conversation.forkedFrom.title ?? conversation.forkedFrom.sessionId} last />
          </>
        ) : (
          <InfoRow label="File size" value={formatSize(conversation.fileSize)} last />
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

function InfoRow({ label, value, mono, last }: InfoRowProps & { last?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '3px 0',
        fontSize: 11,
        borderBottom: last ? 'none' : `1px solid ${theme.glass.borderColor}`,
      }}
    >
      <span style={{ color: theme.text.muted, textShadow: theme.text.shadowLight }}>{label}</span>
      <span
        style={{
          color: theme.text.secondary,
          textShadow: theme.text.shadowLight,
          fontFamily: mono ? 'monospace' : 'inherit',
          fontSize: mono ? 9 : 11,
          maxWidth: 160,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </span>
    </div>
  )
}
