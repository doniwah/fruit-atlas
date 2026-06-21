import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthCard, Field, inputCls } from "@/components/auth/AuthCard";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Masuk — FruitCluster" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [role, setRole] = useState<"admin" | "student">("student");
  const navigate = useNavigate();

  return (
    <AuthCard
      title="Selamat datang kembali"
      subtitle="Masuk untuk melanjutkan analisis Anda"
      footer={<>Belum punya akun? <Link to="/register" className="font-medium text-primary hover:underline">Daftar</Link></>}
    >
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface p-1">
        {(["admin", "student"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${
              role === r ? "bg-card text-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {r === "admin" ? "Admin" : "Siswa"}
          </button>
        ))}
      </div>

      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); navigate({ to: role === "admin" ? "/admin" : "/student" }); }}>
        <Field label="Email">
          <input type="email" required placeholder="nama@universitas.ac.id" className={inputCls} />
        </Field>
        <Field label="Kata Sandi">
          <input type="password" required placeholder="••••••••" className={inputCls} />
        </Field>
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" className="h-3.5 w-3.5 rounded border-border accent-[color:var(--primary)]" />
            Ingat saya
          </label>
          <Link to="/forgot-password" className="font-medium text-primary hover:underline">Lupa kata sandi?</Link>
        </div>
        <button type="submit" className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-95">
          Masuk sebagai {role === "admin" ? "Admin" : "Siswa"}
        </button>
      </form>
    </AuthCard>
  );
}
