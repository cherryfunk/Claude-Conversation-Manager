import type { Project, Conversation, ConversationDetail } from '@ccm/shared'

interface VsCodeApi {
  postMessage(msg: unknown): void
  getState(): unknown
  setState(state: unknown): void
}

declare function acquireVsCodeApi(): VsCodeApi

const vscodeApi: VsCodeApi | null =
  typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null

let requestId = 0
const pendingRequests = new Map<
  number,
  { resolve: (value: unknown) => void; reject: (reason: Error) => void }
>()

if (vscodeApi) {
  window.addEventListener('message', (event: MessageEvent) => {
    const msg = event.data as { requestId?: number; error?: string; data?: unknown; type?: string }
    if (msg.requestId !== undefined && pendingRequests.has(msg.requestId)) {
      const { resolve, reject } = pendingRequests.get(msg.requestId)!
      pendingRequests.delete(msg.requestId)
      if (msg.error) {
        reject(new Error(msg.error))
      } else {
        resolve(msg.data)
      }
    }
  })
}

function postMessageRequest(type: string, params: Record<string, unknown> = {}): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const id = requestId++
    pendingRequests.set(id, { resolve, reject })
    vscodeApi!.postMessage({ type, requestId: id, ...params })
  })
}

export async function fetchProjects(): Promise<Project[]> {
  if (vscodeApi) {
    return postMessageRequest('getProjects') as Promise<Project[]>
  }
  const r = await fetch('/api/projects')
  return r.json() as Promise<Project[]>
}

export async function fetchConversations(projectId: string): Promise<Conversation[]> {
  if (vscodeApi) {
    return postMessageRequest('getConversations', { projectId }) as Promise<Conversation[]>
  }
  const r = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/conversations`,
  )
  return r.json() as Promise<Conversation[]>
}

export async function fetchConversation(
  projectId: string,
  sessionId: string,
): Promise<ConversationDetail> {
  if (vscodeApi) {
    return postMessageRequest('getConversation', { projectId, sessionId }) as Promise<ConversationDetail>
  }
  const r = await fetch(
    `/api/conversations/${encodeURIComponent(projectId)}/${encodeURIComponent(sessionId)}`,
  )
  return r.json() as Promise<ConversationDetail>
}

export function onRefresh(callback: () => void): () => void {
  if (vscodeApi) {
    const handler = (event: MessageEvent): void => {
      const msg = event.data as { type?: string }
      if (msg?.type === 'refresh') callback()
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  } else {
    // SSE for dev mode
    const source = new EventSource('/api/events')
    source.onmessage = (event) => {
      if (event.data === 'refresh') callback()
    }
    return () => source.close()
  }
}
