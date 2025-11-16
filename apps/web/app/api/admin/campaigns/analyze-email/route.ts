import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'

// AI-powered email quality analysis
interface EmailAnalysis {
  overall_score: number // 0-100
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

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { subject, content } = body

    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: subject and content' },
        { status: 400 }
      )
    }

    const analysis = analyzeEmail(subject, content)

    return NextResponse.json(analysis)
  } catch (error: any) {
    console.error('Error analyzing email:', error)
    return NextResponse.json(
      { error: 'Failed to analyze email', details: error.message },
      { status: 500 }
    )
  }
}

function analyzeEmail(subject: string, content: string): EmailAnalysis {
  const issues: EmailAnalysis['issues'] = []
  const suggestions: EmailAnalysis['suggestions'] = []
  let score = 100

  // 1. Check for spam trigger words
  const spamWords = [
    'free', 'winner', 'cash', 'prize', 'congratulations', 'urgent', 'act now',
    'limited time', 'click here', 'buy now', 'order now', 'guarantee', 'risk free',
    '100%', 'make money', 'extra income', 'work from home', 'be your own boss',
    'miracle', 'amazing', 'incredible', 'special promotion', 'dear friend'
  ]
  
  const subjectLower = subject.toLowerCase()
  const contentLower = content.toLowerCase()
  const foundSpamWords = spamWords.filter(word => 
    subjectLower.includes(word) || contentLower.includes(word)
  )

  if (foundSpamWords.length > 0) {
    const severity = foundSpamWords.length > 3 ? 'high' : foundSpamWords.length > 1 ? 'medium' : 'low'
    score -= foundSpamWords.length * 5
    issues.push({
      type: 'spam_words',
      severity,
      description: `Found ${foundSpamWords.length} spam trigger word(s): ${foundSpamWords.slice(0, 3).join(', ')}${foundSpamWords.length > 3 ? '...' : ''}`
    })
    suggestions.push({
      category: 'content',
      suggestion: 'Replace spam trigger words with more professional alternatives'
    })
  }

  // 2. Check for excessive capitalization
  const capsCount = (subject + ' ' + content).replace(/[^A-Z]/g, '').length
  const totalChars = (subject + ' ' + content).length
  const capsPercentage = (capsCount / totalChars) * 100

  if (capsPercentage > 30) {
    score -= 15
    issues.push({
      type: 'excessive_caps',
      severity: 'high',
      description: `${Math.round(capsPercentage)}% of text is capitalized (should be < 30%)`
    })
    suggestions.push({
      category: 'formatting',
      suggestion: 'Use normal sentence case instead of excessive capitals'
    })
  } else if (capsPercentage > 20) {
    score -= 10
    issues.push({
      type: 'excessive_caps',
      severity: 'medium',
      description: `${Math.round(capsPercentage)}% of text is capitalized (should be < 20%)`
    })
  }

  // 3. Check for excessive exclamation marks
  const exclamationCount = (subject + ' ' + content).split('!').length - 1
  if (exclamationCount > 3) {
    score -= 10
    issues.push({
      type: 'excessive_punctuation',
      severity: 'medium',
      description: `${exclamationCount} exclamation marks found (should be ≤ 3)`
    })
    suggestions.push({
      category: 'formatting',
      suggestion: 'Reduce exclamation marks to maintain professional tone'
    })
  }

  // 4. Check subject line length
  if (subject.length < 20) {
    score -= 5
    issues.push({
      type: 'subject_too_short',
      severity: 'low',
      description: `Subject line is ${subject.length} characters (recommended: 40-60)`
    })
    suggestions.push({
      category: 'subject',
      suggestion: 'Make subject line more descriptive (40-60 characters ideal)'
    })
  } else if (subject.length > 80) {
    score -= 10
    issues.push({
      type: 'subject_too_long',
      severity: 'medium',
      description: `Subject line is ${subject.length} characters (recommended: 40-60)`
    })
    suggestions.push({
      category: 'subject',
      suggestion: 'Shorten subject line (may be truncated on mobile devices)'
    })
  }

  // 5. Check for personalization
  const hasPersonalization = content.includes('{{buyer_name}}') || 
                            content.includes('{{company}}') ||
                            content.includes('{{org_name}}')
  
  if (!hasPersonalization) {
    score -= 5
    issues.push({
      type: 'no_personalization',
      severity: 'low',
      description: 'Email lacks personalization placeholders'
    })
    suggestions.push({
      category: 'content',
      suggestion: 'Add personalization: {{buyer_name}}, {{company}}, {{org_name}}'
    })
  }

  // 6. Check content length
  if (content.length < 100) {
    score -= 5
    issues.push({
      type: 'content_too_short',
      severity: 'low',
      description: `Email content is ${content.length} characters (should be 200-800)`
    })
    suggestions.push({
      category: 'content',
      suggestion: 'Provide more context and value in the email body'
    })
  } else if (content.length > 1500) {
    score -= 10
    issues.push({
      type: 'content_too_long',
      severity: 'medium',
      description: `Email content is ${content.length} characters (should be 200-800)`
    })
    suggestions.push({
      category: 'content',
      suggestion: 'Shorten email content - recipients prefer concise messages'
    })
  }

  // 7. Check for links
  const linkCount = (content.match(/https?:\/\//g) || []).length + 
                   (content.match(/{{product_link}}/g) || []).length

  if (linkCount === 0) {
    score -= 5
    issues.push({
      type: 'no_links',
      severity: 'low',
      description: 'Email contains no links to your product'
    })
    suggestions.push({
      category: 'content',
      suggestion: 'Include {{product_link}} to drive engagement'
    })
  } else if (linkCount > 5) {
    score -= 10
    issues.push({
      type: 'too_many_links',
      severity: 'medium',
      description: `${linkCount} links found (should be 1-3)`
    })
    suggestions.push({
      category: 'content',
      suggestion: 'Reduce number of links - too many can trigger spam filters'
    })
  }

  // 8. Check for images (attachments)
  const hasImages = content.toLowerCase().includes('<img') || 
                   content.toLowerCase().includes('[image')
  
  if (hasImages) {
    score -= 5
    issues.push({
      type: 'contains_images',
      severity: 'low',
      description: 'Email appears to contain images or attachments'
    })
    suggestions.push({
      category: 'content',
      suggestion: 'Avoid inline images - use text and links instead'
    })
  }

  // 9. Check for professional tone indicators
  const professionalWords = ['partnership', 'collaborate', 'premium', 'quality', 'solution', 'services', 'products']
  const hasProfessionalTone = professionalWords.some(word => contentLower.includes(word))
  
  if (!hasProfessionalTone) {
    score -= 3
    issues.push({
      type: 'unprofessional_tone',
      severity: 'low',
      description: 'Email could benefit from more professional language'
    })
    suggestions.push({
      category: 'content',
      suggestion: 'Use professional B2B language (e.g., partnership, quality, solutions)'
    })
  }

  // 10. Check for call to action
  const hasCallToAction = contentLower.includes('reply') || 
                         contentLower.includes('contact') ||
                         contentLower.includes('learn more') ||
                         contentLower.includes('view') ||
                         contentLower.includes('rfq')
  
  if (!hasCallToAction) {
    score -= 5
    issues.push({
      type: 'no_cta',
      severity: 'low',
      description: 'Email lacks a clear call-to-action'
    })
    suggestions.push({
      category: 'content',
      suggestion: 'Add a clear call-to-action (e.g., "View product details", "Submit an RFQ")'
    })
  }

  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score))

  // Determine spam risk level
  let spam_risk_level: 'low' | 'medium' | 'high'
  if (score >= 80) {
    spam_risk_level = 'low'
  } else if (score >= 60) {
    spam_risk_level = 'medium'
  } else {
    spam_risk_level = 'high'
  }

  // Add general best practices if score is good
  if (score >= 80) {
    suggestions.push({
      category: 'best_practice',
      suggestion: 'Great email! Consider A/B testing subject lines for optimization'
    })
  }

  return {
    overall_score: Math.round(score),
    spam_risk_level,
    issues,
    suggestions
  }
}

