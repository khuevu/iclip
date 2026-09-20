import { ClipboardItem, ContentType } from '../types';

export function detectContentType(text: string): ContentType {
  const trimmed = text.trim();

  // URL detection
  if (/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(trimmed)) {
    return 'url';
  }

  // Email detection
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'email';
  }

  // Hex color detection
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8})$/.test(trimmed)) {
    return 'color';
  }

  // JSON detection
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // not valid json, fall through
    }
  }

  // Code detection heuristics
  const codePatterns = [
    /^(import|export|const|let|var|function|class|interface|type|def|return|public|private)\s+/m,
    /[{}();=>]/m,
    /<([a-z]+)([^<]+)*(?:>(.*)<\/\1>|\s+\/>)/s,
    /^\s*(npm|pnpm|yarn|git|docker|curl|cd|ls|cat|brew)\s+/m
  ];
  if (codePatterns.some((pattern) => pattern.test(trimmed)) && (trimmed.includes('\n') || trimmed.length > 25)) {
    return 'code';
  }

  return 'text';
}

export function createClipboardItem(text: string, sourceApp = 'System Clipboard', pinned = false): ClipboardItem {
  const lines = text.split('\n');
  const words = text.trim().split(/\s+/).filter(Boolean);

  return {
    id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    copiedAt: Date.now(),
    sourceApp,
    type: detectContentType(text),
    pinned,
    charCount: text.length,
    wordCount: words.length,
    lineCount: lines.length,
  };
}

export function formatTimeAgo(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${Math.floor(diffHour / 24)}d ago`;
}

export function transformText(text: string, format: 'uppercase' | 'lowercase' | 'titlecase' | 'trim' | 'json' | 'slug' | 'cleanWhitespace'): string {
  switch (format) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'titlecase':
      return text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
    case 'trim':
      return text.trim();
    case 'slug':
      return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    case 'json':
      try {
        const parsed = JSON.parse(text);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return text;
      }
    case 'cleanWhitespace':
      return text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
    default:
      return text;
  }
}
