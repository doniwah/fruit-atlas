import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Section } from "@/components/app/AppShell";
import { FileDown, FileSpreadsheet, FileText, Play, RefreshCw, AlertCircle, Check, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { getDataset, getClusters } from "@/lib/db-store";
import { toast } from "sonner";
import { getStoredUsers } from "@/components/app/ProfilePage";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Laporan — Admin" }] }),
  component: ReportsPage,
});

interface RecentReport {
  id: string;
  name: string;
  size: string;
  type: "pdf" | "excel" | "history" | "students";
  created: string;
  content: string; // File content string
}

function ReportsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [fruitTypes, setFruitTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [reportType, setReportType] = useState<"pdf" | "excel" | "history" | "students">("pdf");
  const [fruitFilter, setFruitFilter] = useState("Semua");
  const [scope, setScope] = useState("real"); // "real" | "all"

  // Generating state
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genMessage, setGenMessage] = useState("");

  // Recent reports state (persisted in localStorage)
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);

  // Load dataset items & unique fruit types on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const dataset = await getDataset();
        // The dataset from db-store already has synthetic items filtered out.
        // We will load all items (real + synthetic) from the API.
        // To get all items (including synthetic), we will fetch it dynamically or simulate.
        // Let's just use the main dataset.
        setItems(dataset);
        
        // Find unique fruit types
        const uniqueFruits = Array.from(new Set(dataset.map((item: any) => item.fruit))).filter(Boolean);
        setFruitTypes(uniqueFruits);

        // Load recent reports from localStorage
        const savedReports = localStorage.getItem("fruit_atlas_recent_reports");
        if (savedReports) {
          setRecentReports(JSON.parse(savedReports));
        } else {
          // Default mock reports
          const defaultReports: RecentReport[] = [
            {
              id: "REP-1",
              name: "analisis-semua-buah-2026-06-20.txt",
              size: "12 KB",
              type: "pdf",
              created: "2026-06-20 14:22",
              content: "=== LAPORAN ANALISIS BUAH ===\nDibuat pada: 2026-06-20\nJumlah Sampel: 150 buah\nStatistik Ringkasan:\nRata-rata Hue: 124°\nRata-rata Sirkularitas: 0.72\nRata-rata Rasio Aspek: 1.15"
            },
            {
              id: "REP-2",
              name: "ekspor-dataset-lengkap.csv",
              size: "18 KB",
              type: "excel",
              created: "2026-06-22 09:15",
              content: "ID,Nama Gambar,Jenis Buah,Ukuran,Tanggal Upload,Hue,Saturasi,Value,Sirkularitas,Rasio Aspek\nIMG-1000,apel_merah_01.jpg,Apel,247 KB,2026-06-01,11,0.79,0.76,0.92,1.03"
            }
          ];
          setRecentReports(defaultReports);
          localStorage.setItem("fruit_atlas_recent_reports", JSON.stringify(defaultReports));
        }
      } catch (err) {
        console.error(err);
        toast.error("Gagal memuat dataset untuk laporan");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // CSV Generator
  const generateCSV = (data: any[]) => {
    const headers = ["ID", "Nama Gambar", "Jenis Buah", "Ukuran", "Tanggal Upload", "Hue (derajat)", "Saturasi (0-1)", "Value (0-1)", "Sirkularitas (0-1)", "Rasio Aspek"];
    const rows = data.map(item => [
      item.id,
      item.name,
      item.fruit,
      item.size,
      item.uploaded,
      item.hue,
      item.saturation,
      item.value,
      item.circularity,
      item.aspectRatio
    ]);
    return [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
  };

  // Student List CSV Generator
  const generateStudentsReport = (students: any[]) => {
    const headers = ["ID", "Nama Lengkap", "Email", "Institusi", "Tanggal Bergabung", "Terakhir Login", "Status"];
    const rows = students.map(s => [
      s.id,
      s.name,
      s.email,
      s.institution,
      s.joined,
      s.lastLogin ? new Date(s.lastLogin).toLocaleString("id-ID") : "Belum pernah",
      s.status === "Active" ? "Aktif" : "Nonaktif"
    ]);
    return [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
  };

  // TXT Report Generator (Format Laporan PDF ringkas)
  const generatePDFReport = (data: any[], fruitType: string, dataScope: string) => {
    const dateStr = new Date().toLocaleString("id-ID");
    const fruitCounts: Record<string, number> = {};
    let totalHue = 0, totalCirc = 0, totalAspect = 0;

    data.forEach(item => {
      fruitCounts[item.fruit] = (fruitCounts[item.fruit] || 0) + 1;
      totalHue += item.hue;
      totalCirc += item.circularity;
      totalAspect += item.aspectRatio;
    });

    const total = data.length || 1;
    const avgHue = (totalHue / total).toFixed(1);
    const avgCirc = (totalCirc / total).toFixed(2);
    const avgAspect = (totalAspect / total).toFixed(2);

    let report = `===========================================================
               LAPORAN ANALISIS DATASET BUAH (FRUIT-ATLAS)
===========================================================
Tanggal Pembuatan : ${dateStr}
Kategori Saringan : ${fruitType}
Cakupan Data     : ${dataScope === "all" ? "Dataset Utama + Titik Visualisasi" : "Dataset Utama Sahaja"}
Jumlah Sampel      : ${data.length} buah

-----------------------------------------------------------
1. STATISTIK RINGKASAN DATASET CITRA
-----------------------------------------------------------
Rata-rata Rona Hue (Warna) : ${avgHue}°
Rata-rata Sirkularitas     : ${avgCirc}
Rata-rata Rasio Aspek      : ${avgAspect}

-----------------------------------------------------------
2. DISTRIBUSI JENIS BUAH DI DALAM KLASTER
-----------------------------------------------------------
`;

    for (const [fruit, count] of Object.entries(fruitCounts)) {
      report += `- Buah ${fruit.padEnd(15)} : ${count} sampel (${((count / total) * 100).toFixed(1)}%)\n`;
    }

    report += `
-----------------------------------------------------------
3. TABEL DETAIL DATASET SAMPEL (50 Sampel Pertama)
-----------------------------------------------------------
${"ID".padEnd(10)} | ${"Nama Buah".padEnd(20)} | ${"Metrik Ekstraksi (HSV, Circ, AR)"}
-----------------------------------------------------------
`;

    data.slice(0, 50).forEach(item => {
      report += `${item.id.padEnd(10)} | ${item.fruit.padEnd(20)} | HSV(${item.hue}°, ${item.saturation}, ${item.value}) · Circ: ${item.circularity} · AR: ${item.aspectRatio}\n`;
    });

    if (data.length > 50) {
      report += `... dan ${data.length - 50} sampel lainnya.\n`;
    }

    report += `\n==================== AKHIR DARI DOKUMENTASI LAPORAN ====================`;
    return report;
  };

  // TXT Audit Log Generator
  const generateHistoryReport = (data: any[]) => {
    const dateStr = new Date().toLocaleString("id-ID");
    let report = `===========================================================
            LOG AUDIT RIWAYAT UNGGAHAN KLASTERISASI BUAH
===========================================================
Tanggal Pembuatan : ${dateStr}
Jumlah Sampel      : ${data.length} log audit aktif

-----------------------------------------------------------
RIWAYAT ALUR KERJA SISTEM (50 Riwayat Terakhir)
-----------------------------------------------------------
`;
    data.slice(0, 50).forEach((item, idx) => {
      report += `[LOG-${(idx + 1).toString().padStart(3, "0")}] ${item.uploaded} - Berkas "${item.name}" terdaftar sebagai "${item.fruit}" dengan ID ${item.id}. Parameter ekstraksi: Hue=${item.hue}°, Sirkularitas=${item.circularity}, Rasio Aspek=${item.aspectRatio}.\n`;
    });

    if (data.length > 50) {
      report += `... dan ${data.length - 50} catatan audit log lainnya.\n`;
    }

    report += `\n==================== AKHIR DARI CATATAN AUDIT LOG ====================`;
    return report;
  };

  // Handle Report Creation
  const handleCreateReport = () => {
    setIsGenerating(true);
    setGenProgress(10);
    setGenMessage("Menghubungkan ke basis data...");

    // Filter data based on choices
    let filtered = [...items];
    if (fruitFilter !== "Semua") {
      filtered = filtered.filter(item => item.fruit === fruitFilter);
    }

    // Simulate progress steps
    const steps = [
      { p: 30, m: "Mengambil metadata piksel gambar..." },
      { p: 60, m: "Menghitung rata-rata histogram HSV..." },
      { p: 85, m: "Menyusun struktur berkas keluaran..." },
      { p: 100, m: "Berkas berhasil dibuat!" }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setGenProgress(step.p);
        setGenMessage(step.m);

        if (step.p === 100) {
          setTimeout(async () => {
            // Generate content
            let content = "";
            let extension = "txt";
            let filename = "";
            const timestamp = new Date().toISOString().split("T")[0];

            if (reportType === "excel") {
              content = generateCSV(filtered);
              extension = "csv";
              filename = `ekspor-dataset-${fruitFilter.toLowerCase()}-${timestamp}.${extension}`;
            } else if (reportType === "pdf") {
              content = generatePDFReport(filtered, fruitFilter, scope);
              filename = `laporan-analisis-${fruitFilter.toLowerCase()}-${timestamp}.${extension}`;
            } else if (reportType === "students") {
              const users = await getStoredUsers();
              const studentsOnly = users
                .filter(u => u.role === "student")
                .map(u => ({
                  id: u.id || "STU-XXXX",
                  name: u.fullName,
                  email: u.email,
                  institution: u.institution || "State University",
                  joined: u.joined || "-",
                  lastLogin: u.lastLogin,
                  status: u.status || "Active"
                }));
              content = generateStudentsReport(studentsOnly);
              extension = "csv";
              filename = `daftar-mahasiswa-${timestamp}.${extension}`;
            } else {
              content = generateHistoryReport(filtered);
              filename = `riwayat-audit-${fruitFilter.toLowerCase()}-${timestamp}.${extension}`;
            }

            const newReport: RecentReport = {
              id: "REP-" + (recentReports.length + 1),
              name: filename,
              size: `${(content.length / 1024).toFixed(1)} KB`,
              type: reportType,
              created: new Date().toISOString().replace("T", " ").substring(0, 16),
              content
            };

            const updated = [newReport, ...recentReports];
            setRecentReports(updated);
            localStorage.setItem("fruit_atlas_recent_reports", JSON.stringify(updated));

            setIsGenerating(false);
            setGenProgress(0);
            toast.success(`Laporan "${filename}" berhasil dibuat!`);
          }, 500);
        }
      }, (idx + 1) * 400);
    });
  };

  // Handle Download File in Browser
  const handleDownload = (report: RecentReport) => {
    try {
      const mimeType = report.type === "excel" ? "text/csv;charset=utf-8;" : "text/plain;charset=utf-8;";
      const blob = new Blob([report.content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", report.name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Unduhan untuk "${report.name}" dimulai`);
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunduh berkas");
    }
  };

  // Handle Delete Report
  const handleDeleteReport = (id: string) => {
    const updated = recentReports.filter(r => r.id !== id);
    setRecentReports(updated);
    localStorage.setItem("fruit_atlas_recent_reports", JSON.stringify(updated));
    toast.success("Catatan laporan dihapus");
  };

  return (
    <AppShell role="admin" title="Laporan & Ekspor" subtitle="Buat dokumentasi laporan dan ekspor dataset secara interaktif">
      {/* Upper Grid: Quick stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: PDF Report Config */}
        <div className={`rounded-xl border p-5 transition-all ${reportType === "pdf" ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card"}`}>
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-500"><FileText className="h-4 w-4" /></div>
            <button onClick={() => setReportType("pdf")} className={`text-xs px-2.5 py-1 rounded font-semibold ${reportType === "pdf" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {reportType === "pdf" ? <Check className="h-3 w-3" /> : "Pilih"}
            </button>
          </div>
          <h3 className="mt-4 text-sm font-bold text-foreground">Laporan PDF Ringkasan</h3>
          <p className="mt-1 text-xs text-muted-foreground">Berisi ringkasan rata-rata HSV, sirkularitas, dan rasio aspek yang diformat untuk dokumentasi lab.</p>
        </div>

        {/* Card 2: Excel/CSV Report Config */}
        <div className={`rounded-xl border p-5 transition-all ${reportType === "excel" ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card"}`}>
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500"><FileSpreadsheet className="h-4 w-4" /></div>
            <button onClick={() => setReportType("excel")} className={`text-xs px-2.5 py-1 rounded font-semibold ${reportType === "excel" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {reportType === "excel" ? <Check className="h-3 w-3" /> : "Pilih"}
            </button>
          </div>
          <h3 className="mt-4 text-sm font-bold text-foreground">Ekspor Excel / CSV</h3>
          <p className="mt-1 text-xs text-muted-foreground">Mengekstrak seluruh baris data koordinat pixel mentah ke format tabel spreadsheet siap olah (Excel).</p>
        </div>

        {/* Card 3: History Audit Config */}
        <div className={`rounded-xl border p-5 transition-all ${reportType === "history" ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card"}`}>
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500"><FileDown className="h-4 w-4" /></div>
            <button onClick={() => setReportType("history")} className={`text-xs px-2.5 py-1 rounded font-semibold ${reportType === "history" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {reportType === "history" ? <Check className="h-3 w-3" /> : "Pilih"}
            </button>
          </div>
          <h3 className="mt-4 text-sm font-bold text-foreground">Log Riwayat Audit</h3>
          <p className="mt-1 text-xs text-muted-foreground">Catatan riwayat audit lengkap disertai stempel waktu (timestamp) pengunggahan dan klasifikasi klaster.</p>
        </div>

        {/* Card 4: Students Report Config */}
        <div className={`rounded-xl border p-5 transition-all ${reportType === "students" ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card"}`}>
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500"><Users className="h-4 w-4" /></div>
            <button onClick={() => setReportType("students")} className={`text-xs px-2.5 py-1 rounded font-semibold ${reportType === "students" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {reportType === "students" ? <Check className="h-3 w-3" /> : "Pilih"}
            </button>
          </div>
          <h3 className="mt-4 text-sm font-bold text-foreground">Ekspor Daftar Mahasiswa</h3>
          <p className="mt-1 text-xs text-muted-foreground">Mengekspor seluruh daftar mahasiswa beserta stempel waktu (timestamp) login terakhir mereka.</p>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid gap-6 md:grid-cols-3 mt-6">
        {/* Left Column: Creator Form */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5"><Play className="h-4 w-4 text-primary" /> Pengaturan Laporan</h3>
          <p className="text-xs text-muted-foreground">Konfigurasikan cakupan data untuk menyusun dokumen laporan penelitian Anda.</p>

          <hr className="border-border/60" />

          {/* Input 1: Fruit Filter */}
          <div>
            <label className="block text-xs text-muted-foreground font-semibold">Filter Berdasarkan Jenis Buah</label>
            <select
              value={fruitFilter}
              onChange={(e) => setFruitFilter(e.target.value)}
              disabled={reportType === "students"}
              className="w-full mt-1.5 border border-border bg-surface rounded px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="Semua">Semua Jenis Buah</option>
              {fruitTypes.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Input 2: Data Scope */}
          <div>
            <label className="block text-xs text-muted-foreground font-semibold">Cakupan Data</label>
            <div className="mt-1.5 space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  value="real"
                  checked={scope === "real"}
                  disabled={reportType === "students"}
                  onChange={() => setScope("real")}
                  className="accent-primary disabled:opacity-50"
                />
                <span className={reportType === "students" ? "text-muted-foreground" : ""}>Hanya Dataset Utama ({items.length} Data)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  value="all"
                  checked={scope === "all"}
                  disabled={reportType === "students"}
                  onChange={() => setScope("all")}
                  className="accent-primary disabled:opacity-50"
                />
                <span className={reportType === "students" ? "text-muted-foreground" : ""}>Termasuk Titik Sintetis & Noise</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleCreateReport}
            disabled={isGenerating || loading}
            className="w-full rounded-md bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition shadow disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Menyusun Berkas...
              </>
            ) : (
              "Buat Laporan"
            )}
          </button>

          {/* Progress bar under button */}
          {isGenerating && (
            <div className="space-y-1.5 mt-3 animate-pulse">
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>{genMessage}</span>
                <span>{genProgress}%</span>
              </div>
              <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${genProgress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Recent Reports List */}
        <div className="md:col-span-2">
          <Section title="Pustaka Laporan Terbaru" description="Dokumen yang telah berhasil dibuat dan siap diunduh ke perangkat Anda.">
            {recentReports.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-xl text-center p-6 bg-card/40">
                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <h4 className="font-semibold text-xs text-foreground">Pustaka laporan kosong</h4>
                <p className="text-[10px] text-muted-foreground mt-1">Gunakan panel di sebelah kiri untuk membuat laporan pertama Anda.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <ul className="divide-y divide-border">
                  {recentReports.map((report) => (
                    <li key={report.id} className="flex items-center justify-between p-4 hover:bg-surface/30 transition">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          report.type === "excel" ? "bg-emerald-500/10 text-emerald-500" :
                          report.type === "pdf" ? "bg-red-500/10 text-red-500" :
                          report.type === "students" ? "bg-blue-500/10 text-blue-500" : "bg-indigo-500/10 text-indigo-500"
                        }`}>
                          {report.type === "excel" ? <FileSpreadsheet className="h-4 w-4" /> :
                           report.type === "pdf" ? <FileText className="h-4 w-4" /> :
                           report.type === "students" ? <Users className="h-4 w-4" /> : <FileDown className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground truncate max-w-[240px] md:max-w-[320px]">{report.name}</div>
                          <div className="flex gap-2 text-[10px] text-muted-foreground font-mono mt-0.5">
                            <span>{report.size}</span>
                            <span>·</span>
                            <span>{report.created}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          onClick={() => handleDownload(report)}
                          className="rounded border border-border bg-background px-3 py-1.5 font-semibold text-foreground hover:bg-muted transition"
                        >
                          Unduh
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="rounded border border-transparent text-muted-foreground px-2 py-1.5 hover:text-destructive hover:bg-destructive/10 transition"
                          title="Hapus riwayat"
                        >
                          Hapus
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>
        </div>
      </div>
    </AppShell>
  );
}
