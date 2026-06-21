import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingNav, MarketingFooter } from "@/components/marketing/MarketingShell";
import {
  Upload, Palette, Shapes, GitBranch, Boxes, FileBarChart,
  ArrowRight, Quote, CircleDot, Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FruitCluster — Analisis Gambar Buah dengan DBSCAN" },
      { name: "description", content: "Platform akademik untuk pengelompokan gambar buah menggunakan HSV dan fitur bentuk dengan DBSCAN." },
      { property: "og:title", content: "FruitCluster — Analisis Gambar Buah dengan DBSCAN" },
      { property: "og:description", content: "Sistem pengelompokan gambar dan klasifikasi buah untuk penelitian akademik." },
    ],
  }),
  component: LandingPage,
});

const features = [
  { icon: Upload, title: "Unggah Gambar", desc: "Unggah gambar tunggal atau masal dengan pratinjau dan pengambilan metadata otomatis." },
  { icon: Palette, title: "Ekstraksi HSV", desc: "Ekstraksi rona warna (hue), saturasi, dan histogram nilai kecerahan dominan per gambar buah." },
  { icon: Shapes, title: "Ekstraksi Bentuk", desc: "Ekstraksi tepi kontur objek, rasio aspek bounding box, dan momen sirkularitas." },
  { icon: GitBranch, title: "Klasterisasi DBSCAN", desc: "Pengelompokan berbasis kepadatan dengan parameter eps dan min_samples yang dapat disesuaikan." },
  { icon: Boxes, title: "Kelola Kluster", desc: "Beri label, gabungkan, dan audit kluster dengan area kerja administrator yang jelas." },
  { icon: FileBarChart, title: "Sistem Pelaporan", desc: "Ekspor laporan PDF dan Excel untuk kebutuhan skripsi, tesis, dan dokumentasi lab." },
];

const workflow = [
  { n: "01", title: "Unggah", desc: "Kirim gambar buah" },
  { n: "02", title: "Ekstraksi", desc: "Nilai HSV + fitur bentuk" },
  { n: "03", title: "Klaster", desc: "Jalankan DBSCAN" },
  { n: "04", title: "Hasil", desc: "Label & laporan akhir" },
];

const testimonials = [
  { name: "Dr. R. Hartono", role: "Dosen Computer Vision", quote: "Alur kerja yang rapi dan dapat direproduksi, sangat cocok untuk mengajarkan konsep unsupervised learning secara langsung." },
  { name: "Maya P., Mahasiswi S2", role: "Asisten Peneliti", quote: "Memotong waktu pra-pemrosesan tesis saya hingga setengahnya. Ekspor data kluster sangat membantu." },
  { name: "Prof. L. Anwar", role: "Fakultas Informatika", quote: "Terasa seperti alat produksi nyata, bukan sekadar proyek mata kuliah biasa." },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                Dibuat untuk penelitian akademik
              </div>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
                Analisis Gambar Buah Secara Cerdas Menggunakan DBSCAN
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
                Sistem pengelompokan gambar dan klasifikasi buah untuk penelitian akademik.
                Gabungkan fitur warna HSV dengan deskriptor bentuk, lalu kelompokkan secara alami menggunakan algoritma DBSCAN.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-95 shadow-md"
                >
                  Mulai Analisis <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/how-it-works"
                  className="inline-flex items-center rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Pelajari Selengkapnya
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6 text-sm">
                <div><div className="font-semibold">1.200+</div><div className="text-xs text-muted-foreground">gambar dianalisis</div></div>
                <div><div className="font-semibold">8</div><div className="text-xs text-muted-foreground">kluster buah</div></div>
                <div><div className="font-semibold">95%</div><div className="text-xs text-muted-foreground">rata-rata akurasi</div></div>
              </div>
            </div>

            {/* Dashboard illustration */}
            <div className="relative">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-pop)]">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-destructive/70" />
                    <span className="h-2 w-2 rounded-full bg-warning/70" />
                    <span className="h-2 w-2 rounded-full bg-success/70" />
                  </div>
                  <span>dasbor-penelitian.app</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { l: "Kluster", v: "8" },
                    { l: "Titik Derau", v: "22" },
                    { l: "Siluet", v: "0.71" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-lg border border-border bg-surface p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</div>
                      <div className="mt-1 text-lg font-semibold">{s.v}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-lg border border-border bg-surface p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-medium">Grafik Scatter DBSCAN</div>
                    <div className="text-[10px] text-muted-foreground font-mono">eps=0.45 · min_samples=5</div>
                  </div>
                  <div className="relative h-44 w-full overflow-hidden rounded-md bg-background">
                    {Array.from({ length: 80 }).map((_, i) => {
                      const c = i % 5;
                      const colors = ["#4CAF50", "#3B82F6", "#F59E0B", "#A855F7", "#EF4444"];
                      const cx = [22, 60, 78, 35, 80][c];
                      const cy = [70, 55, 78, 30, 25][c];
                      const x = cx + (Math.random() - 0.5) * 15;
                      const y = cy + (Math.random() - 0.5) * 15;
                      return (
                        <span
                          key={i}
                          className="absolute h-1.5 w-1.5 rounded-full opacity-80"
                          style={{ left: `${x}%`, top: `${y}%`, background: colors[c] }}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-6 gap-1.5">
                  {["#C0392B","#E67E22","#F4D03F","#7DCE82","#6C3483","#9CA3AF"].map((c) => (
                    <div key={c} className="h-6 rounded" style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 hidden rounded-lg border border-border bg-card p-3 shadow-[var(--shadow-pop)] sm:block">
                <div className="flex items-center gap-2 text-xs">
                  <CircleDot className="h-3.5 w-3.5 text-primary" />
                  Kluster C-1 · Apel Merah Matang
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Fitur</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Peralatan Penelitian Lengkap</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Setiap langkah alur kerja — mulai dari gambar mentah hingga visualisasi kelompok yang siap publikasi.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-[var(--shadow-card)]">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Alur Kerja</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Empat Langkah, Terintegrasi</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {workflow.map((w, i) => (
              <div key={w.n} className="relative rounded-xl border border-border bg-card p-5">
                <div className="text-xs font-mono text-muted-foreground">{w.n}</div>
                <div className="mt-2 text-base font-semibold">{w.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{w.desc}</div>
                {i < workflow.length - 1 && (
                  <ArrowRight className="absolute right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-border md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Testimoni</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Dipercaya di Ruang Kelas dan Laboratorium</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-card p-6">
                <Quote className="h-5 w-5 text-primary/60" />
                <p className="mt-3 text-sm leading-relaxed text-foreground">{t.quote}</p>
                <div className="mt-5 text-xs">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-muted-foreground">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
