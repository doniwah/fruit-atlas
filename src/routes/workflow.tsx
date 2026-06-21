import { createFileRoute } from "@tanstack/react-router";
import { MarketingNav, MarketingFooter } from "@/components/marketing/MarketingShell";

export const Route = createFileRoute("/workflow")({
  head: () => ({ meta: [{ title: "Alur Kerja Sistem — FruitCluster" }, { name: "description", content: "Alur kerja sistem interaktif." }] }),
  component: WorkflowPage,
});

const nodes = [
  "Mulai",
  "Punya Akun?",
  "Daftar / Masuk",
  "Validasi",
  "Cek Peran",
  "Dashboard",
  "Unggah Gambar Buah",
  "Ekstraksi HSV",
  "Ekstraksi Bentuk",
  "Klasterisasi DBSCAN",
  "Hasil Kluster",
  "Kelola Kluster",
  "Keluar",
];

function WorkflowPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Alur Kerja Sistem</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Alur kerja ujung-ke-ujung</h1>
        <p className="mt-2 text-sm text-muted-foreground">Mulai dari masuk hingga keluar — setiap simpul dalam pipa pemrosesan FruitCluster.</p>

        <ol className="mt-10 space-y-3">
          {nodes.map((n, i) => (
            <li key={n} className="relative">
              <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-card)]">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</div>
                <div className="text-sm font-medium">{n}</div>
              </div>
              {i < nodes.length - 1 && (
                <div className="flex justify-center py-1">
                  <div className="h-4 w-px bg-border" />
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
      <MarketingFooter />
    </div>
  );
}
