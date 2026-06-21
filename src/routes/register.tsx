import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthCard, Field, inputCls } from "@/components/auth/AuthCard";
import { useState } from "react";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Daftar — FruitCluster" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const [role, setRole] = useState<"admin" | "student">("student");
  const navigate = useNavigate();

  return (
    <AuthCard
      title="Buat akun baru"
      subtitle="Bergabunglah dengan ruang kerja penelitian FruitCluster"
      footer={<>Sudah punya akun? <Link to="/login" className="font-medium text-primary hover:underline">Masuk</Link></>}
    >
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface p-1">
        {(["admin", "student"] as const).map((r) => (
          <button key={r} onClick={() => setRole(r)} className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${
            role === r ? "bg-card text-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground hover:text-foreground"
          }`}>
            Daftar sebagai {r === "admin" ? "Admin" : "Siswa"}
          </button>
        ))}
      </div>

      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); navigate({ to: role === "admin" ? "/admin" : "/student" }); }}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nama Lengkap"><input className={inputCls} placeholder="Jane Doe" required /></Field>
          <Field label="Nama Pengguna"><input className={inputCls} placeholder="janedoe" required /></Field>
        </div>
        <Field label="Email"><input type="email" className={inputCls} placeholder="nama@universitas.ac.id" required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kata Sandi"><input type="password" className={inputCls} placeholder="••••••••" required /></Field>
          <Field label="Konfirmasi Kata Sandi"><input type="password" className={inputCls} placeholder="••••••••" required /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Institusi"><input className={inputCls} placeholder="Universitas Negeri" /></Field>
          <Field label="Nomor Telepon"><input className={inputCls} placeholder="+62 812 ..." /></Field>
        </div>
        <Field label="Foto Profil (opsional)">
          <input type="file" className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground hover:file:bg-muted" />
        </Field>
        <button className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-95">Buat Akun</button>
      </form>
    </AuthCard>
  );
}
