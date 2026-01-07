// NotebookLM2Anki - Utility Functions

/**
 * Unescape HTML entities in a string
 */
export function unescapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

/**
 * Generate a random ID for Anki models/decks
 */
export function generateId() {
  return Math.floor(Math.random() * (2 ** 31 - 2 ** 30) + 2 ** 30);
}

/**
 * Generate a GUID for Anki notes
 */
export function generateGuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Clean math notation for Anki (convert $$ to \[ \] format)
 */
export function cleanMath(str) {
  if (!str) return "";
  // Convert Block Math: $$ ... $$ -> \[ ... \]
  let s = str.replace(/\$\$(.*?)\$\$/gs, '\\[$1\\]');
  // Convert Inline Math: $ ... $ -> \( ... \)
  s = s.replace(/\$((?:[^$]|\\$)+?)\$/g, '\\($1\\)');
  // Convert Code: `...` -> <code>...</code>
  s = s.replace(/`([^`]+)`/g, '<code class="latex-snippet">$1</code>');
  return s;
}

/**
 * Escape CSV value (handle quotes and commas)
 */
export function escapeCSV(value) {
  if (!value) return '""';
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Sanitize deck name (remove invalid characters)
 */
export function sanitizeDeckName(name) {
  if (!name) return "Unknown Notebook";
  // Replace :: with - to avoid Anki subdeck issues, trim whitespace
  return name.replace(/::/g, " - ").trim();
}

/**
 * Parse JSON safely with HTML entity decoding
 */
export function parseAppData(jsonString) {
  try {
    const cleanJson = unescapeHtml(jsonString);
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("[NotebookLM2Anki] JSON parse error:", e);
    return null;
  }
}

/**
 * Download a file in the browser
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get current timestamp in ISO format
 */
export function getTimestamp() {
  return new Date().toISOString();
}
