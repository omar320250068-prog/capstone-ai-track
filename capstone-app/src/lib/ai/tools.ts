// ---------------------------------------------------------------------------
// Server-side tool definitions — the tool definition file for the
// "generative UI" phase.
//
// Two read-only tools, both defined with a Zod input schema and an execute
// function, and both registered in the single `TOOLS` record that the route
// handler passes to streamText (real Claude) and that the local demo stream
// uses to execute calls honestly when no API key is set:
//
//   1. audit_repo — fetch a public GitHub repository from the live API and
//      score its health. The result renders as a score card with a ring
//      chart (generative UI, not a JSON dump).
//   2. site_meta  — fetch a public web page and extract its meta tags
//      (title/description/OG/favicon/lang). Renders as a findings table with
//      present/missing badges.
//
// Design rules applied (from the mentor tips):
//   - Schemas are small and honest: owner+repo, url. Nothing the model can
//     pad with guesses. Every field carries `.describe()` so the model (and
//     the reviewer reading the README contract) knows its meaning.
//   - Optional fields in the RETURN shape (license, favicon, CI state…)
//     have an explicit rendering plan in the client: "—" / "missing" badge /
//     "unverified" chip, never a blank cell or a thrown key error.
//   - Failure is a first-class designed state: every error path throws an
//     Error with a user-safe, actionable message, which the AI SDK surfaces
//     as a `tool-error` part -> the client's output-error panel. Nothing in
//     the success component is required to understand the error component.
//
// `server-only` keeps these schemas, the system-adjacent descriptions and
// the outbound fetch code out of the client bundle: only the rendered
// *result types* are consumed in components, as plain data.
// ---------------------------------------------------------------------------

import "server-only";

import { tool } from "ai";
import { z } from "zod";

/** Friendly timeout for outbound fetches (ms). */
const FETCH_TIMEOUT_MS = 10_000;

/** Cap page/html reads so a huge response cannot stall the stream (512 KB). */
const MAX_HTML_BYTES = 512 * 1024;

/**
 * Error thrown by the execute functions for every DESIGNED failure. The
 * message is user-safe and actionable. The route handler's `onError`
 * recognizes this type and forwards the message verbatim (instead of
 * wrapping it in transport-failure framing), so the client's output-error
 * panel shows exactly the crafted text.
 */
export class ToolExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolExecutionError";
  }
}

// ===========================================================================
// Tool 1 — audit_repo
// ===========================================================================

/**
 * Input schema for `audit_repo`. Deliberately two fields, both constrained
 * to the character set GitHub allows, each with model-facing guidance.
 */
export const auditRepoInputSchema = z.object({
  owner: z
    .string()
    .regex(/^[\w.-]{1,100}$/, "GitHub owner: letters, digits, dot, dash, underscore")
    .describe('GitHub owner (user or org), e.g. "vercel"'),
  repo: z
    .string()
    .regex(/^[\w.-]{1,100}$/, "Repository name: letters, digits, dot, dash, underscore")
    .describe('Repository name without .git, e.g. "next.js"'),
});

export type AuditRepoInput = z.infer<typeof auditRepoInputSchema>;

/** One row of the audit report. `level` drives the finding's color/icon. */
export type AuditFinding = {
  level: "info" | "warn" | "bad";
  label: string;
  detail: string;
};

/**
 * Return shape of `audit_repo`. Optional values are `null` and MUST render
 * as an explicit "not present" state in the UI (never an empty cell).
 */
export type AuditResult = {
  /** "owner/repo" — canonical display name. */
  repo: string;
  /** 0–100 health score (weighted checks below). */
  score: number;
  /** Letter grade bucket: A ≥ 85, B ≥ 70, C ≥ 50, else D. */
  grade: "A" | "B" | "C" | "D";
  /** One-sentence, human summary written by the tool (not the model). */
  summary: string;
  metrics: {
    stars: number;
    openIssues: number;
    /** ISO date of last push, or null when GitHub omits it. */
    lastPush: string | null;
    sizeKB: number;
    /** SPDX id, e.g. "mit". null = repository has no detected license. */
    license: string | null;
    /** null = repository has no default branch (empty repo). */
    defaultBranch: string | null;
    archived: boolean;
    /** true/false, or null when GitHub rate-limited the CI probe. */
    hasCI: boolean | null;
    description: string | null;
    /** Number of repository topics (0 is a valid, rendered value). */
    topics: number;
  };
  /** Only the checks that need attention — the card shows the rest. */
  findings: AuditFinding[];
  /** Wall-clock time the tool spent, for the card footer. */
  fetchedInMs: number;
};

/**
 * The weighted checks. Kept as data so the card can explain the score and
 * the README contract can quote it verbatim. Weights sum to 100.
 */
const AUDIT_CHECKS = {
  license: 10,
  notArchived: 15,
  recentPush: 20,
  ci: 15,
  hasStars: 10,
  manageableIssues: 10,
  hasDescription: 10,
  hasTopics: 10,
} as const;

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 86_400_000)) : null;
}

function gradeFor(score: number): AuditResult["grade"] {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  return "D";
}

/**
 * Execute `audit_repo`: one call to the repository endpoint plus one cheap
 * probe for `.github/workflows` (GitHub Actions presence). The probe is
 * best-effort — if it fails (rate limit), `hasCI` becomes null and an
 * "unverified" finding is emitted instead of a wrong `false`.
 */
export async function executeAuditRepo(input: AuditRepoInput): Promise<AuditResult> {
  const startedAt = Date.now();
  const { owner, repo } = auditRepoInputSchema.parse(input);
  const repoUrl = `https://api.github.com/repos/${owner}/${repo}`;

  let res: Response;
  try {
    res = await fetch(repoUrl, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "capstone-ai-track-tools/1.0",
      },
    });
  } catch (cause) {
    const timedOut = cause instanceof Error && cause.name === "TimeoutError";
    throw new ToolExecutionError(
      timedOut
        ? `api.github.com did not answer within ${FETCH_TIMEOUT_MS / 1000}s. The network may be slow — retry in a moment.`
        : `Could not reach api.github.com (${cause instanceof Error ? cause.message : String(cause)}).`,
    );
  }

  if (res.status === 404) {
    throw new ToolExecutionError(
      `GitHub returned 404 — "${owner}/${repo}" does not exist (or is private). Check the owner and repo names and try again.`,
    );
  }
  if (res.status === 403 || res.status === 429) {
    throw new ToolExecutionError(
      `GitHub rate-limited this server (HTTP ${res.status}). Unauthenticated previews get 60 requests/hour — wait a minute and retry.`,
    );
  }
  if (!res.ok) {
    throw new ToolExecutionError(`GitHub returned HTTP ${res.status} for "${owner}/${repo}".`);
  }

  const data = (await res.json()) as {
    stargazers_count?: number;
    open_issues_count?: number;
    pushed_at?: string | null;
    size?: number;
    license?: { spdx_id?: string | null } | null;
    default_branch?: string | null;
    archived?: boolean;
    description?: string | null;
    topics?: string[];
  };

  // Best-effort CI probe: does .github/workflows exist?
  let hasCI: boolean | null = null;
  try {
    const probe = await fetch(`${repoUrl}/contents/.github/workflows`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "capstone-ai-track-tools/1.0",
      },
    });
    if (probe.ok) hasCI = true;
    else if (probe.status === 404) hasCI = false;
    // 403/429 here stay null ("unverified") — see rendering plan.
  } catch {
    hasCI = null;
  }

  const stars = data.stargazers_count ?? 0;
  const openIssues = data.open_issues_count ?? 0;
  const lastPush = data.pushed_at ?? null;
  const license = data.license?.spdx_id ?? null;
  const defaultBranch = data.default_branch ?? null;
  const archived = data.archived === true;
  const description = data.description?.trim() || null;
  const topics = Array.isArray(data.topics) ? data.topics.length : 0;
  const pushAgeDays = daysSince(lastPush);

  const findings: AuditFinding[] = [];
  let score = 0;

  if (license) score += AUDIT_CHECKS.license;
  else
    findings.push({
      level: "warn",
      label: "No license detected",
      detail: "Collaborators cannot legally reuse the code.",
    });

  if (!archived) score += AUDIT_CHECKS.notArchived;
  else
    findings.push({
      level: "bad",
      label: "Repository is archived",
      detail: "Read-only: GitHub froze issues, PRs and pushes.",
    });

  if (pushAgeDays !== null && pushAgeDays <= 90) score += AUDIT_CHECKS.recentPush;
  else if (pushAgeDays !== null && pushAgeDays <= 180)
    findings.push({
      level: "warn",
      label: `Last push ${pushAgeDays} days ago`,
      detail: "Active within 6 months, but not this quarter.",
    });
  else
    findings.push({
      level: "bad",
      label: lastPush ? `Last push ${pushAgeDays} days ago` : "No push recorded",
      detail: "The project looks dormant — check for an active fork.",
    });

  if (hasCI === true) score += AUDIT_CHECKS.ci;
  else if (hasCI === false)
    findings.push({
      level: "warn",
      label: "No GitHub Actions workflows",
      detail: "No automated build/test pipeline detected.",
    });
  else
    findings.push({
      level: "info",
      label: "CI state unverified",
      detail: "GitHub rate-limited the workflow probe — not scored either way.",
    });

  if (stars > 0) score += AUDIT_CHECKS.hasStars;
  else
    findings.push({
      level: "info",
      label: "No stars yet",
      detail: "Fresh or low-visibility repository.",
    });

  if (openIssues <= 25) score += AUDIT_CHECKS.manageableIssues;
  else
    findings.push({
      level: "warn",
      label: `${openIssues} open issues`,
      detail: "Backlog above 25 — triage may be lagging.",
    });

  if (description) score += AUDIT_CHECKS.hasDescription;
  else
    findings.push({
      level: "warn",
      label: "No description",
      detail: "The repository page does not say what the project is.",
    });

  if (topics > 0) score += AUDIT_CHECKS.hasTopics;
  else
    findings.push({
      level: "info",
      label: "No topics",
      detail: "Topics help discovery on github.com/search.",
    });

  const grade = gradeFor(score);
  const summary = archived
    ? `"${owner}/${repo}" is archived — treat it as read-only regardless of its other signals.`
    : pushAgeDays !== null && pushAgeDays <= 90
      ? `Actively maintained (pushed ${pushAgeDays} day${pushAgeDays === 1 ? "" : "s"} ago) with a health score of ${score}/100.`
      : `Health score ${score}/100 — activity is the weak point (last push ${pushAgeDays ?? "unknown"} days ago).`;

  return {
    repo: `${owner}/${repo}`,
    score,
    grade,
    summary,
    metrics: {
      stars,
      openIssues,
      lastPush,
      sizeKB: data.size ?? 0,
      license,
      defaultBranch,
      archived,
      hasCI,
      description,
      topics,
    },
    findings,
    fetchedInMs: Date.now() - startedAt,
  };
}

// ===========================================================================
// Tool 2 — site_meta
// ===========================================================================

/** Input schema for `site_meta`: a single absolute http(s) URL. */
export const siteMetaInputSchema = z.object({
  url: z
    .url({ protocol: /^https?$/ })
    .max(2048)
    .describe('Absolute page URL, e.g. "https://example.com"'),
});

export type SiteMetaInput = z.infer<typeof siteMetaInputSchema>;

/**
 * Return shape of `site_meta`. Everything except `url`/`status`/`ok` may be
 * null (missing tag, blocked page, non-HTML content) — each null renders as
 * an explicit "missing" badge in the findings table.
 */
export type SiteMetaResult = {
  url: string;
  /** Final URL after redirects (null-safe: same as url when no redirect). */
  finalUrl: string;
  status: number;
  /** true when 2xx/3xx — the table's overall verdict. */
  ok: boolean;
  /** <title> text, trimmed. */
  title: string | null;
  /** meta name="description". */
  description: string | null;
  /** meta property="og:title". */
  ogTitle: string | null;
  /** meta property="og:image". */
  ogImage: string | null;
  /** href of <link rel="*icon*">, absolutized against the page URL. */
  favicon: string | null;
  /** <html lang="…">. */
  lang: string | null;
  fetchedInMs: number;
};

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/** Parse `key="value"` attributes out of one already-matched HTML tag. */
function tagAttributes(tag: string): Map<string, string> {
  const attrs = new Map<string, string>();
  const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;
  while ((match = attrRe.exec(tag)) !== null) {
    attrs.set(match[1].toLowerCase(), decodeEntities(match[2] ?? match[3] ?? ""));
  }
  return attrs;
}

/** Find a <meta> tag whose name or property equals `key` (case-insensitive). */
function metaContent(html: string, key: string): string | null {
  const metaRe = /<meta\s[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = metaRe.exec(html)) !== null) {
    const attrs = tagAttributes(match[0]);
    const name = (attrs.get("name") ?? attrs.get("property") ?? "").toLowerCase();
    if (name === key) {
      const content = attrs.get("content");
      if (content) return content;
    }
  }
  return null;
}

/** href of the first <link> whose rel contains `needle` (e.g. "icon"). */
function linkHref(html: string, needle: string): string | null {
  const linkRe = /<link\s[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = linkRe.exec(html)) !== null) {
    const attrs = tagAttributes(match[0]);
    const rel = (attrs.get("rel") ?? "").toLowerCase();
    const href = attrs.get("href");
    if (href && rel.split(/\s+/).some((token) => token.includes(needle))) return href;
  }
  return null;
}

function absolutize(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

/**
 * Execute `site_meta`: fetch the page, read up to 512 KB of HTML, and pull
 * the seven tags the table renders. Non-HTML content types and non-ok
 * statuses throw designed, user-readable errors (the error panel path).
 */
export async function executeSiteMeta(input: SiteMetaInput): Promise<SiteMetaResult> {
  const startedAt = Date.now();
  const { url } = siteMetaInputSchema.parse(input);

  let res: Response;
  try {
    res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "capstone-ai-track-tools/1.0 (+capstone)",
      },
    });
  } catch (cause) {
    const timedOut = cause instanceof Error && cause.name === "TimeoutError";
    throw new ToolExecutionError(
      timedOut
        ? `"${url}" did not answer within ${FETCH_TIMEOUT_MS / 1000}s. Retry, or try a faster page.`
        : `"${url}" could not be fetched (${cause instanceof Error ? cause.message : String(cause)}). Check the URL and your network.`,
    );
  }

  if (!res.ok) {
    throw new ToolExecutionError(
      `"${url}" responded with HTTP ${res.status} ${res.statusText || ""}`.trim() +
        " — meta tags were not read. Try a URL that returns 200.",
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType && !/text\/html|application\/xhtml\+xml/i.test(contentType)) {
    throw new ToolExecutionError(
      `"${url}" is not an HTML page (content-type: ${contentType.split(";")[0]}). The site_meta tool reads HTML meta tags only.`,
    );
  }

  const html = (await res.text()).slice(0, MAX_HTML_BYTES);
  const finalUrl = res.url || url;

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const langMatch = html.match(/<html[^>]*\slang\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  const faviconHref = linkHref(html, "icon");

  return {
    url,
    finalUrl,
    status: res.status,
    ok: res.ok,
    title: titleMatch ? decodeEntities(titleMatch[1]) || null : null,
    description: metaContent(html, "description"),
    ogTitle: metaContent(html, "og:title"),
    ogImage: metaContent(html, "og:image"),
    favicon: faviconHref ? absolutize(faviconHref, finalUrl) : null,
    lang: langMatch ? decodeEntities(langMatch[1] ?? langMatch[2] ?? "") || null : null,
    fetchedInMs: Date.now() - startedAt,
  };
}

// ===========================================================================
// The registered tool set
// ===========================================================================

/**
 * The tool record the route handler hands to streamText. The same record is
 * the contract the local demo stream honors: it validates inputs against
 * these schemas and calls these exact execute functions, so only the model's
 * *decision* to call a tool is mocked — the tool itself always really runs.
 */
export const TOOLS = {
  audit_repo: tool({
    description:
      "Audit a public GitHub repository against the live GitHub API: health score (0-100), " +
      "letter grade, metrics (stars, open issues, last push, license, CI) and only the findings " +
      "that need attention. Use when the reviewer asks to check, score or review a repository.",
    inputSchema: auditRepoInputSchema,
    execute: executeAuditRepo,
  }),
  site_meta: tool({
    description:
      "Fetch a public web page and extract its meta tags: title, description, og:title, og:image, " +
      "favicon, lang and HTTP status. Use when the reviewer asks about a URL's meta tags, SEO or " +
      "what a page reports about itself.",
    inputSchema: siteMetaInputSchema,
    execute: executeSiteMeta,
  }),
};

export type ChatTools = typeof TOOLS;
