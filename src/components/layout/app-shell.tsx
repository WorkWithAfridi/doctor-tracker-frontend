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
  CheckCircle2,
  ChevronRight,
  Settings,
  BookOpen,
  UserRound,
} from "lucide-react";
import { authActions, useAuth } from "@/services/auth-store";
import { useApi } from "@/hooks/use-api";
import type { DashboardData } from "@/types/domain";
import { RequestState } from "@/components/common/request-state";
import { apiDocsUrl } from "@/lib/api";

const navigation = [
  { href: "/dashboard", title: "Overview", icon: LayoutDashboard },
  { href: "/doctors", title: "Doctors", icon: Stethoscope },
  { href: "/patients", title: "Patients", icon: UsersRound },
  { href: "/profile", title: "Profile", icon: UserRound },
  { href: "/settings", title: "Settings", icon: Settings },
];
export function AppShell({ children }: { children: ReactNode }) {
  const state = useAuth();
  const router = useRouter();
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [notice, setNotice] = useState("");
  const sidebarRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (state.ready && !state.authenticated && !state.error)
      router.replace("/login");
  }, [state.ready, state.authenticated, state.error, router]);
  useEffect(() => {
    const receive = (event: Event) =>
      setNotice((event as CustomEvent<string>).detail);
    window.addEventListener("workspace-notice", receive);
    return () => window.removeEventListener("workspace-notice", receive);
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
  if (state.error)
    return (
      <RequestState
        loading={false}
        error={state.error}
        retry={() => void state.retry()}
      />
    );
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
      : path.startsWith("/settings")
        ? "Settings"
        : path.startsWith("/profile")
          ? "Profile"
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
          {navigation
            .filter(
              (item) =>
                item.href !== "/settings" || state.user?.role === "admin",
            )
            .map(({ href, title, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`nav-item ${path.startsWith(href) ? "active" : ""}`}
                aria-current={path.startsWith(href) ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={19} />
                {title}
                {title === "Patients" && <PatientCount />}
              </Link>
            ))}
          <a
            className="nav-item"
            href={apiDocsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            <BookOpen size={19} />
            API documentation
          </a>
        </nav>
        <div className="sidebar-bottom">
          <button
            className="logout"
            disabled={loggingOut}
            onClick={async () => {
              setLoggingOut(true);
              setLogoutError("");
              try {
                await authActions.logout();
                router.replace("/login");
              } catch (error) {
                setLogoutError(
                  error instanceof Error ? error.message : "Unable to log out.",
                );
              } finally {
                setLoggingOut(false);
              }
            }}
          >
            <LogOut size={18} />
            Log out
          </button>
          {logoutError && (
            <p className="form-error" role="alert">
              {logoutError}
            </p>
          )}
          <div className="sidebar-user">
            <span className="avatar mint">
              {state.user?.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              {state.user?.name}
              <small>
                {state.user?.role === "admin" ? "Administrator" : "Staff"}
              </small>
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
              Connected workspace
            </span>
            <span className="topbar-avatar avatar mint">
              {state.user?.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </span>
          </div>
        </header>
        <main className="page-content">
          {children}
          <footer className="page-footer">
            <span>
              Doctor Tracker <span>·</span> Thoughtful care, organized.
            </span>
            <span>Care workspace</span>
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
    </div>
  );
}

function PatientCount() {
  const { data } = useApi<{ data: DashboardData }>(
    "/analytics/dashboard?days=30",
  );
  return data ? (
    <span className="nav-count">{data.data.totals.patients}</span>
  ) : null;
}
