import { createFileRoute } from "@tanstack/react-router";
import { MarketingNav, MarketingFooter } from "@/components/marketing/MarketingShell";
import { Mail, MapPin, Phone } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Kontak — FruitCluster" }, { name: "description", content: "Hubungi laboratorium penelitian FruitCluster." }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <div className="mx-auto grid max-w-5xl gap-10 px-6 py-20 md:grid-cols-2">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Kontak</h1>
          <p className="mt-2 text-sm text-muted-foreground">Untuk kolaborasi penelitian atau lisensi akademik.</p>
          <ul className="mt-8 space-y-4 text-sm">
            <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /> research@fruitcluster.edu</li>
            <li className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary" /> +62 21 555 1234</li>
            <li className="flex items-center gap-3"><MapPin className="h-4 w-4 text-primary" /> Fakultas Informatika, Jakarta</li>
          </ul>
        </div>
        <form className="rounded-xl border border-border bg-card p-6">
          <div className="space-y-4">
            {[
              { l: "Nama Anda", t: "text", ph: "Jane Doe" },
              { l: "Email", t: "email", ph: "nama@universitas.ac.id" },
            ].map((f) => (
              <div key={f.l}>
                <label className="text-xs font-medium text-muted-foreground">{f.l}</label>
                <input type={f.t} placeholder={f.ph} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Pesan</label>
              <textarea rows={4} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <button type="button" className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Kirim pesan</button>
          </div>
        </form>
      </div>
      <MarketingFooter />
    </div>
  ),
});
