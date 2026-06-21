import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Section } from "@/components/app/AppShell";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Pengaturan — Admin" }] }),
  component: () => (
    <AppShell role="admin" title="Pengaturan" subtitle="Nilai default pipa pemrosesan dan preferensi platform">
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Nilai Default DBSCAN">
          <div className="space-y-3 text-sm">
            <label className="block"><span className="text-xs text-muted-foreground">eps</span>
              <input defaultValue="0.45" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" />
            </label>
            <label className="block"><span className="text-xs text-muted-foreground">min_samples</span>
              <input defaultValue="5" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" />
            </label>
          </div>
        </Section>
        <Section title="Notifikasi">
          <ul className="space-y-3 text-sm">
            {["Kirim email saat analisis selesai", "Rangkuman mingguan penelitian", "Peringatan keamanan akun"].map((l) => (
              <li key={l} className="flex items-center justify-between">
                <span>{l}</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-[color:var(--primary)]" />
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </AppShell>
  ),
});
