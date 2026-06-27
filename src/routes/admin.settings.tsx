import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Section } from "@/components/app/AppShell";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Pengaturan — Admin" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [eps, setEps] = useState(0.05);
  const [minSamples, setMinSamples] = useState(4);
  const [notifPreferences, setNotifPreferences] = useState({
    emailAnalysis: true,
    weeklySummary: true,
    securityAlert: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load DBSCAN settings
    const savedDBSCAN = localStorage.getItem("fruit_atlas_dbscan_settings");
    if (savedDBSCAN) {
      try {
        const parsed = JSON.parse(savedDBSCAN);
        setEps(parsed.eps ?? 0.05);
        setMinSamples(parsed.minSamples ?? 4);
      } catch (e) {
        console.error("Failed to parse fruit_atlas_dbscan_settings", e);
      }
    }

    // Load Notification settings
    const savedNotifs = localStorage.getItem("fruit_atlas_notif_preferences");
    if (savedNotifs) {
      try {
        setNotifPreferences(JSON.parse(savedNotifs));
      } catch (e) {
        console.error("Failed to parse fruit_atlas_notif_preferences", e);
      }
    }

    setLoading(false);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (isNaN(eps) || eps <= 0) {
      toast.error("Nilai epsilon (eps) harus berupa angka positif.");
      return;
    }
    if (isNaN(minSamples) || minSamples <= 0 || !Number.isInteger(minSamples)) {
      toast.error("Nilai min_samples harus berupa bilangan bulat positif.");
      return;
    }

    localStorage.setItem(
      "fruit_atlas_dbscan_settings",
      JSON.stringify({ eps, minSamples })
    );

    localStorage.setItem(
      "fruit_atlas_notif_preferences",
      JSON.stringify(notifPreferences)
    );

    toast.success("Pengaturan berhasil disimpan!");
  };

  if (loading) {
    return (
      <AppShell role="admin" title="Pengaturan" subtitle="Memuat preferensi...">
        <div className="h-64 flex items-center justify-center font-mono text-sm text-muted-foreground">
          Memuat pengaturan...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="admin" title="Pengaturan" subtitle="Nilai default pipa pemrosesan dan preferensi platform">
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* DBSCAN Settings */}
          <Section title="Nilai Default DBSCAN" description="Parameter bawaan untuk analisis klasterisasi siswa">
            <div className="space-y-4 py-2">
              <div className="space-y-1 text-sm">
                <label htmlFor="eps" className="block text-xs font-semibold text-muted-foreground">
                  Epsilon (eps)
                </label>
                <input
                  id="eps"
                  type="number"
                  step="0.01"
                  value={eps}
                  onChange={(e) => setEps(parseFloat(e.target.value))}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Jarak maksimum antar titik untuk dikategorikan sebagai satu lingkungan klaster.
                </p>
              </div>

              <div className="space-y-1 text-sm">
                <label htmlFor="minSamples" className="block text-xs font-semibold text-muted-foreground">
                  Min Samples
                </label>
                <input
                  id="minSamples"
                  type="number"
                  value={minSamples}
                  onChange={(e) => setMinSamples(parseInt(e.target.value, 10))}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Jumlah sampel minimum yang diperlukan dalam lingkungan eps untuk membentuk klaster baru.
                </p>
              </div>
            </div>
          </Section>

          {/* Notifications Settings */}
          <Section title="Notifikasi" description="Preferensi surat elektronik dan sistem informasi">
            <ul className="space-y-4 py-2 text-sm">
              <li className="flex items-center justify-between">
                <span>Kirim email saat analisis selesai</span>
                <input
                  type="checkbox"
                  checked={notifPreferences.emailAnalysis}
                  onChange={(e) =>
                    setNotifPreferences({
                      ...notifPreferences,
                      emailAnalysis: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-[color:var(--primary)] cursor-pointer"
                />
              </li>
              <li className="flex items-center justify-between">
                <span>Rangkuman mingguan penelitian</span>
                <input
                  type="checkbox"
                  checked={notifPreferences.weeklySummary}
                  onChange={(e) =>
                    setNotifPreferences({
                      ...notifPreferences,
                      weeklySummary: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-[color:var(--primary)] cursor-pointer"
                />
              </li>
              <li className="flex items-center justify-between">
                <span>Peringatan keamanan akun</span>
                <input
                  type="checkbox"
                  checked={notifPreferences.securityAlert}
                  onChange={(e) =>
                    setNotifPreferences({
                      ...notifPreferences,
                      securityAlert: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-[color:var(--primary)] cursor-pointer"
                />
              </li>
            </ul>
          </Section>
        </div>

        {/* Form Action */}
        <div className="flex justify-end pt-2">
          <Button type="submit" className="cursor-pointer">
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
