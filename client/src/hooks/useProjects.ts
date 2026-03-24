import { useState, useEffect, useCallback } from 'react'
import { fetchProjects, fetchConversations, onRefresh } from '../lib/api'
import type { Project, Conversation } from '@ccm/shared'

export function useProjects(): { projects: Project[]; loading: boolean } {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    fetchProjects()
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    return onRefresh(load)
  }, [load])

  return { projects, loading }
}

export function useConversations(projectId: string | null): {
  conversations: Conversation[]
  loading: boolean
} {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
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

  useEffect(() => {
    load()
    return onRefresh(load)
  }, [load])

  return { conversations, loading }
}
