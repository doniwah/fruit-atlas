import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Section } from "@/components/app/AppShell";
import { getDataset, deleteDatasetItem, updateDatasetItem } from "@/lib/db-store";
import { Search, Trash2, Database, AlertCircle, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/datasets")({
  head: () => ({ meta: [{ title: "Kelola Dataset — Admin" }] }),
  component: DatasetsPage,
});

function DatasetsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [fruitFilter, setFruitFilter] = useState("Semua buah");

  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    fruit: "",
    imageUrl: "",
    hue: 0,
    saturation: 0,
    value: 0,
    circularity: 0,
    aspectRatio: 1,
  });

  // Open Edit Dialog
  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setEditForm({
      id: item.id,
      name: item.name,
      fruit: item.fruit,
      imageUrl: item.imageUrl || "",
      hue: item.hue || 0,
      saturation: item.saturation || 0,
      value: item.value || 0,
      circularity: item.circularity || 0,
      aspectRatio: item.aspectRatio || 1,
    });
  };

  const [saving, setSaving] = useState(false);

  // Compress image using canvas before storing
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX = 300;
          let w = img.width;
          let h = img.height;
          if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
          else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.65));
        };
        img.onerror = reject;
        img.src = e.target!.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle File Upload — compress then store
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImage(file)
      .then((compressed) => {
        setEditForm((prev) => ({ ...prev, imageUrl: compressed }));
        toast.info(`Gambar "${file.name}" siap disimpan.`);
      })
      .catch(() => toast.error("Gagal membaca file gambar"));
  };

  // Handle Edit Submit
  const handleSaveEdit = async () => {
    if (!editForm.name.trim() || !editForm.fruit.trim()) {
      toast.error("Nama file dan kelas buah wajib diisi");
      return;
    }
    setSaving(true);
    try {
      // Send compressed imageUrl directly to server (safe size after compression)
      await updateDatasetItem({ data: editForm });
      toast.success(`Item ${editForm.id} berhasil diperbarui`);
      setEditingItem(null);
      loadItems();
    } catch (err: any) {
      console.error("Error updating dataset item:", err);
      const errMsg = err?.message || err?.toString() || "Unknown error";
      toast.error(`Gagal menyimpan: ${errMsg}`);
    } finally {
      setSaving(false);
    }
  };

  // Load dataset items from server
  const loadItems = () => {
    setLoading(true);
    getDataset()
      .then((res) => {
        setItems(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Gagal memuat item dataset");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadItems();

    const handleGlobalError = (event: ErrorEvent) => {
      toast.error(`Uncaught JavaScript Error: ${event.message}`);
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      const reasonStr = event.reason?.message || event.reason?.toString() || "Unknown promise error";
      toast.error(`Unhandled Promise Error: ${reasonStr}`);
    };

    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus item dataset dengan ID ${id}?`)) return;

    try {
      await deleteDatasetItem({ data: id });
      toast.success(`Item ${id} berhasil dihapus`);
      loadItems(); // reload
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus item dataset");
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.fruit.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFruit =
      fruitFilter === "Semua buah" ||
      item.fruit.toLowerCase() === fruitFilter.toLowerCase();

    return matchesSearch && matchesFruit;
  });

  const translateFruit = (fruit: string) => {
    switch (fruit.toLowerCase()) {
      case "apple": return "Apel";
      case "orange": return "Jeruk";
      case "banana": return "Pisang";
      case "mango": return "Mangga";
      case "grape": return "Anggur";
      default: return fruit;
    }
  };

  return (
    <AppShell
      role="admin"
      title="Kelola Dataset"
      subtitle="Unggah, beri label, dan kurasi gambar buah"
    >
      <Section
        title="Pustaka Dataset"
        description={`${filteredItems.length} gambar sesuai kriteria`}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Cari gambar…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-md border border-border bg-background py-1.5 pl-7 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <select
              value={fruitFilter}
              onChange={(e) => setFruitFilter(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-xs focus:outline-none"
            >
              <option>Semua buah</option>
              {Array.from(new Set(items.map(item => translateFruit(item.fruit)))).sort().map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        }
      >
        {loading ? (
          <div className="h-64 flex items-center justify-center font-mono text-sm text-muted-foreground">
            MENGAMBIL DAFTAR GAMBAR DARI DATABASE...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-xl text-center p-6">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <h4 className="font-semibold text-xs text-foreground">Tidak ada item yang cocok</h4>
            <p className="text-[10px] text-muted-foreground mt-1">Coba atur ulang filter atau kata pencarian Anda.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  {["ID", "Pratinjau", "Nama File", "Kelas Buah", "Ukuran", "Diunggah", "Aksi"].map((h) => (
                    <th key={h} className="px-4 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredItems.map((r) => (
                  <tr key={r.id} className="hover:bg-surface/30">
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.id}</td>
                    <td className="px-4 py-2.5">
                      {r.imageUrl ? (
                        <img
                          src={r.imageUrl}
                          alt={r.name}
                          className="h-10 w-10 rounded-md border border-border bg-muted object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-gradient-to-br from-primary/10 to-primary/5 border border-border flex items-center justify-center">
                          <Database className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-medium">{r.name}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
                        {translateFruit(r.fruit)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.size}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.uploaded}</td>
                    <td className="px-4 py-2.5 flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-primary transition"
                        title="Edit entri"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive transition"
                        title="Hapus entri"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── Edit Modal Dialog ── */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" /> Edit Item Dataset ({editForm.id})
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Nama File</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Kelas Buah</label>
                  <input
                    type="text"
                    value={editForm.fruit}
                    onChange={(e) => setEditForm({ ...editForm, fruit: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                <div className="flex justify-between items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Unggah File Gambar</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-xs text-muted-foreground
                        file:mr-3 file:py-1 file:px-2.5
                        file:rounded-md file:border-0
                        file:text-xs file:font-semibold
                        file:bg-primary/10 file:text-primary
                        hover:file:bg-primary/20 cursor-pointer"
                    />
                  </div>
                  {editForm.imageUrl && (
                    <div className="shrink-0">
                      <label className="block text-[9px] text-muted-foreground mb-1">Pratinjau</label>
                      <img
                        src={editForm.imageUrl}
                        alt="Preview"
                        className="h-12 w-12 rounded-md border border-border bg-muted object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="border-t border-border/40 pt-2">
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Atau Gunakan URL Gambar</label>
                  <input
                    type="text"
                    value={editForm.imageUrl}
                    onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                    placeholder="data:image/... atau http..."
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                  />
                </div>
              </div>

              <div className="border-t border-border/60 pt-3">
                <h4 className="font-semibold text-xs text-foreground mb-3 font-medium">Fitur Kuantitatif</h4>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">Hue (0 - 360)</label>
                    <input
                      type="number"
                      value={editForm.hue}
                      onChange={(e) => setEditForm({ ...editForm, hue: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">Saturasi (0.0 - 1.0)</label>
                    <input
                      type="number"
                      value={editForm.saturation}
                      onChange={(e) => setEditForm({ ...editForm, saturation: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">Value (0.0 - 1.0)</label>
                    <input
                      type="number"
                      value={editForm.value}
                      onChange={(e) => setEditForm({ ...editForm, value: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">Sirkularitas (0.0 - 1.0)</label>
                    <input
                      type="number"
                      value={editForm.circularity}
                      onChange={(e) => setEditForm({ ...editForm, circularity: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">Rasio Aspek (0.1 - 5.0)</label>
                    <input
                      type="number"
                      value={editForm.aspectRatio}
                      onChange={(e) => setEditForm({ ...editForm, aspectRatio: parseFloat(e.target.value) || 1 })}
                      className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border/60 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded-md border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
