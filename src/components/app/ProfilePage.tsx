import { AppShell, Section } from "@/components/app/AppShell";
import { User } from "lucide-react";

export function ProfilePage({ role }: { role: "admin" | "student" }) {
  return (
    <AppShell role={role} title="Profil" subtitle="Kelola akun Anda">
      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Foto">
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-8 w-8" />
            </div>
            <button className="rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted">Unggah foto</button>
          </div>
        </Section>
        <div className="lg:col-span-2 space-y-6">
          <Section title="Informasi profil">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { l: "Nama Lengkap", v: "Jane Doe" },
                { l: "Nama Pengguna", v: "janedoe" },
                { l: "Email", v: "jane@universitas.ac.id" },
                { l: "Institusi", v: "Universitas Negeri" },
                { l: "Telepon", v: "+62 812 3456 7890" },
                { l: "Peran", v: role === "admin" ? "Admin" : "Siswa" },
              ].map((f) => (
                <label key={f.l} className="block">
                  <span className="text-xs text-muted-foreground">{f.l}</span>
                  <input defaultValue={f.v} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
                </label>
              ))}
            </div>
            <button className="mt-4 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Simpan perubahan</button>
          </Section>
          <Section title="Ubah kata sandi">
            <div className="grid gap-3 sm:grid-cols-3">
              {["Kata Sandi Saat Ini", "Kata Sandi Baru", "Konfirmasi Kata Sandi Baru"].map((l) => (
                <label key={l} className="block">
                  <span className="text-xs text-muted-foreground">{l}</span>
                  <input type="password" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
                </label>
              ))}
            </div>
            <button className="mt-4 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">Perbarui kata sandi</button>
          </Section>
        </div>
      </div>
    </AppShell>
  );
}
