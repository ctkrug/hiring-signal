const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Formats a thread's ISO created-at timestamp as a human month label (e.g.
 * "July 2026") for the month picker. Derived from the date rather than
 * parsed out of the thread title, since titles vary slightly across months
 * ("Who is hiring?" vs "Who is Hiring?", trailing punctuation, etc).
 */
export function formatMonthLabel(isoDate: string): string {
  const date = new Date(isoDate);
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
