import { marked } from "marked";

// Single newlines become <br>, like Rails' simple_format on the old site.
marked.use({ breaks: true, gfm: true });

export function md(text?: string | null): string {
  if (!text) return "";
  return marked.parse(text, { async: false }) as string;
}
