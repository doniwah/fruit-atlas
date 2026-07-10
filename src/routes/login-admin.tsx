import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthCard, Field, inputCls } from "@/components/auth/AuthCard";
import { useState } from "react";
import { toast } from "sonner";
import { getStoredUsers, saveStoredUsers } from "@/components/app/ProfilePage";

export const Route = createFileRoute("/login-admin")({
  head: () => ({ meta: [{ title: "Masuk Admin — FruitCluster" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const users = await getStoredUsers();
    const foundUser = users.find(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        u.passwordHash === password &&
        u.role === "admin"
    );

    if (foundUser) {
      const nowStr = new Date().toISOString();
      const updatedUser = { ...foundUser, lastLogin: nowStr };
      
      const updatedUsers = users.map(u => 
        u.email.toLowerCase() === email.trim().toLowerCase() ? updatedUser : u
      );
      await saveStoredUsers(updatedUsers);

      localStorage.setItem("fruit_atlas_current_user", JSON.stringify(updatedUser));
      toast.success(`Selamat datang kembali, ${foundUser.fullName}!`);
      navigate({ to: "/admin" });
    } else {
      toast.error("Email atau kata sandi salah, atau peran Anda bukan Admin.");
    }
  };

  return (
    <AuthCard
      title="Masuk sebagai Admin"
      subtitle="Masuk ke dashboard manajemen FruitCluster"
      footer={
        <div className="space-y-2 text-center text-xs">
          <div>
            Apakah Anda Siswa?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Masuk di sini
            </Link>
          </div>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleLogin}>
        <Field label="Email">
          <input
            type="email"
            required
            placeholder="jane@universitas.ac.id"
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Kata Sandi">
          <input
            type="password"
            required
            placeholder="••••••••"
            className={inputCls}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" className="h-3.5 w-3.5 rounded border-border accent-[color:var(--primary)]" />
            Ingat saya
          </label>
          <Link to="/forgot-password" className="font-medium text-primary hover:underline">Lupa kata sandi?</Link>
        </div>
        <button type="submit" className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-95 cursor-pointer">
          Masuk sebagai Admin
        </button>
      </form>
    </AuthCard>
  );
}
