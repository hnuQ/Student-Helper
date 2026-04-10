import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy, Edit2, Eye, Mail, Plus, Save, Trash2, X } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { useStore } from '../../stores/appStore'

const TEXT = {
  title: '\u90ae\u4ef6\u6a21\u677f\u5e93',
  subtitle: '\u6240\u586b\u5373\u6240\u89c1\uff0c\u6240\u89c1\u5373\u53ef\u590d\u5236',
  copyFinal: '\u4e00\u952e\u590d\u5236\u6700\u7ec8\u90ae\u4ef6',
  copied: '\u5df2\u590d\u5236\u5230\u526a\u8d34\u677f',
  templates: '\u6a21\u677f',
  newTemplate: '\u65b0\u5efa\u6a21\u677f',
  templateName: '\u6a21\u677f\u540d\u79f0',
  create: '\u521b\u5efa',
  creating: '\u521b\u5efa\u4e2d...',
  selectTemplate: '\u4ece\u5de6\u4fa7\u9009\u62e9\u4e00\u4e2a\u6a21\u677f',
  fillValues: '\u586b\u5199\u53d8\u91cf\u503c',
  save: '\u4fdd\u5b58',
  saved: '\u5df2\u4fdd\u5b58',
  subject: '\u90ae\u4ef6\u4e3b\u9898',
  inputSubject: '\u8f93\u5165\u90ae\u4ef6\u4e3b\u9898...',
  variables: '\u53d8\u91cf',
  usedVarsSuffix: '\u4e2a\u5df2\u7528',
  insertHint: '\u00b7 \u70b9\u51fb\u63d2\u5165\u5230\u5149\u6807\u5904',
  body: '\u6b63\u6587\u5185\u5bb9',
  bodyPlaceholder: '\u5728\u6b64\u7f16\u8f91\u90ae\u4ef6\u5185\u5bb9\uff0c\u70b9\u51fb\u4e0a\u65b9\u53d8\u91cf\u63d2\u5165\u5360\u4f4d\u7b26...',
  preview: '\u5b9e\u65f6\u9884\u89c8',
  previewLegend: '\uff08\u84dd=\u672a\u586b\uff0c\u7eff=\u5df2\u586b\uff09',
  previewEmpty: '\u9009\u62e9\u6a21\u677f\u540e\u5728\u6b64\u9884\u89c8',
  previewWindow: '\u90ae\u4ef6\u9884\u89c8',
  previewBody: '\u6b63\u6587',
  emptySubject: '\uff08\u7a7a\u4e3b\u9898\uff09',
  emptyBody: '\uff08\u7a7a\u6b63\u6587\uff09',
  confirmDelete: '\u786e\u5b9a\u5220\u9664\u6b64\u6a21\u677f\uff1f',
  fillTitle: '\u586b\u5199\u53d8\u91cf\u503c',
  fillDesc: '\u5df2\u586b\u503c\u5b9e\u65f6\u663e\u793a\u5728\u53f3\u4fa7\u9884\u89c8\u533a\uff08\u7eff\u8272\uff09',
  noVars: '\u5f53\u524d\u6a21\u677f\u4e2d\u6682\u672a\u4f7f\u7528\u4efb\u4f55\u53d8\u91cf',
  noVarsHint: '\u5728\u5de6\u4fa7\u7f16\u8f91\u533a\u70b9\u51fb\u201c\u53d8\u91cf\u201d\u6309\u94ae\u63d2\u5165\u5360\u4f4d\u7b26\u540e\u518d\u6765\u586b\u5199',
  filled: '\u5df2\u586b',
  inputValuePrefix: '\u8f93\u5165 ',
  inputValueSuffix: ' \u7684\u503c\uff08\u53ef\u4e0d\u586b\uff09',
  done: '\u5b8c\u6210\uff08\u67e5\u770b\u9884\u89c8\uff09',
  intro: '\u81ea\u8350\u4fe1',
  inquiry: '\u8be2\u95ee\u540d\u989d',
  thanks: '\u611f\u8c22\u4fe1',
  defaultSubject: '\u90ae\u4ef6\u4e3b\u9898',
  defaultContent: '\u90ae\u4ef6\u5185\u5bb9...',
  finalSubject: '\u4e3b\u9898\uff1a'
} as const

const VARIABLE_POOL = [
  'ADVISOR_NAME', 'YOUR_NAME', 'YOUR_UNIVERSITY', 'YOUR_MAJOR',
  'YOUR_GPA', 'YOUR_RANK', 'RESEARCH_INTEREST',
  'YOUR_PROJECTS', 'YOUR_CONTACT', 'ACHIEVEMENTS'
]

const defaultTemplates = [
  {
    id: 'self-intro',
    name: TEXT.intro,
    subject: '\u4fdd\u7814\u81ea\u8350 - {{YOUR_NAME}}',
    content: `\u5c0a\u656c\u7684{{ADVISOR_NAME}}\u8001\u5e08\uff1a

\u60a8\u597d\uff01\u6211\u662f{{YOUR_NAME}}\uff0c\u6765\u81ea{{YOUR_UNIVERSITY}}{{YOUR_MAJOR}}\u4e13\u4e1a\uff0c\u76ee\u524d GPA {{YOUR_GPA}}\uff0c\u4e13\u4e1a\u6392\u540d {{YOUR_RANK}}\u3002

\u6211\u5bf9\u60a8\u7684\u7814\u7a76\u65b9\u5411{{RESEARCH_INTEREST}}\u975e\u5e38\u611f\u5174\u8da3\u3002\u5728\u672c\u79d1\u9636\u6bb5\uff0c\u6211\u53c2\u4e0e\u4e86{{YOUR_PROJECTS}}\uff0c\u79ef\u7d2f\u4e86\u4e00\u5b9a\u7684\u7814\u7a76\u7ecf\u9a8c\u3002

\u9644\u4ef6\u662f\u6211\u7684\u4e2a\u4eba\u7b80\u5386\u548c\u6210\u7ee9\u5355\uff0c\u606d\u8bf7\u8001\u5e08\u80fd\u7ed9\u6211\u4e00\u4e2a\u673a\u4f1a\uff0c\u671f\u5f85\u80fd\u591f\u52a0\u5165\u60a8\u7684\u8bfe\u9898\u7ec4\u7ee7\u7eed\u6df1\u9020\u3002

\u6b64\u81f4
\u656c\u793c

{{YOUR_NAME}}
{{YOUR_CONTACT}}`,
    variables: ['ADVISOR_NAME', 'YOUR_NAME', 'YOUR_UNIVERSITY', 'YOUR_MAJOR', 'YOUR_GPA', 'YOUR_RANK', 'YOUR_PROJECTS', 'YOUR_CONTACT']
  },
  {
    id: 'inquiry',
    name: TEXT.inquiry,
    subject: '\u5173\u4e8e{{ADVISOR_NAME}}\u8001\u5e08\u8bfe\u9898\u7ec4\u7684\u54a8\u8be2',
    content: `\u5c0a\u656c\u7684{{ADVISOR_NAME}}\u8001\u5e08\uff1a

\u60a8\u597d\uff01\u6211\u662f{{YOUR_NAME}}\uff0c\u6765\u81ea{{YOUR_UNIVERSITY}}{{YOUR_MAJOR}}\u4e13\u4e1a\u3002

\u6211\u5728\u5b98\u7f51\u4e0a\u4e86\u89e3\u5230\u60a8\u7684\u7814\u7a76\u65b9\u5411\u662f{{RESEARCH_INTEREST}}\uff0c\u5bf9\u6b64\u975e\u5e38\u611f\u5174\u8da3\u3002\u6211\u76ee\u524d\u5df2\u7ecf\u83b7\u5f97\u4e86{{ACHIEVEMENTS}}\uff0c\u5e0c\u671b\u80fd\u591f\u6709\u673a\u4f1a\u52a0\u5165\u60a8\u7684\u8bfe\u9898\u7ec4\u3002

\u8bf7\u95ee\u8001\u5e08\u4eca\u5e74\u8fd8\u6709\u535a\u58eb/\u7855\u58eb\u7814\u7a76\u751f\u62db\u751f\u540d\u989d\u5417\uff1f

\u671f\u5f85\u60a8\u7684\u56de\u590d\uff01

{{YOUR_NAME}}
{{YOUR_CONTACT}}`,
    variables: ['ADVISOR_NAME', 'YOUR_NAME', 'YOUR_UNIVERSITY', 'YOUR_MAJOR', 'RESEARCH_INTEREST', 'ACHIEVEMENTS', 'YOUR_CONTACT']
  },
  {
    id: 'thank-you',
    name: TEXT.thanks,
    subject: '\u611f\u8c22\u60a8\u4eca\u5929\u7684\u9762\u8bd5 - {{YOUR_NAME}}',
    content: `\u5c0a\u656c\u7684{{ADVISOR_NAME}}\u8001\u5e08\uff1a

\u60a8\u597d\uff01\u611f\u8c22\u60a8\u5728\u767e\u5fd9\u4e4b\u4e2d\u62bd\u51fa\u65f6\u95f4\u4e0e\u6211\u8fdb\u884c\u9762\u8bd5\u3002\u901a\u8fc7\u4eca\u5929\u7684\u4ea4\u6d41\uff0c\u6211\u66f4\u52a0\u6df1\u5165\u5730\u4e86\u89e3\u4e86\u60a8\u8bfe\u9898\u7ec4\u7684\u7814\u7a76\u65b9\u5411{{RESEARCH_INTEREST}}\uff0c\u5bf9\u80fd\u591f\u52a0\u5165\u60a8\u7684\u56e2\u961f\u66f4\u52a0\u5411\u5f80\u3002

\u6211\u4f1a\u7ee7\u7eed\u52aa\u529b\u63d0\u5347\u81ea\u5df1\uff0c\u671f\u5f85\u80fd\u591f\u6536\u5230\u60a8\u7684\u597d\u6d88\u606f\uff01

\u6b64\u81f4
\u656c\u793c

{{YOUR_NAME}}`,
    variables: ['ADVISOR_NAME', 'YOUR_NAME', 'RESEARCH_INTEREST']
  }
]

function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{\s*(.+?)\s*\}\}/g) || []
  return [...new Set(matches.map((match) => match.replace(/\{\{|\}\}/g, '').trim()))]
}

function renderPreviewText(text: string, fillValues: Record<string, string>): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped
    .replace(/\{\{\s*(.+?)\s*\}\}/g, (_match, varName) => {
      const key = String(varName).trim()
      const filled = fillValues[key]
      if (filled) {
        return `<span class="inline-flex items-center bg-green-100 text-green-800 border border-green-200 px-1.5 py-0.5 rounded text-xs font-medium mx-0.5">${filled}</span>`
      }
      return `<span class="inline-flex items-center bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded text-xs font-mono mx-0.5">${key}</span>`
    })
    .replace(/\n/g, '<br />')
}

const STORAGE_KEY = 'studentHelperEmailFillValues'

export default function EmailTemplates(): JSX.Element {
  const { emailTemplates, loadEmailTemplates, createEmailTemplate, updateEmailTemplate, error, clearError } = useStore()

  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null)
  const [editedName, setEditedName] = useState('')
  const [editedSubject, setEditedSubject] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [saved, setSaved] = useState(false)
  const [showAddTemplate, setShowAddTemplate] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [isFillModalOpen, setIsFillModalOpen] = useState(false)
  const [extractedVars, setExtractedVars] = useState<string[]>([])
  const [fillValues, setFillValues] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    } catch {
      return {}
    }
  })
  const [copied, setCopied] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [hasLoadedTemplates, setHasLoadedTemplates] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const initRef = useRef(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fillValues))
  }, [fillValues])

  const usedVariables = useMemo(() => extractVariables(editedContent + editedSubject), [editedContent, editedSubject])
  const previewHtml = useMemo(() => renderPreviewText(editedContent, fillValues), [editedContent, fillValues])
  const previewSubjectHtml = useMemo(() => renderPreviewText(editedSubject, fillValues), [editedSubject, fillValues])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      await loadEmailTemplates()
      if (!cancelled) {
        setHasLoadedTemplates(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [loadEmailTemplates])

  useEffect(() => {
    if (!hasLoadedTemplates || initRef.current || emailTemplates.length > 0) {
      return
    }

    initRef.current = true
    void initDefaultTemplates()
  }, [emailTemplates, hasLoadedTemplates])

  useEffect(() => {
    if (emailTemplates.length > 0) {
      initRef.current = true
    }
  }, [emailTemplates])

  async function initDefaultTemplates(): Promise<void> {
    for (const template of defaultTemplates) {
      const result = await createEmailTemplate({ name: template.name, subject: template.subject, content: template.content })
      if (result?.id) {
        for (const variable of template.variables) {
          await window.api.emailVariable.create({ name: variable, templateId: result.id })
        }
      }
    }
    await loadEmailTemplates()
  }

  const templates = emailTemplates.length > 0
    ? emailTemplates
    : defaultTemplates.map((template) => ({ ...template, variables: template.variables.map((variable) => ({ id: variable, name: variable, templateId: template.id })) }))

  function handleSelectTemplate(template: any): void {
    setSelectedTemplate(template)
    setEditedName(template.name)
    setEditedSubject(template.subject)
    setEditedContent(template.content)
    setSaved(false)
    setCopied(false)
    setIsFillModalOpen(false)
  }

  async function handleSave(): Promise<void> {
    if (!selectedTemplate) return
    try {
      await updateEmailTemplate(selectedTemplate.id, { name: editedName, subject: editedSubject, content: editedContent })
      await loadEmailTemplates()
      const latest = useStore.getState().emailTemplates.find((template: any) => template.id === selectedTemplate.id)
      if (latest) setSelectedTemplate(latest)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      clearError()
    }
  }

  function handleVariableInsert(variableName: string): void {
    const textarea = textareaRef.current
    const insertion = `{{${variableName}}}`
    if (!textarea) {
      setEditedContent((prev) => prev + insertion)
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const nextContent = editedContent.substring(0, start) + insertion + editedContent.substring(end)
    setEditedContent(nextContent)
    requestAnimationFrame(() => {
      const position = start + insertion.length
      textarea.focus()
      textarea.setSelectionRange(position, position)
    })
  }

  function handleOpenFillModal(): void {
    const nextVars = usedVariables
    setExtractedVars(nextVars)
    const initialValues: Record<string, string> = {}
    nextVars.forEach((variable) => {
      initialValues[variable] = fillValues[variable] || ''
    })
    setFillValues(initialValues)
    setIsFillModalOpen(true)
  }

  function handleFillChange(name: string, value: string): void {
    setFillValues((prev) => ({ ...prev, [name]: value }))
  }

  function handleFillDone(): void {
    setIsFillModalOpen(false)
  }

  const handleCopyFinal = useCallback(async (): Promise<void> => {
    let content = editedContent
    let subject = editedSubject
    Object.entries(fillValues).forEach(([name, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, 'g')
      content = content.replace(regex, value)
      subject = subject.replace(regex, value)
    })
    await navigator.clipboard.writeText(`${TEXT.finalSubject}${subject}\n\n${content}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }, [editedContent, editedSubject, fillValues])

  async function handleAddTemplate(): Promise<void> {
    if (!newTemplateName.trim() || isCreating) return
    setIsCreating(true)
    try {
      const result = await createEmailTemplate({ name: newTemplateName.trim(), subject: TEXT.defaultSubject, content: TEXT.defaultContent })
      await loadEmailTemplates()
      if (result?.id) {
        const created = useStore.getState().emailTemplates.find((template: any) => template.id === result.id)
        if (created) handleSelectTemplate(created)
      }
      setNewTemplateName('')
      setShowAddTemplate(false)
    } finally {
      setIsCreating(false)
    }
  }

  async function handleDeleteTemplate(templateId: string): Promise<void> {
    if (!confirm(TEXT.confirmDelete)) return
    await window.api.emailTemplate.delete(templateId)
    await loadEmailTemplates()
    if (selectedTemplate?.id === templateId) setSelectedTemplate(null)
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">{TEXT.title}</h2>
            <p className="text-sm text-muted-foreground">{TEXT.subtitle}</p>
          </div>
          {selectedTemplate && (
            <Button onClick={() => void handleCopyFinal()} disabled={copied} className="gap-1.5">
              {copied ? <><Check className="h-3.5 w-3.5" />{TEXT.copied}</> : <><Copy className="h-3.5 w-3.5" />{TEXT.copyFinal}</>}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_1fr_1fr]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{TEXT.templates}</span>
              <button onClick={() => setShowAddTemplate(!showAddTemplate)} className="text-muted-foreground transition-colors hover:text-primary" title={TEXT.newTemplate}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {showAddTemplate && (
              <div className="space-y-1">
                <Input
                  placeholder={TEXT.templateName}
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void handleAddTemplate()}
                  autoFocus
                  className="h-8 text-sm"
                />
                <div className="flex gap-1">
                  <Button size="sm" className="h-7 flex-1 text-xs" onClick={() => void handleAddTemplate()} disabled={isCreating}><Plus className="mr-1 h-3 w-3" />{isCreating ? TEXT.creating : TEXT.create}</Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setShowAddTemplate(false); setNewTemplateName('') }}><X className="h-3 w-3" /></Button>
                </div>
              </div>
            )}
            <div className="space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
              {templates.map((template: any) => (
                <div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={`group flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm transition-all ${selectedTemplate?.id === template.id ? 'border-primary/30 bg-primary/10 text-primary' : 'border-transparent hover:bg-muted'}`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">{template.name}</span>
                  </div>
                  <button className="opacity-0 transition-all group-hover:opacity-100 text-muted-foreground hover:text-destructive flex-shrink-0 p-0.5" onClick={(e) => { e.stopPropagation(); void handleDeleteTemplate(template.id) }}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {!selectedTemplate ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted text-muted-foreground">
                <Mail className="mb-3 h-10 w-10 opacity-40" />
                <p className="text-sm">{TEXT.selectTemplate}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Input value={editedName} onChange={(e) => setEditedName(e.target.value)} className="h-auto rounded-none border-0 border-b border-transparent bg-transparent px-0 text-base font-semibold shadow-none focus:border-b-2 focus:border-primary" placeholder={TEXT.templateName} />
                  <div className="ml-auto flex gap-2">
                    <Button onClick={handleOpenFillModal} variant="outline" size="sm" className="gap-1.5"><Edit2 className="h-3.5 w-3.5" />{TEXT.fillValues}</Button>
                    <Button onClick={() => void handleSave()} disabled={saved} variant="outline" size="sm" className="gap-1.5">{saved ? <><Check className="h-3.5 w-3.5" />{TEXT.saved}</> : <><Save className="h-3.5 w-3.5" />{TEXT.save}</>}</Button>
                  </div>
                </div>

                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">{TEXT.subject}</Label>
                  <Input value={editedSubject} onChange={(e) => setEditedSubject(e.target.value)} className="font-mono text-sm" placeholder={TEXT.inputSubject} />
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">{TEXT.variables}</Label>
                    {usedVariables.length > 0 && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">{usedVariables.length} {TEXT.usedVarsSuffix}</span>}
                    <span className="ml-1 text-xs text-muted-foreground">{TEXT.insertHint}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {VARIABLE_POOL.map((variable) => {
                      const isUsed = usedVariables.includes(variable)
                      return (
                        <button
                          key={variable}
                          onClick={() => handleVariableInsert(variable)}
                          className={`cursor-pointer rounded border px-2 py-1 text-xs transition-colors ${isUsed ? 'border-blue-200 bg-blue-100 text-blue-700 hover:bg-blue-200' : 'border-border bg-muted/60 text-muted-foreground hover:bg-muted'}`}
                        >
                          {variable}
                        </button>
                      )
                    })}
                    {usedVariables.filter((variable) => !VARIABLE_POOL.includes(variable)).map((variable) => (
                      <button key={variable} onClick={() => handleVariableInsert(variable)} className="cursor-pointer rounded border border-purple-200 bg-purple-50 px-2 py-1 text-xs text-purple-700 hover:bg-purple-100">
                        {variable}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1">
                  <Label className="mb-1 block text-xs text-muted-foreground">{TEXT.body}</Label>
                  <Textarea ref={textareaRef} value={editedContent} onChange={(e) => setEditedContent(e.target.value)} rows={16} className="resize-none rounded-md border-muted-foreground/20 font-mono text-sm focus:border-primary" placeholder={TEXT.bodyPlaceholder} />
                </div>

                {error && <p className="text-xs text-destructive">{error}</p>}
              </>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{TEXT.preview}</span>
              <span className="ml-1 text-xs text-muted-foreground">{TEXT.previewLegend}</span>
            </div>
            {!selectedTemplate ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted text-muted-foreground">
                <Eye className="mb-3 h-10 w-10 opacity-40" />
                <p className="text-sm">{TEXT.previewEmpty}</p>
              </div>
            ) : (
              <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-400" />
                    <div className="h-2 w-2 rounded-full bg-amber-400" />
                    <div className="h-2 w-2 rounded-full bg-green-400" />
                    <span className="ml-2 font-mono text-xs text-slate-400">{TEXT.previewWindow}</span>
                  </div>
                </div>
                <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800">
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">Subject</p>
                  <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100" dangerouslySetInnerHTML={{ __html: previewSubjectHtml || `<span class="text-slate-300 italic">${TEXT.emptySubject}</span>` }} />
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">{TEXT.previewBody}</p>
                  <div className="whitespace-pre-wrap text-sm leading-7 text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: previewHtml || `<span class="text-slate-300 italic">${TEXT.emptyBody}</span>` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isFillModalOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={handleFillDone} />
          <div className="flex w-[420px] flex-col overflow-hidden border-l border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 className="text-base font-semibold">{TEXT.fillTitle}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{TEXT.fillDesc}</p>
              </div>
              <button onClick={handleFillDone} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {extractedVars.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p className="text-sm">{TEXT.noVars}</p>
                  <p className="mt-1 text-xs">{TEXT.noVarsHint}</p>
                </div>
              ) : (
                extractedVars.map((varName, index) => (
                  <div key={varName} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-36 flex-shrink-0 shrink-0 rounded bg-muted px-1.5 py-1 text-right font-mono text-xs text-muted-foreground">{varName}</span>
                      {fillValues[varName] && <span className="text-xs font-medium text-green-600">{TEXT.filled}</span>}
                    </div>
                    <Input placeholder={`${TEXT.inputValuePrefix}${varName}${TEXT.inputValueSuffix}`} value={fillValues[varName] || ''} onChange={(e) => handleFillChange(varName, e.target.value)} autoFocus={index === 0} className="text-sm" />
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end border-t border-border bg-muted/30 px-5 py-4">
              <Button onClick={handleFillDone} size="sm" className="gap-1.5"><Check className="h-3.5 w-3.5" />{TEXT.done}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
