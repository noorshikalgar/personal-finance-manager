import AnalyzeClient from '@/components/analyze/AnalyzeClient'

export const metadata = {
  title: 'Analyze - Personal Finance Manager',
  description: 'Analyze your transactions and spending patterns',
}

export default function AnalyzePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Financial Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Analyze your transactions, track spending by category, and monitor your savings
        </p>
      </div>
      <AnalyzeClient />
    </div>
  )
}
