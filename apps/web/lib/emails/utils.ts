/**
 * Email Utilities
 * 
 * Spam Prevention Utilities
 * These utilities help ensure emails pass spam filters
 */

import { EMAIL_CONFIG } from './config'

/**
 * Check if subject line contains spam trigger words
 */
export function hasSpamTriggerWords(subject: string): boolean {
  const lowerSubject = subject.toLowerCase()
  return EMAIL_CONFIG.spamPrevention.spamTriggerWords.some(
    (word) => lowerSubject.includes(word.toLowerCase())
  )
}

/**
 * Calculate text-to-HTML ratio
 * Returns ratio between 0 and 1 (e.g., 0.3 = 30% text)
 */
export function calculateTextToHtmlRatio(html: string, text: string): number {
  // Remove HTML tags and get text content length
  const htmlTextLength = html.replace(/<[^>]*>/g, '').trim().length
  const textLength = text.trim().length
  
  // Use the longer text length as denominator
  const totalTextLength = Math.max(htmlTextLength, textLength)
  if (totalTextLength === 0) return 0
  
  return textLength / totalTextLength
}

/**
 * Count links in HTML content
 */
export function countLinks(html: string): number {
  const linkMatches = html.match(/<a[^>]*href=["'][^"']*["'][^>]*>/gi)
  return linkMatches ? linkMatches.length : 0
}

/**
 * Validate email content for spam prevention
 * Returns array of warnings/issues
 */
export function validateEmailContent(options: {
  subject: string
  htmlContent?: string
  textContent?: string
}): string[] {
  const warnings: string[] = []
  
  // Check subject for spam trigger words
  if (hasSpamTriggerWords(options.subject)) {
    warnings.push('Subject line may contain spam trigger words')
  }
  
  // Check text-to-HTML ratio
  if (options.htmlContent && options.textContent) {
    const ratio = calculateTextToHtmlRatio(options.htmlContent, options.textContent)
    if (ratio < EMAIL_CONFIG.spamPrevention.minTextToHtmlRatio) {
      warnings.push(
        `Text-to-HTML ratio (${(ratio * 100).toFixed(1)}%) is below recommended minimum (${(EMAIL_CONFIG.spamPrevention.minTextToHtmlRatio * 100).toFixed(0)}%)`
      )
    }
  }
  
  // Check link count
  if (options.htmlContent) {
    const linkCount = countLinks(options.htmlContent)
    if (linkCount > EMAIL_CONFIG.spamPrevention.maxLinks) {
      warnings.push(
        `Email contains ${linkCount} links, which exceeds recommended maximum of ${EMAIL_CONFIG.spamPrevention.maxLinks}`
      )
    }
  }
  
  return warnings
}

/**
 * Sanitize email content to avoid spam filters
 */
export function sanitizeEmailContent(content: string): string {
  // Remove excessive exclamation marks (more than 2 in a row)
  let sanitized = content.replace(/!{3,}/g, '!!')
  
  // Remove excessive question marks
  sanitized = sanitized.replace(/\?{3,}/g, '??')
  
  // Remove all caps words (except acronyms like API, URL, etc.)
  // This is a simple version - you might want more sophisticated logic
  sanitized = sanitized.replace(/\b[A-Z]{4,}\b/g, (match) => {
    // Keep common acronyms
    const acronyms = ['API', 'URL', 'HTTP', 'HTTPS', 'HTML', 'CSS', 'JS', 'JSON', 'XML']
    if (acronyms.includes(match)) return match
    // Convert to title case
    return match.charAt(0) + match.slice(1).toLowerCase()
  })
  
  return sanitized
}

/**
 * Create email-safe subject line
 */
export function createSafeSubjectLine(subject: string): string {
  let safe = sanitizeEmailContent(subject)
  
  // Remove spam trigger words
  EMAIL_CONFIG.spamPrevention.spamTriggerWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    safe = safe.replace(regex, '')
  })
  
  // Clean up extra spaces
  safe = safe.replace(/\s+/g, ' ').trim()
  
  // Limit length (recommended max is 50 characters)
  if (safe.length > 50) {
    safe = safe.substring(0, 47) + '...'
  }
  
  return safe
}

