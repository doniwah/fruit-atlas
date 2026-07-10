import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Section } from "@/components/app/AppShell";
import { getStoredUsers, saveStoredUsers } from "@/components/app/ProfilePage";
import { UserPlus, KeyRound, Pencil, Trash2, Check, Copy } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/students")({
  head: () => ({ meta: [{ title: "Mahasiswa — Admin" }] }),
  component: StudentsPage,
});

interface Student {
  id: string;
  name: string;
  email: string;
  institution: string;
  joined: string;
  status: string;
  lastLogin?: string;
}

function StudentsPage() {
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetDetails, setResetDetails] = useState<{ name: string; email: string; password?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    institution: "",
    status: "Active" as "Active" | "Inactive",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Initialize from localStorage
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      const users = await getStoredUsers();
      if (!isMounted) return;
      
      let needsSync = false;
      const studentsOnly: Student[] = users
        .filter((u) => u.role === "student")
        .map((u) => {
          if (!u.id) {
            needsSync = true;
            // Generate next available ID sequentially
            const maxId = users.reduce((max, user) => {
              if (user.id && user.id.startsWith("STU-")) {
                const num = parseInt(user.id.replace("STU-", ""), 10);
                return isNaN(num) ? max : Math.max(max, num);
              }
              return max;
            }, 2399);
            u.id = `STU-${maxId + 1}`;
            u.joined = u.joined || new Date().toISOString().split("T")[0];
            u.status = u.status || "Active";
          }
          return {
            id: u.id,
            name: u.fullName,
            email: u.email,
            institution: u.institution || "State University",
            joined: u.joined || new Date().toISOString().split("T")[0],
            status: u.status || "Active",
            lastLogin: u.lastLogin,
          };
        });
        
      setStudentList(studentsOnly);
      setLoading(false);
      
      if (needsSync) {
        await saveStoredUsers(users);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const saveToLocalStorage = async (list: Student[]) => {
    setStudentList(list);
    
    // Sync back to fruit_atlas_users!
    const users = await getStoredUsers();
    
    // Separate admin users and student users
    const adminUsers = users.filter((u) => u.role !== "student");
    
    // Map current studentList back to UserProfile objects
    const updatedStudentUsers = list.map((s) => {
      // Find existing user by ID first, then fallback to email
      const existing = users.find((u) => (s.id && u.id === s.id) || u.email.toLowerCase() === s.email.toLowerCase());
      return {
        id: s.id,
        fullName: s.name,
        username: existing?.username || s.name.toLowerCase().replace(/\s+/g, ""),
        email: s.email,
        institution: s.institution,
        phone: existing?.phone || "",
        role: "student" as const,
        avatar: existing?.avatar || "",
        passwordHash: existing?.passwordHash || "student123", // default password
        joined: s.joined,
        status: s.status as "Active" | "Inactive",
        lastLogin: s.lastLogin,
      };
    });
    
    await saveStoredUsers([...adminUsers, ...updatedStudentUsers]);
  };

  // Action Triggers
  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      name: "",
      email: "",
      institution: "",
      status: "Active",
    });
    setFormErrors({});
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      institution: student.institution,
      status: student.status === "Active" ? "Active" : "Inactive",
    });
    setFormErrors({});
    setIsAddEditOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Nama wajib diisi";
    if (!formData.email.trim()) {
      errors.email = "Email wajib diisi";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Format email tidak valid";
    }
    if (!formData.institution.trim()) errors.institution = "Institusi wajib diisi";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingStudent) {
      // Edit
      const updated = studentList.map((s) =>
        s.id === editingStudent.id
          ? { ...s, ...formData }
          : s
      );
      saveToLocalStorage(updated);
      toast.success(`Akun mahasiswa "${formData.name}" berhasil diperbarui!`);
    } else {
      // Add
      const nextIdNum = studentList.reduce((max, s) => {
        const num = parseInt(s.id.replace("STU-", ""), 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 2399) + 1;
      
      const newStudent: Student = {
        id: `STU-${nextIdNum}`,
        name: formData.name,
        email: formData.email,
        institution: formData.institution,
        joined: new Date().toISOString().split("T")[0],
        status: formData.status,
      };
      
      const updated = [...studentList, newStudent];
      saveToLocalStorage(updated);
      toast.success(`Akun mahasiswa "${formData.name}" berhasil ditambahkan!`);
    }

    setIsAddEditOpen(false);
  };

  const handleOpenDelete = (student: Student) => {
    setDeletingStudent(student);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (!deletingStudent) return;
    const updated = studentList.filter((s) => s.id !== deletingStudent.id);
    saveToLocalStorage(updated);
    toast.success(`Akun mahasiswa "${deletingStudent.name}" berhasil dihapus!`);
    setIsDeleteOpen(false);
    setDeletingStudent(null);
  };

  const handleOpenResetPassword = async (student: Student) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generatedPassword = `Mhs-${password}`;

    // Save the new password to fruit_atlas_users
    const users = await getStoredUsers();
    const updatedUsers = users.map((u) =>
      u.email.toLowerCase() === student.email.toLowerCase()
        ? { ...u, passwordHash: generatedPassword }
        : u
    );
    await saveStoredUsers(updatedUsers);

    setResetDetails({
      name: student.name,
      email: student.email,
      password: generatedPassword,
    });
    setCopied(false);
    setIsResetOpen(true);
  };

  const handleCopyPassword = () => {
    if (!resetDetails?.password) return;
    navigator.clipboard.writeText(resetDetails.password);
    setCopied(true);
    toast.success("Kata sandi disalin ke papan klip!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <AppShell role="admin" title="Kelola Mahasiswa" subtitle="Memuat data...">
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          Memuat data mahasiswa...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      role="admin"
      title="Kelola Mahasiswa"
      subtitle="Tambah akun baru dan atur ulang kata sandi"
      actions={
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Tambah akun
        </button>
      }
    >
      <Section title="Daftar Mahasiswa" description={`${studentList.length} akun terdaftar`}>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {["ID", "Nama", "Email", "Institusi", "Bergabung", "Terakhir Login", "Status", "Aksi"].map((h) => (
                  <th key={h} className="px-4 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studentList.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-surface/60">
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{s.id}</td>
                  <td className="px-4 py-2.5 font-medium">{s.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{s.email}</td>
                  <td className="px-4 py-2.5">{s.institution}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{s.joined}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">
                    {s.lastLogin ? new Date(s.lastLogin).toLocaleString("id-ID") : "Belum pernah"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        s.status === "Active"
                          ? "bg-success/15 text-[color:var(--success)]"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {s.status === "Active" ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        title="Atur ulang kata sandi"
                        onClick={() => handleOpenResetPassword(s)}
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Edit akun"
                        onClick={() => handleOpenEdit(s)}
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Hapus akun"
                        onClick={() => handleOpenDelete(s)}
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Add / Edit Student Dialog */}
      <Dialog open={isAddEditOpen} onOpenChange={setIsAddEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSave} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingStudent ? "Edit Akun Mahasiswa" : "Tambah Akun Mahasiswa"}
              </DialogTitle>
              <DialogDescription>
                {editingStudent
                  ? "Perbarui informasi detail akun mahasiswa di bawah ini."
                  : "Masukkan detail informasi untuk membuat akun mahasiswa baru."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                  className={formErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {formErrors.name && (
                  <p className="text-xs text-destructive font-medium">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nama@univ.edu"
                  className={formErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {formErrors.email && (
                  <p className="text-xs text-destructive font-medium">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="institution">Institusi</Label>
                <Input
                  id="institution"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  placeholder="Nama universitas atau sekolah"
                  className={formErrors.institution ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {formErrors.institution && (
                  <p className="text-xs text-destructive font-medium">{formErrors.institution}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="status">Status Akun</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "Active" | "Inactive" })}
                  className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm transition-colors outline-none focus-visible:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  <option value="Active">Aktif</option>
                  <option value="Inactive">Nonaktif</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddEditOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda sangat yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus akun mahasiswa{" "}
              <span className="font-semibold text-foreground">{deletingStudent?.name}</span> secara permanen
              dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteOpen(false)}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              Hapus Akun
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Modal */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-500" />
              Kata Sandi Diatur Ulang
            </DialogTitle>
            <DialogDescription>
              Kata sandi sementara untuk mahasiswa di bawah ini telah berhasil dibuat. Silakan salin dan berikan kepada mahasiswa bersangkutan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="rounded-lg bg-muted p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">Nama:</span>
                <span className="font-semibold text-xs">{resetDetails?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">Email:</span>
                <span className="font-mono text-xs">{resetDetails?.email}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kata Sandi Sementara</Label>
              <div className="relative flex items-center">
                <span className="w-full block select-all font-mono text-center text-lg font-bold border border-dashed border-border rounded-lg bg-surface py-3 tracking-wider text-primary">
                  {resetDetails?.password}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="absolute right-3 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                  title="Salin kata sandi"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsResetOpen(false)} className="w-full">
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

