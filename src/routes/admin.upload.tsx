import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, Section } from "@/components/app/AppShell";
import { Upload, X, Sparkles } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/admin/upload")({
  head: () => ({ meta: [{ title: "Unggah Gambar — Admin" }] }),
  component: UploadPage,
});

// A beautiful SVG representation of a red apple to use as default mock data
const DEFAULT_APPLE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><radialGradient id="r" cx="45%" cy="40%" r="60%"><stop offset="0%" stop-color="%23ff6b6b"/><stop offset="70%" stop-color="%23e60000"/><stop offset="100%" stop-color="%238a0000"/></radialGradient></defs><circle cx="100" cy="105" r="75" fill="url(%23r)"/><path d="M100 30 Q95 10 80 15 Q95 20 100 35 Z" fill="%234caf50"/><path d="M100 32 Q105 15 120 20 Q105 25 100 35 Z" fill="%234caf50"/><rect x="98" y="25" width="4" height="12" fill="%238b5a2b" transform="rotate(-10 100 30)"/></svg>`;

const DEMO_FRUITS = [
  {
    name: "apel_merah.svg",
    size: "12 KB",
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><radialGradient id="r" cx="45%" cy="40%" r="60%"><stop offset="0%" stop-color="%23ff6b6b"/><stop offset="70%" stop-color="%23e60000"/><stop offset="100%" stop-color="%238a0000"/></radialGradient></defs><circle cx="100" cy="105" r="75" fill="url(%23r)"/><path d="M100 30 Q95 10 80 15 Q95 20 100 35 Z" fill="%234caf50"/><path d="M100 32 Q105 15 120 20 Q105 25 100 35 Z" fill="%234caf50"/><rect x="98" y="25" width="4" height="12" fill="%238b5a2b" transform="rotate(-10 100 30)"/></svg>`
  },
  {
    name: "lemon_kuning.svg",
    size: "15 KB",
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><radialGradient id="l" cx="45%" cy="40%" r="60%"><stop offset="0%" stop-color="%23fff275"/><stop offset="70%" stop-color="%23ffeb3b"/><stop offset="100%" stop-color="%23fbc02d"/></radialGradient></defs><ellipse cx="100" cy="100" rx="80" ry="60" fill="url(%23l)" transform="rotate(-15 100 100)"/><circle cx="30" cy="80" r="10" fill="%23fbc02d"/><circle cx="170" cy="120" r="10" fill="%23fbc02d"/><path d="M100 40 Q105 20 120 25 Q105 30 100 40 Z" fill="%234caf50"/></svg>`
  },
  {
    name: "ceri_merah.svg",
    size: "10 KB",
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><radialGradient id="c" cx="45%" cy="40%" r="60%"><stop offset="0%" stop-color="%23d81b60"/><stop offset="70%" stop-color="%23880e4f"/><stop offset="100%" stop-color="%234a001f"/></radialGradient></defs><circle cx="70" cy="120" r="40" fill="url(%23c)"/><circle cx="130" cy="130" r="40" fill="url(%23c)"/><path d="M70 120 Q90 60 110 50 Q130 60 130 130" fill="none" stroke="%238b5a2b" stroke-width="4"/><path d="M110 50 Q95 30 80 35 Q95 40 110 50 Z" fill="%234caf50"/></svg>`
  },
  {
    name: "pisang_kuning.svg",
    size: "18 KB",
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M40 30 Q10 70 30 140 Q60 170 150 120 Q120 110 70 110 Q50 90 60 40 Q50 32 40 30 Z" fill="%23ffeb3b"/><path d="M150 120 Q160 115 165 110" stroke="%238b5a2b" stroke-width="6" fill="none"/><path d="M40 30 Q38 25 35 25" stroke="%235d4037" stroke-width="8" fill="none"/></svg>`
  }
];

function UploadPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<{ name: string; size: string; dataUrl: string }[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    if (!list.length) return;

    list.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setFiles((s) => [
          ...s,
          {
            name: file.name,
            size: `${Math.round(file.size / 1024)} KB`,
            dataUrl,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleStartAnalysis = () => {
    if (files.length === 0) return;
    
    // Save all files as a JSON array for batch processing
    localStorage.setItem("fruit_atlas_upload_files", JSON.stringify(files));
    
    // Fallback single-file storage for backward compatibility
    const targetFile = files[files.length - 1];
    localStorage.setItem("fruit_atlas_upload_image", targetFile.dataUrl);
    localStorage.setItem("fruit_atlas_upload_image_name", targetFile.name);
    localStorage.setItem("fruit_atlas_upload_image_size", targetFile.size);
    
    navigate({ to: "/admin/analysis" });
  };

  return (
    <AppShell role="admin" title="Unggah Gambar" subtitle="Unggah gambar buah untuk dianalisis dan diklasterisasi">
      <Section title="Unggah" description="Seret dan lepaskan atau cari file Anda">
        <div className="flex flex-col gap-4">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-surface px-6 py-12 text-center transition hover:border-primary/40">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <div className="text-sm font-medium">Letakkan gambar Anda di sini</div>
            <div className="text-xs text-muted-foreground">JPG, PNG, atau SVG · maks 10 MB</div>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <span className="mt-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs">
              Cari file
            </span>
          </label>
          
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 p-4 text-center">
            <div className="text-xs font-semibold text-foreground">Skenario Demo DBSCAN</div>
            <p className="text-[11px] text-muted-foreground max-w-md">
              Ingin menguji skenario pengelompokan bentuk? Muat buah Apel, Lemon, Ceri (bulat) dan Pisang (melengkung) sekaligus dengan satu klik.
            </p>
            <button
              type="button"
              onClick={() => setFiles(DEMO_FRUITS)}
              className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-secondary text-secondary-foreground px-3.5 py-1.5 text-xs font-medium hover:bg-secondary/80 transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Muat Demo Buah (Apel, Lemon, Ceri, Pisang)
            </button>
          </div>
        </div>
      </Section>

      {files.length > 0 && (
        <div className="mt-6">
          <Section title="Antrean unggahan" description={`${files.length} file`}>
            <ul className="divide-y divide-border text-sm">
              {files.map((f, i) => (
                <li key={f.name + i} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <img
                      src={f.dataUrl}
                      alt={f.name}
                      className="h-10 w-10 rounded-md border border-border object-cover bg-muted"
                    />
                    <div>
                      <div className="font-medium">{f.name}</div>
                      <div className="text-xs text-muted-foreground">{f.size}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setFiles((s) => s.filter((_, idx) => idx !== i))}
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setFiles([])}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted"
              >
                Bersihkan
              </button>
              <button
                onClick={handleStartAnalysis}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                Mulai analisis
              </button>
            </div>
          </Section>
        </div>
      )}
    </AppShell>
  );
}
