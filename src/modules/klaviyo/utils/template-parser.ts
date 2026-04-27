/**
 * Heuristic section-extractor for Klaviyo drag-and-drop templates.
 *
 * Klaviyo's saved templates are heavy nested-table HTML. The actual
 * visual structure is encoded as top-level <tr> rows inside a content
 * <table> nested several levels into the body. Each top-level <tr>
 * usually corresponds to one visual section: a hero image, a body
 * block, a product grid, a CTA, a footer.
 *
 * The parser doesn't try to map sections to our React-Email block
 * taxonomy — that's a design judgment and lives in the (manual)
 * translation step. Here we just detect boundaries and pull out the
 * content for each section so the human translator (or an AI-assisted
 * step downstream) has clean inputs to work from.
 */
import { JSDOM } from "jsdom";

export interface ParsedSection {
  index: number;
  /**
   * Heuristic classification — `hero` if the section is dominated by a
   * single image; `text` if it's mostly typography; `image+text` for
   * mixed; `grid` if it has 2+ columns of images; `button` if it's a
   * stand-alone CTA; `unknown` otherwise. Translator overrides as needed.
   */
  guess:
    | "hero"
    | "text"
    | "image_text"
    | "grid"
    | "button"
    | "spacer"
    | "footer"
    | "unknown";
  text: string;
  imageUrls: string[];
  buttonLabels: string[];
  buttonHrefs: string[];
  /** Background and foreground colors found anywhere in this section. */
  colors: string[];
  /** Inner HTML of the section, lightly normalised for readability. */
  html: string;
}

export interface ParsedTemplate {
  sections: ParsedSection[];
  /** Every distinct color found in the template, sorted by frequency desc. */
  colorPalette: Array<{ color: string; count: number }>;
}

const COLOR_RE = /#[0-9a-f]{3,8}\b|rgba?\([^)]+\)/gi;

export function parseTemplateHtml(html: string): ParsedTemplate {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const contentTable = findContentTable(doc);
  const rows = contentTable
    ? Array.from(contentTable.querySelectorAll(":scope > tbody > tr, :scope > tr"))
    : [];

  const sections: ParsedSection[] = rows.map((row, index) =>
    extractSection(row as Element, index),
  );

  const colorPalette = collectColors(doc);

  return { sections, colorPalette };
}

/**
 * Klaviyo's layout typically wraps content in 2-3 outer tables before
 * reaching the table whose rows are the visual sections. The strategy
 * is: walk down `<table>` descendants looking for the first one whose
 * direct child rows have meaningful content (text, images, or
 * background colors) — that's the layout table.
 */
function findContentTable(doc: Document): Element | null {
  const tables = Array.from(doc.querySelectorAll("table"));
  let best: { table: Element; score: number } | null = null;
  for (const table of tables) {
    const rows = Array.from(
      table.querySelectorAll(":scope > tbody > tr, :scope > tr"),
    );
    if (rows.length < 2) continue;
    const score = rows.reduce((acc, row) => acc + scoreRow(row as Element), 0);
    if (score > 0 && (!best || score > best.score)) {
      best = { table, score };
    }
  }
  return best?.table ?? null;
}

function scoreRow(row: Element): number {
  const text = (row.textContent ?? "").replace(/\s+/g, " ").trim();
  const images = row.querySelectorAll("img").length;
  const hasButton = row.querySelector('a[style*="background-color"], a[style*="background"]');
  let score = 0;
  if (text.length > 5) score += Math.min(10, Math.floor(text.length / 50) + 1);
  score += images * 3;
  if (hasButton) score += 4;
  return score;
}

function extractSection(row: Element, index: number): ParsedSection {
  const text = (row.textContent ?? "").replace(/\s+/g, " ").trim();
  const imgs = Array.from(row.querySelectorAll("img"));
  const imageUrls = imgs
    .map((img) => img.getAttribute("src") ?? "")
    .filter((s) => s.length > 0);

  const buttons = Array.from(
    row.querySelectorAll('a[style*="background"], a[style*="border"]'),
  ).filter((a) => {
    const t = (a.textContent ?? "").trim();
    // Filter out plain inline links. Real buttons have padding / a bg / a border.
    return t.length > 0 && t.length < 60;
  });
  const buttonLabels = buttons.map((a) => (a.textContent ?? "").trim());
  const buttonHrefs = buttons.map((a) => a.getAttribute("href") ?? "");

  const colors = uniqueColorsIn(row);
  const html = serialiseSection(row);

  return {
    index,
    guess: guessKind({ text, imageUrls, buttons }),
    text,
    imageUrls,
    buttonLabels,
    buttonHrefs,
    colors,
    html,
  };
}

function guessKind(input: {
  text: string;
  imageUrls: string[];
  buttons: Element[];
}): ParsedSection["guess"] {
  const { text, imageUrls, buttons } = input;
  const textLen = text.length;
  if (imageUrls.length >= 2) return "grid";
  if (textLen === 0 && imageUrls.length === 0 && buttons.length === 0)
    return "spacer";
  if (imageUrls.length === 1 && textLen < 30 && buttons.length === 0)
    return "hero";
  if (imageUrls.length === 0 && textLen > 0 && buttons.length === 0)
    return "text";
  if (imageUrls.length === 0 && buttons.length > 0 && textLen < 60)
    return "button";
  if (imageUrls.length >= 1 && textLen > 0) return "image_text";
  // Footer heuristic — long blocks of text near the end with link-heavy content.
  if (textLen > 200 && imageUrls.length === 0) return "footer";
  return "unknown";
}

function uniqueColorsIn(el: Element): string[] {
  const out = new Set<string>();
  const walk = (node: Element) => {
    const style = node.getAttribute("style") ?? "";
    const matches = style.match(COLOR_RE) ?? [];
    for (const m of matches) out.add(normaliseColor(m));
    const bgcolor = node.getAttribute("bgcolor");
    if (bgcolor) out.add(normaliseColor(bgcolor));
    for (const child of Array.from(node.children)) walk(child);
  };
  walk(el);
  return Array.from(out);
}

function collectColors(doc: Document): ParsedTemplate["colorPalette"] {
  const counts = new Map<string, number>();
  const tally = (color: string) => {
    const key = normaliseColor(color);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  };
  for (const el of Array.from(doc.querySelectorAll("[style]"))) {
    const style = el.getAttribute("style") ?? "";
    const matches = style.match(COLOR_RE) ?? [];
    for (const m of matches) tally(m);
  }
  for (const el of Array.from(doc.querySelectorAll("[bgcolor]"))) {
    const bg = el.getAttribute("bgcolor");
    if (bg) tally(bg);
  }
  return Array.from(counts.entries())
    .map(([color, count]) => ({ color, count }))
    .sort((a, b) => b.count - a.count);
}

function normaliseColor(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.startsWith("#") && trimmed.length === 4) {
    // Expand #abc → #aabbcc so we don't double-count short and long forms.
    const [r, g, b] = trimmed.slice(1);
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  // Klaviyo writes #FFFFFF and #ffffff interchangeably; lowercase canonical.
  return trimmed;
}

function serialiseSection(row: Element): string {
  // Trim hyper-noisy attributes (style is what matters; class/dir/role pollute).
  const clone = row.cloneNode(true) as Element;
  for (const node of Array.from(clone.querySelectorAll("[class], [role], [dir], [lang]"))) {
    node.removeAttribute("class");
    node.removeAttribute("role");
    node.removeAttribute("dir");
    node.removeAttribute("lang");
  }
  return (clone.outerHTML ?? "").replace(/\s+/g, " ").trim();
}
