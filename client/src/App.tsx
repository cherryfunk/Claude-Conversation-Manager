import { useState, useCallback } from 'react'
import { useConversations } from './hooks/useProjects'
import Sidebar from './components/Sidebar'
import ConversationTree from './components/ConversationTree'
import NodeDetail from './components/NodeDetail'
import theme, { buttonStyle } from './lib/theme'
import type { ConversationNodeData } from './lib/buildTree'

export default function App() {
  const [selectedProject, setSelectedProject] = useState<string | null>(
    () => localStorage.getItem('ccm-last-project'),
  )
  const [selectedConv, setSelectedConv] = useState<ConversationNodeData | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { conversations, loading } = useConversations(selectedProject)

  const handleSelectProject = useCallback((projectId: string) => {
    setSelectedProject(projectId)
    setSelectedConv(null)
    try { localStorage.setItem('ccm-last-project', projectId) } catch { /* webview may block */ }
  }, [])

  const handleNodeSelect = useCallback((nodeData: ConversationNodeData) => {
    setSelectedConv(nodeData)
  }, [])

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden', background: theme.canvas.background }}>
      <ConversationTree
        conversations={conversations}
        loading={loading}
        onNodeSelect={handleNodeSelect}
        selectedSessionId={selectedConv?.sessionId}
      />

      {sidebarOpen && (
        <Sidebar
          onSelectProject={handleSelectProject}
          activeProjectId={selectedProject}
          onCollapse={() => setSidebarOpen(false)}
        />
      )}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 20,
            ...buttonStyle(),
            borderRadius: 6,
            cursor: 'pointer',
            padding: '6px 10px',
            fontSize: 13,
          }}
        >
          Projects
        </button>
      )}

      {selectedConv && (
        <NodeDetail
          conversation={selectedConv}
          onClose={() => setSelectedConv(null)}
        />
      )}
    </div>
  )
}
