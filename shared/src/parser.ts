import { readdir, stat } from 'fs/promises'
import { join, basename } from 'path'
import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import { homedir } from 'os'
import type {
  Project,
  Conversation,
  ForkInfo,
  ContentBlock,
  ConversationMessage,
  ConversationDetail,
} from './types'

const CLAUDE_DIR = join(homedir(), '.claude')
const PROJECTS_DIR = join(CLAUDE_DIR, 'projects')
const HISTORY_FILE = join(CLAUDE_DIR, 'history.jsonl')

const TREE_TYPES = new Set(['user', 'assistant', 'system'])

interface HistoryEntry {
  sessionId?: string
  project?: string
}

interface RawJsonlEntry {
  uuid?: string
  parentUuid?: string
  type?: string
  timestamp?: string
  message?: RawMessage
  content?: unknown
  customTitle?: string
  forkedFrom?: { sessionId: string; messageUuid: string }
  isSidechain?: boolean
}

interface RawMessage {
  content?: string | RawContentBlock[]
  model?: string
  stop_reason?: string
}

interface RawContentBlock {
  type: string
  text?: string
  name?: string
  input?: unknown
  content?: string | Array<{ type: string; text?: string }>
  tool_use_id?: string
  thinking?: string
}

function decodeProjectDir(dirName: string): string {
  return dirName.replace(/^-/, '/').replace(/-/g, '/')
}

async function buildProjectMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  try {
    const rl = createInterface({
      input: createReadStream(HISTORY_FILE),
      crlfDelay: Infinity,
    })
    for await (const line of rl) {
      try {
        const obj = JSON.parse(line) as HistoryEntry
        if (obj.sessionId && obj.project) {
          map.set(obj.sessionId, obj.project)
        }
      } catch {
        // skip malformed lines
      }
    }
  } catch {
    // history file may not exist
  }
  return map
}

function filterConvFiles(files: string[]): string[] {
  return files.filter(
    (f) => f.endsWith('.jsonl') && !f.includes('subagent')
  )
}

export async function listProjects(): Promise<Project[]> {
  const projectMap = await buildProjectMap()
  const dirPathMap = new Map<string, string>()
  const entries = await readdir(PROJECTS_DIR, { withFileTypes: true })
  const projects: Project[] = []

  // First pass: find readable paths for each directory from history
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const dirPath = join(PROJECTS_DIR, entry.name)
    const files = await readdir(dirPath)
    const convFiles = filterConvFiles(files)
    for (const file of convFiles) {
      const sessionId = basename(file, '.jsonl')
      if (projectMap.has(sessionId)) {
        const historyPath = projectMap.get(sessionId)!
        const encodedHistoryPath = historyPath.replace(/[\/ ]/g, '-')
        if (encodedHistoryPath === entry.name) {
          dirPathMap.set(entry.name, historyPath)
          break
        }
      }
    }
  }

  // Second pass: build project list
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const dirPath = join(PROJECTS_DIR, entry.name)
    const files = await readdir(dirPath)
    const convFiles = filterConvFiles(files)

    const readablePath = dirPathMap.get(entry.name) ?? decodeProjectDir(entry.name)
    const shortName = readablePath.replace(homedir(), '~')

    projects.push({
      id: entry.name,
      path: readablePath,
      name: shortName,
      conversationCount: convFiles.length,
    })
  }

  return projects.sort((a, b) => a.name.localeCompare(b.name))
}

export async function listConversations(projectDirName: string): Promise<Conversation[]> {
  const dirPath = join(PROJECTS_DIR, projectDirName)
  const files = await readdir(dirPath)
  const convFiles = filterConvFiles(files)

  const conversations: Conversation[] = []

  for (const file of convFiles) {
    const filePath = join(dirPath, file)
    const sessionId = basename(file, '.jsonl')
    const fileStat = await stat(filePath)

    let title: string | null = null
    let firstUserMsg: string | null = null
    let firstTimestamp: string | null = null
    let lastTimestamp: string | null = null
    let messageCount = 0
    let forkedFrom: ForkInfo | null = null

    const rl = createInterface({
      input: createReadStream(filePath),
      crlfDelay: Infinity,
    })

    for await (const line of rl) {
      try {
        const obj = JSON.parse(line) as RawJsonlEntry
        messageCount++

        if (obj.timestamp) {
          const ts = obj.timestamp
          if (!firstTimestamp && !obj.forkedFrom) firstTimestamp = ts
          lastTimestamp = ts
        }

        if (!forkedFrom && obj.forkedFrom) {
          forkedFrom = {
            sessionId: obj.forkedFrom.sessionId,
            messageUuid: obj.forkedFrom.messageUuid,
          }
        }

        if (obj.type === 'custom-title' && obj.customTitle) {
          title = obj.customTitle
        }

        if (
          !firstUserMsg &&
          obj.type === 'user' &&
          obj.message?.content
        ) {
          const content = obj.message.content
          if (Array.isArray(content)) {
            for (const block of content) {
              if (block.type === 'text' && block.text) {
                const text = block.text.trim()
                if (text && !text.startsWith('<')) {
                  firstUserMsg = text.slice(0, 100)
                  break
                }
              }
            }
          }
        }
      } catch {
        // skip malformed lines
      }
    }

    conversations.push({
      sessionId,
      title: title ?? firstUserMsg ?? '(untitled)',
      firstTimestamp,
      lastTimestamp,
      messageCount,
      fileSize: fileStat.size,
      forkedFrom,
    })
  }

  // Resolve fork parent titles
  const titleMap = new Map<string, string>()
  for (const c of conversations) {
    titleMap.set(c.sessionId, c.title)
  }
  for (const c of conversations) {
    if (c.forkedFrom) {
      c.forkedFrom.title = titleMap.get(c.forkedFrom.sessionId) ?? c.forkedFrom.sessionId
    }
  }

  return conversations.sort(
    (a, b) =>
      new Date(b.lastTimestamp ?? 0).getTime() -
      new Date(a.lastTimestamp ?? 0).getTime()
  )
}

function extractContentPreview(msg: RawMessage): string {
  if (!msg?.content) return ''
  const content = msg.content
  if (typeof content === 'string') return content.slice(0, 150)
  if (Array.isArray(content)) {
    for (const block of content) {
      if (block.type === 'text' && block.text) {
        return block.text.slice(0, 150)
      }
      if (block.type === 'tool_use') {
        return `[Tool: ${block.name}]`
      }
    }
  }
  return ''
}

function extractContent(msg: RawMessage): ContentBlock[] {
  if (!msg?.content) return []
  if (typeof msg.content === 'string') {
    return [{ type: 'text', text: msg.content }]
  }
  if (Array.isArray(msg.content)) {
    return msg.content.map((block): ContentBlock => {
      if (block.type === 'text') {
        return { type: 'text', text: block.text ?? '' }
      }
      if (block.type === 'tool_use') {
        return {
          type: 'tool_use',
          name: block.name,
          input: block.input,
        }
      }
      if (block.type === 'tool_result') {
        let resultText = ''
        if (typeof block.content === 'string') {
          resultText = block.content
        } else if (Array.isArray(block.content)) {
          resultText = block.content
            .filter((c) => c.type === 'text')
            .map((c) => c.text ?? '')
            .join('\n')
        }
        return {
          type: 'tool_result',
          text: resultText.slice(0, 5000),
          toolUseId: block.tool_use_id,
        }
      }
      if (block.type === 'thinking') {
        return { type: 'thinking', text: (block.thinking ?? '').slice(0, 2000) }
      }
      return { type: block.type || 'unknown' }
    })
  }
  return []
}

export async function getConversation(
  projectDirName: string,
  sessionId: string,
): Promise<ConversationDetail> {
  const filePath = join(PROJECTS_DIR, projectDirName, `${sessionId}.jsonl`)
  const rl = createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  })

  const messages: ConversationMessage[] = []
  let title: string | null = null
  const allNodes = new Map<string, ConversationMessage>()

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line) as RawJsonlEntry

      if (obj.type === 'custom-title' && obj.customTitle) {
        title = obj.customTitle
        continue
      }

      if (!obj.type || !TREE_TYPES.has(obj.type)) continue
      if (!obj.uuid) continue

      const node: ConversationMessage = {
        uuid: obj.uuid,
        parentUuid: obj.parentUuid ?? null,
        type: obj.type as 'user' | 'assistant' | 'system',
        timestamp: obj.timestamp ?? '',
        isSidechain: obj.isSidechain ?? false,
        contentPreview: '',
        content: [],
        model: null,
        stopReason: null,
      }

      if (obj.type === 'user' && obj.message) {
        node.contentPreview = extractContentPreview(obj.message)
        node.content = extractContent(obj.message)
      } else if (obj.type === 'assistant' && obj.message) {
        node.contentPreview = extractContentPreview(obj.message)
        node.content = extractContent(obj.message)
        node.model = obj.message.model ?? null
        node.stopReason = obj.message.stop_reason ?? null
      } else if (obj.type === 'system') {
        const text =
          typeof obj.content === 'string' ? obj.content : JSON.stringify(obj.content)
        node.contentPreview = text.slice(0, 150)
        node.content = [{ type: 'text', text: text.slice(0, 2000) }]
      }

      allNodes.set(obj.uuid, node)
      messages.push(node)
    } catch {
      // skip malformed lines
    }
  }

  // Reparent: if a node's parentUuid points to a filtered-out node, make it a root
  for (const msg of messages) {
    if (msg.parentUuid && !allNodes.has(msg.parentUuid)) {
      msg.parentUuid = null
    }
  }

  return {
    sessionId,
    title: title ?? messages.find((m) => m.type === 'user')?.contentPreview ?? '(untitled)',
    messages,
  }
}
