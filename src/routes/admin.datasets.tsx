import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Section } from "@/components/app/AppShell";
import { getDataset, deleteDatasetItem } from "@/lib/db-store";
import { Search, Trash2, Database, AlertCircle } from "lucide-react";
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
      item.fruit.toLowerCase() === (fruitFilter === "Apel" ? "apple" : fruitFilter === "Jeruk" ? "orange" : fruitFilter === "Pisang" ? "banana" : fruitFilter === "Mangga" ? "mango" : fruitFilter === "Anggur" ? "grape" : fruitFilter).toLowerCase();

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
              <option>Apel</option>
              <option>Jeruk</option>
              <option>Pisang</option>
              <option>Mangga</option>
              <option>Anggur</option>
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
                    <td className="px-4 py-2.5">
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
    </AppShell>
  );
}
