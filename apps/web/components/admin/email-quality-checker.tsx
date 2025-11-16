'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Sparkles, AlertTriangle, CheckCircle, Info } from 'lucide-react'

interface EmailAnalysis {
  overall_score: number
  spam_risk_level: 'low' | 'medium' | 'high'
  issues: Array<{
    type: string
    severity: 'low' | 'medium' | 'high'
    description: string
  }>
  suggestions: Array<{
    category: string
    suggestion: string
  }>
}

interface EmailQualityCheckerProps {
  subject: string
  content: string
  onSubjectChange?: (subject: string) => void
  onContentChange?: (content: string) => void
}

export function EmailQualityChecker({ 
  subject, 
  content,
  onSubjectChange,
  onContentChange 
}: EmailQualityCheckerProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<EmailAnalysis | null>(null)

  async function analyzeEmail() {
    if (!subject || !content) {
      toast.error('Please provide both subject and content')
      return
    }

    setAnalyzing(true)
    try {
      const response = await fetch('/api/admin/campaigns/analyze-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content })
      })

      if (!response.ok) throw new Error('Failed to analyze email')

      const data = await response.json()
      setAnalysis(data)
    } catch (error) {
      console.error('Error analyzing email:', error)
      toast.error('Failed to analyze email')
    } finally {
      setAnalyzing(false)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'low':
        return <Info className="h-4 w-4 text-blue-600" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Email Quality Checker
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Analyze your email to avoid spam filters
          </p>
        </div>
        <Button
          onClick={analyzeEmail}
          disabled={analyzing || !subject || !content}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {analyzing ? 'Analyzing...' : 'Analyze Email'}
        </Button>
      </div>

      {analysis && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          {/* Score Overview */}
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-6 border border-border/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Overall Score</div>
                <div className="text-4xl font-bold">{analysis.overall_score}/100</div>
              </div>
              <Badge variant="outline" className={getRiskColor(analysis.spam_risk_level)}>
                {analysis.spam_risk_level.toUpperCase()} SPAM RISK
              </Badge>
            </div>
            
            {/* Score Bar */}
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  analysis.overall_score >= 80
                    ? 'bg-green-500'
                    : analysis.overall_score >= 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${analysis.overall_score}%` }}
              />
            </div>
          </div>

          {/* Issues */}
          {analysis.issues.length > 0 && (
            <div className="bg-card/50 rounded-xl p-4 border border-border/30">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Issues Found ({analysis.issues.length})
              </h4>
              <div className="space-y-2">
                {analysis.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border border-border/20"
                  >
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{issue.type.replace(/_/g, ' ')}</span>
                        <Badge variant="outline" className="text-xs">
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{issue.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div className="bg-card/50 rounded-xl p-4 border border-border/30">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Suggestions ({analysis.suggestions.length})
              </h4>
              <div className="space-y-2">
                {analysis.suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border border-border/20"
                  >
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        {suggestion.category}
                      </div>
                      <p className="text-sm">{suggestion.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

