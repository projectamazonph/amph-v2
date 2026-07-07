/**
 * Lightweight MDX → HTML renderer.
 *
 * Handles the markdown subset we use in lessons:
 *   - Headings (# ## ### ####)
 *   - Paragraphs
 *   - Bold/italic (**text**, *text*)
 *   - Inline code (`code`) and code blocks (```)
 *   - Bullet lists (- item)
 *   - Blockquotes (> text)
 *   - Horizontal rules (---)
 *
 * No JSX components — pure markdown. For interactive components
 * (e.g., drag-drop simulations) we'll need a real MDX setup, but the
 * current AMPH content is markdown-only.
 *
 * Security: all output is HTML-escaped. No raw HTML passes through.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInline(text: string): string {
  let out = escapeHtml(text);
  // Bold
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic
  out = out.replace(/(?<!\w)\*([^*]+)\*(?!\w)/g, '<em>$1</em>');
  // Inline code
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  return out;
}

export function renderLesson(markdown: string): string {
  const lines = markdown.split('\n');
  const html: string[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let inList = false;
  let inParagraph = false;
  let paragraphBuffer: string[] = [];

  function flushParagraph() {
    if (paragraphBuffer.length > 0) {
      const text = paragraphBuffer.join(' ').trim();
      if (text) {
        html.push(`<p>${renderInline(text)}</p>`);
      }
      paragraphBuffer = [];
    }
    inParagraph = false;
  }

  function flushList() {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  }

  for (const line of lines) {
    // Code blocks
    if (line.trim().startsWith('```')) {
      flushParagraph();
      flushList();
      if (inCodeBlock) {
        html.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
        inCodeBlock = false;
        codeBuffer = [];
      } else {
        inCodeBlock = true;
        codeBuffer = [];
      }
      continue;
    }
    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      const text = renderInline(headingMatch[2].trim());
      html.push(`<h${level}>${text}</h${level}>`);
      continue;
    }

    // Horizontal rule
    if (line.trim() === '---' || line.trim() === '***') {
      flushParagraph();
      flushList();
      html.push('<hr />');
      continue;
    }

    // Blockquote
    const blockquoteMatch = line.match(/^>\s*(.*)$/);
    if (blockquoteMatch) {
      flushParagraph();
      flushList();
      html.push(`<blockquote>${renderInline(blockquoteMatch[1])}</blockquote>`);
      continue;
    }

    // Bullet list
    const listMatch = line.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${renderInline(listMatch[1])}</li>`);
      continue;
    }

    // Empty line: end current block
    if (line.trim() === '') {
      flushParagraph();
      flushList();
      continue;
    }

    // Plain text: accumulate paragraph
    inParagraph = true;
    paragraphBuffer.push(line.trim());
  }

  // Final flush
  flushParagraph();
  flushList();
  if (inCodeBlock) {
    html.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
  }

  return html.join('\n');
}