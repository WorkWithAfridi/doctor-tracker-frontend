"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  LayoutDashboard,
  Stethoscope,
  UsersRound,
  LogOut,
  Menu,
  X,
  RotateCcw,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { demoActions, useDemo } from "@/services/demo-store";
import { Modal } from "@/components/common/ui";

const navigation = [
  { href: "/dashboard", title: "Overview", icon: LayoutDashboard },
  { href: "/doctors", title: "Doctors", icon: Stethoscope },
  { href: "/patients", title: "Patients", icon: UsersRound },
];
export function AppShell({ children }: { children: ReactNode }) {
  const state = useDemo();
  const router = useRouter();
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const sidebarRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (state.ready && !state.authenticated) router.replace("/login");
  }, [state.ready, state.authenticated, router]);
  useEffect(() => {
    const receive = (event: Event) =>
      setNotice((event as CustomEvent<string>).detail);
    window.addEventListener("demo-notice", receive);
    return () => window.removeEventListener("demo-notice", receive);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!menuOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not(:disabled)",
        ) ?? [],
      ).filter((element) => element.getClientRects().length > 0);
    focusable()[0]?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
      if (event.key === "Tab") {
        const elements = focusable();
        const first = elements[0];
        const last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("keydown", close);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [menuOpen]);
  if (!state.ready || !state.authenticated)
    return (
      <div className="boot-state">
        <Activity size={28} />
        <p>Opening your workspace…</p>
      </div>
    );
  const section = path.startsWith("/doctors")
    ? "Doctors"
    : path.startsWith("/patients")
      ? "Patients"
      : "Overview";
  return (
    <div className="app-shell">
      {menuOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside
        ref={sidebarRef}
        id="workspace-navigation"
        role={menuOpen ? "dialog" : undefined}
        aria-modal={menuOpen ? true : undefined}
        aria-label="Workspace navigation"
        className={`sidebar ${menuOpen ? "open" : ""}`}
      >
        <Link
          href="/dashboard"
          className="brand"
          onClick={() => setMenuOpen(false)}
        >
          <span className="brand-icon">
            <Activity size={23} />
          </span>
          <span>
            Doctor Tracker<small>CARE OPERATIONS</small>
          </span>
        </Link>
        <button
          className="icon-button mobile-close"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        >
          <X size={20} />
        </button>
        <div className="workspace-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map(({ href, title, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${path.startsWith(href) ? "active" : ""}`}
              aria-current={path.startsWith(href) ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <Icon size={19} />
              {title}
              {title === "Patients" && (
                <span className="nav-count">{state.patients.length}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-card">
            <span className="demo-dot" />
            Demo workspace
            <p>
              A little room to explore.
              <br />
              All records are fictional.
            </p>
            <button
              onClick={() => {
                setResetOpen(true);
                setMenuOpen(false);
              }}
            >
              Reset demo data <RotateCcw size={13} />
            </button>
          </div>
          <button
            className="logout"
            onClick={() => {
              demoActions.logout();
              router.replace("/login");
            }}
          >
            <LogOut size={18} />
            Log out
          </button>
          <div className="sidebar-user">
            <span className="avatar mint">AK</span>
            <div>
              Alex Kim<small>Administrator</small>
            </div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              aria-expanded={menuOpen}
              aria-controls="workspace-navigation"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{section}</strong>
          </div>
          <div className="topbar-right">
            <span className="demo-pill">
              <span className="demo-dot" />
              Demo mode
            </span>
            <span className="topbar-avatar avatar mint">AK</span>
          </div>
        </header>
        <main className="page-content">
          {state.storageError && (
            <div className="storage-warning" role="status">
              Browser storage is unavailable. Changes will last for this visit
              only.
            </div>
          )}
          {children}
          <footer className="page-footer">
            <span>
              Doctor Tracker <span>·</span> Thoughtful care, organized.
            </span>
            <span>
              Frontend preview <ArrowUpRight size={12} />
            </span>
          </footer>
        </main>
      </div>
      {notice && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {resetOpen && (
        <Modal
          title="Reset demo data?"
          description="Your changes will be replaced with the original fictional doctors and patients. You will stay signed in."
          onClose={() => setResetOpen(false)}
        >
          <div className="modal-footer">
            <button
              className="button secondary"
              onClick={() => setResetOpen(false)}
            >
              Keep my changes
            </button>
            <button
              className="button primary"
              onClick={() => {
                demoActions.reset();
                setResetOpen(false);
                setNotice("Demo data restored");
              }}
            >
              Reset data
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
