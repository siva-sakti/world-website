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
  image: string | null; // og:image, RESOLVED against the final (post-redirect) page URL — absolute or null
  siteName: string | null; // og:site_name, else the final URL's hostname
  finalUrl: string; // where the fetch actually landed (redirects followed) — relative og:image resolves against THIS
};

const MAX_HTML = 1024 * 1024; // read at most ~1 MB of markup (YouTube's og tags sit ~700KB deep — measured)
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

// One og:<name> property, both attribute orders (the title extractor's pattern) — first match wins.
function extractOg(html: string, name: string): string | null {
  const raw =
    firstMatch(html, new RegExp(`<meta[^>]+property=["']og:${name}["'][^>]+content=["']([^"']+)["']`, "i")) ||
    firstMatch(html, new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${name}["']`, "i"));
  if (!raw) return null;
  const clean = decodeEntities(raw).trim(); // entity-decode (&amp; in query strings)
  return clean || null;
}

// The page's card image, as an ABSOLUTE https URL or null. og:image is frequently
// relative (/img/card.jpg) or protocol-relative (//cdn…) — resolve against the final
// page URL. data: URIs are rejected (not fetchable safely); http-on-https and other
// unsafe hosts are rejected later by fetchImageBlob's own safeUrl guard.
function resolveImage(html: string, finalUrl: string): string | null {
  const raw = extractOg(html, "image");
  if (!raw || raw.startsWith("data:")) return null;
  try {
    const abs = new URL(raw, finalUrl);
    return abs.protocol === "https:" ? abs.toString() : null;
  } catch {
    return null;
  }
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

// Known oEmbed providers — the OFFICIAL unfurl route (a tiny JSON of title +
// thumbnail, built for exactly this). YouTube needs it: its watch page buries the
// og tags ~700KB into 1.4MB of markup and never serves them to a capped read.
function oembedEndpoint(u: URL): { endpoint: string; site: string } | null {
  const h = u.hostname.replace(/^www\.|^m\./, "");
  if (h === "youtube.com" || h === "youtu.be") {
    return { endpoint: `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(u.toString())}`, site: "YouTube" };
  }
  return null;
}

async function tryOEmbed(u: URL): Promise<PageMeta | null> {
  const prov = oembedEndpoint(u);
  if (!prov) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(prov.endpoint, {
      signal: ctrl.signal,
      headers: { "user-agent": "worldbot/1.0 (+link-card)", accept: "application/json" },
    });
    if (!res.ok) return null;
    const j: unknown = await res.json();
    if (typeof j !== "object" || j === null) return null;
    const { title, thumbnail_url } = j as Record<string, unknown>;
    return {
      title: typeof title === "string" && title.trim() ? title.trim().slice(0, 300) : null,
      image: typeof thumbnail_url === "string" && thumbnail_url.startsWith("https://") ? thumbnail_url : null,
      siteName: prov.site,
      finalUrl: u.toString(),
    };
  } catch {
    return null; // fall through to the page fetch
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchPageMeta(rawUrl: string): Promise<PageMeta | null> {
  const u = safeUrl(rawUrl);
  if (!u) return null;
  const fallback: PageMeta = { title: null, image: null, siteName: null, finalUrl: u.toString() };

  // Known providers answer via oEmbed — exact, tiny, official; a miss falls through.
  const oe = await tryOEmbed(u);
  if (oe?.title) return oe;

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
    const finalUrl = res.url || u.toString();
    let siteName: string | null = extractOg(html, "site_name");
    if (!siteName) {
      try { siteName = new URL(finalUrl).hostname.replace(/^www\./, ""); } catch { siteName = null; }
    }
    return { title: extractTitle(html), image: resolveImage(html, finalUrl), siteName, finalUrl };
  } catch {
    return fallback; // timeout / network / parse — the capture still saves
  } finally {
    clearTimeout(timer);
  }
}

// ── The card image download (link bits — link-bit-plan.md) ──────────────────
// Fetch the og:image itself, under the SAME hygiene as the page fetch: https-only +
// private-host guard (re-checked after redirect), timeout, content-type must be an
// image, and a STREAMED size cap (a hostile "image" must not balloon the function).
// Returns the bytes + their content-type, or null — never throws: a failed image
// only means a plainer card, capture is never blocked.
const MAX_IMAGE = 4 * 1024 * 1024; // 4MB — og:images are typically 50–500KB

export async function fetchImageBlob(
  rawUrl: string,
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const u = safeUrl(rawUrl);
  if (!u) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(u.toString(), {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "user-agent": "worldbot/1.0 (+link-card)", accept: "image/*" },
    });
    try { if (isPrivateHost(new URL(res.url).hostname)) return null; } catch { return null; }
    if (!res.ok) return null;
    const ct = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!ct.startsWith("image/")) return null;
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_IMAGE) return null;
    if (!res.body) return null;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_IMAGE) { reader.cancel().catch(() => {}); return null; }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) { bytes.set(c, off); off += c.byteLength; }
    return { bytes, contentType: ct };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** The site's display name for a URL — hostname minus www, GUARDED (a malformed stored
 * url must never throw mid-render). The one shared copy (card strip · bit page · meta). */
export function hostOf(url: string | null | undefined): string {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, "") : "";
  } catch {
    return "";
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
