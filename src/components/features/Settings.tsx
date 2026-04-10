import { Moon, Sun, Monitor, Database, Download, Upload, Trash2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Label } from '../ui/label'

export default function Settings(): JSX.Element | null {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const handleExportData = async (): Promise<void> => {
    try {
      const data = await window.api.institution.getAll()
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `student-helper-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert(`\u5bfc\u51fa\u5931\u8d25\uff1a${(error as Error).message}`)
    }
  }

  const handleImportData = async (): Promise<void> => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (event) => resolve(event.target?.result as string)
        reader.onerror = reject
        reader.readAsText(file)
      })

      try {
        const data = JSON.parse(content)
        if (Array.isArray(data)) {
          for (const institution of data) {
            const { id, advisors, tasks, ...rest } = institution
            await window.api.institution.create(rest)
          }
          alert('\u5bfc\u5165\u6210\u529f')
          window.location.reload()
        }
      } catch {
        alert('\u5bfc\u5165\u5931\u8d25\uff1a\u65e0\u6548\u7684\u6570\u636e\u683c\u5f0f')
      }
    }
    input.click()
  }

  const handleClearData = async (): Promise<void> => {
    if (!confirm('\u786e\u5b9a\u8981\u6e05\u9664\u6240\u6709\u6570\u636e\u5417\uff1f\u6b64\u64cd\u4f5c\u4e0d\u53ef\u6062\u590d\u3002')) return
    if (!confirm('\u8fd9\u662f\u6700\u540e\u4e00\u6b21\u786e\u8ba4\uff0c\u6e05\u9664\u540e\u6240\u6709\u6570\u636e\u5c06\u6c38\u4e45\u4e22\u5931\u3002')) return

    try {
      const institutions = await window.api.institution.getAll()
      for (const inst of institutions) {
        await window.api.institution.delete(inst.id)
      }
      alert('\u6570\u636e\u5df2\u6e05\u9664')
      window.location.reload()
    } catch (error) {
      alert(`\u6e05\u9664\u5931\u8d25\uff1a${(error as Error).message}`)
    }
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold">{'\u8bbe\u7f6e'}</h2>
          <p className="text-muted-foreground">{'\u7ba1\u7406\u4e3b\u9898\u548c\u672c\u5730\u6570\u636e\u3002'}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{'\u5916\u89c2'}</CardTitle>
            <CardDescription>{'\u9009\u62e9\u5e94\u7528\u4e3b\u9898\u3002'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">{'\u4e3b\u9898'}</Label>
              <div className="flex gap-2">
                <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')} className="flex-1"><Sun className="h-4 w-4 mr-2" />{'\u6d45\u8272'}</Button>
                <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')} className="flex-1"><Moon className="h-4 w-4 mr-2" />{'\u6df1\u8272'}</Button>
                <Button variant={theme === 'system' ? 'default' : 'outline'} onClick={() => setTheme('system')} className="flex-1"><Monitor className="h-4 w-4 mr-2" />{'\u8ddf\u968f\u7cfb\u7edf'}</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2"><Database className="h-5 w-5" />{'\u6570\u636e\u7ba1\u7406'}</CardTitle>
            <CardDescription>{'\u5bfc\u5165\u3001\u5bfc\u51fa\u6216\u6e05\u7a7a\u672c\u5730\u6570\u636e\u3002'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportData} className="flex-1"><Download className="h-4 w-4 mr-2" />{'\u5bfc\u51fa\u6570\u636e'}</Button>
              <Button variant="outline" onClick={handleImportData} className="flex-1"><Upload className="h-4 w-4 mr-2" />{'\u5bfc\u5165\u6570\u636e'}</Button>
            </div>
            <div className="pt-4 border-t">
              <Button variant="destructive" onClick={handleClearData} className="w-full"><Trash2 className="h-4 w-4 mr-2" />{'\u6e05\u9664\u6240\u6709\u6570\u636e'}</Button>
              <p className="text-xs text-muted-foreground text-center mt-2">{'\u6e05\u9664\u524d\u5efa\u8bae\u5148\u5bfc\u51fa\u5907\u4efd\u3002'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg font-semibold">{'\u5173\u4e8e'}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Student Helper</strong></p>
            <p>{'\u7248\u672c\uff1a2.1.1'}</p>
            <p>{'\u6570\u636e\u5b58\u50a8\uff1a\u672c\u5730 SQLite \u6570\u636e\u5e93'}</p>
            <p className="pt-2">{'\u5e94\u7528\u5b8c\u5168\u79bb\u7ebf\u8fd0\u884c\uff0c\u6240\u6709\u6570\u636e\u4ec5\u4fdd\u5b58\u5728\u5f53\u524d\u8bbe\u5907\u4e0a\u3002'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

