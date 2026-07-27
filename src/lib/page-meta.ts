// Server-side page TITLE for a source (D-102: a pasted link is provenance, not a
// saved page). Fetched ONCE, at intake — the title becomes the source's NAME,
// owner-editable in the manager afterward; a dead or edited page never rewrites
// what you filed.
//
// SSRF-guarded, because this fetches a USER-SUPPLIED URL from our server:
//   • https only                    • block IP-literal + private hosts (also AFTER redirect)
//   • timeout                       • content-type must be html
//   • size cap even WITHOUT a Content-Length header (streamed read)
// Proportionate hygiene, not a fortress — DNS-rebinding is consciously not covered
// (worst case a leaked capability makes our server GET a web page; small blast
// radius on Vercel, per the review).

export type PageMeta = {
  title: string | null;
};

const MAX_HTML = 512 * 1024; // read at most ~512 KB of markup
const TIMEOUT_MS = 6000;

function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".local")) return true;
  if (h.includes(":")) return true; // any IPv6 literal — never a source URL
  if (/^\d+(\.\d+){0,3}$/.test(h)) return true; // any bare-IP form (incl. decimal tricks)
  return false;
}

/** A safe URL for the title fetch, or null if it can't be fetched safely. */
function safeUrl(raw: string): URL | null {
  let u: URL;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== "https:") return null;
  if (isPrivateHost(u.hostname)) return null;
  return u;
}

function firstMatch(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ");
}

function extractTitle(html: string): string | null {
  const og =
    firstMatch(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    firstMatch(html, /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  const t = og || firstMatch(html, /<title[^>]*>([^<]+)<\/title>/i);
  if (!t) return null;
  const clean = decodeEntities(t).replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, 300) : null;
}

/** Read at most MAX_HTML bytes of the body — capped even when the server sends no
 * Content-Length (a hostile page must not balloon a serverless function). */
async function readCapped(res: Response): Promise<string> {
  if (!res.body) return (await res.text()).slice(0, MAX_HTML);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let html = "";
  while (html.length < MAX_HTML) {
    const { done, value } = await reader.read();
    if (done) break;
    html += dec.decode(value, { stream: true });
  }
  reader.cancel().catch(() => {});
  return html.slice(0, MAX_HTML);
}

export async function fetchPageMeta(rawUrl: string): Promise<PageMeta | null> {
  const u = safeUrl(rawUrl);
  if (!u) return null;
  const fallback: PageMeta = { title: null };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(u.toString(), {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "user-agent": "worldbot/1.0 (+source-title)", accept: "text/html" },
    });
    // a redirect could land on a private host — re-check the FINAL url
    try { if (isPrivateHost(new URL(res.url).hostname)) return fallback; } catch { /* keep */ }
    if (!res.ok) return fallback;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html")) return fallback;
    const html = await readCapped(res);
    return { title: extractTitle(html) };
  } catch {
    return fallback; // timeout / network / parse — the capture still saves
  } finally {
    clearTimeout(timer);
  }
}

/** Normalize what the owner pasted into a savable URL (adds https:// if missing). */
export function normalizeUrl(raw: string): string {
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

/** A light heuristic: does this quick-add text look like a link, not a note? */
export function looksLikeUrl(raw: string): boolean {
  const t = raw.trim();
  if (/\s/.test(t)) return false; // has whitespace → it's prose
  if (/^https?:\/\//i.test(t)) return true;
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(t); // domain.tld[/path]
}
