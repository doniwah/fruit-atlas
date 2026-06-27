import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Section } from "@/components/app/AppShell";
import { getClusters, getDataset, deleteDatasetItem, ClusterConfig, FruitItem } from "@/lib/db-store";
import { ArrowLeft, Trash2, Database, AlertCircle, RefreshCw, BarChart2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cluster-detail")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      id: (search.id as string) || "",
    };
  },
  head: () => ({ meta: [{ title: "Detail Kluster — Admin" }] }),
  component: ClusterDetailPage,
});

function ClusterDetailPage() {
  const { id } = Route.useSearch();
  const [config, setConfig] = useState<ClusterConfig | null>(null);
  const [items, setItems] = useState<FruitItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FruitItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, dRes] = await Promise.all([getClusters(), getDataset()]);
      const matched = cRes.find((c) => c.id === id);
      setConfig(matched || null);
      setItems(dRes);

      if (matched) {
        const label = matched.label;
        let filtered: FruitItem[] = [];
        if (label.toLowerCase() === "noise" || label.toLowerCase() === "derau (noise)") {
          filtered = dRes.filter((i) => !i.fruit || i.fruit === "Noise");
        } else {
          const fruitName = label.split(" — ")[0];
          const englishFruitMap: Record<string, string> = {
            Apel: "Apple",
            Jeruk: "Orange",
            Pisang: "Banana",
            Mangga: "Mango",
            Anggur: "Grape",
          };
          const targetFruitName = englishFruitMap[fruitName] || fruitName;
          filtered = dRes.filter((i) => i.fruit === targetFruitName || i.fruit === fruitName);
        }
        setFilteredItems(filtered);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat rincian kluster");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus item ${itemId} dari kluster ini?`)) return;

    try {
      await deleteDatasetItem({ data: itemId });
      toast.success(`Item ${itemId} berhasil dihapus`);
      loadData(); // reload data
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus item");
    }
  };

  const translateLabel = (label?: string) => {
    if (!label) return "";
    return label
      .replace("Apple — Red Ripe", "Apel — Merah Matang")
      .replace("Orange — Mature", "Jeruk — Matang")
      .replace("Banana — Yellow", "Pisang — Kuning")
      .replace("Mango — Green Yellow", "Mangga — Hijau Kekuningan")
      .replace("Grape — Purple", "Anggur — Ungu")
      .replace("Noise", "Derau (Noise)");
  };

  const translateShape = (shape?: string) => {
    if (!shape) return "";
    switch (shape.toLowerCase()) {
      case "round": return "Bulat";
      case "curved": return "Melengkung";
      case "oval": return "Oval";
      case "cluster": return "Kelompok";
      case "mixed": return "Campuran";
      default: return shape;
    }
  };

  // Calculations
  const totalCount = filteredItems.length;
  const avgHue = totalCount ? Math.round(filteredItems.reduce((acc, i) => acc + i.hue, 0) / totalCount) : 0;
  const avgSat = totalCount ? (filteredItems.reduce((acc, i) => acc + i.saturation, 0) / totalCount).toFixed(2) : "0.00";
  const avgVal = totalCount ? (filteredItems.reduce((acc, i) => acc + i.value, 0) / totalCount).toFixed(2) : "0.00";
  const avgCirc = totalCount ? (filteredItems.reduce((acc, i) => acc + i.circularity, 0) / totalCount).toFixed(2) : "0.00";
  const avgAspect = totalCount ? (filteredItems.reduce((acc, i) => acc + i.aspectRatio, 0) / totalCount).toFixed(2) : "1.00";

  if (loading) {
    return (
      <AppShell role="admin" title="Rincian Kluster" subtitle="Memuat rincian...">
        <div className="h-64 flex items-center justify-center font-mono text-sm text-muted-foreground">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin text-primary" />
          MEMUAT RINCIAN KLASTER DAN METRIK...
        </div>
      </AppShell>
    );
  }

  if (!config) {
    return (
      <AppShell role="admin" title="Detail Kluster" subtitle="Kluster tidak ditemukan">
        <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-xl text-center p-6">
          <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
          <h4 className="font-semibold text-xs text-foreground">Kluster Tidak Ditemukan</h4>
          <p className="text-[10px] text-muted-foreground mt-1 max-w-sm">
            Kluster dengan ID "{id}" tidak terdaftar di database.
          </p>
          <Link to="/admin/clusters" className="mt-4 inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <ArrowLeft className="h-3 w-3" /> Kembali ke kelola kluster
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      role="admin"
      title="Rincian Kluster"
      subtitle={`Rincian visual dan statistik kluster ${config.id}`}
    >
      <div className="space-y-6">
        {/* Back Link */}
        <div>
          <Link
            to="/admin/clusters"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Kelola Kluster
          </Link>
        </div>

        {/* Top Profile Card */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="h-14 w-14 rounded-xl border border-border shadow-sm flex items-center justify-center text-white"
              style={{ background: config.dominantColor }}
            >
              <BarChart2 className="h-6 w-6 mix-blend-difference" />
            </div>
            <div>
              <div className="text-xs font-mono text-muted-foreground">{config.id}</div>
              <h2 className="text-lg font-bold text-foreground">{translateLabel(config.label)}</h2>
              <div className="text-xs text-muted-foreground flex gap-3 mt-0.5">
                <span>Bentuk Umum: <strong className="text-foreground">{translateShape(config.shape)}</strong></span>
                <span>•</span>
                <span>Warna Dominan: <strong className="font-mono text-foreground">{config.dominantColor}</strong></span>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-surface px-4 py-2 border border-border text-center sm:text-right">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Anggota</div>
            <div className="text-xl font-extrabold text-primary">{totalCount} gambar</div>
          </div>
        </div>

        {/* Feature Averages Section */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
          {[
            { label: "Hue Rata-rata", value: `${avgHue}°`, desc: "Rentang 0-360 derajat warna" },
            { label: "Saturasi Rata-rata", value: avgSat, desc: "Kepekatan warna (0-1)" },
            { label: "Kecerahan Rata-rata", value: avgVal, desc: "Nilai value warna (0-1)" },
            { label: "Sirkularitas Rata-rata", value: avgCirc, desc: "Tingkat kebulatan (0-1)" },
            { label: "Rasio Aspek Rata-rata", value: avgAspect, desc: "Perbandingan lebar/tinggi" },
          ].map((stat, idx) => (
            <div key={idx} className="rounded-lg border border-border bg-card p-4 text-center">
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</div>
              <div className="text-lg font-bold text-foreground mt-1.5">{stat.value}</div>
              <div className="text-[9px] text-muted-foreground mt-1">{stat.desc}</div>
            </div>
          ))}
        </div>

        {/* Member Grid Section */}
        <Section
          title="Sampel Visual Anggota"
          description={`Menampilkan ${totalCount} gambar yang termasuk dalam kluster ini`}
        >
          {totalCount === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center border border-dashed border-border rounded-xl text-center p-6">
              <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
              <h4 className="font-semibold text-xs text-foreground">Tidak Ada Anggota Kluster</h4>
              <p className="text-[10px] text-muted-foreground mt-1">
                Belum ada dataset yang terklasifikasi ke kluster ini. Silakan tambahkan dataset baru.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-xl border border-border bg-card overflow-hidden transition-all hover:scale-[1.02] hover:shadow-md hover:border-primary/30"
                >
                  {/* Image wrapper */}
                  <div className="aspect-square relative w-full overflow-hidden bg-muted border-b border-border">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-300"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <Database className="h-8 w-8 text-primary/30" />
                      </div>
                    )}
                    {/* Delete overlay button */}
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="absolute right-2 top-2 rounded-md bg-background/90 p-1.5 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                      title="Hapus gambar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Metadata */}
                  <div className="p-3 space-y-1.5">
                    <div className="flex justify-between items-center gap-1">
                      <span className="font-mono text-[9px] text-muted-foreground truncate">{item.id}</span>
                      <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">
                        H:{item.hue}°
                      </span>
                    </div>
                    <div className="font-medium text-xs truncate text-foreground" title={item.name}>
                      {item.name}
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[9px] text-muted-foreground pt-1 border-t border-border/40">
                      <div>Circ: {item.circularity.toFixed(2)}</div>
                      <div>AR: {item.aspectRatio.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </AppShell>
  );
}
