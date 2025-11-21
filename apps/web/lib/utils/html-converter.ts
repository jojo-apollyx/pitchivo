/**
 * Utilities for converting between HTML and rich text formats
 */

/**
 * Cleans up HTML content for editing in rich text editor
 * - Preserves structure and formatting
 * - Maintains placeholders
 * - Ensures compatibility with Tiptap
 */
export function cleanHtmlForEditor(html: string): string {
  if (!html) return ''
  
  // Remove extra whitespace but preserve structure
  let cleaned = html.trim()
  
  // Ensure proper paragraph structure
  if (!cleaned.startsWith('<')) {
    // Plain text - wrap in paragraph
    cleaned = `<p>${cleaned}</p>`
  }
  
  return cleaned
}

/**
 * Prepares HTML content for sending to Smartlead
 * - Ensures proper formatting
 * - Preserves placeholders
 */
export function prepareHtmlForSmartlead(html: string): string {
  if (!html) return ''
  
  // Remove empty paragraphs at the end
  let cleaned = html.replace(/<p><\/p>\s*$/g, '')
  
  // Ensure there's at least some content
  if (!cleaned || cleaned === '<p></p>') {
    return ''
  }
  
  return cleaned
}

/**
 * Extracts plain text from HTML (for previews)
 */
export function extractPlainText(html: string, maxLength?: number): string {
  if (!html) return ''
  
  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, '')
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  
  // Trim whitespace
  text = text.trim()
  
  // Truncate if needed
  if (maxLength && text.length > maxLength) {
    text = text.substring(0, maxLength) + '...'
  }
  
  return text
}

/**
 * Checks if HTML content is empty
 */
export function isHtmlEmpty(html: string): boolean {
  if (!html) return true
  
  const text = extractPlainText(html)
  return text.length === 0
}

