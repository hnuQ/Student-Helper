import { LayoutDashboard, Kanban, Calendar, Mail, Settings, GraduationCap, NotebookPen } from 'lucide-react'
import { View } from '../../stores/appStore'

interface SidebarProps {
  currentView: View
  onViewChange: (view: View) => void
  onSelectInstitution: (id: string | null) => void
}

const navItems = [
  { id: 'dashboard' as View, label: '\u603b\u89c8', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'kanban' as View, label: '\u770b\u677f', icon: <Kanban className="w-5 h-5" /> },
  { id: 'timeline' as View, label: '\u65e5\u7a0b', icon: <Calendar className="w-5 h-5" /> },
  { id: 'daily' as View, label: '\u65e5\u5e38', icon: <NotebookPen className="w-5 h-5" /> },
  { id: 'templates' as View, label: '\u6a21\u677f', icon: <Mail className="w-5 h-5" /> },
  { id: 'settings' as View, label: '\u8bbe\u7f6e', icon: <Settings className="w-5 h-5" /> }
]

export default function Sidebar({ currentView, onViewChange, onSelectInstitution }: SidebarProps): JSX.Element {
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Student Helper</h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  onSelectInstitution(null)
                  onViewChange(item.id)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentView === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">v2.1.1</p>
      </div>
    </aside>
  )
}
