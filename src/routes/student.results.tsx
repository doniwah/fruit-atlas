import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Section } from "@/components/app/AppShell";
import { Download, FileText, Sparkles, Database, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { getDataset } from "@/lib/db-store";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/student/results")({
  head: () => ({ meta: [{ title: "Laporan Hasil — Siswa" }] }),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      id: (search.id as string) || undefined,
    };
  },
  component: ResultsPage,
});

interface ResultsData {
  id: string;
  name: string;
  fruit: string;
  clusterId: string;
  clusterLabel: string;
  dominantColor: string;
  shape: string;
  confidence: string;
  notes: string;
  hue: number;
  saturation: number;
  value: number;
  circularity: number;
  aspectRatio: number;
  imageUrl?: string;
}

function ResultsPage() {
  const { id } = Route.useSearch();
  const [result, setResult] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (id) {
      setLoading(true);
      getDataset()
        .then((items) => {
          if (!isMounted) return;
          const found = items.find((item) => item.id === id);
          if (found) {
            setResult({
              id: found.id,
              name: found.name,
              fruit: found.fruit || "Tidak Diketahui",
              clusterId: found.cluster || "C-7",
              clusterLabel: found.fruit && found.fruit !== "Noise" ? `Klaster ${found.fruit}` : "Derau (Noise)",
              dominantColor: hsvToHexColor(found.hue, found.saturation, found.value),
              shape: found.circularity > 0.85 ? "Bulat" : "Tidak Beraturan",
              confidence: found.cluster && found.fruit !== "Noise" && found.fruit !== "Derau" ? "Tinggi" : "Rendah (Noise)",
              notes: `Diambil dari database. Fitur inti: HSV(${found.hue}°, ${found.saturation}, ${found.value}), Sirkularitas: ${found.circularity}, Rasio Aspek: ${found.aspectRatio}.`,
              hue: found.hue,
              saturation: found.saturation,
              value: found.value,
              circularity: found.circularity,
              aspectRatio: found.aspectRatio,
              imageUrl: found.imageUrl,
            });
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          if (isMounted) setLoading(false);
        });
    } else {
      // Load from localStorage
      const img = localStorage.getItem("fruit_atlas_upload_image") || "";
      const label = localStorage.getItem("fruit_atlas_last_run_label") || "Derau (Noise)";
      const cid = localStorage.getItem("fruit_atlas_last_run_id") || "C-7";
      const conf = localStorage.getItem("fruit_atlas_last_run_confidence") || "Rendah";
      const col = localStorage.getItem("fruit_atlas_last_run_color") || "#9CA3AF";
      const shp = localStorage.getItem("fruit_atlas_last_run_shape") || "Campuran";
      const nts = localStorage.getItem("fruit_atlas_last_run_notes") || "";
      const h = parseFloat(localStorage.getItem("fruit_atlas_last_run_hue") || "0");
      const s = parseFloat(localStorage.getItem("fruit_atlas_last_run_saturation") || "0");
      const v = parseFloat(localStorage.getItem("fruit_atlas_last_run_value") || "0");
      const circ = parseFloat(localStorage.getItem("fruit_atlas_last_run_circularity") || "0");
      const asp = parseFloat(localStorage.getItem("fruit_atlas_last_run_aspect") || "1");

      setResult({
        id: "Analisis Lokal",
        name: localStorage.getItem("fruit_atlas_upload_image_name") || "analysis_image.jpg",
        fruit: label.split(" — ")[0] || "Tidak Diketahui",
        clusterId: cid,
        clusterLabel: label,
        dominantColor: col,
        shape: shp === "Round" ? "Bulat" : shp === "Irregular" ? "Tidak Beraturan" : shp,
        confidence: conf,
        notes: nts,
        hue: h,
        saturation: s,
        value: v,
        circularity: circ,
        aspectRatio: asp,
        imageUrl: img,
      });
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Helper to convert HSV to hex for local display fallback
  function hsvToHexColor(h: number, s: number, v: number): string {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;
    if (h >= 0 && h < 60) {
      [r, g, b] = [c, x, 0];
    } else if (h >= 60 && h < 120) {
      [r, g, b] = [x, c, 0];
    } else if (h >= 120 && h < 180) {
      [r, g, b] = [0, c, x];
    } else if (h >= 180 && h < 240) {
      [r, g, b] = [0, x, c];
    } else if (h >= 240 && h < 300) {
      [r, g, b] = [x, 0, c];
    } else if (h >= 300 && h < 360) {
      [r, g, b] = [c, 0, x];
    }
    const rHex = Math.round((r + m) * 255).toString(16).padStart(2, "0");
    const gHex = Math.round((g + m) * 255).toString(16).padStart(2, "0");
    const bHex = Math.round((b + m) * 255).toString(16).padStart(2, "0");
    return `#${rHex}${gHex}${bHex}`;
  }

  // Handle Download JSON
  const handleDownloadJSON = () => {
    if (!result) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `laporan_analisis_${result.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle Export PDF (Print page)
  const handleExportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <AppShell role="student" title="Hasil Laporan" subtitle="Memuat laporan...">
        <div className="h-64 flex items-center justify-center font-mono text-sm text-muted-foreground">
          MENGAMBIL LAPORAN KLASIFIKASI BUAH...
        </div>
      </AppShell>
    );
  }

  if (!result) {
    return (
      <AppShell role="student" title="Laporan Hasil" subtitle="Hasil analisis tidak ditemukan">
        <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-xl p-6 text-center">
          <Database className="h-8 w-8 text-muted-foreground mb-2" />
          <h3 className="font-semibold text-sm">Belum ada analisis aktif</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Kembali ke halaman unggah gambar dan lakukan analisis ekstraksi fitur untuk menghasilkan laporan klasifikasi.
          </p>
          <Link to="/student/upload" className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
            <ArrowLeft className="h-3.5 w-3.5" /> Mulai analisis baru
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      role="student"
      title="Laporan Hasil Analisis"
      subtitle={`Laporan klasifikasi untuk ${result.name}`}
      actions={
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handleDownloadJSON}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" /> Unduh JSON
          </button>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 shadow"
          >
            <FileText className="h-3.5 w-3.5" /> Cetak Laporan
          </button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Image View */}
        <Section title="Gambar yang Dianalisis">
          <div className="aspect-square rounded-xl border border-border bg-slate-900/60 overflow-hidden flex items-center justify-center">
            {result.imageUrl ? (
              <img
                src={result.imageUrl}
                alt="Gambar Buah"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-xs text-muted-foreground font-mono">Pratinjau gambar tidak tersedia</div>
            )}
          </div>
          <div className="mt-3 text-[10px] text-muted-foreground font-mono flex items-center gap-1">
            <Database className="h-3.5 w-3.5 text-primary" /> ID Referensi: {result.id}
          </div>
        </Section>

        {/* Right Column: Classification Results */}
        <div className="space-y-6 lg:col-span-2">
          <Section title="Hasil Klasifikasi" description="Keluaran pengklasteran DBSCAN backend">
            <dl className="grid gap-4 sm:grid-cols-2">
              {[
                ["Nama Buah", result.fruit === "Unknown" ? "Tidak Diketahui" : result.fruit, "Estimasi kategori buah"],
                ["ID Klaster", result.clusterId, "Kode pengenal klaster"],
                ["Label Klaster", result.clusterLabel === "Noise" ? "Derau (Noise)" : result.clusterLabel, "Label interpretasi kelompok"],
                ["Warna Dominan", result.dominantColor, "Rata-rata warna HSV dalam kode hex"],
                ["Deskriptor Bentuk", result.shape, "Profil kebulatan buah"],
                ["Peran Klaster", result.confidence, "Peran sampel dalam topologi DBSCAN"],
              ].map(([k, v, desc]) => (
                <div key={k} className="rounded-lg border border-border bg-surface p-3 flex flex-col justify-between">
                  <div>
                    <dt className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{k}</dt>
                    <dd className="mt-1.5 flex items-center gap-2 text-sm font-bold text-foreground">
                      {k === "Warna Dominan" && (
                        <span
                          className="h-3.5 w-3.5 rounded border border-border"
                          style={{ backgroundColor: v }}
                        />
                      )}
                      {v}
                    </dd>
                  </div>
                  <span className="text-[9px] text-muted-foreground/80 mt-1">{desc}</span>
                </div>
              ))}
            </dl>
          </Section>

          {/* Quantitative Metrics */}
          <Section title="Profil Fitur Kuantitatif" description="Koordinat metrik numerik pada ruang 5D">
            <div className="overflow-hidden rounded-lg border border-border bg-surface/40">
              <table className="w-full text-sm">
                <thead className="bg-surface text-left text-xs uppercase text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-2">Nama Fitur</th>
                    <th className="px-4 py-2 font-mono">Nilai Pengukuran</th>
                    <th className="px-4 py-2">Skala Normalisasi [0, 1]</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr className="hover:bg-surface/50">
                    <td className="px-4 py-2.5 font-medium text-xs">Hue (H)</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{result.hue}°</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{(result.hue / 360).toFixed(3)}</td>
                  </tr>
                  <tr className="hover:bg-surface/50">
                    <td className="px-4 py-2.5 font-medium text-xs">Saturasi (S)</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{result.saturation}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{result.saturation.toFixed(3)}</td>
                  </tr>
                  <tr className="hover:bg-surface/50">
                    <td className="px-4 py-2.5 font-medium text-xs">Kecerahan Warna (Value/V)</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{result.value}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{result.value.toFixed(3)}</td>
                  </tr>
                  <tr className="hover:bg-surface/50">
                    <td className="px-4 py-2.5 font-medium text-xs">Sirkularitas</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{result.circularity}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{result.circularity.toFixed(3)}</td>
                  </tr>
                  <tr className="hover:bg-surface/50">
                    <td className="px-4 py-2.5 font-medium text-xs">Rasio Aspek</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{result.aspectRatio}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{Math.min(1.0, (result.aspectRatio - 0.5) / 2).toFixed(3)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* Analysis notes */}
          <Section title="Catatan Analisis">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs leading-relaxed text-muted-foreground flex gap-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Ringkasan Eksekusi Alur</p>
                <p className="mt-1">{result.notes}</p>
              </div>
            </div>
          </Section>

          {/* Back button */}
          <div className="flex justify-end print:hidden">
            <Link
              to="/student/upload"
              className="rounded-md border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-muted"
            >
              Analisis gambar lain
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
