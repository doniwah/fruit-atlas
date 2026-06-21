import { createFileRoute } from "@tanstack/react-router";
import { MarketingNav, MarketingFooter } from "@/components/marketing/MarketingShell";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "Tentang Kami — FruitCluster" }, { name: "description", content: "Tentang proyek penelitian akademik FruitCluster." }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Tentang Kami</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Platform penelitian yang dibangun untuk pengajaran dan pengerjaan tesis</h1>
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          FruitCluster dikembangkan sebagai bagian dari kurikulum computer vision
          akademik untuk memberi mahasiswa alur pemrosesan yang dapat direproduksi dan didokumentasikan dengan baik
          dalam mengeksplorasi klasterisasi berbasis kepadatan pada data gambar nyata. Platform ini menggabungkan
          analisis warna HSV, deskriptor bentuk, dan DBSCAN di balik antarmuka yang bersih
          sehingga fokus tetap pada pemahaman metode.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground border-l-2 border-primary/50 pl-4 italic">
          Data yang digunakan dalam penelitian ini terdiri dari 50 objek buah dengan variasi bentuk, seperti bulat, lonjong, dan segitiga, serta variasi warna yang relevan untuk pengenalan visual siswa tunarungu.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { k: "Didirikan", v: "2025" },
            { k: "Tujuan Penggunaan", v: "Tesis & Tugas Kuliah" },
            { k: "Lisensi", v: "Akademik" },
          ].map((m) => (
            <div key={m.k} className="rounded-xl border border-border bg-card p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{m.k}</div>
              <div className="mt-1 text-base font-semibold">{m.v}</div>
            </div>
          ))}
        </div>
      </div>
      <MarketingFooter />
    </div>
  ),
});
