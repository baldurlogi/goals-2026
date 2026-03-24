import type { GoalStep, UserGoalStep } from "./goalTypes";

const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"')\]]+/gi;
const DOMAIN_PATTERN = /\b(?:[\w-]+\.)+[a-z]{2,}(?:\/[^\s<>"')\]]*)?/gi;
const BARE_DOMAIN_PATTERN =
  /^(?:[\w-]+\.)+[a-z]{2,}(?:\/[^\s]*)?$/i;

export type ParsedStepDetails = {
  guidance: string[];
  doneWhen: string | null;
  links: string[];
};

function dedupe(values: string[]) {
  return Array.from(new Set(values));
}

export function normalizeStepLink(href: string): string | null {
  const trimmed = href.trim().replace(/[),.;]+$/, "");
  if (!trimmed) return null;

  const withProtocol =
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
      ? trimmed
      : trimmed.startsWith("www.") || BARE_DOMAIN_PATTERN.test(trimmed)
        ? `https://${trimmed}`
        : null;

  if (!withProtocol) return null;

  try {
    return new URL(withProtocol).toString();
  } catch {
    return null;
  }
}

export function prettyStepLink(href: string) {
  try {
    const url = new URL(href);
    const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
    return `${url.hostname}${path}`;
  } catch {
    return href.replace(/^https?:\/\//, "");
  }
}

export function parseStepLinksInput(value: string): string[] {
  return dedupe(
    value
      .split(/\r?\n|,/)
      .map((item) => normalizeStepLink(item))
      .filter((item): item is string => Boolean(item)),
  );
}

export function buildStepNotes(
  guidanceText: string,
  doneWhenText?: string | null,
) {
  const guidance = guidanceText.trim();
  const doneWhen = doneWhenText?.trim() ?? "";

  return [guidance, doneWhen ? `Done when: ${doneWhen}` : ""]
    .filter(Boolean)
    .join("\n\n");
}

function extractLinks(text: string) {
  return dedupe(
    Array.from(text.matchAll(new RegExp(`${URL_PATTERN.source}|${DOMAIN_PATTERN.source}`, "gi")))
      .map((match) => normalizeStepLink(match[0]))
      .filter((item): item is string => Boolean(item)),
  );
}

export function parseStepDetails(
  step: Pick<GoalStep, "notes" | "links"> | Pick<UserGoalStep, "notes" | "links">,
): ParsedStepDetails {
  const rawNotes = typeof step.notes === "string" ? step.notes.trim() : "";
  const doneWhenMatch = rawNotes.match(
    /done when\s*[:\-]?\s*([\s\S]*?)(?=(?:\n\s*(?:links?|resources?)\s*:)|$)/i,
  );
  const doneWhen = doneWhenMatch?.[1].trim() || null;

  const linksSectionMatch = rawNotes.match(
    /(?:^|\n)\s*(?:links?|resources?)\s*:\s*([\s\S]*)$/i,
  );
  const notesWithoutLinks = linksSectionMatch
    ? rawNotes.replace(linksSectionMatch[0], "").trim()
    : rawNotes;
  const notesWithoutDoneWhen = doneWhenMatch
    ? notesWithoutLinks.replace(doneWhenMatch[0], "").trim()
    : notesWithoutLinks;

  const links = dedupe([
    ...((step.links ?? [])
      .map((href) => normalizeStepLink(href))
      .filter((href): href is string => Boolean(href))),
    ...extractLinks(linksSectionMatch?.[1] ?? ""),
    ...extractLinks(rawNotes),
  ]);

  const guidance = notesWithoutDoneWhen
    .replace(new RegExp(`${URL_PATTERN.source}|${DOMAIN_PATTERN.source}`, "gi"), "")
    .split(/\r?\n+/)
    .map((line) => line.replace(/^\s*how\s*:?\s*/i, ""))
    .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
    .filter((line) => Boolean(line) && !/^links?\s*:?\s*$/i.test(line));

  return {
    guidance,
    doneWhen,
    links,
  };
}
