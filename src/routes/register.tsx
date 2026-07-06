import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthCard, Field, inputCls } from "@/components/auth/AuthCard";
import { useState } from "react";
import { toast } from "sonner";
import { getStoredUsers, saveStoredUsers, UserProfile } from "@/components/app/ProfilePage";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Daftar — FruitCluster" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const [role, setRole] = useState<"admin" | "student">("student");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [institution, setInstitution] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");

  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file foto maksimal adalah 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatar(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !username.trim() || !email.trim() || !password || !confirmPassword) {
      toast.error("Mohon isi semua bidang wajib.");
      return;
    }

    if (password.length < 6) {
      toast.error("Kata sandi harus minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    const users = await getStoredUsers();
    const emailExists = users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (emailExists) {
      toast.error("Email ini sudah terdaftar.");
      return;
    }

    const newUser: UserProfile = {
      fullName: fullName.trim(),
      username: username.trim(),
      email: email.trim(),
      institution: institution.trim(),
      phone: phone.trim(),
      role,
      avatar,
      passwordHash: password,
      lastLogin: new Date().toISOString(),
    };

    // Save to users list and set as current user
    await saveStoredUsers([...users, newUser]);
    localStorage.setItem("fruit_atlas_current_user", JSON.stringify(newUser));

    toast.success("Registrasi berhasil! Selamat datang di FruitCluster.");
    navigate({ to: role === "admin" ? "/admin" : "/student" });
  };

  return (
    <AuthCard
      title="Buat akun baru"
      subtitle="Bergabunglah dengan ruang kerja penelitian FruitCluster"
      footer={<>Sudah punya akun? <Link to="/login" className="font-medium text-primary hover:underline">Masuk</Link></>}
    >
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface p-1">
        {(["admin", "student"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition cursor-pointer ${
              role === r ? "bg-card text-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Daftar sebagai {r === "admin" ? "Admin" : "Siswa"}
          </button>
        ))}
      </div>

      <form className="space-y-4" onSubmit={handleRegister}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nama Lengkap">
            <input
              className={inputCls}
              placeholder="Jane Doe"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </Field>
          <Field label="Nama Pengguna">
            <input
              className={inputCls}
              placeholder="janedoe"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Email">
          <input
            type="email"
            className={inputCls}
            placeholder="nama@universitas.ac.id"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kata Sandi">
            <input
              type="password"
              className={inputCls}
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field label="Konfirmasi Kata Sandi">
            <input
              type="password"
              className={inputCls}
              placeholder="••••••••"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Institusi">
            <input
              className={inputCls}
              placeholder="Universitas Negeri"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            />
          </Field>
          <Field label="Nomor Telepon">
            <input
              className={inputCls}
              placeholder="+62 812 ..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Foto Profil (opsional)">
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground hover:file:bg-muted cursor-pointer"
          />
        </Field>
        <button type="submit" className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-95 cursor-pointer">
          Buat Akun
        </button>
      </form>
    </AuthCard>
  );
}
