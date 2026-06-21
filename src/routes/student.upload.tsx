import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, Section } from "@/components/app/AppShell";
import { Upload, X } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/student/upload")({
  head: () => ({ meta: [{ title: "Upload Image — Student" }] }),
  component: UploadPage,
});

// A beautiful SVG representation of a red apple to use as default mock data
const DEFAULT_APPLE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><radialGradient id="r" cx="45%" cy="40%" r="60%"><stop offset="0%" stop-color="%23ff6b6b"/><stop offset="70%" stop-color="%23e60000"/><stop offset="100%" stop-color="%238a0000"/></radialGradient></defs><circle cx="100" cy="105" r="75" fill="url(%23r)"/><path d="M100 30 Q95 10 80 15 Q95 20 100 35 Z" fill="%234caf50"/><path d="M100 32 Q105 15 120 20 Q105 25 100 35 Z" fill="%234caf50"/><rect x="98" y="25" width="4" height="12" fill="%238b5a2b" transform="rotate(-10 100 30)"/></svg>`;

function UploadPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<{ name: string; size: string; dataUrl: string }[]>([
    { name: "apple_red_01.jpg", size: "184 KB", dataUrl: DEFAULT_APPLE_SVG },
  ]);

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
    
    navigate({ to: "/student/analysis" });
  };

  return (
    <AppShell role="student" title="Unggah Gambar" subtitle="Unggah gambar buah untuk dianalisis">
      <Section title="Unggah" description="Seret dan lepaskan atau cari file Anda">
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

