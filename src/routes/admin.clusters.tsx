import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Section } from "@/components/app/AppShell";
import { getClusters, getDataset, addClusterConfigItem, updateClusterConfigItem, deleteClusterConfigItem, ClusterConfig } from "@/lib/db-store";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/clusters")({
  head: () => ({ meta: [{ title: "Kelola Kluster — Admin" }] }),
  component: ClustersPage,
});

function ClustersPage() {
  const [configs, setConfigs] = useState<ClusterConfig[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isEditing, setIsEditing] = useState<string | null>(null); // config.id
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    label: "",
    dominantColor: "#3B82F6",
    shape: "Bulat",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, dRes] = await Promise.all([getClusters(), getDataset()]);
      setConfigs(cRes);
      setItems(dRes);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat kluster");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditClick = (c: ClusterConfig) => {
    setIsEditing(c.id);
    setFormData({
      label: c.label,
      dominantColor: c.dominantColor,
      shape: translateShapeToIndonesian(c.shape),
    });
  };

  const handleSave = async (id: string) => {
    if (!formData.label.trim()) {
      toast.error("Label tidak boleh kosong");
      return;
    }

    try {
      await updateClusterConfigItem({
        data: {
          id,
          label: formData.label,
          dominantColor: formData.dominantColor,
          shape: translateShapeToEnglish(formData.shape),
        },
      });
      toast.success("Kluster berhasil diperbarui");
      setIsEditing(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui kluster");
    }
  };

  const handleAdd = async () => {
    if (!formData.label.trim()) {
      toast.error("Label tidak boleh kosong");
      return;
    }

    try {
      await addClusterConfigItem({
        data: {
          label: formData.label,
          dominantColor: formData.dominantColor,
          shape: translateShapeToEnglish(formData.shape),
        },
      });
      toast.success("Kluster berhasil ditambahkan");
      setIsAdding(false);
      setFormData({ label: "", dominantColor: "#3B82F6", shape: "Bulat" });
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menambahkan kluster");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pemetaan label kluster ini?")) return;

    try {
      await deleteClusterConfigItem({ data: id });
      toast.success("Kluster berhasil dihapus");
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus kluster");
    }
  };

  // Helper to count members based on cluster label mapping (matching fruit type name)
  const getClusterCount = (label?: string) => {
    if (!label) return 0;
    if (label.toLowerCase() === "noise" || label.toLowerCase() === "derau (noise)") {
      return items.filter(i => !i.fruit || i.fruit === "Noise").length;
    }
    const fruitName = label.split(" — ")[0];
    // Map Indonesian names to English if used in fruit properties
    const englishFruitMap: Record<string, string> = {
      "Apel": "Apple",
      "Jeruk": "Orange",
      "Pisang": "Banana",
      "Mangga": "Mango",
      "Anggur": "Grape"
    };
    const targetFruitName = englishFruitMap[fruitName] || fruitName;
    return items.filter(i => i.fruit === targetFruitName || i.fruit === fruitName).length;
  };

  const translateShapeToIndonesian = (shape?: string) => {
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

  const translateShapeToEnglish = (shape?: string) => {
    if (!shape) return "";
    switch (shape.toLowerCase()) {
      case "bulat": return "Round";
      case "melengkung": return "Curved";
      case "oval": return "Oval";
      case "kelompok": return "Cluster";
      case "campuran": return "Mixed";
      default: return shape;
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

  return (
    <AppShell
      role="admin"
      title="Kelola Kluster"
      subtitle="Kurasi label kluster dan rincian kelompok"
      actions={
        <button
          onClick={() => {
            setIsAdding(true);
            setIsEditing(null);
            setFormData({ label: "", dominantColor: "#10B981", shape: "Bulat" });
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/95 hover:shadow transition"
        >
          <Plus className="h-3.5 w-3.5" /> Tambah kluster
        </button>
      }
    >
      {loading ? (
        <div className="h-64 flex items-center justify-center font-mono text-sm text-muted-foreground">
          MEMUAT KONFIGURASI KLASTER AKTIF...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Add Cluster Section */}
          {isAdding && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 animate-[fadeIn_0.3s_ease-out]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground">Tambah Pemetaan Label Kluster Baru</h3>
                <button onClick={() => setIsAdding(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs text-muted-foreground font-semibold">Label Kluster</label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="misal: Apel — Hijau Asam"
                    className="w-full mt-1.5 border border-border bg-card rounded px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground font-semibold">Kode Warna Dominan</label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      type="color"
                      value={formData.dominantColor}
                      onChange={(e) => setFormData({ ...formData, dominantColor: e.target.value })}
                      className="h-8 w-12 rounded border border-border bg-transparent p-0.5 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.dominantColor}
                      onChange={(e) => setFormData({ ...formData, dominantColor: e.target.value })}
                      className="flex-1 border border-border bg-card rounded px-2.5 py-1.5 font-mono text-xs outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground font-semibold">Bentuk Umum</label>
                  <input
                    type="text"
                    value={formData.shape}
                    onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
                    placeholder="misal: Bulat, Oval, Melengkung"
                    className="w-full mt-1.5 border border-border bg-card rounded px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2 text-xs font-semibold">
                <button
                  onClick={() => setIsAdding(false)}
                  className="rounded border border-border bg-background px-3 py-1.5 hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  onClick={handleAdd}
                  className="rounded bg-primary text-primary-foreground px-3 py-1.5 hover:bg-primary/95"
                >
                  Simpan Pemetaan
                </button>
              </div>
            </div>
          )}

          {/* Clusters Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {configs.map((c) => {
              const editing = isEditing === c.id;
              const count = getClusterCount(c.label);

              return (
                <div
                  key={c.id}
                  className={`rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] transition ${
                    editing ? "border-primary bg-primary/5 shadow-md" : "border-border"
                  }`}
                >
                  {editing ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <span className="text-xs font-mono text-muted-foreground">{c.id}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSave(c.id)}
                            className="rounded-md p-1 text-emerald-500 hover:bg-emerald-500/10"
                            title="Simpan"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setIsEditing(null)}
                            className="rounded-md p-1 text-rose-500 hover:bg-rose-500/10"
                            title="Batal"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] text-muted-foreground font-semibold">Nama Label</label>
                        <input
                          type="text"
                          value={formData.label}
                          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                          className="w-full border border-border bg-background rounded px-2.5 py-1 text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-muted-foreground font-semibold">Kode Warna</label>
                          <div className="flex items-center gap-1 mt-1">
                            <input
                              type="color"
                              value={formData.dominantColor}
                              onChange={(e) => setFormData({ ...formData, dominantColor: e.target.value })}
                              className="h-6 w-8 rounded border border-border cursor-pointer bg-transparent"
                            />
                            <input
                              type="text"
                              value={formData.dominantColor}
                              onChange={(e) => setFormData({ ...formData, dominantColor: e.target.value })}
                              className="w-full border border-border bg-background rounded px-1.5 py-1 font-mono text-[10px]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] text-muted-foreground font-semibold">Bentuk</label>
                          <input
                            type="text"
                            value={formData.shape}
                            onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
                            className="w-full mt-1 border border-border bg-background rounded px-2.5 py-1 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <Link
                          to="/admin/cluster-detail"
                          search={{ id: c.id }}
                          className="flex items-center gap-3 cursor-pointer group/link hover:opacity-85 transition-opacity flex-1 min-w-0"
                        >
                          <div
                            className="h-10 w-10 rounded-lg border border-border shrink-0 transition-transform group-hover/link:scale-[1.03]"
                            style={{ background: c.dominantColor }}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-mono text-muted-foreground">{c.id}</div>
                            <div className="text-sm font-semibold truncate group-hover/link:text-primary transition-colors">
                              {translateLabel(c.label)}
                            </div>
                          </div>
                        </Link>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEditClick(c)}
                            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive cursor-pointer transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <Link
                        to="/admin/cluster-detail"
                        search={{ id: c.id }}
                        className="mt-4 grid grid-cols-2 gap-3 text-xs border-t border-border/40 pt-3 cursor-pointer hover:opacity-85 transition-opacity block"
                      >
                        <div>
                          <div className="text-muted-foreground">Anggota Terhitung</div>
                          <div className="font-semibold text-foreground">{count} gambar</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Arketipe Bentuk</div>
                          <div className="font-semibold text-foreground">{translateShapeToIndonesian(c.shape)}</div>
                        </div>
                      </Link>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary Table */}
          <div>
            <Section title="Konfigurasi Kluster" description="Rincian referensi yang digunakan oleh pengklasifikasi dinamis">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    {["Kode Kluster", "Nama Label", "Anggota", "Pemetaan Warna Dominan", "Profil Bentuk"].map((h) => (
                      <th key={h} className="py-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {configs.map((c) => (
                    <tr key={c.id} className="border-t border-border">
                      <td className="py-2 font-mono text-xs text-muted-foreground">{c.id}</td>
                      <td className="py-2 font-semibold text-foreground">{translateLabel(c.label)}</td>
                      <td className="py-2">{getClusterCount(c.label)} gambar</td>
                      <td className="py-2">
                        <span
                          className="inline-block h-4 w-4 rounded border border-border align-middle"
                          style={{ background: c.dominantColor }}
                        />{" "}
                        <span className="ml-2 align-middle text-xs text-muted-foreground font-mono">
                          {c.dominantColor}
                        </span>
                      </td>
                      <td className="py-2 text-muted-foreground">{translateShapeToIndonesian(c.shape)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </div>
        </div>
      )}
    </AppShell>
  );
}
