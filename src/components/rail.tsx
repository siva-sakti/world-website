"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { newBoard } from "@/app/actions";
import { logout } from "@/app/login/actions";

// THE CABINET, everywhere (V4 — the owner's ruling): one rail owns all
// navigation; the eleven hand-rolled page headers retire. Collapsible so
// canvases and the writing page can breathe — collapsed by default on those
// routes, expanded on browse routes; the owner's toggle is remembered.

const TUCKED_ROUTES = ["/board/", "/bit/", "/note/", "/write"];

function routeDefault(pathname: string): boolean {
  return TUCKED_ROUTES.some((r) => pathname.startsWith(r));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => routeDefault(pathname));
  const [chosen, setChosen] = useState(false); // has the owner toggled this session?

  // Apply the remembered choice after mount (localStorage is client-only —
  // the same one-time capability-read pattern as card.tsx's coarse-pointer check).
  useEffect(() => {
    const stored = window.localStorage.getItem("railCollapsed");
    if (stored !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client storage read
      setCollapsed(stored === "1");
      setChosen(true);
    }
  }, []);

  // Route changes re-apply the route default until the owner has chosen.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync to navigation, guarded
    if (!chosen) setCollapsed(routeDefault(pathname));
  }, [pathname, chosen]);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    setChosen(true);
    window.localStorage.setItem("railCollapsed", next ? "1" : "0");
  }

  if (pathname === "/login") return <>{children}</>;

  if (collapsed) {
    return (
      <div className="shell-collapsed">
        <button className="rail-peek" onClick={toggle} title="open the cabinet" aria-label="open navigation">
          ⟩
        </button>
        {children}
      </div>
    );
  }

  return (
    <div className="home-shell">
      <nav className="rail">
        <div className="rail-top">
          <Link href="/" className="rail-brand">world</Link>
          <button className="rail-tuck" onClick={toggle} title="tuck the cabinet away" aria-label="collapse navigation">
            ⟨
          </button>
        </div>
        <Link href="/write" className="rail-link">✎ write</Link>
        <form action={newBoard}>
          <button className="rail-link rail-btn">+ new board</button>
        </form>
        <div className="rail-sec">everything</div>
        <Link href="/boards" className="rail-link">all boards</Link>
        <Link href="/notes" className="rail-link">all notes</Link>
        <Link href="/bits" className="rail-link">bits</Link>
        <div className="rail-sec">lenses</div>
        <Link href="/search" className="rail-link">search</Link>
        <Link href="/graph" className="rail-link">graph</Link>
        <Link href="/tags" className="rail-link">tags</Link>
        <div className="rail-foot">
          <Link href="/sources" className="rail-link">sources</Link>
          <Link href="/trash" className="rail-link">trash</Link>
          <a href="/api/export" className="rail-link" title="Download all your data">export</a>
          <form action={logout}>
            <button className="rail-link rail-btn">sign out</button>
          </form>
        </div>
      </nav>
      <div className="shell-main">{children}</div>
    </div>
  );
}
