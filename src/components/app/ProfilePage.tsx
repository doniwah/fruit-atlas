import { AppShell, Section } from "@/components/app/AppShell";
import { User, Camera, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { getDbUsers, saveDbUsers } from "@/lib/db-store";

export interface UserProfile {
  fullName: string;
  username: string;
  email: string;
  institution: string;
  phone: string;
  role: "admin" | "student";
  avatar: string; // Base64 data URL
  passwordHash: string;
  id?: string;
  joined?: string;
  status?: "Active" | "Inactive";
}

const DEFAULT_USERS: UserProfile[] = [
  {
    fullName: "Jane Doe",
    username: "janedoe",
    email: "jane@universitas.ac.id",
    institution: "Universitas Negeri",
    phone: "+62 812 3456 7891",
    role: "admin",
    avatar: "",
    passwordHash: "admin123",
  },
  {
    fullName: "Siswa Perdana",
    username: "siswaperdana",
    email: "siswa@universitas.ac.id",
    institution: "Universitas Negeri",
    phone: "+62 812 9876 5432",
    role: "student",
    avatar: "",
    passwordHash: "student123",
    id: "STU-2408",
    joined: "2025-09-01",
    status: "Active",
  },
  {
    fullName: "Ayu Lestari",
    username: "ayulestari",
    email: "student1@univ.edu",
    institution: "State University",
    phone: "",
    role: "student",
    avatar: "",
    passwordHash: "student123",
    id: "STU-2400",
    joined: "2025-01-15",
    status: "Inactive",
  },
  {
    fullName: "Budi Santoso",
    username: "budisantoso",
    email: "student2@univ.edu",
    institution: "State University",
    phone: "",
    role: "student",
    avatar: "",
    passwordHash: "student123",
    id: "STU-2401",
    joined: "2025-02-15",
    status: "Active",
  },
  {
    fullName: "Citra Dewi",
    username: "citradewi",
    email: "student3@univ.edu",
    institution: "State University",
    phone: "",
    role: "student",
    avatar: "",
    passwordHash: "student123",
    id: "STU-2402",
    joined: "2025-03-15",
    status: "Active",
  },
  {
    fullName: "Dimas Aji",
    username: "dimasaji",
    email: "student4@univ.edu",
    institution: "State University",
    phone: "",
    role: "student",
    avatar: "",
    passwordHash: "student123",
    id: "STU-2403",
    joined: "2025-04-15",
    status: "Active",
  },
  {
    fullName: "Eka Putri",
    username: "ekaputri",
    email: "student5@univ.edu",
    institution: "State University",
    phone: "",
    role: "student",
    avatar: "",
    passwordHash: "student123",
    id: "STU-2404",
    joined: "2025-05-15",
    status: "Inactive",
  },
  {
    fullName: "Farhan R.",
    username: "farhanr",
    email: "student6@univ.edu",
    institution: "State University",
    phone: "",
    role: "student",
    avatar: "",
    passwordHash: "student123",
    id: "STU-2405",
    joined: "2025-06-15",
    status: "Active",
  },
  {
    fullName: "Gita Wulandari",
    username: "gitawulandari",
    email: "student7@univ.edu",
    institution: "State University",
    phone: "",
    role: "student",
    avatar: "",
    passwordHash: "student123",
    id: "STU-2406",
    joined: "2025-07-15",
    status: "Active",
  },
  {
    fullName: "Hadi Pratama",
    username: "hadipratama",
    email: "student8@univ.edu",
    institution: "State University",
    phone: "",
    role: "student",
    avatar: "",
    passwordHash: "student123",
    id: "STU-2407",
    joined: "2025-08-15",
    status: "Active",
  },
];

export async function getStoredUsers(): Promise<UserProfile[]> {
  try {
    const users = await getDbUsers();
    return users as UserProfile[];
  } catch (error) {
    console.error("Failed to load users from server database", error);
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("fruit_atlas_users");
    if (!stored) return DEFAULT_USERS;
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_USERS;
    }
  }
}

export async function saveStoredUsers(users: UserProfile[]) {
  try {
    await saveDbUsers({ data: users });
  } catch (error) {
    console.error("Failed to save users to server database", error);
  }
  if (typeof window !== "undefined") {
    localStorage.setItem("fruit_atlas_users", JSON.stringify(users));
  }
}

export function getCurrentUser(role: "admin" | "student"): UserProfile {
  if (typeof window === "undefined") return DEFAULT_USERS[role === "admin" ? 0 : 1];
  const stored = localStorage.getItem("fruit_atlas_current_user");
  let currentUser: UserProfile | null = null;
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  // If no current user, or if role mismatch, find/initialize for the role
  if (!currentUser || currentUser.role !== role) {
    const storedUsers = localStorage.getItem("fruit_atlas_users");
    let usersList: UserProfile[] = DEFAULT_USERS;
    if (storedUsers) {
      try {
        usersList = JSON.parse(storedUsers);
      } catch {
        // ignore
      }
    }
    const found = usersList.find((u) => u.role === role);
    if (found) {
      currentUser = found;
    } else {
      currentUser = role === "admin" ? DEFAULT_USERS[0] : DEFAULT_USERS[1];
    }
    localStorage.setItem("fruit_atlas_current_user", JSON.stringify(currentUser));
  }
  return currentUser;
}

export function ProfilePage({ role }: { role: "admin" | "student" }) {
  const [currentUser, setCurrentUserLocal] = useState<UserProfile | null>(null);

  // Profile fields state
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [institution, setInstitution] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = getCurrentUser(role);
    setCurrentUserLocal(user);
    setFullName(user.fullName);
    setUsername(user.username);
    setEmail(user.email);
    setInstitution(user.institution);
    setPhone(user.phone);
    setAvatar(user.avatar || "");
  }, [role]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file foto maksimal adalah 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      setAvatar(base64String);

      if (currentUser) {
        const updatedUser = { ...currentUser, avatar: base64String };
        localStorage.setItem("fruit_atlas_current_user", JSON.stringify(updatedUser));
        setCurrentUserLocal(updatedUser);

        const users = await getStoredUsers();
        const updatedUsers = users.map((u) => (u.email === currentUser.email ? updatedUser : u));
        await saveStoredUsers(updatedUsers);
        window.dispatchEvent(new Event("profileUpdate"));
      }
      toast.success("Foto profil berhasil diunggah!");
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = async () => {
    setAvatar("");
    if (currentUser) {
      const updatedUser = { ...currentUser, avatar: "" };
      localStorage.setItem("fruit_atlas_current_user", JSON.stringify(updatedUser));
      setCurrentUserLocal(updatedUser);

      const users = await getStoredUsers();
      const updatedUsers = users.map((u) => (u.email === currentUser.email ? updatedUser : u));
      await saveStoredUsers(updatedUsers);
      window.dispatchEvent(new Event("profileUpdate"));
    }
    toast.success("Foto profil berhasil dihapus!");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!fullName.trim()) {
      toast.error("Nama lengkap tidak boleh kosong.");
      return;
    }
    if (!username.trim()) {
      toast.error("Nama pengguna tidak boleh kosong.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Email tidak valid.");
      return;
    }

    const updatedUser = {
      ...currentUser,
      fullName,
      username,
      email,
      institution,
      phone,
      avatar,
    };

    // Save to current user
    localStorage.setItem("fruit_atlas_current_user", JSON.stringify(updatedUser));
    setCurrentUserLocal(updatedUser);

    // Save to users list
    const users = await getStoredUsers();
    let updatedUsers = users.map((u) => (u.email === currentUser.email ? updatedUser : u));
    const exists = users.some((u) => u.email === currentUser.email);
    if (!exists) {
      updatedUsers = [...users, updatedUser];
    }
    await saveStoredUsers(updatedUsers);
    window.dispatchEvent(new Event("profileUpdate"));

    toast.success("Profil berhasil diperbarui!");
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Semua kolom kata sandi harus diisi.");
      return;
    }

    if (currentPassword !== currentUser.passwordHash) {
      toast.error("Kata sandi saat ini tidak cocok.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Kata sandi baru harus minimal 6 karakter.");
      return;
    }

    if (newPassword === currentPassword) {
      toast.error("Kata sandi baru harus berbeda dengan kata sandi saat ini.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    const updatedUser = {
      ...currentUser,
      passwordHash: newPassword,
    };

    // Save to current user
    localStorage.setItem("fruit_atlas_current_user", JSON.stringify(updatedUser));
    setCurrentUserLocal(updatedUser);

    // Save to users list
    const users = await getStoredUsers();
    const updatedUsers = users.map((u) => (u.email === currentUser.email ? updatedUser : u));
    await saveStoredUsers(updatedUsers);

    // Reset password inputs
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    toast.success("Kata sandi berhasil diperbarui!");
  };

  return (
    <AppShell role={role} title="Profil" subtitle="Kelola akun Anda">
      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Foto">
          <div className="flex flex-col items-center gap-4 py-4">
            {avatar ? (
              <img
                src={avatar}
                alt="Foto Profil"
                className="h-20 w-20 rounded-full object-cover border-2 border-primary/20 shadow-sm"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/5">
                <User className="h-8 w-8" />
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePhotoClick}
                className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted cursor-pointer transition"
              >
                <Camera className="h-3.5 w-3.5" />
                Unggah foto
              </button>
              {avatar && (
                <button
                  type="button"
                  onClick={handleDeletePhoto}
                  className="flex items-center gap-1.5 rounded-md border border-destructive/20 bg-destructive/5 text-destructive px-3 py-1.5 text-xs font-medium hover:bg-destructive/10 cursor-pointer transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus
                </button>
              )}
            </div>
          </div>
        </Section>
        <div className="lg:col-span-2 space-y-6">
          <Section title="Informasi profil">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Nama Lengkap</span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Nama Pengguna</span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Institusi</span>
                  <input
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Telepon</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+62 812 ..."
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Peran</span>
                  <input
                    value={role === "admin" ? "Admin" : "Siswa"}
                    disabled
                    className="mt-1 w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed outline-none"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-95 cursor-pointer transition"
              >
                Simpan perubahan
              </button>
            </form>
          </Section>
          <Section title="Ubah kata sandi">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Kata Sandi Saat Ini</span>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Kata Sandi Baru</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Konfirmasi Kata Sandi Baru</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted cursor-pointer transition"
              >
                Perbarui kata sandi
              </button>
            </form>
          </Section>
        </div>
      </div>
    </AppShell>
  );
}
