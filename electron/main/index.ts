import { app, shell, BrowserWindow, ipcMain, dialog, Menu, MenuItemConstructorOptions } from 'electron'
import { join } from 'path'
import { existsSync, copyFileSync, unlinkSync } from 'fs'
import log from 'electron-log'
import { exec } from 'child_process'
import { promisify } from 'util'
import Database from 'better-sqlite3'

const execAsync = promisify(exec)
const isDev = !app.isPackaged
const platform = process.platform || 'win32'

let prisma: any = null
let mainWindow: BrowserWindow | null = null

const BUILTIN_EMAIL_TEMPLATES = [
  {
    key: 'self-intro',
    name: '自荐信',
    subject: '保研自荐 - {{YOUR_NAME}}',
    content: `尊敬的{{ADVISOR_NAME}}老师：

您好！我是{{YOUR_NAME}}，来自{{YOUR_UNIVERSITY}}{{YOUR_MAJOR}}专业，目前 GPA {{YOUR_GPA}}，专业排名 {{YOUR_RANK}}。

我对您的研究方向{{RESEARCH_INTEREST}}非常感兴趣。在本科阶段，我参与了{{YOUR_PROJECTS}}，积累了一定的研究经验。

附件是我的个人简历和成绩单，恳请老师能给我一个机会，期待能够加入您的课题组继续深造。

此致
敬礼

{{YOUR_NAME}}
{{YOUR_CONTACT}}`,
    variables: ['ADVISOR_NAME', 'YOUR_NAME', 'YOUR_UNIVERSITY', 'YOUR_MAJOR', 'YOUR_GPA', 'YOUR_RANK', 'YOUR_PROJECTS', 'YOUR_CONTACT']
  },
  {
    key: 'inquiry',
    name: '询问名额',
    subject: '关于{{ADVISOR_NAME}}老师课题组的咨询',
    content: `尊敬的{{ADVISOR_NAME}}老师：

您好！我是{{YOUR_NAME}}，来自{{YOUR_UNIVERSITY}}{{YOUR_MAJOR}}专业。

我在官网上了解到您的研究方向是{{RESEARCH_INTEREST}}，对此非常感兴趣。我目前已经获得了{{ACHIEVEMENTS}}，希望能够有机会加入您的课题组。

请问老师今年还有博士/硕士研究生招生名额吗？

期待您的回复！

{{YOUR_NAME}}
{{YOUR_CONTACT}}`,
    variables: ['ADVISOR_NAME', 'YOUR_NAME', 'YOUR_UNIVERSITY', 'YOUR_MAJOR', 'RESEARCH_INTEREST', 'ACHIEVEMENTS', 'YOUR_CONTACT']
  },
  {
    key: 'thank-you',
    name: '感谢信',
    subject: '感谢您今天的面试 - {{YOUR_NAME}}',
    content: `尊敬的{{ADVISOR_NAME}}老师：

您好！感谢您在百忙之中抽出时间与我进行面试。通过今天的交流，我更加深入地了解了您课题组的研究方向{{RESEARCH_INTEREST}}，对能够加入您的团队更加向往。

我会继续努力提升自己，期待能够收到您的好消息！

此致
敬礼

{{YOUR_NAME}}`,
    variables: ['ADVISOR_NAME', 'YOUR_NAME', 'RESEARCH_INTEREST']
  }
] as const

function getDatabasePath(): string {
  if (isDev) {
    return join(__dirname, '../../prisma/dev.db')
  }
  return join(app.getPath('userData'), 'dev.db')
}

function getPrismaClientPath(): string {
  if (isDev) {
    return join(__dirname, '../../node_modules/.prisma/client')
  }
  return join(process.resourcesPath, '.prisma', 'client')
}

function createApplicationMenu(): void {
  const template: MenuItemConstructorOptions[] = [
    {
      label: '\u6587\u4ef6',
      submenu: [
        { label: '\u5173\u95ed\u7a97\u53e3', role: 'close' },
        { type: 'separator' },
        { label: '\u9000\u51fa', role: 'quit' }
      ]
    },
    {
      label: '\u7f16\u8f91',
      submenu: [
        { label: '\u64a4\u9500', role: 'undo' },
        { label: '\u91cd\u505a', role: 'redo' },
        { type: 'separator' },
        { label: '\u526a\u5207', role: 'cut' },
        { label: '\u590d\u5236', role: 'copy' },
        { label: '\u7c98\u8d34', role: 'paste' },
        { label: '\u5168\u9009', role: 'selectAll' }
      ]
    },
    {
      label: '\u89c6\u56fe',
      submenu: [
        { label: '\u91cd\u65b0\u52a0\u8f7d', role: 'reload' },
        { label: '\u5f3a\u5236\u91cd\u65b0\u52a0\u8f7d', role: 'forceReload' },
        { label: '\u5207\u6362\u5f00\u53d1\u8005\u5de5\u5177', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '\u5b9e\u9645\u5927\u5c0f', role: 'resetZoom' },
        { label: '\u653e\u5927', role: 'zoomIn' },
        { label: '\u7f29\u5c0f', role: 'zoomOut' },
        { type: 'separator' },
        { label: '\u5207\u6362\u5168\u5c4f', role: 'togglefullscreen' }
      ]
    },
    {
      label: '\u7a97\u53e3',
      submenu: [
        { label: '\u6700\u5c0f\u5316', role: 'minimize' },
        { label: '\u7f29\u653e', role: 'zoom' }
      ]
    },
    {
      label: '\u5e2e\u52a9',
      submenu: [
        {
          label: '\u6253\u5f00\u9879\u76ee\u4e3b\u9875',
          click: async () => {
            await shell.openExternal('https://github.com')
          }
        }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

async function initializeDatabase(): Promise<string> {
  const dbPath = getDatabasePath()

  if (isDev) {
    ensureDailyRecordColumns(dbPath)
    log.info('[Dev] Using local database at:', dbPath)
    return dbPath
  }

  const userDbPath = dbPath
  const resourceDbPath = join(process.resourcesPath, 'prisma', 'dev.db')

  if (!existsSync(userDbPath)) {
    if (existsSync(resourceDbPath)) {
      copyFileSync(resourceDbPath, userDbPath)
      log.info('[Prod] Copied seed database from resources')
    }
    return userDbPath
  }

  try {
    ensureDailyRecordColumns(userDbPath)
    const { PrismaClient: PC } = require(getPrismaClientPath())
    const tmpPrisma = new PC({ datasources: { db: { url: `file:${userDbPath}` } } })
    await tmpPrisma.weeklySummary.findFirst({ select: { id: true } })
    await tmpPrisma.dailyRecord.findFirst({ select: { id: true, breakfast: true, lunch: true, dinner: true, snacks: true } })
    await tmpPrisma.$disconnect()
    log.info('[Prod] User database schema is up to date')
    return userDbPath
  } catch (err: any) {
    log.warn('[Prod] User database schema is outdated. Replacing with fresh database.', err?.message)
    try { unlinkSync(userDbPath) } catch {}
    try { unlinkSync(userDbPath + '-shm') } catch {}
    try { unlinkSync(userDbPath + '-wal') } catch {}
    if (existsSync(resourceDbPath)) {
      copyFileSync(resourceDbPath, userDbPath)
      log.info('[Prod] Database replaced successfully')
    }
    return userDbPath
  }
}

function ensureDailyRecordColumns(dbPath: string): void {
  const requiredColumns = ['breakfast', 'lunch', 'dinner', 'snacks'] as const
  const sqlite = new Database(dbPath)

  try {
    const rows = sqlite.prepare("PRAGMA table_info('DailyRecord')").all() as Array<{ name: string }>
    const existingColumns = new Set(rows.map((row) => row.name))

    for (const column of requiredColumns) {
      if (existingColumns.has(column)) continue
      sqlite.exec(`ALTER TABLE "DailyRecord" ADD COLUMN "${column}" TEXT`)
      log.info(`[Prod] Added missing DailyRecord column: ${column}`)
    }
  } finally {
    sqlite.close()
  }
}

async function getPrisma(): Promise<any> {
  if (prisma) return prisma

  const prismaPath = getPrismaClientPath()
  const dbPath = getDatabasePath()
  const dbUrl = `file:${dbPath}`

  if (!isDev) {
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = join(prismaPath, 'query_engine-windows.dll.node')
  }

  try {
    const { PrismaClient } = require(prismaPath)
    prisma = new PrismaClient({
      datasources: { db: { url: dbUrl } }
    })
  } catch (err) {
    log.error('Failed to load Prisma Client:', err)
    throw err
  }

  return prisma
}

async function dedupeEmailTemplates(client: any): Promise<void> {
  const templates = await client.emailTemplate.findMany({
    include: { variables: true },
    orderBy: { createdAt: 'asc' }
  })

  const builtinByName = new Map(BUILTIN_EMAIL_TEMPLATES.map((template) => [template.name, template]))
  const builtinByVariableSignature = new Map(
    BUILTIN_EMAIL_TEMPLATES.map((template) => [[...template.variables].sort().join('|'), template] as const)
  )
  const canonicalTemplates = new Map<string, any>()

  for (const template of templates) {
    const variableSignature = [...template.variables.map((variable: any) => variable.name)].sort().join('|')
    const builtinTemplate = builtinByName.get(template.name) ?? builtinByVariableSignature.get(variableSignature)
    const canonicalKey = builtinTemplate?.key ?? JSON.stringify([template.name, template.subject, template.content])
    const existing = canonicalTemplates.get(canonicalKey)

    if (!existing) {
      canonicalTemplates.set(canonicalKey, template)

      if (builtinTemplate) {
        await client.emailTemplate.update({
          where: { id: template.id },
          data: {
            name: builtinTemplate.name,
            subject: builtinTemplate.subject,
            content: builtinTemplate.content
          }
        })
      }
      continue
    }

    const existingVariables = new Set(existing.variables.map((variable: any) => variable.name))
    const missingVariables = template.variables.filter((variable: any) => !existingVariables.has(variable.name))
    const updateData = builtinTemplate
      ? {
          name: builtinTemplate.name,
          subject: builtinTemplate.subject,
          content: builtinTemplate.content
        }
      : undefined

    await client.$transaction(async (tx: any) => {
      if (updateData) {
        await tx.emailTemplate.update({
          where: { id: existing.id },
          data: updateData
        })
      }

      for (const variable of missingVariables) {
        await tx.emailVariable.create({
          data: {
            name: variable.name,
            templateId: existing.id
          }
        })
      }

      await tx.emailTemplate.delete({
        where: { id: template.id }
      })
    })

    existing.variables.push(...missingVariables)
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    title: 'Student Helper',
    autoHideMenuBar: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  const renderUrl = process.env.ELECTRON_RENDERER_URL
  if (isDev && renderUrl) {
    mainWindow.loadURL(renderUrl)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function startOfDay(input?: string | Date): Date {
  const date = input ? new Date(input) : new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function getMonthRange(input: string): { start: string; end: string } {
  const date = startOfDay(input)
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return { start: formatDateKey(start), end: formatDateKey(end) }
}

function getWeekRange(input: string): { start: string; end: string } {
  const base = startOfDay(input)
  const day = base.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const start = new Date(base)
  start.setDate(base.getDate() + diff)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start: formatDateKey(start), end: formatDateKey(end) }
}

function formatDateKey(input: string | Date): string {
  const date = startOfDay(input)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function escapeRegExp(value: string): string {
  return value.replace(/[-/\^$*+?.()|[\]{}]/g, '\\$&')
}

function normalizeMetricUnit(unit: string): string {
  return unit.toLowerCase().replace(/(?:\u516c)?\u65a4/g, 'kg').replace(/\u5398\u7c73/g, 'cm')
}

function parseMetric(text: string, aliases: string[]): number | null {
  for (const alias of aliases) {
    const escapedAlias = escapeRegExp(alias)
    const pattern = new RegExp(`${escapedAlias}\\s*[:\\uFF1A]?\\s*(\\d+(?:\\.\\d+)?)\\s*(kg|\\u65a4|cm|\\u5398\\u7c73)?`, 'i')
    const match = text.match(pattern)
    if (!match) continue

    const value = Number(match[1])
    const unit = normalizeMetricUnit(match[2] || '')
    if (Number.isNaN(value)) return null
    if (aliases.includes('\u4f53\u91cd') && unit === '\u65a4') return Number((value * 0.5).toFixed(2))
    return value
  }
  return null
}

function normalizeTimeToken(value: string): string {
  const normalized = value.trim().replace(/[\uFF1A.]/g, ':')
  const [hours, minutes = '00'] = normalized.split(':')
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = normalizeTimeToken(value).split(':').map(Number)
  return hours * 60 + minutes
}

function calculateDuration(startTime: string, endTime: string): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime)
}

function parseDailyText(text: string, fallbackDate?: string) {
  const normalizedText = text.replace(/\r/g, '')
  const warnings: string[] = []
  const lines = normalizedText.split('\n').map((line) => line.trim()).filter(Boolean)

  let parsedDate = fallbackDate || formatDateKey(new Date())
  const explicitDate = normalizedText.match(/(\d{4}[./-]\d{1,2}[./-]\d{1,2})/)
  const shortDate = normalizedText.match(/(^|\s)(\d{1,2}[./-]\d{1,2})(?=\s|$)/)
  if (explicitDate) parsedDate = formatDateKey(explicitDate[1].replace(/[.]/g, '-').replace(/\//g, '-'))
  else if (shortDate) parsedDate = formatDateKey(`${new Date().getFullYear()}-${shortDate[2].replace(/[.]/g, '-').replace(/\//g, '-')}`)

  const activities: Array<{ startTime: string; endTime: string; content: string; durationMinutes: number }> = []
  const activityPattern = /(?:^|[\u2022*-]\s*)?(\d{1,2}(?::|\uFF1A|\.)\d{2})\s*[-~\u2014\uFF0D\u5230\u81F3]\s*(\d{1,2}(?::|\uFF1A|\.)\d{2})\s*(.+)$/g

  for (const line of lines) {
    let matchedActivity = false
    for (const match of line.matchAll(activityPattern)) {
      matchedActivity = true
      const startTime = normalizeTimeToken(match[1])
      const endTime = normalizeTimeToken(match[2])
      const content = match[3].trim().replace(/^[\uFF1A:\-\s]+/, '')
      const durationMinutes = calculateDuration(startTime, endTime)
      if (!content) {
        warnings.push(`Activity content is empty: ${line}`)
        continue
      }
      if (durationMinutes <= 0) {
        warnings.push(`${startTime}-${endTime} is not a valid range`)
        continue
      }
      activities.push({ startTime, endTime, content, durationMinutes })
    }
    if (!matchedActivity && /(\d{1,2}(?::|\uFF1A|\.)\d{2})\s*[-~\u2014\uFF0D\u5230\u81F3]\s*(\d{1,2}(?::|\uFF1A|\.)\d{2})/.test(line)) {
      warnings.push(`Could not fully parse activity: ${line}`)
    }
  }

  activities.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
  for (let i = 1; i < activities.length; i += 1) {
    if (timeToMinutes(activities[i].startTime) < timeToMinutes(activities[i - 1].endTime)) warnings.push(`Activities overlap: ${activities[i - 1].content} / ${activities[i].content}`)
  }

  return {
    date: parsedDate,
    weight: parseMetric(normalizedText, ['\u4f53\u91cd', 'weight']),
    waist: parseMetric(normalizedText, ['\u8170\u56f4', 'waist']),
    chest: parseMetric(normalizedText, ['\u80f8\u56f4', 'bust']),
    hips: parseMetric(normalizedText, ['\u81c0\u56f4', '\u81c0', 'hips']),
    activities,
    totalMinutes: activities.reduce((sum, activity) => sum + activity.durationMinutes, 0),
    warnings
  }
}

function sanitizeActivities(activities: any[]): Array<{ startTime: string; endTime: string; content: string; durationMinutes: number }> {
  const sanitized = (activities || []).map((activity) => {
    const rawStart = String(activity.startTime || '').trim()
    const rawEnd = String(activity.endTime || '').trim()
    const content = String(activity.content || '').trim()
    if (!rawStart || !rawEnd || !content) return null
    const startTime = normalizeTimeToken(rawStart)
    const endTime = normalizeTimeToken(rawEnd)
    const durationMinutes = calculateDuration(startTime, endTime)
    if (durationMinutes <= 0) return null
    return { startTime, endTime, content, durationMinutes }
  }).filter(Boolean) as Array<{ startTime: string; endTime: string; content: string; durationMinutes: number }>

  sanitized.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
  return sanitized
}

log.transports.file.level = 'info'
log.info('Application starting...', { isDev, platform })

ipcMain.handle('institution:getAll', async () => {
  const client = await getPrisma()
  return client.institution.findMany({
    include: { advisors: true, tasks: true },
    orderBy: { createdAt: 'desc' }
  })
})

ipcMain.handle('institution:getById', async (_, id: string) => {
  const client = await getPrisma()
  return client.institution.findUnique({
    where: { id },
    include: {
      advisors: { include: { assets: true, interviews: true } },
      tasks: true
    }
  })
})

ipcMain.handle('institution:create', async (_, data: any) => {
  const client = await getPrisma()
  return client.institution.create({
    data: {
      name: data.name,
      department: data.department,
      tier: data.tier,
      degreeType: data.degreeType,
      campDeadline: data.campDeadline ? new Date(data.campDeadline) : null,
      pushDeadline: data.pushDeadline ? new Date(data.pushDeadline) : null,
      expectedQuota: data.expectedQuota,
      policyTags: JSON.stringify(data.policyTags || [])
    },
    include: { advisors: true, tasks: true }
  })
})

ipcMain.handle('institution:update', async (_, id: string, data: any) => {
  const client = await getPrisma()
  return client.institution.update({
    where: { id },
    data: {
      name: data.name,
      department: data.department,
      tier: data.tier,
      degreeType: data.degreeType,
      campDeadline: data.campDeadline ? new Date(data.campDeadline) : null,
      pushDeadline: data.pushDeadline ? new Date(data.pushDeadline) : null,
      expectedQuota: data.expectedQuota,
      policyTags: JSON.stringify(data.policyTags || [])
    },
    include: { advisors: true, tasks: true }
  })
})

ipcMain.handle('institution:delete', async (_, id: string) => {
  const client = await getPrisma()
  await client.institution.delete({ where: { id } })
  return true
})

ipcMain.handle('advisor:getByInstitution', async (_, institutionId: string) => {
  const client = await getPrisma()
  return client.advisor.findMany({
    where: { institutionId },
    include: { assets: true, interviews: true }
  })
})

ipcMain.handle('advisor:create', async (_, data: any) => {
  const client = await getPrisma()
  return client.advisor.create({
    data: {
      institutionId: data.institutionId,
      name: data.name,
      title: data.title,
      researchArea: data.researchArea,
      email: data.email,
      homepage: data.homepage,
      contactStatus: data.contactStatus || 'PENDING',
      reputationScore: data.reputationScore,
      notes: data.notes
    },
    include: { assets: true, interviews: true }
  })
})

ipcMain.handle('advisor:update', async (_, id: string, data: any) => {
  const client = await getPrisma()
  return client.advisor.update({
    where: { id },
    data: {
      name: data.name,
      title: data.title,
      researchArea: data.researchArea,
      email: data.email,
      homepage: data.homepage,
      contactStatus: data.contactStatus,
      lastContactDate: data.lastContactDate ? new Date(data.lastContactDate) : null,
      reputationScore: data.reputationScore,
      notes: data.notes
    },
    include: { assets: true, interviews: true }
  })
})

ipcMain.handle('advisor:delete', async (_, id: string) => {
  const client = await getPrisma()
  await client.advisor.delete({ where: { id } })
  return true
})

ipcMain.handle('task:getByInstitution', async (_, institutionId: string) => {
  const client = await getPrisma()
  return client.task.findMany({
    where: { institutionId },
    orderBy: { dueDate: 'asc' }
  })
})

ipcMain.handle('task:getOrphan', async () => {
  const client = await getPrisma()
  return client.task.findMany({
    where: { institutionId: null },
    orderBy: { dueDate: 'asc' }
  })
})

ipcMain.handle('task:create', async (_, data: any) => {
  const client = await getPrisma()
  return client.task.create({
    data: {
      institutionId: data.institutionId || null,
      title: data.title,
      dueDate: new Date(data.dueDate),
      isCompleted: false
    }
  })
})

ipcMain.handle('task:update', async (_, id: string, data: any) => {
  try {
    const client = await getPrisma()
    const updateData: Record<string, any> = {}

    if (data.title !== undefined) {
      updateData.title = data.title
    }
    if (data.dueDate !== undefined) {
      if (data.dueDate === null || data.dueDate === '') {
        updateData.dueDate = null
      } else {
        const parsedDate = new Date(data.dueDate)
        if (Number.isNaN(parsedDate.getTime())) {
          return { success: false, data: null, error: 'Invalid dueDate' }
        }
        updateData.dueDate = parsedDate
      }
    }
    if (data.isCompleted !== undefined) {
      updateData.isCompleted = data.isCompleted
    }

    const result = await client.task.update({ where: { id }, data: updateData })
    return { success: true, data: result, error: null }
  } catch (error: any) {
    log.error('Error updating task:', error)
    return { success: false, data: null, error: error.message }
  }
})

ipcMain.handle('task:delete', async (_, id: string) => {
  const client = await getPrisma()
  await client.task.delete({ where: { id } })
  return true
})

ipcMain.handle('asset:create', async (_, data: any) => {
  const client = await getPrisma()
  return client.asset.create({
    data: {
      advisorId: data.advisorId,
      type: data.type,
      localPath: data.localPath
    }
  })
})

ipcMain.handle('asset:delete', async (_, id: string) => {
  const client = await getPrisma()
  await client.asset.delete({ where: { id } })
  return true
})

ipcMain.handle('interview:create', async (_, data: any) => {
  const client = await getPrisma()
  return client.interview.create({
    data: {
      advisorId: data.advisorId,
      date: new Date(data.date),
      format: data.format,
      markdownNotes: data.markdownNotes || ''
    }
  })
})

ipcMain.handle('interview:update', async (_, id: string, data: any) => {
  const client = await getPrisma()
  return client.interview.update({
    where: { id },
    data: {
      date: new Date(data.date),
      format: data.format,
      markdownNotes: data.markdownNotes
    }
  })
})

ipcMain.handle('interview:delete', async (_, id: string) => {
  const client = await getPrisma()
  await client.interview.delete({ where: { id } })
  return true
})

ipcMain.handle('daily:getMonth', async (_, month: string) => {
  const client = await getPrisma()
  const { start, end } = getMonthRange(month)
  return client.dailyRecord.findMany({
    where: { date: { gte: start, lte: end } },
    include: { activities: { orderBy: { startTime: 'asc' } } },
    orderBy: { date: 'asc' }
  })
})

ipcMain.handle('daily:getByDate', async (_, date: string) => {
  const client = await getPrisma()
  return client.dailyRecord.findUnique({
    where: { date: formatDateKey(date) },
    include: { activities: { orderBy: { startTime: 'asc' } } }
  })
})

ipcMain.handle('daily:upsert', async (_, data: any) => {
  const client = await getPrisma()
  const date = formatDateKey(data.date)
  const activities = sanitizeActivities(data.activities)
  const totalMinutes = activities.reduce((sum, activity) => sum + activity.durationMinutes, 0)
  const studyMinutes = Number.isFinite(Number(data.studyMinutes)) ? Math.max(0, Math.round(Number(data.studyMinutes))) : 0

  return client.dailyRecord.upsert({
    where: { date },
    create: {
      date,
      weight: data.weight ?? null,
      waist: data.waist ?? null,
      chest: data.chest ?? null,
      hips: data.hips ?? null,
      totalMinutes,
      studyMinutes,
      trainingPlan: data.trainingPlan ?? null,
      breakfast: data.breakfast ?? null,
      lunch: data.lunch ?? null,
      dinner: data.dinner ?? null,
      snacks: data.snacks ?? null,
      rawText: data.rawText ?? null,
      summary: data.summary ?? null,
      activities: { create: activities }
    },
    update: {
      weight: data.weight ?? null,
      waist: data.waist ?? null,
      chest: data.chest ?? null,
      hips: data.hips ?? null,
      totalMinutes,
      studyMinutes,
      trainingPlan: data.trainingPlan ?? null,
      breakfast: data.breakfast ?? null,
      lunch: data.lunch ?? null,
      dinner: data.dinner ?? null,
      snacks: data.snacks ?? null,
      rawText: data.rawText ?? null,
      summary: data.summary ?? null,
      activities: {
        deleteMany: {},
        create: activities
      }
    },
    include: { activities: { orderBy: { startTime: 'asc' } } }
  })
})

ipcMain.handle('daily:deleteByDate', async (_, date: string) => {
  const client = await getPrisma()
  await client.dailyRecord.deleteMany({ where: { date: formatDateKey(date) } })
  return true
})

ipcMain.handle('daily:parseText', async (_, text: string, date?: string) => parseDailyText(text, date))

ipcMain.handle('daily:getWeek', async (_, date: string) => {
  const client = await getPrisma()
  const { start, end } = getWeekRange(date)
  const records = await client.dailyRecord.findMany({
    where: { date: { gte: start, lte: end } },
    include: { activities: { orderBy: { startTime: 'asc' } } },
    orderBy: { date: 'asc' }
  })
  const weeklySummary = await client.weeklySummary.findUnique({ where: { weekStartDate: start } })
  return { records, weeklySummary }
})

ipcMain.handle('daily:saveWeekSummary', async (_, date: string, summary: string) => {
  const client = await getPrisma()
  const { start } = getWeekRange(date)
  return client.weeklySummary.upsert({
    where: { weekStartDate: start },
    create: { weekStartDate: start, summary: summary || '' },
    update: { summary: summary || '' }
  })
})

ipcMain.handle('file:selectFile', async (_, options: any) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: options?.filters || [
      { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'tex'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('file:openExternal', async (_, path: string) => {
  await shell.openPath(path)
  return true
})

ipcMain.handle('file:compileLatex', async (_, texPath: string) => {
  try {
    const dir = texPath.substring(0, texPath.lastIndexOf('/') || texPath.lastIndexOf('\\'))
    const command = platform === 'win32'
      ? `cd /d "${dir}" && xelatex -interaction=nonstopmode "${texPath}"`
      : `cd "${dir}" && xelatex -interaction=nonstopmode "${texPath}"`
    const { stdout, stderr } = await execAsync(command)
    return { success: true, stdout, stderr }
  } catch (error: any) {
    log.error('Error compiling LaTeX:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('emailTemplate:getAll', async () => {
  try {
    const client = await getPrisma()
    await dedupeEmailTemplates(client)
    const templates = await client.emailTemplate.findMany({
      include: { variables: true },
      orderBy: { createdAt: 'asc' }
    })
    return { success: true, data: templates }
  } catch (error: any) {
    log.error('Error fetching email templates:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('emailTemplate:create', async (_, data: any) => {
  try {
    const client = await getPrisma()
    const template = await client.emailTemplate.create({
      data: {
        name: data.name,
        subject: data.subject,
        content: data.content
      }
    })
    return { success: true, data: template }
  } catch (error: any) {
    log.error('Error creating email template:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('emailTemplate:update', async (_, id: string, data: any) => {
  try {
    const client = await getPrisma()
    const template = await client.emailTemplate.update({
      where: { id },
      data: {
        name: data.name,
        subject: data.subject,
        content: data.content
      },
      include: { variables: true }
    })
    return { success: true, data: template }
  } catch (error: any) {
    log.error('Error updating email template:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('emailTemplate:delete', async (_, id: string) => {
  try {
    const client = await getPrisma()
    await client.emailTemplate.delete({ where: { id } })
    return { success: true }
  } catch (error: any) {
    log.error('Error deleting email template:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('emailVariable:getByTemplate', async (_, templateId: string) => {
  try {
    const client = await getPrisma()
    const variables = await client.emailVariable.findMany({
      where: { templateId }
    })
    return { success: true, data: variables }
  } catch (error: any) {
    log.error('Error fetching email variables:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('emailVariable:create', async (_, data: any) => {
  try {
    const client = await getPrisma()
    const variable = await client.emailVariable.create({
      data: {
        name: data.name,
        templateId: data.templateId
      }
    })
    return { success: true, data: variable }
  } catch (error: any) {
    log.error('Error creating email variable:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('emailVariable:delete', async (_, id: string) => {
  try {
    const client = await getPrisma()
    await client.emailVariable.delete({ where: { id } })
    return { success: true }
  } catch (error: any) {
    log.error('Error deleting email variable:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('advisor:getConflictWarnings', async (_, institutionId: string) => {
  const client = await getPrisma()
  const institution = await client.institution.findUnique({
    where: { id: institutionId },
    include: { advisors: true }
  })
  if (!institution) return []

  const warnings: string[] = []
  const sentAdvisors = institution.advisors.filter((advisor: any) => advisor.contactStatus === 'SENT')
  if (sentAdvisors.length > 1) {
    warnings.push(`\u540c\u4e00\u9662\u7cfb ${institution.name} \u6709 ${sentAdvisors.length} \u4f4d\u5bfc\u5e08\u5904\u4e8e\u5df2\u53d1\u9001\u4f46\u672a\u56de\u590d\u72b6\u6001`)
  }
  return warnings
})

app.whenReady().then(async () => {
  if (platform === 'win32') {
    app.setAppUserModelId('com.student-helper.app')
  }

  try {
    const dbPath = await initializeDatabase()
    process.env.DATABASE_URL = `file:${dbPath}`
    const client = await getPrisma()
    await client.$connect()
    log.info('Database connected successfully')
  } catch (error) {
    log.error('Database initialization failed:', error)
  }

  createApplicationMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', async () => {
  if (prisma) {
    await prisma.$disconnect()
  }
  if (platform !== 'darwin') {
    app.quit()
  }
})
