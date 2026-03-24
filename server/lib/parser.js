import { readdir, readFile, stat } from 'fs/promises'
import { join, basename } from 'path'
import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import { homedir } from 'os'

const CLAUDE_DIR = join(homedir(), '.claude')
const PROJECTS_DIR = join(CLAUDE_DIR, 'projects')
const HISTORY_FILE = join(CLAUDE_DIR, 'history.jsonl')

// Message types that form the conversation tree
const TREE_TYPES = new Set(['user', 'assistant', 'system'])

// Decode project dir name to readable path
function decodeProjectDir(dirName) {
  // e.g. "-Users-cherryfunk-Repos-NeSyCat-Papers" -> "/Users/cherryfunk/Repos/NeSyCat Papers"
  // Heuristic: leading dash = /, internal dashes could be path separators or hyphens
  // We cross-reference with history.jsonl for accuracy
  return dirName.replace(/^-/, '/').replace(/-/g, '/')
}

// Build project path map from history.jsonl
async function buildProjectMap() {
  const map = new Map() // sessionId -> project path
  try {
    const rl = createInterface({
      input: createReadStream(HISTORY_FILE),
      crlfDelay: Infinity,
    })
    for await (const line of rl) {
      try {
        const obj = JSON.parse(line)
        if (obj.sessionId && obj.project) {
          map.set(obj.sessionId, obj.project)
        }
      } catch {}
    }
  } catch {}
  return map
}

// List all projects
export async function listProjects() {
  const projectMap = await buildProjectMap()
  const entries = await readdir(PROJECTS_DIR, { withFileTypes: true })
  const projects = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const dirPath = join(PROJECTS_DIR, entry.name)
    const files = await readdir(dirPath)
    const convFiles = files.filter(
      (f) => f.endsWith('.jsonl') && !f.includes('subagent')
    )

    // Find readable name from history
    let readablePath = null
    for (const file of convFiles) {
      const sessionId = basename(file, '.jsonl')
      if (projectMap.has(sessionId)) {
        readablePath = projectMap.get(sessionId)
        break
      }
    }

    const shortName = readablePath
      ? readablePath.replace(homedir(), '~')
      : entry.name.replace(/^-Users-[^-]+-Repos-/, '').replace(/-/g, ' ')

    projects.push({
      id: entry.name,
      path: readablePath || decodeProjectDir(entry.name),
      name: shortName,
      conversationCount: convFiles.length,
    })
  }

  return projects.sort((a, b) => a.name.localeCompare(b.name))
}

// List conversations for a project (lightweight - partial scan)
export async function listConversations(projectDirName) {
  const dirPath = join(PROJECTS_DIR, projectDirName)
  const files = await readdir(dirPath)
  const convFiles = files.filter(
    (f) => f.endsWith('.jsonl') && !f.includes('subagent')
  )

  const conversations = []

  for (const file of convFiles) {
    const filePath = join(dirPath, file)
    const sessionId = basename(file, '.jsonl')
    const fileStat = await stat(filePath)

    let title = null
    let firstUserMsg = null
    let firstTimestamp = null
    let lastTimestamp = null
    let messageCount = 0
    let forkedFrom = null

    const rl = createInterface({
      input: createReadStream(filePath),
      crlfDelay: Infinity,
    })

    for await (const line of rl) {
      try {
        const obj = JSON.parse(line)
        messageCount++

        if (obj.timestamp) {
          const ts = obj.timestamp
          // For forked conversations, only count non-inherited messages
          if (!firstTimestamp && !obj.forkedFrom) firstTimestamp = ts
          lastTimestamp = ts
        }

        // Get fork origin (first occurrence only)
        if (!forkedFrom && obj.forkedFrom) {
          forkedFrom = {
            sessionId: obj.forkedFrom.sessionId,
            messageUuid: obj.forkedFrom.messageUuid,
          }
        }

        // Get custom title
        if (obj.type === 'custom-title' && obj.customTitle) {
          title = obj.customTitle
        }

        // Get first user message as fallback title
        if (
          !firstUserMsg &&
          obj.type === 'user' &&
          obj.message &&
          obj.message.content
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
      } catch {}
    }

    conversations.push({
      sessionId,
      title: title || firstUserMsg || '(untitled)',
      firstTimestamp,
      lastTimestamp,
      messageCount,
      fileSize: fileStat.size,
      forkedFrom,
    })
  }

  // Resolve fork parent titles
  const titleMap = new Map()
  for (const c of conversations) {
    titleMap.set(c.sessionId, c.title)
  }
  for (const c of conversations) {
    if (c.forkedFrom) {
      c.forkedFrom.title = titleMap.get(c.forkedFrom.sessionId) || c.forkedFrom.sessionId
    }
  }

  return conversations.sort(
    (a, b) =>
      new Date(b.lastTimestamp || 0).getTime() -
      new Date(a.lastTimestamp || 0).getTime()
  )
}

// Extract content preview from message
function extractContentPreview(msg) {
  if (!msg || !msg.content) return ''
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

// Extract full content blocks from message
function extractContent(msg) {
  if (!msg || !msg.content) return []
  if (typeof msg.content === 'string') {
    return [{ type: 'text', text: msg.content }]
  }
  if (Array.isArray(msg.content)) {
    return msg.content.map((block) => {
      if (block.type === 'text') {
        return { type: 'text', text: block.text || '' }
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
            .map((c) => c.text)
            .join('\n')
        }
        return {
          type: 'tool_result',
          text: resultText.slice(0, 5000),
          toolUseId: block.tool_use_id,
        }
      }
      if (block.type === 'thinking') {
        return { type: 'thinking', text: (block.thinking || '').slice(0, 2000) }
      }
      return { type: block.type || 'unknown' }
    })
  }
  return []
}

// Get full conversation as tree data
export async function getConversation(projectDirName, sessionId) {
  const filePath = join(PROJECTS_DIR, projectDirName, `${sessionId}.jsonl`)
  const rl = createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  })

  const messages = []
  let title = null
  const allNodes = new Map() // uuid -> message data

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line)

      if (obj.type === 'custom-title' && obj.customTitle) {
        title = obj.customTitle
        continue
      }

      if (!TREE_TYPES.has(obj.type)) continue
      if (!obj.uuid) continue

      const node = {
        uuid: obj.uuid,
        parentUuid: obj.parentUuid || null,
        type: obj.type,
        timestamp: obj.timestamp,
        isSidechain: obj.isSidechain || false,
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
        node.model = obj.message.model || null
        node.stopReason = obj.message.stop_reason || null
      } else if (obj.type === 'system') {
        const text =
          typeof obj.content === 'string' ? obj.content : JSON.stringify(obj.content)
        node.contentPreview = text.slice(0, 150)
        node.content = [{ type: 'text', text: text.slice(0, 2000) }]
      }

      allNodes.set(obj.uuid, node)
      messages.push(node)
    } catch {}
  }

  // Reparent: if a node's parentUuid points to a filtered-out node, walk up
  for (const msg of messages) {
    if (msg.parentUuid && !allNodes.has(msg.parentUuid)) {
      msg.parentUuid = null // orphan - make it a root
    }
  }

  return {
    sessionId,
    title: title || messages.find((m) => m.type === 'user')?.contentPreview || '(untitled)',
    messages,
  }
}
