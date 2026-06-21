import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, StatCard, Section } from "@/components/app/AppShell";
import { FlaskConical, ImageIcon, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/student/")({
  head: () => ({ meta: [{ title: "Dashboard Siswa — FruitCluster" }] }),
  component: () => (
    <AppShell role="student" title="Dashboard" subtitle="Sekilas tentang analisis Anda"
      actions={<Link to="/student/upload" className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Unggah gambar</Link>}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Analisis Saya" value="24" delta="+3 minggu ini" icon={FlaskConical} />
        <StatCard label="Gambar Diunggah" value="58" delta="+8 minggu ini" icon={ImageIcon} />
        <StatCard label="Hasil Terbaru" value="Apel — C1" delta="tingkat keyakinan 92%" icon={Sparkles} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title="Lanjutkan pekerjaan Anda" description="Lanjutkan kembali analisis yang tersisa">
          <ul className="divide-y divide-border text-sm">
            {[
              { t: "apple_red_07.jpg", s: "Menunggu klasterisasi", to: "/student/analysis" },
              { t: "mango_green_02.jpg", s: "Ekstraksi fitur selesai", to: "/student/analysis" },
              { t: "orange_05.jpg", s: "Hasil siap dilihat", to: "/student/results" },
            ].map((r) => (
              <li key={r.t} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{r.t}</div>
                  <div className="text-xs text-muted-foreground">{r.s}</div>
                </div>
                <Link to={r.to} className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted inline-flex items-center gap-1">Buka <ArrowRight className="h-3 w-3" /></Link>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Tips Praktis" description="Dapatkan hasil klaster yang lebih baik">
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>• Gunakan pencahayaan yang konsisten untuk semua gambar buah.</li>
            <li>• Potong gambar (crop) secara rapat di sekitar buah sebelum diunggah.</li>
            <li>• Mulai dengan eps=0.45 dan min_samples=5; lalu lakukan iterasi.</li>
            <li>• Tinjau titik derau (noise) — titik tersebut sering kali menandakan salah label.</li>
          </ul>
        </Section>
      </div>
    </AppShell>
  ),
});
