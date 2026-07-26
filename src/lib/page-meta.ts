// Server-side page metadata for a bookmark (capture Slice 2). Fetch the page and
// pull its title + og:image + favicon. Read ONCE, frozen at capture (I-S2) — a
// dead or edited page never rewrites what you filed.
//
// SSRF-guarded, because this fetches a USER-SUPPLIED URL from our server:
//   • https only            • block private / loopback hosts (also AFTER redirect)
//   • timeout               • content-type must be html   • size cap
// Proportionate hygiene, not a fortress — worst case a leaked capability makes our
// server GET a web page (small blast radius on Vercel, per the review).

export type PageMeta = {
  title: string | null;
  domain: string;
  faviconUrl: string;
  ogImageUrl: string | null; // stored as a real preview in a later slice
};

const MAX_HTML = 512 * 1024; // read at most ~512 KB of markup
const TIMEOUT_MS = 6000;

function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    h === "localhost" || h === "0.0.0.0" || h === "::1" ||
    h.startsWith("127.") || h.startsWith("10.") ||
    h.startsWith("192.168.") || h.startsWith("169.254.") ||
    h.endsWith(".local")
  ) return true;
  const m = h.match(/^172\.(\d+)\./); // 172.16–31.x.x is private
  if (m) { const n = Number(m[1]); if (n >= 16 && n <= 31) return true; }
  return false;
}

/** A safe URL for capture, or null if it can't be fetched safely. */
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

function extractOgImage(html: string, base: URL): string | null {
  const raw =
    firstMatch(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    firstMatch(html, /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (!raw) return null;
  try {
    const abs = new URL(decodeEntities(raw), base); // resolve relative → absolute
    return abs.protocol === "https:" ? abs.toString() : null;
  } catch { return null; }
}

export async function fetchPageMeta(rawUrl: string): Promise<PageMeta | null> {
  const u = safeUrl(rawUrl);
  if (!u) return null;
  const domain = u.hostname.replace(/^www\./, "");
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
  const fallback: PageMeta = { title: null, domain, faviconUrl, ogImageUrl: null };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(u.toString(), {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "user-agent": "worldbot/1.0 (+bookmark-preview)", accept: "text/html" },
    });
    // a redirect could land on a private host — re-check the FINAL url
    try { if (isPrivateHost(new URL(res.url).hostname)) return fallback; } catch { /* keep */ }
    if (!res.ok) return fallback;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html")) return fallback;
    const len = Number(res.headers.get("content-length") ?? "0");
    if (len && len > 4 * MAX_HTML) return fallback; // absurdly large → skip
    const html = (await res.text()).slice(0, MAX_HTML);
    return { title: extractTitle(html), domain, faviconUrl, ogImageUrl: extractOgImage(html, u) };
  } catch {
    return fallback; // timeout / network / parse — the bookmark still saves
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
