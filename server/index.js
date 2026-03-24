import express from 'express'
import cors from 'cors'
import { listProjects, listConversations, getConversation } from './lib/parser.js'

const app = express()
const PORT = 3001

app.use(cors())

app.get('/api/projects', async (req, res) => {
  try {
    const projects = await listProjects()
    res.json(projects)
  } catch (err) {
    console.error('Error listing projects:', err)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/projects/:dirName/conversations', async (req, res) => {
  try {
    const conversations = await listConversations(req.params.dirName)
    res.json(conversations)
  } catch (err) {
    console.error('Error listing conversations:', err)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/conversations/:dirName/:sessionId', async (req, res) => {
  try {
    const conversation = await getConversation(
      req.params.dirName,
      req.params.sessionId
    )
    res.json(conversation)
  } catch (err) {
    console.error('Error getting conversation:', err)
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`CCT server running on http://localhost:${PORT}`)
})
