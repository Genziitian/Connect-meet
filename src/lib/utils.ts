// ============================================================
// GenZ IITian Connect — Utility Functions
// ============================================================

/**
 * Format date to relative time (e.g., "2 min ago")
 */
export function timeAgo(dateStr: string): string {
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
}

/**
 * Generate anonymous display name
 */
export function generateAnonName(): string {
  const adjectives = [
    'Curious', 'Brilliant', 'Focused', 'Creative', 'Studious',
    'Determined', 'Insightful', 'Dedicated', 'Innovative', 'Methodical',
    'Analytical', 'Persistent', 'Resourceful', 'Ambitious', 'Diligent',
  ];
  const nouns = [
    'Scholar', 'Learner', 'Thinker', 'Coder', 'Explorer',
    'Researcher', 'Student', 'Analyst', 'Builder', 'Solver',
    'Engineer', 'Scientist', 'Innovator', 'Pioneer', 'Seeker',
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999) + 1;
  return `${adj}${noun}${num}`;
}

/**
 * Hash IP address for logging (one-way)
 */
export async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + 'genziitian-salt-2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

/**
 * Validate IIT Madras email format
 */
export function isIITMEmail(email: string): boolean {
  const patterns = [
    /@ds\.study\.iitm\.ac\.in$/i,
    /@es\.study\.iitm\.ac\.in$/i,
    /@study\.iitm\.ac\.in$/i,
    /@smail\.iitm\.ac\.in$/i,
  ];
  return patterns.some(p => p.test(email));
}

/**
 * Format price in INR
 */
export function formatINR(amount: number): string {
  if (amount === 0) return 'Free';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format match count
 */
export function formatMatchCount(count: number, max: number): string {
  if (max === -1) return `${count} used (Unlimited)`;
  return `${count}/${max} today`;
}

/**
 * Generate session ID
 */
export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Simple profanity check (basic — should use AI in production)
 */
export function containsProfanity(text: string): boolean {
  const blockedPatterns = [
    /\b(abuse|explicit|inappropriate)\b/i,
    // In production, use a comprehensive ML-based toxicity detection
  ];
  return blockedPatterns.some(p => p.test(text));
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}

/**
 * CN utility for conditional classnames
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
