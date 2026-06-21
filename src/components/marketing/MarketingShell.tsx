import { Link, useRouterState } from "@tanstack/react-router";
import { Microscope } from "lucide-react";

const nav = [
  { to: "/", label: "Beranda" },
  { to: "/about", label: "Tentang Kami" },
  { to: "/features", label: "Fitur" },
  { to: "/how-it-works", label: "Cara Kerja" },
  { to: "/contact", label: "Kontak" },
];

export function MarketingNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Microscope className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">FruitCluster</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">/ Penelitian DBSCAN</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Masuk
          </Link>
          <Link
            to="/register"
            className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:opacity-90"
          >
            Daftar
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Microscope className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">FruitCluster</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Platform penelitian akademik untuk analisis gambar buah menggunakan
            ekstraksi fitur HSV, deskriptor bentuk, dan klasterisasi DBSCAN.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Produk</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/features" className="hover:text-primary">Fitur</Link></li>
            <li><Link to="/how-it-works" className="hover:text-primary">Cara Kerja</Link></li>
            <li><Link to="/workflow" className="hover:text-primary">Alur Kerja Sistem</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Institusi</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-primary">Tentang Kami</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Kontak</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Laboratorium Penelitian FruitCluster</span>
          <span>v1.0 · Penggunaan Akademik</span>
        </div>
      </div>
    </footer>
  );
}
