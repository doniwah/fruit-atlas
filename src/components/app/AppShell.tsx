import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Database, Users, Boxes, FlaskConical, BarChart3,
  FileText, Settings, User, LogOut, Upload, Image as ImageIcon,
  Microscope,
} from "lucide-react";
import type { ReactNode } from "react";

type Item = { to: string; label: string; icon: typeof LayoutDashboard };

const adminItems: Item[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/datasets", label: "Kelola Dataset", icon: Database },
  { to: "/admin/students", label: "Kelola Siswa", icon: Users },
  { to: "/admin/clusters", label: "Kelola Kluster", icon: Boxes },
  { to: "/admin/analysis", label: "Analisis Gambar", icon: FlaskConical },
  { to: "/admin/results", label: "Analisis Hasil", icon: BarChart3 },
  { to: "/admin/reports", label: "Laporan", icon: FileText },
  { to: "/admin/settings", label: "Pengaturan", icon: Settings },
  { to: "/admin/profile", label: "Profil", icon: User },
];

const studentItems: Item[] = [
  { to: "/student", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/upload", label: "Unggah Gambar", icon: Upload },
  { to: "/student/analysis", label: "Analisis", icon: FlaskConical },
  { to: "/student/results", label: "Hasil Analisis", icon: BarChart3 },
  { to: "/student/profile", label: "Profil", icon: User },
];

export function AppShell({
  role,
  title,
  subtitle,
  children,
  actions,
}: {
  role: "admin" | "student";
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const items = role === "admin" ? adminItems : studentItems;
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen w-full bg-surface">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Microscope className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">FruitCluster</div>
            <div className="text-[11px] text-muted-foreground">Panel {role === "admin" ? "Admin" : "Siswa"}</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Area Kerja
          </div>
          <ul className="space-y-0.5">
            {items.map((it) => {
              const Icon = it.icon;
              const active = pathname === it.to;
              return (
                <li key={it.to}>
                  <Link
                    to={it.to}
                    className={`group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                      active
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                    <span>{it.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-border p-3">
          <Link
            to="/login"
            className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-6 backdrop-blur">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-foreground">{title}</h1>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">{actions}</div>
        </header>

        <main className="flex-1 px-6 py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="sticky bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background md:hidden">
          {items.slice(0, 5).map((it) => {
            const Icon = it.icon;
            const active = pathname === it.to;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex flex-col items-center gap-1 py-2 text-[10px] ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {it.label.split(" ")[0]}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function StatCard({
  label, value, delta, icon: Icon,
}: { label: string; value: string; delta?: string; icon?: typeof LayoutDashboard }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        {Icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      {delta && <div className="mt-1 text-xs text-muted-foreground">{delta}</div>}
    </div>
  );
}

export function Section({ title, description, children, actions }: {
  title: string; description?: string; children: ReactNode; actions?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export { ImageIcon };
