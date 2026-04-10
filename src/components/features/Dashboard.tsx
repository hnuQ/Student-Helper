import { useEffect, useMemo, useState } from 'react'
import { differenceInDays, format, isPast } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ArrowRight, Calendar, CheckCircle2, Clock, NotebookPen, TrendingUp, Users, Weight } from 'lucide-react'
import { useStore, Institution } from '../../stores/appStore'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

function formatHours(totalMinutes: number): string {
  if (!totalMinutes) return '0h'
  const hours = totalMinutes / 60
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`
}

export default function Dashboard(): JSX.Element {
  const { institutions, orphanTasks, loadOrphanTasks, setView, setSelectedInstitutionId } = useStore()
  const [weekDailyTotal, setWeekDailyTotal] = useState(0)
  const [latestWeight, setLatestWeight] = useState<number | null>(null)

  useEffect(() => {
    void loadOrphanTasks()
  }, [loadOrphanTasks])

  useEffect(() => {
    let cancelled = false

    async function loadDailySummary(): Promise<void> {
      try {
        const today = new Date().toISOString().slice(0, 10)
        const week = await window.api.daily.getWeek(today)
        if (cancelled) return
        setWeekDailyTotal(week.records.reduce((sum, record) => sum + record.totalMinutes, 0))

        const weighted = [...week.records]
          .filter((record) => typeof record.weight === 'number')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setLatestWeight(weighted[0]?.weight ?? null)
      } catch {
        if (!cancelled) {
          setWeekDailyTotal(0)
          setLatestWeight(null)
        }
      }
    }

    void loadDailySummary()
    return () => {
      cancelled = true
    }
  }, [])

  const stats = useMemo(() => {
    const total = institutions.length
    const reach = institutions.filter((i) => i.tier === 'REACH').length
    const match = institutions.filter((i) => i.tier === 'MATCH').length
    const safety = institutions.filter((i) => i.tier === 'SAFETY').length
    const totalAdvisors = institutions.reduce((acc, i) => acc + (i.advisors?.length || 0), 0)
    const totalTasks = institutions.reduce((acc, i) => acc + (i.tasks?.length || 0), 0)
    const completedTasks = institutions.reduce((acc, i) => acc + (i.tasks?.filter((t) => t.isCompleted).length || 0), 0)

    return {
      total,
      reach,
      match,
      safety,
      totalAdvisors,
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      taskProgress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    }
  }, [institutions])

  const allDeadlines = useMemo(() => {
    const items: Array<{ institution: Institution; deadline: string; type: '\u590f\u4ee4\u8425' | '\u9884\u63a8\u514d'; daysLeft: number }> = []

    for (const inst of institutions) {
      if (inst.campDeadline && !isPast(new Date(inst.campDeadline))) {
        items.push({ institution: inst, deadline: inst.campDeadline, type: '\u590f\u4ee4\u8425', daysLeft: differenceInDays(new Date(inst.campDeadline), new Date()) })
      }
      if (inst.pushDeadline && !isPast(new Date(inst.pushDeadline))) {
        items.push({ institution: inst, deadline: inst.pushDeadline, type: '\u9884\u63a8\u514d', daysLeft: differenceInDays(new Date(inst.pushDeadline), new Date()) })
      }
    }

    return items.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
  }, [institutions])

  const allPendingTasks = useMemo(() => {
    const items: Array<{ institution: Institution | null; task: { id: string; title: string; dueDate: string } }> = []

    for (const inst of institutions) {
      for (const task of inst.tasks || []) {
        if (!task.isCompleted) items.push({ institution: inst, task })
      }
    }

    for (const task of orphanTasks) {
      if (!task.isCompleted) items.push({ institution: null, task })
    }

    return items.sort((a, b) => new Date(a.task.dueDate).getTime() - new Date(b.task.dueDate).getTime())
  }, [institutions, orphanTasks])

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h2 className="text-3xl font-bold">{'\u603b\u89c8'}</h2>
          <p className="text-muted-foreground">{'\u5feb\u901f\u67e5\u770b\u5f53\u524d\u8bb0\u5f55\u3001\u65e5\u7a0b\u548c\u65e5\u5e38\u6295\u5165\u3002'}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StatsCard title={'\u9662\u6821\u603b\u6570'} value={stats.total} icon={<TrendingUp className="h-5 w-5" />} description={`\u51b2 ${stats.reach} | \u7a33 ${stats.match} | \u4fdd ${stats.safety}`} onClick={() => setView('kanban')} />
          <StatsCard title={'\u5bfc\u5e08\u6570\u91cf'} value={stats.totalAdvisors} icon={<Users className="h-5 w-5" />} description={'\u5df2\u5f55\u5165\u5bfc\u5e08\u4fe1\u606f'} onClick={() => setView('kanban')} />
          <StatsCard title={'\u5f85\u529e\u4efb\u52a1'} value={stats.pendingTasks} icon={<Clock className="h-5 w-5" />} description={`\u5171 ${stats.totalTasks} \u9879\u4efb\u52a1`} onClick={() => setView('timeline')} />
          <StatsCard title={'\u4efb\u52a1\u5b8c\u6210\u7387'} value={`${stats.taskProgress}%`} icon={<CheckCircle2 className="h-5 w-5" />} description={`${stats.completedTasks} \u9879\u5df2\u5b8c\u6210`} onClick={() => setView('timeline')} />
          <StatsCard title={'\u672c\u5468\u65e5\u5e38\u65f6\u957f'} value={formatHours(weekDailyTotal)} icon={<NotebookPen className="h-5 w-5" />} description={'\u6765\u81ea\u65e5\u5e38\u6a21\u5757\u7684\u6d3b\u52a8\u6c47\u603b'} onClick={() => setView('daily')} />
          <StatsCard title={'\u6700\u8fd1\u4f53\u91cd'} value={latestWeight === null ? '--' : `${latestWeight} kg`} icon={<Weight className="h-5 w-5" />} description={'\u672c\u5468\u6700\u8fd1\u4e00\u6b21\u8bb0\u5f55'} onClick={() => setView('daily')} />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold"><Calendar className="h-5 w-5" />{'\u65e5\u7a0b\u603b\u89c8'}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setView('timeline')}>
              {'\u67e5\u770b\u5b8c\u6574\u65f6\u95f4\u7ebf'}<ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/20">
              <p className="mb-3 text-sm font-medium text-muted-foreground">{'\u9662\u6821\u622a\u6b62\u65e5\u671f'}</p>
              <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {allDeadlines.length > 0 ? allDeadlines.map(({ institution, deadline, type, daysLeft }) => {
                  const urgency = daysLeft <= 7 ? 'urgent' : daysLeft <= 14 ? 'warning' : 'normal'
                  return (
                    <div key={`${institution.id}-${type}`} className="flex cursor-pointer items-center justify-between rounded-lg bg-white p-3 transition-colors hover:bg-muted/50 dark:bg-slate-900/40" onClick={() => { setSelectedInstitutionId(institution.id); setView('kanban') }}>
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`w-14 flex-shrink-0 rounded bg-slate-100 py-0.5 text-center text-sm font-semibold dark:bg-slate-700 ${urgency === 'urgent' ? 'text-red-600' : urgency === 'warning' ? 'text-amber-600' : 'text-muted-foreground'}`}>{daysLeft}{'\u5929'}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{institution.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{institution.department}</p>
                        </div>
                      </div>
                      <div className="ml-2 flex flex-shrink-0 items-center gap-2">
                        <UrgencyBadge urgency={urgency} />
                        <BadgeTier tier={institution.tier} type={type} />
                        <span className="text-xs text-muted-foreground">{format(new Date(deadline), 'MM/dd', { locale: zhCN })}</span>
                      </div>
                    </div>
                  )
                }) : <p className="py-6 text-center text-sm text-muted-foreground">{'\u6682\u65e0\u5373\u5c06\u622a\u6b62\u7684\u7533\u8bf7'}</p>}
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/20">
              <p className="mb-3 text-sm font-medium text-muted-foreground">{'\u5f85\u529e\u4efb\u52a1'}</p>
              <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {allPendingTasks.length > 0 ? allPendingTasks.map(({ institution, task }) => {
                  const daysLeft = differenceInDays(new Date(task.dueDate), new Date())
                  const urgency = daysLeft <= 7 ? 'urgent' : daysLeft <= 14 ? 'warning' : 'normal'
                  return (
                    <div key={task.id} className={`flex items-center justify-between rounded-lg bg-white p-3 transition-colors hover:bg-muted/50 dark:bg-slate-900/40 ${institution ? 'cursor-pointer' : ''}`} onClick={() => { if (institution) { setSelectedInstitutionId(institution.id); setView('kanban') } }}>
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`w-14 flex-shrink-0 rounded bg-slate-100 py-0.5 text-center text-sm font-semibold dark:bg-slate-700 ${urgency === 'urgent' ? 'text-red-600' : urgency === 'warning' ? 'text-amber-600' : 'text-muted-foreground'}`}>{daysLeft}{'\u5929'}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{task.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{institution ? `${institution.name} \u00b7 ${institution.department}` : '\u72ec\u7acb\u4efb\u52a1'}</p>
                        </div>
                      </div>
                      <div className="ml-2 flex flex-shrink-0 items-center gap-2">
                        <UrgencyBadge urgency={urgency} />
                        <span className="text-xs text-muted-foreground">{format(new Date(task.dueDate), 'MM/dd', { locale: zhCN })}</span>
                      </div>
                    </div>
                  )
                }) : <p className="py-6 text-center text-sm text-muted-foreground">{'\u6682\u65e0\u5f85\u529e\u4efb\u52a1'}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function UrgencyBadge({ urgency }: { urgency: 'urgent' | 'warning' | 'normal' }) {
  if (urgency === 'urgent') return <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">{'\u7d27\u6025'}</span>
  if (urgency === 'warning') return <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">{'\u63d0\u9192'}</span>
  return null
}

function StatsCard({ title, value, icon, description, onClick }: { title: string; value: string | number; icon: React.ReactNode; description: string; onClick?: () => void }) {
  return (
    <Card className={onClick ? 'cursor-pointer transition-colors hover:bg-muted/30' : ''} onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function BadgeTier({ tier, type }: { tier: 'REACH' | 'MATCH' | 'SAFETY'; type: string }) {
  const tierColors = {
    REACH: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    MATCH: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    SAFETY: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  }
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${tierColors[tier]}`}>{type}</span>
}
