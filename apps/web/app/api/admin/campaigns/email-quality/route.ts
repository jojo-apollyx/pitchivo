import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

interface EmailQualityIssue {
  type: string
  severity: 'low' | 'medium' | 'high'
  message: string
  location?: string
}

interface EmailQualitySuggestion {
  category: string
  message: string
  priority: 'low' | 'medium' | 'high'
}

interface EmailQualityAnalysis {
  overallScore: number
  spamRiskLevel: 'low' | 'medium' | 'high'
  issues: EmailQualityIssue[]
  suggestions: EmailQualitySuggestion[]
}

/**
 * Analyze email content for spam filter risk
 * This uses heuristic analysis based on known spam filter patterns
 */
function analyzeEmailQuality(subject: string, content: string): EmailQualityAnalysis {
  const issues: EmailQualityIssue[] = []
  const suggestions: EmailQualitySuggestion[] = []
  let score = 100

  // 1. Check for spam trigger words
  const spamWords = [
    'free', 'guarantee', 'no risk', 'act now', 'limited time',
    'urgent', 'click here', 'buy now', 'winner', 'congratulations',
    'cash', 'prize', 'selected', 'claim', 'bonus', 'offer expires',
    '100% free', 'no cost', 'risk-free', 'urgent action required',
    'act immediately', 'apply now', 'call now', 'order now'
  ]
  
  const combinedText = `${subject} ${content}`.toLowerCase()
  const foundSpamWords = spamWords.filter(word => combinedText.includes(word))
  
  if (foundSpamWords.length > 0) {
    const severity = foundSpamWords.length >= 3 ? 'high' : foundSpamWords.length >= 2 ? 'medium' : 'low'
    score -= foundSpamWords.length * 5
    issues.push({
      type: 'spam_words',
      severity,
      message: `Found ${foundSpamWords.length} spam trigger word(s): ${foundSpamWords.slice(0, 3).join(', ')}`,
      location: 'subject and content'
    })
    suggestions.push({
      category: 'Content',
      message: 'Replace spam trigger words with more professional language',
      priority: severity
    })
  }

  // 2. Check for excessive capitalization
  const capsRegex = /[A-Z]{4,}/g
  const capsMatches = combinedText.match(capsRegex) || []
  if (capsMatches.length > 0) {
    score -= capsMatches.length * 3
    issues.push({
      type: 'excessive_caps',
      severity: 'medium',
      message: `Found ${capsMatches.length} instance(s) of excessive capitalization`,
      location: 'subject and content'
    })
    suggestions.push({
      category: 'Formatting',
      message: 'Avoid using ALL CAPS - use sentence case instead',
      priority: 'medium'
    })
  }

  // 3. Check for excessive exclamation marks
  const exclamationCount = (combinedText.match(/!/g) || []).length
  if (exclamationCount > 2) {
    score -= exclamationCount * 2
    issues.push({
      type: 'excessive_punctuation',
      severity: 'low',
      message: `Found ${exclamationCount} exclamation marks (limit to 1-2)`,
      location: 'subject and content'
    })
    suggestions.push({
      category: 'Formatting',
      message: 'Limit exclamation marks to 1-2 for professional tone',
      priority: 'low'
    })
  }

  // 4. Check for excessive links
  const linkRegex = /(https?:\/\/[^\s]+)|(\{\{product_link\}\})/gi
  const links = (content.match(linkRegex) || []).length
  if (links > 5) {
    score -= (links - 5) * 3
    issues.push({
      type: 'too_many_links',
      severity: 'medium',
      message: `Found ${links} links (recommended: max 5)`,
      location: 'content'
    })
    suggestions.push({
      category: 'Links',
      message: 'Reduce number of links to 3-5 for better deliverability',
      priority: 'medium'
    })
  }

  // 5. Check email length (too short or too long)
  const contentLength = content.length
  if (contentLength < 100) {
    score -= 10
    issues.push({
      type: 'too_short',
      severity: 'medium',
      message: 'Email content is very short (less than 100 characters)',
      location: 'content'
    })
    suggestions.push({
      category: 'Content',
      message: 'Add more substantive content to appear more professional',
      priority: 'medium'
    })
  } else if (contentLength > 5000) {
    score -= 5
    issues.push({
      type: 'too_long',
      severity: 'low',
      message: 'Email content is very long (over 5000 characters)',
      location: 'content'
    })
    suggestions.push({
      category: 'Content',
      message: 'Consider shortening the email for better engagement',
      priority: 'low'
    })
  }

  // 6. Check subject line length
  const subjectLength = subject.length
  if (subjectLength < 20) {
    score -= 5
    issues.push({
      type: 'subject_too_short',
      severity: 'low',
      message: 'Subject line is short (less than 20 characters)',
      location: 'subject'
    })
    suggestions.push({
      category: 'Subject',
      message: 'Add more context to subject line (aim for 40-60 characters)',
      priority: 'low'
    })
  } else if (subjectLength > 100) {
    score -= 8
    issues.push({
      type: 'subject_too_long',
      severity: 'medium',
      message: 'Subject line is too long (over 100 characters)',
      location: 'subject'
    })
    suggestions.push({
      category: 'Subject',
      message: 'Shorten subject line to 40-60 characters for better open rates',
      priority: 'medium'
    })
  }

  // 7. Check for personalization placeholders
  const hasPersonalization = /\{\{(buyer_name|org_name|product_name)\}\}/.test(content)
  if (!hasPersonalization) {
    score -= 5
    suggestions.push({
      category: 'Personalization',
      message: 'Add personalization placeholders like {{buyer_name}} for better engagement',
      priority: 'low'
    })
  }

  // 8. Check for missing unsubscribe mention (important for CAN-SPAM)
  const hasUnsubscribe = /unsubscribe|opt.out|opt out/i.test(content)
  if (!hasUnsubscribe) {
    score -= 10
    issues.push({
      type: 'missing_unsubscribe',
      severity: 'high',
      message: 'No unsubscribe option mentioned (required by CAN-SPAM)',
      location: 'content'
    })
    suggestions.push({
      category: 'Compliance',
      message: 'Add unsubscribe instructions (automatically added in footer)',
      priority: 'high'
    })
  }

  // 9. Check text-to-HTML ratio (simplified - check for balanced text)
  const htmlTagCount = (content.match(/<[^>]+>/g) || []).length
  if (htmlTagCount > 20) {
    score -= 8
    issues.push({
      type: 'too_much_html',
      severity: 'medium',
      message: 'Content has many HTML tags - may affect text-to-HTML ratio',
      location: 'content'
    })
    suggestions.push({
      category: 'Formatting',
      message: 'Simplify HTML formatting for better deliverability',
      priority: 'medium'
    })
  }

  // 10. Check for money symbols and numbers
  const moneySymbols = (combinedText.match(/\$\d+/g) || []).length
  if (moneySymbols > 3) {
    score -= 5
    issues.push({
      type: 'excessive_pricing',
      severity: 'low',
      message: `Found ${moneySymbols} price mentions - may trigger spam filters`,
      location: 'content'
    })
    suggestions.push({
      category: 'Content',
      message: 'Reduce emphasis on pricing in initial outreach',
      priority: 'low'
    })
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score)

  // Determine spam risk level
  let spamRiskLevel: 'low' | 'medium' | 'high'
  if (score >= 80) {
    spamRiskLevel = 'low'
  } else if (score >= 60) {
    spamRiskLevel = 'medium'
  } else {
    spamRiskLevel = 'high'
  }

  // Add general suggestions if score is good
  if (score >= 80 && suggestions.length === 0) {
    suggestions.push({
      category: 'General',
      message: 'Your email looks good! Continue following email best practices.',
      priority: 'low'
    })
  }

  return {
    overallScore: score,
    spamRiskLevel,
    issues,
    suggestions
  }
}

export async function POST(request: NextRequest) {
  try {
    const { campaignId, templateId, subject, content } = await request.json()

    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Subject and content are required' },
        { status: 400 }
      )
    }

    // Analyze email quality
    const analysis = analyzeEmailQuality(subject, content)

    // Save to database if campaignId is provided
    if (campaignId) {
      const { error: insertError } = await supabaseAdmin
        .from('email_quality_scores')
        .insert({
          campaign_id: campaignId,
          template_id: templateId || null,
          subject,
          content,
          overall_score: analysis.overallScore,
          spam_risk_level: analysis.spamRiskLevel,
          issues: analysis.issues,
          suggestions: analysis.suggestions
        })

      if (insertError) {
        console.error('Error saving quality score:', insertError)
        // Don't fail the request if saving fails
      }
    }

    return NextResponse.json({
      success: true,
      analysis
    })
  } catch (error: any) {
    console.error('Error analyzing email quality:', error)
    return NextResponse.json(
      { error: 'Failed to analyze email quality', details: error.message },
      { status: 500 }
    )
  }
}

