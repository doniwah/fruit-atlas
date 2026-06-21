import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatCard, Section } from "@/components/app/AppShell";
import { getDashboardStats } from "@/lib/db-store";
import { Database, FlaskConical, Users, Boxes, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard Admin — FruitCluster" }] }),
  component: AdminDashboard,
});

const icons = [Database, Activity, Boxes, FlaskConical];
const COLORS = ["#4CAF50", "#3B82F6", "#F59E0B", "#A855F7", "#EF4444", "#9CA3AF"];

function AdminDashboard() {
  const [data, setData] = useState<{ stats: any[]; distribution: any[]; history: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getDashboardStats()
      .then((res) => {
        if (isMounted) {
          // Translate dynamic stats deltas
          const translatedStats = res.stats.map((s) => {
            let delta = s.delta;
            if (delta.includes("this week")) delta = delta.replace("this week", "minggu ini");
            if (delta.includes("today")) delta = delta.replace("today", "hari ini");
            if (delta.includes("stable")) delta = "stabil";
            if (delta.includes("isolated")) delta = delta.replace("isolated", "terisolasi");
            
            let label = s.label;
            if (label === "Total Dataset") label = "Total Dataset";
            if (label === "Total Analysis Runs") label = "Total Eksekusi Analisis";
            if (label === "Total Clusters") label = "Total Kluster";
            if (label === "Noise Points") label = "Titik Derau (Noise)";

            return { ...s, label, delta };
          });

          // Translate distribution fruit names if necessary
          const translatedDistribution = res.distribution.map((d) => {
            let name = d.name;
            if (name === "Apple") name = "Apel";
            if (name === "Orange") name = "Jeruk";
            if (name === "Banana") name = "Pisang";
            if (name === "Mango") name = "Mangga";
            if (name === "Grape") name = "Anggur";
            if (name === "Noise") name = "Derau (Noise)";
            return { ...d, name };
          });

          // Translate history days
          const dayMapping: Record<string, string> = {
            "Mon": "Sen", "Tue": "Sel", "Wed": "Rab", "Thu": "Kam", "Fri": "Jum", "Sat": "Sab", "Sun": "Min"
          };
          const translatedHistory = res.history.map((h) => ({
            ...h,
            day: dayMapping[h.day] || h.day
          }));

          setData({
            stats: translatedStats,
            distribution: translatedDistribution,
            history: translatedHistory
          });
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !data) {
    return (
      <AppShell role="admin" title="Dashboard" subtitle="Gambaran umum aktivitas sistem">
        <div className="h-64 flex items-center justify-center font-mono text-sm text-muted-foreground">
          MENGHITUNG METRIK ADMIN DAN STATISTIK KLASTER...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      role="admin"
      title="Dashboard"
      subtitle="Gambaran umum aktivitas di seluruh platform"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.stats.map((s, i) => (
          <StatCard key={s.label} {...s} icon={icons[i % icons.length]} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section title="Riwayat Analisis" description="Jumlah analisis per hari, 7 hari terakhir">
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <BarChart data={data.history}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="day" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }} />
                  <Bar dataKey="runs" fill="#4CAF50" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>
        </div>

        <Section title="Distribusi Kluster" description="Jumlah gambar buah per kategori kluster">
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.distribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {data.distribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {data.distribution.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground">{c.name}</span>
                <span className="ml-auto font-medium">{c.value}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="mt-6">
        <Section title="Aktivitas Terbaru">
          <ul className="divide-y divide-border">
            {[
              { who: "Maya P.", what: "menjalankan analisis DBSCAN pada 12 gambar buah", when: "2 menit yang lalu" },
              { who: "Admin", what: "menyinkronkan konfigurasi dan pustaka database", when: "1 jam yang lalu" },
              { who: "Sistem Siswa", what: "menghitung kontur bentuk real-time untuk unggahan kustom", when: "3 jam yang lalu" },
              { who: "Sistem DBSCAN", what: "memetakan ulang label kelas kluster dinamis baru", when: "Baru saja" },
            ].map((a, i) => (
              <li key={i} className="flex items-center gap-3 py-3 text-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <span className="font-medium">{a.who}</span>{" "}
                  <span className="text-muted-foreground">{a.what}</span>
                </div>
                <div className="text-xs text-muted-foreground">{a.when}</div>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </AppShell>
  );
}
