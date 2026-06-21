import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Section } from "@/components/app/AppShell";
import { clusters } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/results")({
  head: () => ({ meta: [{ title: "Analisis Hasil — Admin" }] }),
  component: () => {
    const translateShape = (shape?: string) => {
      if (!shape) return "";
      switch (shape.toLowerCase()) {
        case "round": return "Bulat";
        case "oval": return "Lonjong";
        case "curved": return "Melengkung";
        case "cluster": return "Kluster";
        case "mixed": return "Campuran";
        default: return shape;
      }
    };

    const translateLabel = (label?: string) => {
      if (!label) return "";
      if (label.startsWith("Apple")) return label.replace("Apple", "Apel");
      if (label.startsWith("Orange")) return label.replace("Orange", "Jeruk");
      if (label.startsWith("Banana")) return label.replace("Banana", "Pisang");
      if (label.startsWith("Mango")) return label.replace("Mango", "Mangga");
      if (label.startsWith("Grape")) return label.replace("Grape", "Anggur");
      if (label === "Noise") return "Derau (Noise)";
      return label;
    };

    return (
      <AppShell role="admin" title="Analisis Hasil" subtitle="Hasil agregat kluster">
        <Section title="Ringkasan Kluster">
          <div className="grid gap-3 md:grid-cols-3">
            {clusters.map((c) => (
              <div key={c.id} className="rounded-lg border border-border bg-surface p-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full border border-border" style={{ background: c.dominantColor }} />
                  <span className="font-medium">{translateLabel(c.label)}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{c.count} anggota · {translateShape(c.shape)}</div>
              </div>
            ))}
          </div>
        </Section>
      </AppShell>
    );
  },
});
