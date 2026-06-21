import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Section } from "@/components/app/AppShell";

export const Route = createFileRoute("/admin/analysis")({
  head: () => ({ meta: [{ title: "Analisis Gambar — Admin" }] }),
  component: () => (
    <AppShell role="admin" title="Analisis Gambar" subtitle="Tinjau dan jalankan kembali alur pemrosesan pada gambar apa pun">
      <Section title="Analisis terbaru">
        <p className="text-sm text-muted-foreground">Alur kerja analisis lengkap dapat diakses melalui <Link to="/student/analysis" className="text-primary hover:underline">ruang kerja analisis</Link>.</p>
      </Section>
    </AppShell>
  ),
});
