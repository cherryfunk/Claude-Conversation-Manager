import { useState, useEffect } from 'react'
import { fetchProjects, fetchConversations } from '../lib/api'

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { projects, loading }
}

export function useConversations(projectId) {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!projectId) {
      setConversations([])
      return
    }
    setLoading(true)
    fetchConversations(projectId)
      .then(setConversations)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [projectId])

  return { conversations, loading }
}
