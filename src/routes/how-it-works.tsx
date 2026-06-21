import { createFileRoute } from "@tanstack/react-router";
import { MarketingNav, MarketingFooter } from "@/components/marketing/MarketingShell";

const steps = [
  { n: "1", t: "Unggah gambar buah", d: "Seret satu gambar atau unggah dalam jumlah banyak dari manajer dataset." },
  { n: "2", t: "Ekstraksi warna HSV", d: "Ubah warna RGB → HSV dan hitung warna dominan beserta histogram." },
  { n: "3", t: "Ekstraksi bentuk", d: "Deteksi kontur dan hitung rasio aspek, sirkularitas, serta momen Hu." },
  { n: "4", t: "Klasterisasi DBSCAN", d: "Atur parameter eps dan min_samples; visualisasikan kluster dan derau (noise)." },
  { n: "5", t: "Hasil Akhir", d: "Tinjau label kluster, tingkat keyakinan, dan ekspor laporan." },
];

export const Route = createFileRoute("/how-it-works")({
  head: () => ({ meta: [{ title: "Cara Kerja — FruitCluster" }, { name: "description", content: "Langkah-langkah pipa pemrosesan FruitCluster." }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <div className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-3xl font-semibold tracking-tight">Cara kerja</h1>
        <ol className="mt-10 space-y-4">
          {steps.map((s) => (
            <li key={s.n} className="flex gap-4 rounded-xl border border-border bg-card p-5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">{s.n}</div>
              <div>
                <div className="text-sm font-semibold">{s.t}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <MarketingFooter />
    </div>
  ),
});
