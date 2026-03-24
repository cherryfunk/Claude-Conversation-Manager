import { useProjects } from '../hooks/useProjects'
import theme, { panelStyle, buttonStyle } from '../lib/theme'

interface SidebarProps {
  onSelectProject: (projectId: string) => void
  activeProjectId: string | null
  onCollapse: () => void
}

export default function Sidebar({ onSelectProject, activeProjectId, onCollapse }: SidebarProps) {
  const { projects, loading } = useProjects()

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 240,
        height: '100%',
        ...panelStyle(),
        borderTop: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: `1px solid ${theme.glass.borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: theme.text.primary, textShadow: theme.text.shadow }}>
            CCM
          </div>
          <div style={{ fontSize: 10, fontWeight: 400, color: theme.text.dimmed, marginTop: 2 }}>
            Claude Conversation Manager
          </div>
        </div>
        <button
          onClick={onCollapse}
          style={{
            ...buttonStyle(),
            cursor: 'pointer',
            fontSize: 16,
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          &laquo;
        </button>
      </div>

      <div
        style={{
          padding: '10px 12px 6px',
          fontSize: 10,
          fontWeight: 600,
          color: theme.text.dimmed,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Projects
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 16, color: theme.text.dimmed, fontSize: 12 }}>
            Loading...
          </div>
        ) : (
          projects.map((project) => {
            const isActive = activeProjectId === project.id
            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  background: isActive ? `rgba(${theme.node.accentIndigo},0.15)` : 'transparent',
                  borderLeft: isActive
                    ? `3px solid rgba(${theme.node.accentIndigo},0.8)`
                    : '3px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    fontWeight: 500,
                    fontSize: 13,
                    color: isActive ? theme.text.primary : theme.text.secondary,
                    textShadow: theme.text.shadowLight,
                  }}
                >
                  {project.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: theme.text.dimmed,
                    marginTop: 3,
                  }}
                >
                  {project.conversationCount} conversations
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
