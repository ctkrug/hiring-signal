import type { RemoteType } from "./types";

/**
 * Keyword -> canonical tag. Keys are matched case-insensitively as whole
 * words/phrases against the posting text; values are what gets shown/filtered on.
 * Ordered roughly by frequency in "Who is hiring" threads.
 */
const STACK_KEYWORDS: Record<string, string> = {
  typescript: "TypeScript",
  javascript: "JavaScript",
  "node.js": "Node.js",
  nodejs: "Node.js",
  react: "React",
  "react native": "React Native",
  vue: "Vue",
  angular: "Angular",
  svelte: "Svelte",
  python: "Python",
  django: "Django",
  flask: "Flask",
  ruby: "Ruby",
  rails: "Rails",
  go: "Go",
  golang: "Go",
  rust: "Rust",
  java: "Java",
  kotlin: "Kotlin",
  swift: "Swift",
  "c++": "C++",
  "c#": "C#",
  php: "PHP",
  laravel: "Laravel",
  elixir: "Elixir",
  scala: "Scala",
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  mongodb: "MongoDB",
  redis: "Redis",
  graphql: "GraphQL",
  kubernetes: "Kubernetes",
  k8s: "Kubernetes",
  docker: "Docker",
  aws: "AWS",
  gcp: "GCP",
  azure: "Azure",
  terraform: "Terraform",
};

const REMOTE_PATTERNS: Array<{ type: RemoteType; pattern: RegExp }> = [
  { type: "hybrid", pattern: /\bhybrid\b/i },
  { type: "remote", pattern: /\b(remote|remote[- ]first|distributed|work from home|wfh)\b/i },
  { type: "onsite", pattern: /\b(onsite|on-site|in[- ]office|no remote)\b/i },
];

const SENIORITY_KEYWORDS: Record<string, string> = {
  intern: "Intern",
  internship: "Intern",
  junior: "Junior",
  "entry level": "Entry Level",
  "entry-level": "Entry Level",
  "new grad": "Entry Level",
  mid: "Mid",
  "mid-level": "Mid",
  senior: "Senior",
  "sr.": "Senior",
  staff: "Staff",
  principal: "Principal",
  lead: "Lead",
  director: "Director",
};

/** Word-boundary safe match for a keyword that may contain regex-special chars. */
function includesKeyword(haystack: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i").test(haystack);
}

export function extractStack(text: string): string[] {
  const found = new Set<string>();
  for (const [keyword, tag] of Object.entries(STACK_KEYWORDS)) {
    if (includesKeyword(text, keyword)) found.add(tag);
  }
  return [...found].sort();
}

export function extractRemote(text: string): RemoteType {
  for (const { type, pattern } of REMOTE_PATTERNS) {
    if (pattern.test(text)) return type;
  }
  return "unknown";
}

export function extractSeniority(text: string): string[] {
  const found = new Set<string>();
  for (const [keyword, tag] of Object.entries(SENIORITY_KEYWORDS)) {
    if (includesKeyword(text, keyword)) found.add(tag);
  }
  return [...found].sort();
}
