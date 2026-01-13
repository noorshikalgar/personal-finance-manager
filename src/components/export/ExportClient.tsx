'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileJson, FileSpreadsheet, Database, Calendar, Shield, CheckCircle } from 'lucide-react'

interface ExportClientProps {
  userEmail: string
}

export default function ExportClient({ userEmail }: ExportClientProps) {
  const [exportingJson, setExportingJson] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)

  const handleExport = async (format: 'json' | 'excel') => {
    const setLoading = format === 'json' ? setExportingJson : setExportingExcel
    
    setLoading(true)
    try {
      const response = await fetch(`/api/user/export?format=${format}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Export failed')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const extension = format === 'json' ? 'json' : 'xlsx'
      a.download = `finance-export-${new Date().toISOString().split('T')[0]}.${extension}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Export Data</h1>
        <p className="text-muted-foreground mt-2">Download your financial data in your preferred format</p>
      </div>

      {/* Export Options */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Excel Export */}
        <div className="bg-card rounded-lg shadow-lg overflow-hidden border-2 border-accent">
          <div className="bg-gradient-to-r from-accent to-accent p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 bg-card rounded-full flex items-center justify-center">
                <FileSpreadsheet className="h-8 w-8 text-accent" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white text-center">Excel Format</h2>
            <p className="text-accent/80 text-center mt-2">Professional spreadsheet with formatting</p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-accent mr-2 mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">Multiple sheets for organized data</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-accent mr-2 mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">Color-coded headers and values</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-accent mr-2 mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">Automatic currency formatting</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-accent mr-2 mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">Ready for analysis in Excel/Sheets</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-accent mr-2 mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">No database IDs included</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="font-semibold text-foreground mb-2">Includes:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• User Info</li>
                <li>• Accounts</li>
                <li>• Transactions</li>
                <li>• Categories</li>
                <li>• Recurring Transactions</li>
              </ul>
            </div>

            <Button
              onClick={() => handleExport('excel')}
              disabled={exportingExcel}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {exportingExcel ? (
                <>Generating Excel...</>
              ) : (
                <>
                  <FileSpreadsheet className="mr-2 h-5 w-5" />
                  Download Excel
                </>
              )}
            </Button>
          </div>
        </div>

        {/* JSON Export */}
        <div className="bg-card rounded-lg shadow-lg overflow-hidden border-2 border-primary">
          <div className="bg-gradient-to-r from-primary to-primary p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 bg-card rounded-full flex items-center justify-center">
                <FileJson className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white text-center">JSON Format</h2>
            <p className="text-primary/80 text-center mt-2">Developer-friendly structured data</p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">Machine-readable format</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">Easy to parse programmatically</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">Pretty-printed for readability</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">Import into other systems</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">No database IDs included</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="font-semibold text-foreground mb-2">Includes:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Export Info</li>
                <li>• Accounts</li>
                <li>• Transactions</li>
                <li>• Categories</li>
                <li>• Recurring Transactions</li>
              </ul>
            </div>

            <Button
              onClick={() => handleExport('json')}
              disabled={exportingJson}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {exportingJson ? (
                <>Generating JSON...</>
              ) : (
                <>
                  <FileJson className="mr-2 h-5 w-5" />
                  Download JSON
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-card border border-primary rounded-lg p-6">
        <div className="flex items-start">
          <Shield className="h-6 w-6 text-primary mr-3 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground mb-2">Privacy & Security</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• <strong>No Database IDs:</strong> All internal database identifiers are removed for privacy</li>
              <li>• <strong>User Email:</strong> Only your email ({userEmail}) is included for identification</li>
              <li>• <strong>Local Download:</strong> Files are generated server-side and downloaded directly to your device</li>
              <li>• <strong>No Cloud Storage:</strong> Exports are not stored anywhere - they're created on-demand</li>
              <li>• <strong>Full Control:</strong> You can delete your account anytime from Settings</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg shadow p-4 border-l-4 border-primary">
          <div className="flex items-center mb-2">
            <Database className="h-5 w-5 text-primary mr-2" />
            <h4 className="font-semibold text-foreground">Complete Backup</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            All your financial data in one file for safekeeping or migration
          </p>
        </div>

        <div className="bg-card rounded-lg shadow p-4 border-l-4 border-destructive">
          <div className="flex items-center mb-2">
            <Calendar className="h-5 w-5 text-destructive dark:text-destructive mr-2" />
            <h4 className="font-semibold text-foreground">Timestamped</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Each export includes the exact date and time it was created
          </p>
        </div>

        <div className="bg-card rounded-lg shadow p-4 border-l-4 border-accent">
          <div className="flex items-center mb-2">
            <Download className="h-5 w-5 text-accent mr-2" />
            <h4 className="font-semibold text-foreground">Unlimited Exports</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Export as many times as you want, whenever you need
          </p>
        </div>
      </div>
    </div>
  )
}
