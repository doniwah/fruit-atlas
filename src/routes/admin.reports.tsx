import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Section } from "@/components/app/AppShell";
import { FileDown, FileSpreadsheet, FileText } from "lucide-react";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Laporan — Admin" }] }),
  component: () => (
    <AppShell role="admin" title="Laporan" subtitle="Buat dokumentasi untuk penelitian dan audit">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { t: "Laporan PDF", d: "Diformat untuk lampiran tesis", icon: FileText },
          { t: "Ekspor Excel", d: "Fitur mentah dan pembagian kluster", icon: FileSpreadsheet },
          { t: "Riwayat Analisis", d: "Log audit yang disertai stempel waktu", icon: FileDown },
        ].map((r) => (
          <div key={r.t} className="rounded-xl border border-border bg-card p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><r.icon className="h-4 w-4" /></div>
            <h3 className="mt-4 text-sm font-semibold">{r.t}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{r.d}</p>
            <button className="mt-4 w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">Buat</button>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Section title="Laporan terbaru">
          <ul className="divide-y divide-border text-sm">
            {[
              { f: "analisis-2025-05-21.pdf", s: "1.2 MB" },
              { f: "ekspor-kluster.xlsx", s: "342 KB" },
              { f: "riwayat-april.pdf", s: "880 KB" },
            ].map((r) => (
              <li key={r.f} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{r.f}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{r.s}</span>
                  <button className="rounded-md border border-border px-2 py-1 hover:bg-muted">Unduh</button>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </AppShell>
  ),
});
