import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore, Institution } from '../../stores/appStore'
import InstitutionCard from './InstitutionCard'
import InstitutionForm from './InstitutionForm'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

interface KanbanBoardProps {
  onSelectInstitution: (id: string) => void
}

const TEXT = {
  title: '\u9662\u6821\u7533\u8bf7\u770b\u677f',
  subtitle: '\u6309\u51b2\u3001\u7a33\u3001\u4fdd\u5206\u7ec4\u7ba1\u7406\u76ee\u6807\u9662\u6821',
  addInstitution: '\u6dfb\u52a0\u9662\u6821',
  all: '\u5168\u90e8',
  empty: '\u6682\u65e0\u9662\u6821',
} as const

const TIER_LABELS = {
  REACH: '\u51b2',
  MATCH: '\u7a33',
  SAFETY: '\u4fdd',
} as const

const TIER_DESCS = {
  REACH: '\u7565\u9ad8\u4e8e\u5f53\u524d\u7ade\u4e89\u529b\uff0c\u4f46\u503c\u5f97\u5c1d\u8bd5',
  MATCH: '\u4e0e\u5f53\u524d\u80cc\u666f\u76f8\u5bf9\u5339\u914d',
  SAFETY: '\u7528\u4e8e\u4fdd\u5e95\u7684\u76ee\u6807\u9009\u62e9',
} as const

const tierConfig = {
  REACH: { label: TIER_LABELS.REACH, color: 'text-reach', borderColor: 'border-reach' },
  MATCH: { label: TIER_LABELS.MATCH, color: 'text-match', borderColor: 'border-match' },
  SAFETY: { label: TIER_LABELS.SAFETY, color: 'text-safety', borderColor: 'border-safety' },
} as const

export default function KanbanBoard({ onSelectInstitution }: KanbanBoardProps): JSX.Element {
  const { institutions } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null)

  const reachSchools = institutions.filter((institution) => institution.tier === 'REACH')
  const matchSchools = institutions.filter((institution) => institution.tier === 'MATCH')
  const safetySchools = institutions.filter((institution) => institution.tier === 'SAFETY')

  const handleEdit = (institution: Institution): void => {
    setEditingInstitution(institution)
    setShowForm(true)
  }

  const closeForm = (): void => {
    setShowForm(false)
    setEditingInstitution(null)
  }

  return (
    <div className="h-full flex flex-col">
      <header className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{TEXT.title}</h2>
          <p className="text-sm text-muted-foreground">{TEXT.subtitle}</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {TEXT.addInstitution}
        </Button>
      </header>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="all" className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <TabsList>
              <TabsTrigger value="all">{TEXT.all} ({institutions.length})</TabsTrigger>
              <TabsTrigger value="reach" className="text-reach">{TIER_LABELS.REACH} ({reachSchools.length})</TabsTrigger>
              <TabsTrigger value="match" className="text-match">{TIER_LABELS.MATCH} ({matchSchools.length})</TabsTrigger>
              <TabsTrigger value="safety" className="text-safety">{TIER_LABELS.SAFETY} ({safetySchools.length})</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-3 gap-4 h-full">
              <KanbanColumn tier="REACH" schools={reachSchools} config={tierConfig.REACH} onSelect={onSelectInstitution} onEdit={handleEdit} />
              <KanbanColumn tier="MATCH" schools={matchSchools} config={tierConfig.MATCH} onSelect={onSelectInstitution} onEdit={handleEdit} />
              <KanbanColumn tier="SAFETY" schools={safetySchools} config={tierConfig.SAFETY} onSelect={onSelectInstitution} onEdit={handleEdit} />
            </div>
          </TabsContent>

          <TabsContent value="reach" className="flex-1 overflow-auto p-4">
            <KanbanColumn tier="REACH" schools={reachSchools} config={tierConfig.REACH} onSelect={onSelectInstitution} onEdit={handleEdit} fullHeight />
          </TabsContent>
          <TabsContent value="match" className="flex-1 overflow-auto p-4">
            <KanbanColumn tier="MATCH" schools={matchSchools} config={tierConfig.MATCH} onSelect={onSelectInstitution} onEdit={handleEdit} fullHeight />
          </TabsContent>
          <TabsContent value="safety" className="flex-1 overflow-auto p-4">
            <KanbanColumn tier="SAFETY" schools={safetySchools} config={tierConfig.SAFETY} onSelect={onSelectInstitution} onEdit={handleEdit} fullHeight />
          </TabsContent>
        </Tabs>
      </div>

      {showForm && (
        <InstitutionForm institution={editingInstitution} onClose={closeForm} onSuccess={closeForm} />
      )}
    </div>
  )
}

interface KanbanColumnProps {
  tier: 'REACH' | 'MATCH' | 'SAFETY'
  schools: Institution[]
  config: { label: string; color: string; borderColor: string }
  onSelect: (id: string) => void
  onEdit: (institution: Institution) => void
  fullHeight?: boolean
}

function KanbanColumn({ tier, schools, config, onSelect, onEdit, fullHeight }: KanbanColumnProps): JSX.Element {
  return (
    <div className={`flex flex-col bg-muted/30 rounded-lg ${fullHeight ? 'h-full min-h-[400px]' : 'min-h-[200px]'}`}>
      <div className={`p-3 border-b-2 ${config.borderColor}`}>
        <h3 className={`font-bold ${config.color}`}>
          {config.label} ({schools.length})
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">{TIER_DESCS[tier]}</p>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-auto">
        {schools.map((school) => (
          <InstitutionCard
            key={school.id}
            institution={school}
            onClick={() => onSelect(school.id)}
            onEdit={() => onEdit(school)}
          />
        ))}
        {schools.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">{TEXT.empty}</div>
        )}
      </div>
    </div>
  )
}
