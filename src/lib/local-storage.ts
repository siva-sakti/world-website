// TOUCHING BROWSER STORAGE, SAFELY — one definition.
//
// Storage can be missing entirely (server render) or throw on ACCESS, not just on
// write: Safari's "block all cookies" throws from `window.localStorage` itself, so
// even reading has to be guarded. Three places wrapped that by hand, each with its
// own try/catch and its own comment about the same Safari behaviour.
//
// WHAT THIS DOOR IS *NOT*: "remember whether a panel is collapsed." The three callers
// store different things — the rail and home store a yes/no, /outline stores a SET of
// collapsed section ids — and the rail deliberately restores BOTH yes and no because
// it has a per-route default to override, while home only restores "collapsed".
// A "sticky flag" door would have flattened that difference and broken the rail. The
// decision genuinely shared is only this: how to touch storage without crashing.
//
// WHERE TO CALL IT: read inside a mount effect, NEVER during render — storage is
// client-only, so reading it while rendering makes the server and the browser disagree
// about the first paint. That constraint stays at the call sites, where it is visible.

/** A stored string, or null — for "not set", "no storage", and "storage refused". A
 *  caller can't tell those apart, and shouldn't: all three mean "use your default". */
export function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Remember a string. Silent on failure — a preference that won't persist is not worth
 *  interrupting anyone over (blocked storage, or a full quota). */
export function writeLocal(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* blocked or full — the preference just won't survive a reload */
  }
}
