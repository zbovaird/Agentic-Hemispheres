/**
 * Pure string utilities. No external dependencies.
 * RFC 5322 subset for email validation. Idempotent slugify.
 */

/** RFC 5322 subset: local@domain with basic structure */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

/**
 * Validates email against RFC 5322 subset.
 * @param email - Input string to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== "string" || email.length === 0) return false;
  if ((email.match(/@/g) || []).length !== 1) return false;
  return EMAIL_REGEX.test(email);
}

/**
 * Converts string to URL-safe slug. Idempotent.
 * Strips non-ASCII, lowercases, replaces non-alphanumeric with single hyphens.
 * @param input - Input string
 * @returns slug string
 */
export function slugify(input: string): string {
  if (typeof input !== "string") return "";
  let s = input
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return s;
}
