import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingNav, MarketingFooter } from "@/components/marketing/MarketingShell";
import { Check } from "lucide-react";

const items = [
  "Unggah Gambar",
  "Ekstraksi HSV",
  "Ekstraksi Bentuk",
  "Klasterisasi DBSCAN",
  "Kelola Kluster",
  "Sistem Laporan",
];

export const Route = createFileRoute("/features")({
  head: () => ({ meta: [{ title: "Fitur — FruitCluster" }, { name: "description", content: "Daftar fitur untuk pipa pemrosesan FruitCluster." }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <div className="mx-auto max-w-4xl px-6 py-20">
        <h1 className="text-3xl font-semibold tracking-tight">Fitur</h1>
        <p className="mt-2 text-sm text-muted-foreground">Segala hal yang tersedia pada pipa pemrosesan FruitCluster.</p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {items.map((i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm">
              <Check className="h-4 w-4 text-primary" /> {i}
            </li>
          ))}
        </ul>
        <Link to="/register" className="mt-10 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Buat akun baru</Link>
      </div>
      <MarketingFooter />
    </div>
  ),
});
