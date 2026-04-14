import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface DailyActivityInput {
    id?: string
    startTime: string
    endTime: string
    content: string
    durationMinutes?: number
  }

  interface DailyRecordData {
    id: string
    date: string
    weight: number | null
    waist: number | null
    chest: number | null
    hips: number | null
    totalMinutes: number
    studyMinutes: number
    trainingPlan: string | null
    breakfast: string | null
    lunch: string | null
    dinner: string | null
    snacks: string | null
    rawText: string | null
    summary: string | null
    activities: DailyActivityInput[]
    createdAt: string
    updatedAt: string
  }

  interface DailyParseResult {
    date: string
    weight: number | null
    waist: number | null
    chest: number | null
    hips: number | null
    totalMinutes: number
    activities: DailyActivityInput[]
    warnings: string[]
  }

  interface WeeklySummaryData {
    weekStartDate: string
    summary: string
  }

  interface WeeklyDailyBundle {
    records: DailyRecordData[]
    weeklySummary: WeeklySummaryData | null
  }

  interface CustomAPI {
    institution: {
      getAll: () => Promise<any[]>
      getById: (id: string) => Promise<any>
      create: (data: any) => Promise<any>
      update: (id: string, data: any) => Promise<any>
      delete: (id: string) => Promise<boolean>
    }
    advisor: {
      getByInstitution: (institutionId: string) => Promise<any[]>
      create: (data: any) => Promise<any>
      update: (id: string, data: any) => Promise<any>
      delete: (id: string) => Promise<boolean>
      getConflictWarnings: (institutionId: string) => Promise<string[]>
    }
    task: {
      getByInstitution: (institutionId: string) => Promise<any[]>
      getOrphan: () => Promise<any[]>
      create: (data: any) => Promise<any>
      update: (id: string, data: any) => Promise<any>
      delete: (id: string) => Promise<boolean>
    }
    asset: {
      create: (data: any) => Promise<any>
      delete: (id: string) => Promise<boolean>
    }
    interview: {
      create: (data: any) => Promise<any>
      update: (id: string, data: any) => Promise<any>
      delete: (id: string) => Promise<boolean>
    }
    file: {
      selectFile: (options?: any) => Promise<string | null>
      openExternal: (path: string) => Promise<boolean>
      compileLatex: (texPath: string) => Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }>
    }
    emailTemplate: {
      getAll: () => Promise<any>
      create: (data: any) => Promise<any>
      update: (id: string, data: any) => Promise<any>
      delete: (id: string) => Promise<any>
    }
    emailVariable: {
      getByTemplate: (templateId: string) => Promise<any>
      create: (data: any) => Promise<any>
      delete: (id: string) => Promise<any>
    }
    daily: {
      getMonth: (month: string) => Promise<DailyRecordData[]>
      getByDate: (date: string) => Promise<DailyRecordData | null>
      upsert: (data: {
        date: string
        weight?: number | null
        waist?: number | null
        chest?: number | null
        hips?: number | null
        studyMinutes?: number
        trainingPlan?: string | null
        breakfast?: string | null
        lunch?: string | null
        dinner?: string | null
        snacks?: string | null
        rawText?: string | null
        summary?: string | null
        activities: DailyActivityInput[]
      }) => Promise<DailyRecordData>
      deleteByDate: (date: string) => Promise<boolean>
      parseText: (text: string, date?: string) => Promise<DailyParseResult>
      getWeek: (date: string) => Promise<WeeklyDailyBundle>
      saveWeekSummary: (date: string, summary: string) => Promise<WeeklySummaryData>
    }
  }

  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}

export {}
