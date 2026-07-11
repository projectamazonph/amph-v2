import { describe, it, expect } from 'vitest';
import { renderLesson } from '@/lib/mdx';

describe('mdx.ts — renderLesson', () => {
  it('renders plain text as a paragraph', () => {
    expect(renderLesson('Hello world')).toBe('<p>Hello world</p>');
  });

  it('renders multiple paragraphs separated by blank lines', () => {
    const input = 'First paragraph.\n\nSecond paragraph.';
    const result = renderLesson(input);
    expect(result).toContain('<p>First paragraph.</p>');
    expect(result).toContain('<p>Second paragraph.</p>');
  });

  it('renders headings h1 through h4', () => {
    expect(renderLesson('# Title')).toBe('<h1>Title</h1>');
    expect(renderLesson('## Section')).toBe('<h2>Section</h2>');
    expect(renderLesson('### Subsection')).toBe('<h3>Subsection</h3>');
    expect(renderLesson('#### Detail')).toBe('<h4>Detail</h4>');
  });

  it('renders bold text', () => {
    expect(renderLesson('This is **bold** text')).toBe('<p>This is <strong>bold</strong> text</p>');
  });

  it('renders italic text', () => {
    expect(renderLesson('This is *italic* text')).toBe('<p>This is <em>italic</em> text</p>');
  });

  it('renders inline code', () => {
    expect(renderLesson('Use the `renderLesson` function')).toBe('<p>Use the <code>renderLesson</code> function</p>');
  });

  it('renders code blocks', () => {
    const input = '```\nconst x = 1;\nconst y = 2;\n```';
    const result = renderLesson(input);
    expect(result).toContain('<pre><code>');
    expect(result).toContain('const x = 1;');
    expect(result).toContain('const y = 2;');
    expect(result).toContain('</code></pre>');
  });

  it('renders bullet lists', () => {
    const input = '- Item one\n- Item two\n- Item three';
    const result = renderLesson(input);
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>Item one</li>');
    expect(result).toContain('<li>Item two</li>');
    expect(result).toContain('<li>Item three</li>');
    expect(result).toContain('</ul>');
  });

  it('renders blockquotes', () => {
    expect(renderLesson('> A wise quote')).toBe('<blockquote>A wise quote</blockquote>');
  });

  it('renders horizontal rules', () => {
    expect(renderLesson('---')).toBe('<hr />');
    expect(renderLesson('***')).toBe('<hr />');
  });

  it('HTML-escapes dangerous characters', () => {
    const result = renderLesson('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('handles combined formatting', () => {
    const result = renderLesson('# Welcome\n\nThis is **bold** and *italic* with `code`.');
    expect(result).toContain('<h1>Welcome</h1>');
    expect(result).toContain('<p>This is <strong>bold</strong> and <em>italic</em> with <code>code</code>.</p>');
  });

  it('handles unclosed code block by closing at end', () => {
    const input = '```\nconst x = 1;\n\nconst y = 2;';
    const result = renderLesson(input);
    expect(result).toContain('<pre><code>');
    expect(result).toContain('const x = 1');
    expect(result).toContain('const y = 2');
    expect(result).toContain('</code></pre>');
  });

  it('returns empty string for empty input', () => {
    expect(renderLesson('')).toBe('');
  });

  it('trims leading/trailing whitespace per line', () => {
    expect(renderLesson('  Hello   world  ')).toBe('<p>Hello   world</p>');
  });

  it('handles mixed list items with asterisk', () => {
    const input = '* Item A\n* Item B';
    const result = renderLesson(input);
    expect(result).toContain('<li>Item A</li>');
    expect(result).toContain('<li>Item B</li>');
  });
});
