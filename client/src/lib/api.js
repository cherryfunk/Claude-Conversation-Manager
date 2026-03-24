// Detect if running inside a VS Code webview
const vscodeApi =
  typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null

let requestId = 0
const pendingRequests = new Map()

if (vscodeApi) {
  window.addEventListener('message', (event) => {
    const msg = event.data
    if (msg.requestId !== undefined && pendingRequests.has(msg.requestId)) {
      const { resolve, reject } = pendingRequests.get(msg.requestId)
      pendingRequests.delete(msg.requestId)
      if (msg.error) {
        reject(new Error(msg.error))
      } else {
        resolve(msg.data)
      }
    }
  })
}

function postMessageRequest(type, params = {}) {
  return new Promise((resolve, reject) => {
    const id = requestId++
    pendingRequests.set(id, { resolve, reject })
    vscodeApi.postMessage({ type, requestId: id, ...params })
  })
}

export async function fetchProjects() {
  if (vscodeApi) {
    return postMessageRequest('getProjects')
  }
  const r = await fetch('/api/projects')
  return r.json()
}

export async function fetchConversations(projectId) {
  if (vscodeApi) {
    return postMessageRequest('getConversations', { projectId })
  }
  const r = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/conversations`
  )
  return r.json()
}

export async function fetchConversation(projectId, sessionId) {
  if (vscodeApi) {
    return postMessageRequest('getConversation', { projectId, sessionId })
  }
  const r = await fetch(
    `/api/conversations/${encodeURIComponent(projectId)}/${encodeURIComponent(sessionId)}`
  )
  return r.json()
}
