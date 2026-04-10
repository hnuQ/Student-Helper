import { useEffect, useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  FileText,
  Plus,
  Save,
  Sparkles,
  Trash2,
  WrapText
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Textarea } from '../ui/textarea'

interface ActivityDraft {
  id?: string
  startTime: string
  endTime: string
  content: string
}

interface HealthDraft {
  weight: string
  waist: string
  chest: string
  hips: string
}

const TEXT = {
  title: '\u65e5\u5e38',
  subtitle: '\u6309\u5929\u8bb0\u5f55\u5b66\u4e60\u3001\u8bad\u7ec3\u548c\u8eab\u4f53\u6570\u636e\uff0c\u652f\u6301\u5468\u89c6\u56fe\u6c47\u603b\u3002',
  calendar: '\u65e5\u5386',
  weekly: '\u5468\u62a5',
  recorded: '\u5df2\u8bb0',
  learning: '\u5b66\u4e60',
  dayLoading: '\u6b63\u5728\u52a0\u8f7d\u5f53\u5929\u8bb0\u5f55...',
  dayHint: '\u8bb0\u5f55\u5f53\u5929\u7684\u8eab\u4f53\u6570\u636e\u3001\u5b66\u4e60\u65f6\u957f\u548c\u6d3b\u52a8\u5b89\u6392\u3002',
  clearSelection: '\u53d6\u6d88\u9009\u62e9',
  weight: '\u4f53\u91cd',
  waist: '\u8170\u56f4',
  chest: '\u80f8\u56f4',
  hips: '\u81c0\u56f4',
  studyHours: '\u5b66\u4e60\u65f6\u957f',
  hours: '\u5c0f\u65f6',
  trainingPlan: '\u8bad\u7ec3\u8ba1\u5212',
  activities: '\u6d3b\u52a8\u5b89\u6392',
  total: '\u7d2f\u8ba1',
  addActivity: '\u6dfb\u52a0\u6d3b\u52a8',
  activityPlaceholder: '\u586b\u5199\u6d3b\u52a8\u5185\u5bb9',
  duration: '\u65f6\u957f',
  invalidDuration: '\u8bf7\u586b\u5199\u6709\u6548\u7684\u5f00\u59cb\u548c\u7ed3\u675f\u65f6\u95f4',
  summary: '\u6bcf\u65e5\u603b\u7ed3',
  summaryPlaceholder: '\u603b\u7ed3\u4eca\u5929\u5b8c\u6210\u4e86\u4ec0\u4e48\u3001\u72b6\u6001\u5982\u4f55\u3001\u660e\u5929\u8981\u8865\u4ec0\u4e48\u3002',
  save: '\u4fdd\u5b58\u8bb0\u5f55',
  saving: '\u4fdd\u5b58\u4e2d...',
  delete: '\u5220\u9664\u8bb0\u5f55',
  parseTitle: '\u6587\u672c\u89e3\u6790',
  parseDesc: '\u628a\u65e5\u8bb0\u5f0f\u8f93\u5165\u5feb\u901f\u89e3\u6790\u6210\u8eab\u4f53\u6570\u636e\u548c\u6d3b\u52a8\u65f6\u95f4\u6bb5\u3002',
  parsing: '\u89e3\u6790\u4e2d...',
  parse: '\u89e3\u6790\u6587\u672c',
  parseResult: '\u89e3\u6790\u7ed3\u679c',
  apply: '\u5e94\u7528\u5230\u8868\u5355',
  noActivities: '\u6ca1\u6709\u8bc6\u522b\u5230\u53ef\u7528\u7684\u6d3b\u52a8\u8bb0\u5f55\u3002',
  selectDay: '\u9009\u62e9\u4e00\u5929\u5f00\u59cb\u8bb0\u5f55',
  selectDayDesc: '\u5148\u5728\u5de6\u4fa7\u65e5\u5386\u91cc\u70b9\u9009\u65e5\u671f\uff0c\u518d\u586b\u5199\u5f53\u5929\u8be6\u60c5\u3002',
  guide1: '1. \u9009\u62e9\u67d0\u4e00\u5929\uff0c\u5f55\u5165\u4f53\u91cd\u3001\u56f4\u5ea6\u548c\u5b66\u4e60\u65f6\u957f\u3002',
  guide2: '2. \u6dfb\u52a0\u65f6\u95f4\u6bb5\u6d3b\u52a8\uff0c\u7cfb\u7edf\u4f1a\u81ea\u52a8\u6c47\u603b\u603b\u65f6\u957f\u3002',
  guide3: '3. \u5468\u62a5\u9875\u4f1a\u6309\u9009\u4e2d\u65e5\u671f\u6240\u5728\u5468\u6c47\u603b\u6570\u636e\u3002',
  weekOverview: '\u5468\u6982\u89c8',
  weekOverviewDesc: '\u67e5\u770b\u672c\u5468\u5b66\u4e60\u65f6\u957f\u548c\u4f53\u91cd\u53d8\u5316\u3002',
  weeklyTotal: '\u672c\u5468\u603b\u65f6\u957f',
  weightChange: '\u4f53\u91cd\u53d8\u5316',
  weekSummary: '\u5468\u603b\u7ed3',
  weekSummaryDesc: '\u4e3a\u5f53\u524d\u5468\u4fdd\u5b58\u4e00\u6bb5\u9636\u6bb5\u6027\u56de\u987e\u3002',
  recordedDays: '\u5df2\u8bb0\u5f55',
  days: '\u5929',
  totalActivity: '\u7d2f\u8ba1\u6d3b\u52a8',
  weekSummaryHint: '\u5efa\u8bae\u8bb0\u5f55\u672c\u5468\u8fdb\u5c55\u3001\u8bad\u7ec3\u5b89\u6392\u548c\u4e0b\u5468\u8ba1\u5212\u3002',
  weekSummaryPlaceholder: '\u603b\u7ed3\u8fd9\u5468\u5b8c\u6210\u4e86\u54ea\u4e9b\u4efb\u52a1\u3001\u5b66\u4e60\u72b6\u6001\u5982\u4f55\u3001\u4e0b\u5468\u51c6\u5907\u5982\u4f55\u8c03\u6574\u3002',
  saveWeekSummary: '\u4fdd\u5b58\u5468\u603b\u7ed3',
  restoreWeekSummary: '\u6062\u590d\u5df2\u4fdd\u5b58\u5185\u5bb9',
  saveSuccess: '\u4fdd\u5b58\u6210\u529f',
  saveFailed: '\u4fdd\u5b58\u5931\u8d25\uff1a',
  deleteConfirmPrefix: '\u786e\u5b9a\u5220\u9664 ',
  deleteConfirmSuffix: ' \u7684\u65e5\u5e38\u8bb0\u5f55\u5417\uff1f'
} as const

const TRAINING_OPTIONS = [
  { value: 'CHEST', label: '\u80f8' },
  { value: 'BACK', label: '\u80cc' },
  { value: 'LEGS', label: '\u817f' },
  { value: 'REST', label: '\u4f11\u606f' },
  { value: 'OTHER', label: '\u5176\u4ed6' }
] as const

const WEEKDAY_LABELS = ['\u4e00', '\u4e8c', '\u4e09', '\u56db', '\u4e94', '\u516d', '\u65e5']

const RAW_TEXT_PLACEHOLDER = `2026-04-07
\u4f53\u91cd 62.5kg \u8170\u56f4 78 \u80f8\u56f4 92 \u81c0\u56f4 95
09:00-11:30 \u590d\u4e60\u6982\u7387\u8bba\u7b2c3\u7ae0\u5e76\u505a\u9898
14:00-15:00 \u80cc\u90e8\u8bad\u7ec3
20:00-22:00 \u9605\u8bfb\u8bba\u6587`

function formatDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

function formatHours(totalMinutes: number): string {
  if (!totalMinutes) return '0h'
  const hours = totalMinutes / 60
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`
}

function calculateDuration(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  if ([sh, sm, eh, em].some((value) => Number.isNaN(value))) return 0
  return eh * 60 + em - (sh * 60 + sm)
}

function buildHealthDraft(record?: DailyRecordData | null): HealthDraft {
  return {
    weight: record?.weight?.toString() || '',
    waist: record?.waist?.toString() || '',
    chest: record?.chest?.toString() || '',
    hips: record?.hips?.toString() || ''
  }
}

function buildActivityDrafts(record?: DailyRecordData | null): ActivityDraft[] {
  if (!record?.activities?.length) return [{ startTime: '', endTime: '', content: '' }]
  return record.activities.map((activity) => ({ id: activity.id, startTime: activity.startTime, endTime: activity.endTime, content: activity.content }))
}

function formatTrainingPlan(value: string | null | undefined): string {
  return TRAINING_OPTIONS.find((option) => option.value === value)?.label || '\u672a\u8bbe\u7f6e'
}

export default function DailyTracker(): JSX.Element {
  const todayKey = formatDateKey(new Date())
  const [activeTab, setActiveTab] = useState('calendar')
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [monthRecords, setMonthRecords] = useState<DailyRecordData[]>([])
  const [selectedRecord, setSelectedRecord] = useState<DailyRecordData | null>(null)
  const [health, setHealth] = useState<HealthDraft>(buildHealthDraft())
  const [activities, setActivities] = useState<ActivityDraft[]>(buildActivityDrafts())
  const [studyHours, setStudyHours] = useState('')
  const [trainingPlan, setTrainingPlan] = useState('REST')
  const [summary, setSummary] = useState('')
  const [rawText, setRawText] = useState('')
  const [parsePreview, setParsePreview] = useState<DailyParseResult | null>(null)
  const [weekData, setWeekData] = useState<WeeklyDailyBundle | null>(null)
  const [weekSummary, setWeekSummary] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [isLoadingDay, setIsLoadingDay] = useState(false)

  const calendarDays = useMemo(() => {
    const rangeStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
    const rangeEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
    return eachDayOfInterval({ start: rangeStart, end: rangeEnd })
  }, [currentMonth])

  const recordMap = useMemo(() => new Map(monthRecords.map((record) => [record.date, record])), [monthRecords])

  const totalMinutes = useMemo(() => activities.reduce((sum, activity) => {
    const duration = calculateDuration(activity.startTime, activity.endTime)
    return duration > 0 ? sum + duration : sum
  }, 0), [activities])

  const weekBaseDate = selectedDate || todayKey
  const weekStats = useMemo(() => {
    const records = weekData?.records || []
    const total = records.reduce((sum, record) => sum + record.totalMinutes, 0)
    const weights = records.map((record) => record.weight).filter((value): value is number => typeof value === 'number')
    return {
      totalMinutes: total,
      weightChange: weights.length >= 2 ? Number((weights[weights.length - 1] - weights[0]).toFixed(1)) : null,
      records
    }
  }, [weekData])

  useEffect(() => {
    void loadMonth(currentMonth)
  }, [currentMonth])

  useEffect(() => {
    void loadWeek(weekBaseDate)
  }, [weekBaseDate])

  useEffect(() => {
    if (selectedDate) void loadDay(selectedDate)
  }, [selectedDate])

  async function loadMonth(month: Date): Promise<void> {
    setMonthRecords(await window.api.daily.getMonth(formatDateKey(month)))
  }

  async function loadDay(date: string): Promise<void> {
    setIsLoadingDay(true)
    try {
      const record = await window.api.daily.getByDate(date)
      setSelectedRecord(record)
      setHealth(buildHealthDraft(record))
      setActivities(buildActivityDrafts(record))
      setStudyHours(record ? (record.studyMinutes / 60).toString() : '')
      setTrainingPlan(record?.trainingPlan || 'REST')
      setSummary(record?.summary || '')
      setRawText(record?.rawText || '')
      setParsePreview(null)
    } finally {
      setIsLoadingDay(false)
    }
  }

  async function loadWeek(date: string): Promise<void> {
    const nextWeek = await window.api.daily.getWeek(date)
    setWeekData(nextWeek)
    setWeekSummary(nextWeek.weeklySummary?.summary || '')
  }

  function selectDate(date: Date): void {
    const nextDate = formatDateKey(date)
    setSelectedDate(nextDate)
    setCurrentMonth(startOfMonth(date))
  }

  function resetDetailState(): void {
    setSelectedDate(null)
    setSelectedRecord(null)
    setHealth(buildHealthDraft())
    setActivities(buildActivityDrafts())
    setStudyHours('')
    setTrainingPlan('REST')
    setSummary('')
    setRawText('')
    setParsePreview(null)
  }

  function updateActivity(index: number, field: keyof ActivityDraft, value: string): void {
    setActivities((current) => current.map((activity, idx) => (idx === index ? { ...activity, [field]: value } : activity)))
  }

  function addActivity(): void {
    setActivities((current) => [...current, { startTime: '', endTime: '', content: '' }])
  }

  function removeActivity(index: number): void {
    setActivities((current) => current.length === 1 ? [{ startTime: '', endTime: '', content: '' }] : current.filter((_, idx) => idx !== index))
  }

  async function handleParseText(): Promise<void> {
    if (!rawText.trim() || !selectedDate) return
    setIsParsing(true)
    try {
      setParsePreview(await window.api.daily.parseText(rawText, selectedDate))
    } finally {
      setIsParsing(false)
    }
  }

  function applyParsePreview(): void {
    if (!parsePreview) return
    setSelectedDate(parsePreview.date)
    setCurrentMonth(startOfMonth(parseISO(parsePreview.date)))
    setHealth({
      weight: parsePreview.weight?.toString() || '',
      waist: parsePreview.waist?.toString() || '',
      chest: parsePreview.chest?.toString() || '',
      hips: parsePreview.hips?.toString() || ''
    })
    setActivities(
      parsePreview.activities.length > 0
        ? parsePreview.activities.map((activity) => ({ startTime: activity.startTime, endTime: activity.endTime, content: activity.content }))
        : [{ startTime: '', endTime: '', content: '' }]
    )
  }

  async function handleSave(): Promise<void> {
    if (!selectedDate) return
    setIsSaving(true)
    try {
      const saved = await window.api.daily.upsert({
        date: selectedDate,
        weight: health.weight ? Number(health.weight) : null,
        waist: health.waist ? Number(health.waist) : null,
        chest: health.chest ? Number(health.chest) : null,
        hips: health.hips ? Number(health.hips) : null,
        studyMinutes: studyHours ? Math.round(Number(studyHours) * 60) : 0,
        trainingPlan,
        rawText: rawText.trim() || null,
        summary: summary.trim() || null,
        activities
      })
      setSelectedRecord(saved)
      await Promise.all([loadMonth(currentMonth), loadDay(selectedDate), loadWeek(selectedDate)])
      alert(TEXT.saveSuccess)
    } catch (error) {
      console.error(error)
      alert(`${TEXT.saveFailed}${(error as Error).message}`)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(): Promise<void> {
    if (!selectedDate || !selectedRecord) return
    if (!confirm(`${TEXT.deleteConfirmPrefix}${selectedDate}${TEXT.deleteConfirmSuffix}`)) return
    await window.api.daily.deleteByDate(selectedDate)
    await Promise.all([loadMonth(currentMonth), loadWeek(selectedDate)])
    resetDetailState()
  }

  async function handleSaveWeekSummary(): Promise<void> {
    await window.api.daily.saveWeekSummary(weekBaseDate, weekSummary)
    await loadWeek(weekBaseDate)
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">{TEXT.title}</h2>
            <p className="text-muted-foreground">{TEXT.subtitle}</p>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="calendar">{TEXT.calendar}</TabsTrigger>
              <TabsTrigger value="weekly">{TEXT.weekly}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="calendar" className="mt-0">
            <div className="grid grid-cols-[1.15fr_0.95fr] gap-6 items-start">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-xl">{format(currentMonth, 'yyyy\u5e74MM\u6708', { locale: zhCN })}</CardTitle>
                    <CardDescription>{'\u70b9\u51fb\u65e5\u671f\u67e5\u770b\u6216\u7f16\u8f91\u5f53\u5929\u8bb0\u5f55\u3002'}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth((month) => subMonths(month, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth((month) => addMonths(month, 1))}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-7 gap-2 px-1 text-xs font-medium text-muted-foreground">
                    {WEEKDAY_LABELS.map((label) => <div key={label} className="py-1 text-center">{`\u5468${label}`}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day) => {
                      const key = formatDateKey(day)
                      const record = recordMap.get(key)
                      const isSelected = key === selectedDate
                      return (
                        <button key={key} onClick={() => selectDate(day)} className={`min-h-[108px] rounded-lg border p-3 text-left transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-accent hover:text-accent-foreground'} ${isSameMonth(day, currentMonth) ? 'bg-card' : 'bg-muted/30 text-muted-foreground'}`}>
                          <div className="mb-3 flex items-center justify-between">
                            <span className={`text-sm font-semibold ${isSelected ? 'text-primary' : ''}`}>{format(day, 'd')}</span>
                            {record ? <span className="rounded bg-muted px-2 py-0.5 text-[11px]">{TEXT.recorded}</span> : null}
                          </div>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1"><Clock3 className="h-3 w-3" /><span>{record ? `${TEXT.learning} ${formatHours(record.studyMinutes)}` : '--'}</span></div>
                            <div className="flex items-center gap-1"><Dumbbell className="h-3 w-3" /><span>{record ? formatTrainingPlan(record.trainingPlan) : '--'}</span></div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {selectedDate ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-xl">{format(parseISO(selectedDate), 'yyyy\u5e74MM\u6708dd\u65e5 EEEE', { locale: zhCN })}</CardTitle>
                          <CardDescription>{isLoadingDay ? TEXT.dayLoading : TEXT.dayHint}</CardDescription>
                        </div>
                        <Button variant="outline" onClick={resetDetailState}>{TEXT.clearSelection}</Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5"><Label>{`${TEXT.weight} (kg)`}</Label><Input value={health.weight} onChange={(e) => setHealth((state) => ({ ...state, weight: e.target.value }))} placeholder="62.5" /></div>
                        <div className="space-y-1.5"><Label>{`${TEXT.waist} (cm)`}</Label><Input value={health.waist} onChange={(e) => setHealth((state) => ({ ...state, waist: e.target.value }))} placeholder="78" /></div>
                        <div className="space-y-1.5"><Label>{`${TEXT.chest} (cm)`}</Label><Input value={health.chest} onChange={(e) => setHealth((state) => ({ ...state, chest: e.target.value }))} placeholder="92" /></div>
                        <div className="space-y-1.5"><Label>{`${TEXT.hips} (cm)`}</Label><Input value={health.hips} onChange={(e) => setHealth((state) => ({ ...state, hips: e.target.value }))} placeholder="95" /></div>
                        <div className="space-y-1.5"><Label>{`${TEXT.studyHours} (${TEXT.hours})`}</Label><Input value={studyHours} onChange={(e) => setStudyHours(e.target.value)} placeholder="6" /></div>
                        <div className="space-y-1.5"><Label>{TEXT.trainingPlan}</Label><Select value={trainingPlan} onValueChange={setTrainingPlan}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TRAINING_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{TEXT.activities}</h3>
                          <p className="text-sm text-muted-foreground">{`${TEXT.total} ${formatHours(totalMinutes)}`}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={addActivity} className="gap-1.5"><Plus className="h-4 w-4" />{TEXT.addActivity}</Button>
                      </div>

                      <div className="space-y-3">
                        {activities.map((activity, index) => {
                          const duration = calculateDuration(activity.startTime, activity.endTime)
                          return (
                            <div key={`${activity.id || 'new'}-${index}`} className="space-y-3 rounded-lg border bg-muted/20 p-3">
                              <div className="grid grid-cols-[120px_120px_1fr_40px] items-center gap-2">
                                <Input type="time" value={activity.startTime} onChange={(e) => updateActivity(index, 'startTime', e.target.value)} />
                                <Input type="time" value={activity.endTime} onChange={(e) => updateActivity(index, 'endTime', e.target.value)} />
                                <Input value={activity.content} onChange={(e) => updateActivity(index, 'content', e.target.value)} placeholder={TEXT.activityPlaceholder} />
                                <Button variant="ghost" size="icon" onClick={() => removeActivity(index)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                              </div>
                              <p className="text-xs text-muted-foreground">{duration > 0 ? `${TEXT.duration} ${formatHours(duration)}` : TEXT.invalidDuration}</p>
                            </div>
                          )
                        })}
                      </div>

                      <div className="space-y-1.5"><Label>{TEXT.summary}</Label><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder={TEXT.summaryPlaceholder} className="min-h-[120px]" /></div>

                      <div className="flex items-center gap-2">
                        <Button onClick={handleSave} disabled={isSaving} className="gap-1.5"><Save className="h-4 w-4" />{isSaving ? TEXT.saving : TEXT.save}</Button>
                        {selectedRecord ? <Button variant="outline" onClick={handleDelete} className="gap-1.5 text-destructive"><Trash2 className="h-4 w-4" />{TEXT.delete}</Button> : null}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg"><WrapText className="h-5 w-5" />{TEXT.parseTitle}</CardTitle>
                      <CardDescription>{TEXT.parseDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea value={rawText} onChange={(e) => setRawText(e.target.value)} className="min-h-[180px]" placeholder={RAW_TEXT_PLACEHOLDER} />
                      <div className="flex items-center gap-2"><Button variant="outline" onClick={handleParseText} disabled={isParsing || !rawText.trim()} className="gap-1.5"><Sparkles className="h-4 w-4" />{isParsing ? TEXT.parsing : TEXT.parse}</Button></div>
                      {parsePreview ? (
                        <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-medium">{TEXT.parseResult}</p>
                              <p className="text-sm text-muted-foreground">{`\u65e5\u671f ${parsePreview.date}\uff0c${TEXT.activities}${TEXT.total.toLowerCase?.() ?? ''}${formatHours(parsePreview.totalMinutes)}`}</p>
                            </div>
                            <Button size="sm" onClick={applyParsePreview}>{TEXT.apply}</Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div>{`${TEXT.weight}\uff1a${parsePreview.weight ?? '--'}`}</div>
                            <div>{`${TEXT.waist}\uff1a${parsePreview.waist ?? '--'}`}</div>
                            <div>{`${TEXT.chest}\uff1a${parsePreview.chest ?? '--'}`}</div>
                            <div>{`${TEXT.hips}\uff1a${parsePreview.hips ?? '--'}`}</div>
                          </div>
                          <div className="space-y-2">
                            {parsePreview.activities.length > 0 ? parsePreview.activities.map((activity, index) => <div key={`${activity.startTime}-${activity.endTime}-${index}`} className="rounded border bg-background px-3 py-2 text-sm"><span className="font-medium">{activity.startTime} - {activity.endTime}</span><span className="text-muted-foreground"> {activity.content}</span></div>) : <p className="text-sm text-muted-foreground">{TEXT.noActivities}</p>}
                          </div>
                          {parsePreview.warnings.length > 0 ? <div className="space-y-1 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{parsePreview.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div> : null}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">{TEXT.selectDay}</CardTitle>
                    <CardDescription>{TEXT.selectDayDesc}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>{TEXT.guide1}</p>
                    <p>{TEXT.guide2}</p>
                    <p>{TEXT.guide3}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="weekly" className="mt-0">
            <div className="grid grid-cols-[0.9fr_1.1fr] gap-6 items-start">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl"><Calendar className="h-5 w-5" />{TEXT.weekOverview}</CardTitle>
                  <CardDescription>{TEXT.weekOverviewDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-muted/20 p-4"><p className="text-sm text-muted-foreground">{TEXT.weeklyTotal}</p><p className="mt-1 text-2xl font-bold">{formatHours(weekStats.totalMinutes)}</p></div>
                    <div className="rounded-lg border bg-muted/20 p-4"><p className="text-sm text-muted-foreground">{TEXT.weightChange}</p><p className="mt-1 text-2xl font-bold">{weekStats.weightChange === null ? '--' : `${weekStats.weightChange > 0 ? '+' : ''}${weekStats.weightChange} kg`}</p></div>
                  </div>
                  <div className="space-y-2">
                    {eachDayOfInterval({ start: startOfWeek(parseISO(weekBaseDate), { weekStartsOn: 1 }), end: endOfWeek(parseISO(weekBaseDate), { weekStartsOn: 1 }) }).map((day) => {
                      const key = formatDateKey(day)
                      const match = weekStats.records.find((record) => record.date === key)
                      return (
                        <button key={key} onClick={() => { selectDate(day); setActiveTab('calendar') }} className="w-full rounded-lg border px-4 py-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground">
                          <div className="flex items-center justify-between">
                            <div><p className="font-medium">{format(day, 'EEEE', { locale: zhCN })}</p><p className="text-sm text-muted-foreground">{format(day, 'MM\u6708dd\u65e5')}</p></div>
                            <div className="text-right text-sm text-muted-foreground"><p>{match ? formatHours(match.studyMinutes) : '--'}</p><p>{match ? formatTrainingPlan(match.trainingPlan) : '--'}</p></div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl"><FileText className="h-5 w-5" />{TEXT.weekSummary}</CardTitle>
                  <CardDescription>{TEXT.weekSummaryDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                    <p>{`${TEXT.recordedDays} ${weekStats.records.length} ${TEXT.days}`}</p>
                    <p>{`${TEXT.totalActivity} ${formatHours(weekStats.totalMinutes)}`}</p>
                    <p>{TEXT.weekSummaryHint}</p>
                  </div>
                  <Textarea value={weekSummary} onChange={(e) => setWeekSummary(e.target.value)} className="min-h-[240px]" placeholder={TEXT.weekSummaryPlaceholder} />
                  <div className="flex items-center gap-2"><Button onClick={handleSaveWeekSummary} className="gap-1.5"><Save className="h-4 w-4" />{TEXT.saveWeekSummary}</Button><Button variant="outline" onClick={() => setWeekSummary(weekData?.weeklySummary?.summary || '')}>{TEXT.restoreWeekSummary}</Button></div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
