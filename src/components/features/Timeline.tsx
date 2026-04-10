import { useEffect, useState } from 'react'
import { format, isPast, isThisWeek, isToday, isTomorrow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { AlertCircle, ArrowRight, Calendar, CheckCircle2, Circle, Clock, Edit2, Plus, Trash2, X } from 'lucide-react'
import { Institution, Task, useStore } from '../../stores/appStore'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

interface TimelineProps {
  institutions: Institution[]
}

type ScheduleType = 'camp' | 'push' | 'task'

type TimelineEvent = {
  id: string
  title: string
  type: ScheduleType
  date: string
  institution: Institution | null
  completed?: boolean
  taskId?: string
}

const TEXT = {
  title: '\u65e5\u7a0b',
  subtitle: '\u67e5\u770b\u6240\u6709\u622a\u6b62\u65e5\u671f\u548c\u4efb\u52a1',
  addSchedule: '\u6dfb\u52a0\u65e5\u7a0b',
  campDeadline: '\u590f\u4ee4\u8425\u622a\u6b62',
  pushDeadline: '\u9884\u63a8\u514d\u622a\u6b62',
  pendingTasks: '\u5f85\u529e\u4efb\u52a1',
  empty: '\u6682\u65e0\u65e5\u7a0b\u5b89\u6392',
  addFirst: '\u6dfb\u52a0\u7b2c\u4e00\u4e2a\u65e5\u7a0b',
  overdue: '\u5df2\u8fc7\u671f',
  today: '\u4eca\u5929',
  tomorrow: '\u660e\u5929',
  thisWeek: '\u672c\u5468',
  upcoming: '\u5373\u5c06\u5230\u6765',
  task: '\u4efb\u52a1',
  noInstitution: '\u65e0\u5173\u8054\u9662\u6821',
  updateFailed: '\u66f4\u65b0\u5931\u8d25\uff1a',
  unknownError: '\u672a\u77e5\u9519\u8bef',
  deleteConfirm: '\u786e\u5b9a\u5220\u9664\u6b64\u4efb\u52a1\uff1f',
  edit: '\u7f16\u8f91',
  delete: '\u5220\u9664',
  scheduleType: '\u65e5\u7a0b\u7c7b\u578b',
  institution: '\u5173\u8054\u9662\u6821',
  institutionRequired: '\u003cspan class="text-destructive"\u003e*\u003c/span\u003e',
  noInstitutionOption: '\u4e0d\u5173\u8054\u9662\u6821',
  selectInstitution: '\u9009\u62e9\u9662\u6821',
  taskTitle: '\u4efb\u52a1\u6807\u9898',
  taskPlaceholder: '\u5982\uff1a\u63d0\u4ea4\u63a8\u8350\u4fe1',
  dueDate: '\u622a\u6b62\u65e5\u671f',
  cancel: '\u53d6\u6d88',
  adding: '\u6dfb\u52a0\u4e2d...',
  confirmAdd: '\u786e\u8ba4\u6dfb\u52a0',
  editTask: '\u7f16\u8f91\u4efb\u52a1',
  saveEdit: '\u4fdd\u5b58\u4fee\u6539',
  ordinaryTask: '\u666e\u901a\u4efb\u52a1',
  validCamp: '\u590f\u4ee4\u8425',
  validPush: '\u9884\u63a8\u514d'
} as const

export default function Timeline({ institutions }: TimelineProps): JSX.Element {
  const { setSelectedInstitutionId, setView, addTask, deleteTask, updateInstitution, orphanTasks, loadOrphanTasks } = useStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [newType, setNewType] = useState<ScheduleType>('task')
  const [newInstitutionId, setNewInstitutionId] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState('')
  const [orphanTaskCompletion, setOrphanTaskCompletion] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const map: Record<string, boolean> = {}
    orphanTasks.forEach((task) => {
      map[task.id] = task.isCompleted
    })
    setOrphanTaskCompletion(map)
  }, [orphanTasks])

  useEffect(() => {
    void loadOrphanTasks()
  }, [loadOrphanTasks])

  const timelineEvents: TimelineEvent[] = (() => {
    const events: TimelineEvent[] = []
    institutions.forEach((inst) => {
      if (inst.campDeadline) {
        events.push({
          id: `${inst.id}-camp`,
          title: `${inst.name} - ${TEXT.campDeadline}`,
          type: 'camp',
          date: inst.campDeadline,
          institution: inst
        })
      }
      if (inst.pushDeadline) {
        events.push({
          id: `${inst.id}-push`,
          title: `${inst.name} - ${TEXT.pushDeadline}`,
          type: 'push',
          date: inst.pushDeadline,
          institution: inst
        })
      }
      inst.tasks?.forEach((task) => {
        events.push({
          id: task.id,
          title: task.title,
          type: 'task',
          date: task.dueDate,
          institution: inst,
          completed: task.isCompleted,
          taskId: task.id
        })
      })
    })
    orphanTasks.forEach((task) => {
      events.push({
        id: task.id,
        title: task.title,
        type: 'task',
        date: task.dueDate,
        institution: null,
        completed: task.id in orphanTaskCompletion ? orphanTaskCompletion[task.id] : task.isCompleted,
        taskId: task.id
      })
    })
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  })()

  const groupedEvents = (() => {
    const groups: Record<string, TimelineEvent[]> = { overdue: [], today: [], tomorrow: [], thisWeek: [], upcoming: [] }
    timelineEvents.forEach((event) => {
      const date = new Date(event.date)
      if (isPast(date) && !isToday(date)) groups.overdue.push(event)
      else if (isToday(date)) groups.today.push(event)
      else if (isTomorrow(date)) groups.tomorrow.push(event)
      else if (isThisWeek(date)) groups.thisWeek.push(event)
      else groups.upcoming.push(event)
    })
    return groups
  })()

  function getDateLabel(date: string): { label: string; color: string } {
    const parsed = new Date(date)
    if (isPast(parsed) && !isToday(parsed)) return { label: TEXT.overdue, color: 'text-destructive' }
    if (isToday(parsed)) return { label: TEXT.today, color: 'text-primary' }
    if (isTomorrow(parsed)) return { label: TEXT.tomorrow, color: 'text-amber-600' }
    if (isThisWeek(parsed)) return { label: TEXT.thisWeek, color: 'text-blue-600' }
    return { label: format(parsed, 'MM/dd', { locale: zhCN }), color: 'text-muted-foreground' }
  }

  async function handleAddSchedule(): Promise<void> {
    if (!newDate || (newType === 'task' && !newTitle.trim())) return
    if (newType !== 'task' && (!newInstitutionId || newInstitutionId === '__none__')) return
    setIsSubmitting(true)
    try {
      if (newType === 'task') {
        await addTask({
          institutionId: newInstitutionId === '__none__' ? undefined : newInstitutionId || undefined,
          title: newTitle.trim(),
          dueDate: newDate,
          isCompleted: false
        })
      } else {
        const field = newType === 'camp' ? 'campDeadline' : 'pushDeadline'
        await updateInstitution(newInstitutionId, { [field]: newDate })
      }
      setShowAddModal(false)
      setNewInstitutionId('')
      setNewTitle('')
      setNewDate('')
      setNewType('task')
      await loadOrphanTasks()
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleToggleTask(taskId: string, currentCompleted: boolean): void {
    const nextCompleted = !currentCompleted
    setOrphanTaskCompletion((prev) => ({ ...prev, [taskId]: nextCompleted }))

    window.api.task.update(taskId, { isCompleted: nextCompleted })
      .then(() => loadOrphanTasks())
      .catch((error: any) => {
        console.error('Task update failed, rolling back UI', error)
        setOrphanTaskCompletion((prev) => ({ ...prev, [taskId]: currentCompleted }))
        alert(`${TEXT.updateFailed}${error?.message || TEXT.unknownError}`)
      })
  }

  async function handleDeleteTask(taskId: string): Promise<void> {
    if (!confirm(TEXT.deleteConfirm)) return
    await deleteTask(taskId)
    await loadOrphanTasks()
  }

  function handleOpenEdit(task: Task): void {
    setEditingTask(task)
    setEditTitle(task.title)
    setEditDate(task.dueDate.substring(0, 10))
  }

  async function handleSaveEdit(): Promise<void> {
    if (!editingTask || !editTitle.trim() || !editDate) return
    await window.api.task.update(editingTask.id, { title: editTitle.trim(), dueDate: editDate })
    setEditingTask(null)
    await loadOrphanTasks()
  }

  function handleRowClick(event: TimelineEvent): void {
    if (!event.institution) return
    setSelectedInstitutionId(event.institution.id)
    setView('kanban')
  }

  const groupLabels: Record<string, string> = {
    overdue: TEXT.overdue,
    today: TEXT.today,
    tomorrow: TEXT.tomorrow,
    thisWeek: TEXT.thisWeek,
    upcoming: TEXT.upcoming
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">{TEXT.title}</h2>
            <p className="text-muted-foreground">{TEXT.subtitle}</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />{TEXT.addSchedule}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: TEXT.campDeadline, count: timelineEvents.filter((event) => event.type === 'camp').length, color: 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900' },
            { label: TEXT.pushDeadline, count: timelineEvents.filter((event) => event.type === 'push').length, color: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900' },
            { label: TEXT.pendingTasks, count: timelineEvents.filter((event) => event.type === 'task' && !event.completed).length, color: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900' }
          ].map(({ label, count, color }) => (
            <div key={label} className={`flex items-center justify-between rounded-lg px-4 py-2.5 ${color}`}>
              <span className="text-sm font-medium">{label}</span>
              <span className="text-lg font-bold">{count}</span>
            </div>
          ))}
        </div>

        {timelineEvents.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-muted py-16 text-center text-muted-foreground">
            <Calendar className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p className="mb-3">{TEXT.empty}</p>
            <Button variant="outline" onClick={() => setShowAddModal(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />{TEXT.addFirst}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([group, events]) => {
              if (events.length === 0) return null
              return (
                <div key={group}>
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                    {group === 'overdue' && <AlertCircle className="h-5 w-5 text-destructive" />}
                    {group === 'today' && <Clock className="h-5 w-5 text-primary" />}
                    {(group === 'tomorrow' || group === 'thisWeek' || group === 'upcoming') && <Calendar className="h-5 w-5" />}
                    {groupLabels[group]}
                    <span className="text-sm font-normal text-muted-foreground">({events.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {events.map((event) => {
                      const dateInfo = getDateLabel(event.date)
                      const isOrphan = event.institution === null
                      return (
                        <div
                          key={event.id}
                          className={`group flex items-center gap-3 rounded-lg border p-3.5 transition-colors ${event.completed ? 'bg-muted/20 opacity-60' : 'bg-card'} ${isOrphan ? '' : 'cursor-pointer hover:bg-muted/40'}`}
                          onClick={() => !isOrphan && handleRowClick(event)}
                        >
                          <div className="w-20 flex-shrink-0 text-center">
                            {event.type === 'task' && isOrphan ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  e.preventDefault()
                                  if (event.taskId) handleToggleTask(event.taskId, !!event.completed)
                                }}
                                className="mx-auto block rounded p-1 transition-colors hover:bg-muted/50"
                              >
                                {event.completed ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Circle className="h-5 w-5 text-muted-foreground transition-colors hover:text-green-600" />}
                              </button>
                            ) : event.completed ? (
                              <CheckCircle2 className="mx-auto h-5 w-5 text-green-600" />
                            ) : (
                              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${dateInfo.color.replace('text-', 'bg-').replace('600', '100').replace('500', '100').replace('text-primary', 'bg-primary/10 text-primary')}`}>
                                {dateInfo.label}
                              </span>
                            )}
                          </div>

                          <div className="flex-shrink-0">
                            {event.type === 'camp' && <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">{TEXT.validCamp}</span>}
                            {event.type === 'push' && <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{TEXT.validPush}</span>}
                            {event.type === 'task' && <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{TEXT.task}</span>}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-sm font-medium ${event.completed ? 'line-through text-muted-foreground' : ''}`}>{event.title}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {event.institution ? `${event.institution.name} · ${event.institution.department}` : TEXT.noInstitution}
                            </p>
                          </div>

                          <div className="mr-1 flex-shrink-0 text-xs text-muted-foreground">
                            {format(new Date(event.date), 'yyyy/MM/dd', { locale: zhCN })}
                          </div>

                          {isOrphan && event.taskId && (
                            <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const task = orphanTasks.find((item) => item.id === event.taskId)
                                  if (task) handleOpenEdit(task)
                                }}
                                className="rounded p-1.5 transition-colors hover:bg-muted"
                                title={TEXT.edit}
                              >
                                <Edit2 className="h-4 w-4 text-muted-foreground" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  void handleDeleteTask(event.taskId!)
                                }}
                                className="rounded p-1.5 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
                                title={TEXT.delete}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </button>
                            </div>
                          )}

                          {event.institution && <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={showAddModal} onOpenChange={(open) => { if (!open) setShowAddModal(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {TEXT.addSchedule}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{TEXT.scheduleType}</Label>
              <Select value={newType} onValueChange={(value) => { setNewType(value as ScheduleType); setNewTitle('') }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">{TEXT.ordinaryTask}</SelectItem>
                  <SelectItem value="camp">{TEXT.campDeadline}</SelectItem>
                  <SelectItem value="push">{TEXT.pushDeadline}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{TEXT.institution}{newType !== 'task' ? ' *' : ''}</Label>
              <Select value={newInstitutionId} onValueChange={setNewInstitutionId}>
                <SelectTrigger><SelectValue placeholder={TEXT.selectInstitution} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{TEXT.noInstitutionOption}</SelectItem>
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newType === 'task' && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{TEXT.taskTitle}</Label>
                <Input autoFocus placeholder={TEXT.taskPlaceholder} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{TEXT.dueDate}</Label>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="gap-1.5">
              <X className="h-4 w-4" />{TEXT.cancel}
            </Button>
            <Button
              onClick={() => void handleAddSchedule()}
              disabled={isSubmitting || !newDate || (newType === 'task' && !newTitle.trim()) || (newType !== 'task' && (!newInstitutionId || newInstitutionId === '__none__'))}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />{isSubmitting ? TEXT.adding : TEXT.confirmAdd}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTask} onOpenChange={(open) => { if (!open) setEditingTask(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{TEXT.editTask}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">{TEXT.taskTitle}</label>
              <Input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">{TEXT.dueDate}</label>
              <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingTask(null)} className="gap-1.5">
              <X className="h-4 w-4" />{TEXT.cancel}
            </Button>
            <Button onClick={() => void handleSaveEdit()} disabled={!editTitle.trim() || !editDate} className="gap-1.5">
              <Plus className="h-4 w-4" />{TEXT.saveEdit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

