import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthCard, Field, inputCls } from "@/components/auth/AuthCard";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Atur Ulang Kata Sandi — FruitCluster" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  return (
    <AuthCard
      title="Atur ulang kata sandi Anda"
      subtitle={step === 4 ? "Selesai." : "Kami akan memverifikasi identitas Anda dalam tiga langkah singkat."}
      footer={<><Link to="/login" className="font-medium text-primary hover:underline">Kembali ke halaman masuk</Link></>}
    >
      <div className="mb-5 flex items-center gap-2 text-[11px] text-muted-foreground">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex flex-1 items-center gap-2">
            <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
              step >= (n as 1 | 2 | 3) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>{n}</div>
            <div className={`h-px flex-1 ${step > n ? "bg-primary" : "bg-border"}`} />
          </div>
        ))}
      </div>

      {step === 1 && (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
          <Field label="Email"><input type="email" required placeholder="nama@universitas.ac.id" className={inputCls} /></Field>
          <button className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">Kirim OTP</button>
        </form>
      )}
      {step === 2 && (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
          <Field label="Kode satu kali pakai (OTP)" hint="Periksa email Anda untuk melihat kode 6 digit."><input className={inputCls} placeholder="000000" maxLength={6} /></Field>
          <button className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">Verifikasi OTP</button>
        </form>
      )}
      {step === 3 && (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setStep(4); }}>
          <Field label="Kata Sandi Baru"><input type="password" required className={inputCls} /></Field>
          <Field label="Konfirmasi Kata Sandi"><input type="password" required className={inputCls} /></Field>
          <button className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">Perbarui Kata Sandi</button>
        </form>
      )}
      {step === 4 && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-success" />
          <div className="text-sm font-medium">Kata sandi berhasil diperbarui</div>
          <p className="text-xs text-muted-foreground">Anda sekarang dapat masuk menggunakan kata sandi baru Anda.</p>
          <Link to="/login" className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Kembali ke Halaman Masuk</Link>
        </div>
      )}
    </AuthCard>
  );
}
