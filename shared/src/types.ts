export interface Project {
  id: string
  path: string
  name: string
  conversationCount: number
}

export interface ForkInfo {
  sessionId: string
  messageUuid: string
  title?: string
}

export interface Conversation {
  sessionId: string
  title: string
  firstTimestamp: string | null
  lastTimestamp: string | null
  messageCount: number
  fileSize: number
  forkedFrom: ForkInfo | null
}

export interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result' | 'thinking' | string
  text?: string
  name?: string
  input?: unknown
  toolUseId?: string
}

export interface ConversationMessage {
  uuid: string
  parentUuid: string | null
  type: 'user' | 'assistant' | 'system'
  timestamp: string
  isSidechain: boolean
  contentPreview: string
  content: ContentBlock[]
  model: string | null
  stopReason: string | null
}

export interface ConversationDetail {
  sessionId: string
  title: string
  messages: ConversationMessage[]
}

export type WebviewRequest =
  | { type: 'getProjects'; requestId: number }
  | { type: 'getConversations'; requestId: number; projectId: string }
  | { type: 'getConversation'; requestId: number; projectId: string; sessionId: string }

export interface WebviewResponse {
  type: string
  requestId: number
  data?: unknown
  error?: string
}

export interface WebviewRefresh {
  type: 'refresh'
}
