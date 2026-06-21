import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Section } from "@/components/app/AppShell";
import { students } from "@/lib/mock-data";
import { UserPlus, KeyRound, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/students")({
  head: () => ({ meta: [{ title: "Mahasiswa — Admin" }] }),
  component: () => (
    <AppShell role="admin" title="Kelola Mahasiswa" subtitle="Tambah akun baru dan atur ulang kata sandi"
      actions={<button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"><UserPlus className="h-3.5 w-3.5" />Tambah akun</button>}
    >
      <Section title="Daftar Mahasiswa" description={`${students.length} akun aktif`}>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {["ID", "Nama", "Email", "Institusi", "Bergabung", "Status", "Aksi"].map((h) => <th key={h} className="px-4 py-2 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-surface/60">
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{s.id}</td>
                  <td className="px-4 py-2.5 font-medium">{s.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{s.email}</td>
                  <td className="px-4 py-2.5">{s.institution}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{s.joined}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      s.status === "Active" ? "bg-success/15 text-[color:var(--success)]" : "bg-muted text-muted-foreground"
                    }`}>{s.status === "Active" ? "Aktif" : s.status}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <button title="Atur ulang kata sandi" className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><KeyRound className="h-3.5 w-3.5" /></button>
                      <button title="Edit akun" className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                      <button title="Hapus akun" className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </AppShell>
  ),
});
