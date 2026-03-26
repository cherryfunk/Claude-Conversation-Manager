import express, { type Request, type Response } from 'express'
import cors from 'cors'
import { watch, type FSWatcher } from 'fs'
import { join, dirname } from 'path'
import { homedir } from 'os'
import { fileURLToPath } from 'url'
import { listProjects, listConversations, getConversation } from '@ccm/shared'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLIENT_DIST = join(__dirname, '../../extension/webview')

const app = express()
const PORT = 3001

app.use(cors())

// Serve the built React client as a PWA
app.use(express.static(CLIENT_DIST))
// SPA fallback — all non-API routes serve index.html
app.get(/^(?!\/api).*$/, (_req, res) => {
  res.sendFile(join(CLIENT_DIST, 'index.html'))
})

app.get('/api/projects', async (_req: Request, res: Response) => {
  try {
    const projects = await listProjects()
    res.json(projects)
  } catch (err) {
    console.error('Error listing projects:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

app.get('/api/projects/:dirName/conversations', async (req: Request<{ dirName: string }>, res: Response) => {
  try {
    const conversations = await listConversations(req.params.dirName)
    res.json(conversations)
  } catch (err) {
    console.error('Error listing conversations:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

app.get('/api/conversations/:dirName/:sessionId', async (req: Request<{ dirName: string; sessionId: string }>, res: Response) => {
  try {
    const conversation = await getConversation(
      req.params.dirName,
      req.params.sessionId,
    )
    res.json(conversation)
  } catch (err) {
    console.error('Error getting conversation:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

// SSE endpoint for auto-reload in dev mode
const sseClients = new Set<Response>()

app.get('/api/events', (_req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  res.write('data: connected\n\n')
  sseClients.add(res)

  _req.on('close', () => {
    sseClients.delete(res)
  })
})

function broadcastRefresh(): void {
  for (const client of sseClients) {
    client.write('data: refresh\n\n')
  }
}

// Watch Claude projects directory for changes
const claudeProjectsDir = join(homedir(), '.claude', 'projects')
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let watcher: FSWatcher | null = null

try {
  watcher = watch(claudeProjectsDir, { recursive: true }, (_event, filename) => {
    if (!filename?.endsWith('.jsonl')) return
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(broadcastRefresh, 300)
  })
} catch {
  console.warn('Could not watch', claudeProjectsDir, '- auto-reload disabled in dev mode')
}

app.listen(PORT, () => {
  console.log(`CCM server running on http://localhost:${PORT}`)
})

process.on('SIGTERM', () => {
  watcher?.close()
  process.exit(0)
})
