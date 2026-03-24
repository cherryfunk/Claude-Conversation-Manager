import { useState, useCallback } from 'react'
import { useConversations } from './hooks/useProjects'
import Sidebar from './components/Sidebar'
import ConversationTree from './components/ConversationTree'
import NodeDetail from './components/NodeDetail'
import theme from './lib/theme'
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
        sidebarWidth={sidebarOpen ? 240 : 0}
      />

      <Sidebar
        onSelectProject={handleSelectProject}
        activeProjectId={selectedProject}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {selectedConv && (
        <NodeDetail
          conversation={selectedConv}
          onClose={() => setSelectedConv(null)}
        />
      )}
    </div>
  )
}
