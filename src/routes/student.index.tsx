import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, StatCard, Section } from "@/components/app/AppShell";
import {
  FlaskConical,
  ImageIcon,
  Sparkles,
  ArrowRight,
  BarChart3,
  CalendarDays,
} from "lucide-react";
import { getStudentDashboard } from "@/lib/db-store";

// --- Loader: fetch real data server-side ---
export const Route = createFileRoute("/student/")({
  head: () => ({ meta: [{ title: "Dashboard Siswa — FruitCluster" }] }),
  loader: async () => {
    return await getStudentDashboard();
  },
  component: StudentDashboard,
});

// --- Fruit color map for distribution badges ---
const FRUIT_COLORS: Record<string, string> = {
  Apel: "#C0392B",
  Jeruk: "#E67E22",
  Pisang: "#F4D03F",
  Mangga: "#7DCE82",
  Anggur: "#6C3483",
  Stroberi: "#E74C3C",
  Ceri: "#A93226",
  Lemon: "#F9CA24",
  Pisang2: "#F1C40F",
};
function fruitColor(name: string) {
  return FRUIT_COLORS[name] ?? "#64748b";
}

// Format date string to Indonesian short format
function fmtDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function StudentDashboard() {
  const data = Route.useLoaderData();

  const {
    totalAnalysis,
    totalImages,
    thisWeekCount,
    latestResult,
    latestUploaded,
    recentItems,
    fruitDistribution,
  } = data;

  // Stat delta strings
  const weekDelta =
    thisWeekCount > 0
      ? `+${thisWeekCount} minggu ini`
      : "Belum ada minggu ini";

  return (
    <AppShell
      role="student"
      title="Dashboard"
      subtitle="Sekilas tentang analisis Anda"
      actions={
        <Link
          to="/student/upload"
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          Pilih gambar
        </Link>
      }
    >
      {/* ── Stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Analisis Saya"
          value={totalAnalysis.toString()}
          delta={weekDelta}
          icon={FlaskConical}
        />
        <StatCard
          label="Gambar Diunggah"
          value={totalImages.toString()}
          delta={weekDelta}
          icon={ImageIcon}
        />
        <StatCard
          label="Hasil Terbaru"
          value={latestResult}
          delta={latestUploaded ? `Diunggah: ${fmtDate(latestUploaded)}` : "Belum ada data"}
          icon={Sparkles}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* ── Recent uploads list ── */}
        <Section
          title="Analisis Terbaru"
          description="5 gambar buah yang terakhir dianalisis"
        >
          {recentItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Belum ada analisis. Pilih gambar dari dataset untuk melihat hasil.
            </p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {recentItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between py-3 gap-3"
                >
                  {/* Fruit color dot */}
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ background: fruitColor(item.fruit) }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <CalendarDays className="h-3 w-3" />
                      {fmtDate(item.uploaded)}
                      <span className="text-border">·</span>
                      <span
                        className="font-semibold"
                        style={{ color: fruitColor(item.fruit) }}
                      >
                        {item.clusterLabel}
                      </span>
                    </div>
                  </div>
                  <Link
                    to="/student/results"
                    search={{ id: item.id }}
                    className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted inline-flex items-center gap-1 flex-shrink-0"
                  >
                    Lihat <ArrowRight className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="pt-3 border-t border-border/50">
            <Link
              to="/student/upload"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              + Pilih gambar dari dataset
            </Link>
          </div>
        </Section>

        {/* ── Right column: distribution + tips ── */}
        <div className="flex flex-col gap-6">
          {/* Fruit distribution */}
          <Section
            title="Distribusi Buah"
            description="Frekuensi klasifikasi dari seluruh dataset"
          >
            {fruitDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Belum ada data distribusi.
              </p>
            ) : (
              <div className="space-y-2">
                {fruitDistribution.map(({ name, count }) => {
                  const total = fruitDistribution.reduce(
                    (s, f) => s + f.count,
                    0
                  );
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={name} className="flex items-center gap-3 text-sm">
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ background: fruitColor(name) }}
                      />
                      <span className="w-20 truncate text-xs font-medium">
                        {name}
                      </span>
                      <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: fruitColor(name),
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Tips */}
          <Section
            title="Tips Praktis"
            description="Dapatkan hasil klaster yang lebih baik"
          >
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <BarChart3 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                Gunakan pencahayaan yang konsisten untuk semua gambar buah.
              </li>
              <li className="flex items-start gap-2">
                <BarChart3 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                Potong gambar (crop) secara rapat di sekitar buah sebelum diunggah.
              </li>
              <li className="flex items-start gap-2">
                <BarChart3 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                Gunakan metrik <strong>Keduanya</strong> (warna + bentuk) untuk
                hasil DBSCAN terbaik.
              </li>
              <li className="flex items-start gap-2">
                <BarChart3 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                Tinjau titik derau (noise) — sering kali menandakan salah label.
              </li>
            </ul>
          </Section>
        </div>
      </div>
    </AppShell>
  );
}
