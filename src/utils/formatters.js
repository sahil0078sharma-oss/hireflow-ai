/**
 * Shared formatting utilities.
 * Keeps display formatting logic out of components.
 */

/**
 * Format a date string (YYYY-MM-DD) to a readable label.
 * @param {string} dateStr
 * @returns {string} e.g. "Sep 15, 2025"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Calculate days remaining until a deadline.
 * @param {string} deadlineStr - YYYY-MM-DD
 * @returns {number} days remaining (negative if past)
 */
export function daysUntil(deadlineStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(deadlineStr + 'T00:00:00');
  return Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
}

/**
 * Return a badge color class based on deadline urgency.
 * @param {string} deadlineStr
 * @returns {'urgent' | 'warning' | 'safe'}
 */
export function deadlineUrgency(deadlineStr) {
  const days = daysUntil(deadlineStr);
  if (days <= 7) return 'urgent';
  if (days <= 14) return 'warning';
  return 'safe';
}

/**
 * Truncate text to a max length with ellipsis.
 * @param {string} text
 * @param {number} maxLen
 * @returns {string}
 */
export function truncate(text, maxLen = 120) {
  if (!text || text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '…';
}

/**
 * Get initials from a full name.
 * @param {string} name
 * @returns {string} e.g. "Sahil Sharma" → "SS"
 */
export function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/**
 * Format a package string cleanly.
 * @param {string} pkg
 * @returns {string}
 */
export function formatPackage(pkg) {
  return pkg || 'Not disclosed';
}
