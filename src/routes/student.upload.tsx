import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AppShell, Section } from "@/components/app/AppShell";
import { Search, Database, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { getDataset } from "@/lib/db-store";

export const Route = createFileRoute("/student/upload")({
  head: () => ({ meta: [{ title: "Pilih Gambar Buah — Siswa" }] }),
  component: SelectFruitPage,
});

function SelectFruitPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [fruitFilter, setFruitFilter] = useState("Semua buah");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    getDataset()
      .then((res) => {
        // Sanitize: replace any __local__ sentinel (from old localStorage approach) with empty
        const sanitized = res.map((item: any) => ({
          ...item,
          imageUrl: item.imageUrl?.startsWith("__local__") ? "" : (item.imageUrl || ""),
        }));
        setItems(sanitized);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

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

  const handleStartAnalysis = () => {
    if (selectedIds.length === 0) return;
    navigate({ to: "/student/results", search: { ids: selectedIds.join(",") } });
  };

  return (
    <AppShell role="student" title="Pilih Gambar Buah" subtitle="Pilih gambar dari dataset untuk melihat hasil analisis & klasterisasi">
      <div className="mb-4 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs text-foreground">
        <span className="text-muted-foreground">Punya gambar buah kustom sendiri yang ingin dianalisis?</span>
        <Link to="/student/analysis" className="font-semibold text-primary hover:underline flex items-center gap-1.5 cursor-pointer">
          Buka Halaman Unggah <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <Section
        title="Perpustakaan Gambar Buah"
        description={`${filteredItems.length} gambar tersedia`}
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
          <div className="h-64 flex flex-col items-center justify-center font-mono text-sm text-muted-foreground gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            MEMUAT DATASET GAMBAR BUAH...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-xl text-center p-6">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <h4 className="font-semibold text-xs text-foreground">Tidak ada gambar yang cocok</h4>
            <p className="text-[10px] text-muted-foreground mt-1">Coba atur ulang filter atau kata pencarian Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const active = selectedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (active) {
                      setSelectedIds(selectedIds.filter((id) => id !== item.id));
                    } else {
                      setSelectedIds([...selectedIds, item.id]);
                    }
                  }}
                  className={`group text-left rounded-xl border p-2 bg-card hover:shadow-md transition duration-200 ${
                    active ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-border"
                  }`}
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-900 border border-border flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <Database className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <span className="absolute top-1.5 left-1.5 font-mono text-[9px] bg-slate-950/75 text-white px-1.5 py-0.5 rounded backdrop-blur">
                      {item.id}
                    </span>
                    {/* Checkbox indicator overlay */}
                    <div className={`absolute top-1.5 right-1.5 h-4.5 w-4.5 rounded border flex items-center justify-center transition-all duration-150 ${
                      active ? "bg-primary border-primary text-primary-foreground scale-110 shadow" : "bg-black/50 border-white/60 text-transparent"
                    }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="h-3 w-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2 px-1">
                    <div className="font-medium text-xs truncate text-foreground">{item.name}</div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                      <span className="rounded bg-accent px-1.5 py-0.5 text-accent-foreground font-semibold">
                        {translateFruit(item.fruit)}
                      </span>
                      <span>{item.size}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Section>

      {selectedIds.length > 0 && (
        <div className="mt-6 flex justify-end gap-2 animate-[fadeIn_0.2s_ease-out]">
          <button
            onClick={() => setSelectedIds([])}
            className="rounded-md border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-muted"
          >
            Batal ({selectedIds.length} terpilih)
          </button>
          <button
            onClick={handleStartAnalysis}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/95 flex items-center gap-1.5 shadow"
          >
            Lihat Analisis & Klasterisasi <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </AppShell>
  );
}
