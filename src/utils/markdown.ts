/**
 * Render markdown content to HTML for display using a custom parser
 * @param content - The content to render (could be markdown or plain text)
 * @param parser - Custom markdown parser function
 * @returns Rendered HTML string
 */
export function renderMarkdown(content: string, parser: (markdown: string) => string): string {
  if (!content) return ''
  if (!parser) return escapeHtml(content)

  // Check if content contains markdown syntax
  if (hasMarkdownSyntax(content)) {
    return parser(content)
  }

  // If no markdown syntax, return as plain text (escaped)
  return escapeHtml(content)
}

/**
 * Check if text contains markdown syntax
 * @param text - Text to check
 * @returns True if markdown syntax is detected
 */
export function hasMarkdownSyntax(text: string): boolean {
  if (!text) return false

  // Common markdown patterns
  const markdownPatterns = [
    /\*\*.*?\*\*/, // Bold
    /\*.*?\*/, // Italic
    /__.*?__/, // Bold (underscore)
    /_.*?_/, // Italic (underscore)
    /`.*?`/, // Inline code
    /\[.*?\]\(.*?\)/, // Links
    /!\[.*?\]\(.*?\)/, // Images
    /^#{1,6}\s/, // Headers
    /^>\s/, // Blockquotes
    /^[*\-+]\s/, // Unordered lists
    /^\d+\.\s/, // Ordered lists
    /```[\s\S]*?```/, // Code blocks
    /~~.*?~~/, // Strikethrough
  ]

  return markdownPatterns.some(pattern => pattern.test(text))
}

/**
 * Escape HTML characters
 * @param text - Text to escape
 * @returns Escaped text
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Strip HTML tags from text
 * @param html - HTML string
 * @returns Plain text
 */
export function stripHtml(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

/**
 * Check if content is likely HTML
 * @param content - Content to check
 * @returns True if content appears to be HTML
 */
export function isHtml(content: string): boolean {
  return /<[^>]+>/.test(content)
}
