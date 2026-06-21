import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, Section } from "@/components/app/AppShell";
import { Check, Play, Upload, Sparkles, RefreshCw, Cpu, Award, ZoomIn } from "lucide-react";
import { useState, useEffect } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { runDBSCANClustering, addDatasetItem } from "@/lib/db-store";

export const Route = createFileRoute("/student/analysis")({
  head: () => ({ meta: [{ title: "Alur Analisis — Siswa" }] }),
  component: AnalysisPage,
});

const steps = [
  { n: 1, t: "Unggah" },
  { n: 2, t: "Ekstraksi HSV" },
  { n: 3, t: "Ekstraksi Bentuk" },
  { n: 4, t: "Klasterisasi DBSCAN" },
  { n: 5, t: "Hasil Akhir" },
];

const COLORS = ["#4CAF50", "#3B82F6", "#F59E0B", "#A855F7", "#EF4444", "#9CA3AF"];

interface AnalysisFeatures {
  hue: number;
  saturation: number;
  value: number;
  circularity: number;
  aspectRatio: number;
  area: number;
  perimeter: number;
  contourPoints: [number, number][];
  dominantColorHex: string;
}

// Convert HSV to Hex
function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h >= 60 && h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h >= 120 && h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h >= 180 && h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h >= 240 && h < 300) {
    [r, g, b] = [x, 0, c];
  } else if (h >= 300 && h < 360) {
    [r, g, b] = [c, 0, x];
  }
  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, "0");
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, "0");
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, "0");
  return `#${rHex}${gHex}${bHex}`;
}

function AnalysisPage() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Batch states
  const [uploadedImages, setUploadedImages] = useState<{ name: string; size: string; dataUrl: string }[]>([]);
  const [currentAnalyzingIndex, setCurrentAnalyzingIndex] = useState(0);
  const [analyzedFeaturesList, setAnalyzedFeaturesList] = useState<Array<{
    name: string;
    size: string;
    imageUrl: string;
    features: AnalysisFeatures;
  }>>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Active item shortcuts
  const activeImage = analyzedFeaturesList[previewIndex] || null;
  const features = activeImage?.features || null;
  const imageUrl = activeImage?.imageUrl || (uploadedImages[currentAnalyzingIndex]?.dataUrl ?? null);
  const fileName = activeImage?.name || (uploadedImages[currentAnalyzingIndex]?.name ?? "unknown.jpg");
  const fileSize = activeImage?.size || (uploadedImages[currentAnalyzingIndex]?.size ?? "0 KB");

  // Feature states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // DBSCAN parameter states
  const [eps, setEps] = useState(0.3);
  const [minSamples, setMinSamples] = useState(4);
  const [featureMode, setFeatureMode] = useState<"color" | "shape" | "both">("both");

  // Scatter plot axis states
  const [xAxisKey, setXAxisKey] = useState<keyof AnalysisFeatures>("circularity");
  const [yAxisKey, setYAxisKey] = useState<keyof AnalysisFeatures>("hue");

  // Backend clustering result states
  const [clusteringResult, setClusteringResult] = useState<any>(null);
  const [isClusteringLoading, setIsClusteringLoading] = useState(false);

  // Load images from localStorage on mount
  useEffect(() => {
    const savedFilesStr = localStorage.getItem("fruit_atlas_upload_files");
    if (savedFilesStr) {
      try {
        const savedFiles = JSON.parse(savedFilesStr);
        if (Array.isArray(savedFiles) && savedFiles.length > 0) {
          setUploadedImages(savedFiles);
          setActiveStep(2); // Start analyzing straight away
          return;
        }
      } catch (e) {
        console.error("Failed to parse fruit_atlas_upload_files", e);
      }
    }

    // Fallback to single file if files array doesn't exist
    const savedImg = localStorage.getItem("fruit_atlas_upload_image");
    const savedName = localStorage.getItem("fruit_atlas_upload_image_name");
    const savedSize = localStorage.getItem("fruit_atlas_upload_image_size");

    if (savedImg) {
      const filesArr = [{ name: savedName || "uploaded_fruit.jpg", size: savedSize || "unknown size", dataUrl: savedImg }];
      setUploadedImages(filesArr);
      setActiveStep(2); // Start analyzing straight away
    }
  }, []);

  // Handle local file drop/upload if no image is active
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files ?? []);
    if (!fileList.length) return;

    const filesLoaded: { name: string; size: string; dataUrl: string }[] = [];
    let processed = 0;

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        filesLoaded.push({
          name: file.name,
          size: `${Math.round(file.size / 1024)} KB`,
          dataUrl,
        });
        processed++;

        if (processed === fileList.length) {
          setUploadedImages(filesLoaded);
          localStorage.setItem("fruit_atlas_upload_files", JSON.stringify(filesLoaded));
          // Fallback single-file storage for backward compatibility
          const lastFile = filesLoaded[filesLoaded.length - 1];
          localStorage.setItem("fruit_atlas_upload_image", lastFile.dataUrl);
          localStorage.setItem("fruit_atlas_upload_image_name", lastFile.name);
          localStorage.setItem("fruit_atlas_upload_image_size", lastFile.size);
          
          setActiveStep(2);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Image analysis process (Iterative batch analysis)
  useEffect(() => {
    if (activeStep !== 2 || uploadedImages.length === 0) return;
    if (currentAnalyzingIndex >= uploadedImages.length) {
      // All images analyzed, proceed automatically to Step 3
      setIsAnalyzing(false);
      setActiveStep(3);
      return;
    }

    const currentImgObj = uploadedImages[currentAnalyzingIndex];
    setIsAnalyzing(true);
    setAnalysisProgress(10);

    const timer1 = setTimeout(() => setAnalysisProgress(40), 300);
    const timer2 = setTimeout(() => setAnalysisProgress(75), 600);

    // Perform canvas processing
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = currentImgObj.dataUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxDim = 200;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Extract foreground pixels (filter light background and dark edges/shadows)
      const fgPixels: any[] = [];
      const fgSet = new Set<string>();

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          if (a < 50) continue; // Skip transparent

          // Exclude backgrounds: either bright near-white, dark shadows, or low-saturation neutral colors (grays/white/black)
          const maxVal = Math.max(r, g, b);
          const minVal = Math.min(r, g, b);
          const chroma = maxVal - minVal;
          const isNeutralBg = maxVal > 0 ? (chroma / maxVal) < 0.18 : true;
          const isWhiteBg = r > 195 && g > 195 && b > 195;
          const isBlackBg = r < 40 && g < 40 && b < 40;

          if (!isNeutralBg && !isWhiteBg && !isBlackBg) {
            // Convert to HSV
            const rNorm = r / 255;
            const gNorm = g / 255;
            const bNorm = b / 255;
            const max = Math.max(rNorm, gNorm, bNorm);
            const min = Math.min(rNorm, gNorm, bNorm);
            const delta = max - min;

            let hue = 0;
            if (delta > 0) {
              if (max === rNorm) {
                hue = 60 * (((gNorm - bNorm) / delta) % 6);
              } else if (max === gNorm) {
                hue = 60 * ((bNorm - rNorm) / delta + 2);
              } else {
                hue = 60 * ((rNorm - gNorm) / delta + 4);
              }
            }
            if (hue < 0) hue += 360;

            const sat = max === 0 ? 0 : delta / max;
            
            fgPixels.push({ x, y, r, g, b, h: hue, s: sat, v: max });
            fgSet.add(`${x},${y}`);
          }
        }
      }

      // Fallback if no foreground is segmented
      if (fgPixels.length === 0) {
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            const rNorm = r / 255;
            const gNorm = g / 255;
            const bNorm = b / 255;
            const max = Math.max(rNorm, gNorm, bNorm);
            const min = Math.min(rNorm, gNorm, bNorm);
            const delta = max - min;
            let hue = delta === 0 ? 0 : max === rNorm ? 60 * (((gNorm - bNorm) / delta) % 6) : max === gNorm ? 60 * ((bNorm - rNorm) / delta + 2) : 60 * ((rNorm - gNorm) / delta + 4);
            if (hue < 0) hue += 360;
            const sat = max === 0 ? 0 : delta / max;
            fgPixels.push({ x, y, r, g, b, h: hue, s: sat, v: max });
            fgSet.add(`${x},${y}`);
          }
        }
      }

      // 1. Average color computation (using polar coordinates for Hue to avoid wrap-around)
      let sinSum = 0;
      let cosSum = 0;
      let satSum = 0;
      let valSum = 0;

      for (const p of fgPixels) {
        const rad = (p.h * Math.PI) / 180;
        sinSum += Math.sin(rad);
        cosSum += Math.cos(rad);
        satSum += p.s;
        valSum += p.v;
      }

      let avgHue = (Math.atan2(sinSum, cosSum) * 180) / Math.PI;
      if (avgHue < 0) avgHue += 360;
      const avgSat = satSum / fgPixels.length;
      const avgVal = valSum / fgPixels.length;

      // 2. Shape properties
      let minX = w, maxX = 0, minY = h, maxY = 0;
      for (const p of fgPixels) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }

      const bboxW = maxX - minX + 1;
      const bboxH = maxY - minY + 1;
      const aspectRatio = bboxW / bboxH;
      const area = fgPixels.length;

      // Calculate perimeter (count edge pixels)
      let perimeter = 0;
      for (const p of fgPixels) {
        const neighbors = [
          [p.x - 1, p.y],
          [p.x + 1, p.y],
          [p.x, p.y - 1],
          [p.x, p.y + 1]
        ];
        const isEdge = neighbors.some(([nx, ny]) => {
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) return true;
          return !fgSet.has(`${nx},${ny}`);
        });
        if (isEdge) perimeter++;
      }

      let circularity = (4 * Math.PI * area) / Math.pow(perimeter || 1, 2);
      circularity = Math.min(1.0, Math.max(0.05, circularity));

      // Calculate center of mass for angular trace
      let sumX = 0, sumY = 0;
      for (const p of fgPixels) {
        sumX += p.x;
        sumY += p.y;
      }
      const cx = sumX / fgPixels.length;
      const cy = sumY / fgPixels.length;

      // Cast rays to find contour outline
      const contourPoints: [number, number][] = [];
      for (let angle = 0; angle < 360; angle += 8) {
        const rad = (angle * Math.PI) / 180;
        const dx = Math.cos(rad);
        const dy = Math.sin(rad);

        let rMax = Math.max(w, h);
        let foundX = cx;
        let foundY = cy;

        for (let r = 0; r < rMax; r += 0.5) {
          const px = Math.round(cx + dx * r);
          const py = Math.round(cy + dy * r);

          if (px < 0 || px >= w || py < 0 || py >= h) break;
          if (fgSet.has(`${px},${py}`)) {
            foundX = px;
            foundY = py;
          }
        }
        contourPoints.push([
          (foundX / w) * 100,
          (foundY / h) * 100
        ]);
      }

      const dominantColorHex = hsvToHex(avgHue, avgSat, avgVal);

      setTimeout(() => {
        setAnalyzedFeaturesList((prev) => {
          const idx = prev.findIndex((p) => p.name === currentImgObj.name);
          const newFeatureItem = {
            name: currentImgObj.name,
            size: currentImgObj.size,
            imageUrl: currentImgObj.dataUrl,
            features: {
              hue: parseFloat(avgHue.toFixed(1)),
              saturation: parseFloat(avgSat.toFixed(2)),
              value: parseFloat(avgVal.toFixed(2)),
              circularity: parseFloat(circularity.toFixed(2)),
              aspectRatio: parseFloat(aspectRatio.toFixed(2)),
              area,
              perimeter,
              contourPoints,
              dominantColorHex,
            },
          };
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = newFeatureItem;
            return copy;
          }
          return [...prev, newFeatureItem];
        });
        setAnalysisProgress(100);
        setCurrentAnalyzingIndex((i) => i + 1);
      }, 800);
    };

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [activeStep, uploadedImages, currentAnalyzingIndex]);

  // Run DBSCAN Clustering against database in real time
  useEffect(() => {
    if (analyzedFeaturesList.length === 0 || activeStep < 4) return;

    let isMounted = true;
    setIsClusteringLoading(true);

    runDBSCANClustering({
      data: {
        eps,
        minSamples,
        featureMode,
        tempPoints: analyzedFeaturesList.map((item, idx) => ({
          id: `TEMP-RUN-${idx}`,
          name: item.name,
          hue: item.features.hue,
          saturation: item.features.saturation,
          value: item.features.value,
          circularity: item.features.circularity,
          aspectRatio: item.features.aspectRatio,
          imageUrl: item.imageUrl,
        }))
      }
    })
      .then(res => {
        if (isMounted) {
          setClusteringResult(res);
          setIsClusteringLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (isMounted) setIsClusteringLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [eps, minSamples, featureMode, analyzedFeaturesList, activeStep]);

  // Get current preview classification from DBSCAN results
  const currentClusteredPoint = clusteringResult?.points.find((p: any) => p.id === `TEMP-RUN-${previewIndex}`);
  const finalClusterLabel = currentClusteredPoint?.clusterLabel || "Tidak Terklasifikasi (Derau/Noise)";
  const finalClusterId = currentClusteredPoint?.cluster || "C-6";
  const confidence = currentClusteredPoint?.isCore 
    ? "Tinggi (Core Point)" 
    : currentClusteredPoint?.isBorder 
      ? "Sedang (Border Point)" 
      : "Rendah (Noise Point)";

  // Handle Save
  const handleSaveResult = async () => {
    if (analyzedFeaturesList.length === 0) return;
    setIsSaving(true);

    try {
      let firstSavedItemId = "";
      for (let i = 0; i < analyzedFeaturesList.length; i++) {
        const item = analyzedFeaturesList[i];
        const ptId = `TEMP-RUN-${i}`;
        const pt = clusteringResult?.points.find((p: any) => p.id === ptId);
        const clusterLabel = pt?.clusterLabel || "Tidak Terklasifikasi";
        const clusterId = pt?.cluster || "C-6";
        const isCore = pt?.isCore || false;
        const isBorder = pt?.isBorder || false;
        const conf = isCore ? "Tinggi (Core Point)" : isBorder ? "Sedang (Border Point)" : "Rendah (Noise Point)";
        
        const fruitClassification = clusterLabel.split(" — ")[0] || "Tidak Diketahui";

        const savedItem = await addDatasetItem({
          data: {
            name: item.name,
            fruit: fruitClassification,
            size: item.size,
            hue: item.features.hue,
            saturation: item.features.saturation,
            value: item.features.value,
            circularity: item.features.circularity,
            aspectRatio: item.features.aspectRatio,
            x: item.features.circularity * 100,
            y: item.features.hue / 3.6,
            imageUrl: item.imageUrl,
          }
        });

        if (i === 0) {
          firstSavedItemId = savedItem.id;
        }

        // Set local storage for details view of the last item
        if (i === analyzedFeaturesList.length - 1) {
          localStorage.setItem("fruit_atlas_last_run_label", clusterLabel);
          localStorage.setItem("fruit_atlas_last_run_id", clusterId);
          localStorage.setItem("fruit_atlas_last_run_confidence", conf);
          localStorage.setItem("fruit_atlas_last_run_color", item.features.dominantColorHex);
          localStorage.setItem("fruit_atlas_last_run_shape", item.features.circularity > 0.85 ? "Bulat" : "Tidak Beraturan");
          localStorage.setItem("fruit_atlas_last_run_circularity", item.features.circularity.toString());
          localStorage.setItem("fruit_atlas_last_run_aspect", item.features.aspectRatio.toString());
          localStorage.setItem("fruit_atlas_last_run_hue", item.features.hue.toString());
          localStorage.setItem("fruit_atlas_last_run_saturation", item.features.saturation.toString());
          localStorage.setItem("fruit_atlas_last_run_value", item.features.value.toString());
          localStorage.setItem("fruit_atlas_last_run_notes", `Diklasterkan secara dinamis dengan DBSCAN (eps: ${eps}, min_samples: ${minSamples}, bobot: ${featureMode === "both" ? "keduanya" : featureMode === "color" ? "warna" : "bentuk"}). Nilai HSV Warna: H=${item.features.hue}°, S=${item.features.saturation}, V=${item.features.value}. Sirkularitas bentuk adalah ${item.features.circularity} dan rasio aspek adalah ${item.features.aspectRatio}.`);
        }
      }

      // Redirect to student results page using the first saved item ID
      navigate({ to: "/student/results", search: { id: firstSavedItemId } });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Convert points for Scatter rendering based on X & Y axes selected by user
  const mapFeatureToCoord = (point: any, key: keyof AnalysisFeatures) => {
    const val = point[key];
    if (val === undefined) return 50;

    switch (key) {
      case "hue":
        return parseFloat((val / 3.6).toFixed(1)); // 0-360 -> 0-100
      case "saturation":
      case "value":
      case "circularity":
        return parseFloat((val * 100).toFixed(1)); // 0-1 -> 0-100
      case "aspectRatio":
        // Maps 0.5-2.5 to roughly 0-100
        return parseFloat((Math.min(100, Math.max(0, (val - 0.5) / 2 * 100))).toFixed(1));
      default:
        return 50;
    }
  };

  const formattedScatterData = clusteringResult?.points.map((pt: any) => ({
    ...pt,
    xCoord: mapFeatureToCoord(pt, xAxisKey),
    yCoord: mapFeatureToCoord(pt, yAxisKey),
  })) || [];

  const tempScatterPoints = formattedScatterData.filter((p: any) => p.id.startsWith("TEMP-RUN"));
  const otherScatterPoints = formattedScatterData.filter((p: any) => !p.id.startsWith("TEMP-RUN"));

  const getAxisLabel = (key: keyof AnalysisFeatures) => {
    switch (key) {
      case "hue": return "Hue (Roda Warna 0-360°)";
      case "saturation": return "Saturasi (Kemurnian Warna)";
      case "value": return "Value (Kecerahan Warna)";
      case "circularity": return "Sirkularitas (Kebulatan Bentuk)";
      case "aspectRatio": return "Rasio Aspek (Lebar / Tinggi)";
      default: return "";
    }
  };

  return (
    <AppShell role="student" title="Area Kerja Analisis" subtitle="Ekstraksi fitur dan amati pengklasteran DBSCAN secara langsung">
      {/* Steps Rails */}
      <ol className="mb-6 flex flex-wrap gap-2">
        {steps.map((s) => {
          const done = s.n < activeStep;
          const isActive = s.n === activeStep;
          return (
            <li key={s.n}>
              <button
                onClick={() => {
                  if (s.n <= activeStep || features) {
                    setActiveStep(s.n);
                  }
                }}
                disabled={s.n > activeStep && !features}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition duration-200 ${
                  isActive ? "border-primary bg-primary/10 text-primary font-medium"
                    : done ? "border-border bg-card text-foreground"
                    : "border-border bg-card/40 text-muted-foreground cursor-not-allowed"
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  done ? "bg-emerald-500 text-white" : isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>{done ? <Check className="h-3 w-3" /> : s.n}</span>
                {s.t}
              </button>
            </li>
          );
        })}
      </ol>

      {/* Progress Bar */}
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(activeStep / steps.length) * 100}%` }} />
      </div>

      {/* STEP 1: Upload Fallback */}
      {activeStep === 1 && (
        <Section title="Unggah Gambar Buah" description="Belum ada gambar aktif yang dimuat. Unggah gambar buah untuk memulai ekstraksi fitur.">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-surface px-6 py-12 text-center transition hover:border-primary/40">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><Upload className="h-5 w-5" /></div>
            <div className="text-sm font-medium">Pilih gambar buah untuk dianalisis</div>
            <div className="text-xs text-muted-foreground">Mendukung JPG, PNG, WebP</div>
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <span className="mt-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs">Cari file</span>
          </label>
        </Section>
      )}

      {/* WORKSPACE PREVIEW FOR ACTIVE STEPS */}
      {activeStep > 1 && imageUrl && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* COLUMN 1: IMAGE VIEW & ANIMATION */}
            <Section title="Penampil Analisis" description={`${fileName} (${fileSize})`}>
              <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-slate-900 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt="Menganalisis buah"
                  className="max-h-full max-w-full object-contain"
                />

                {/* Scan Overlay Line for Step 2 */}
                {activeStep === 2 && isAnalyzing && (
                  <>
                    <div className="absolute inset-0 bg-primary/5 backdrop-blur-[0.5px]" />
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-[bounce_2s_infinite] shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white gap-2 px-4 text-center">
                      <Cpu className="h-8 w-8 text-primary animate-spin" />
                      <span className="text-xs font-semibold tracking-wider font-mono">MENGEKSTRAKSI PROFIL HSV...</span>
                      <span className="text-xs font-medium font-mono text-emerald-400">
                        Mengolah gambar {currentAnalyzingIndex + 1} dari {uploadedImages.length}
                      </span>
                      <span className="text-[10px] text-slate-300 font-mono truncate max-w-full">
                        {uploadedImages[currentAnalyzingIndex]?.name}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono mt-1">{analysisProgress}%</span>
                    </div>
                  </>
                )}

                {/* Contour SVG Overlay for Step 3 and later */}
                {activeStep >= 3 && features && (
                  <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full pointer-events-none">
                    {/* Bounding Box */}
                    <rect x="5" y="5" width="90" height="90" fill="none" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2 2" />
                    
                    {/* Contour Polygon */}
                    <polygon
                      points={features.contourPoints.map(p => p.join(",")).join(" ")}
                      fill="rgba(76, 175, 80, 0.15)"
                      stroke="#4CAF50"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />

                    {/* Bounding Box labels */}
                    <text x="7" y="12" fill="#ef4444" fontSize="4" fontFamily="monospace">kotak pembatas: {features.aspectRatio.toFixed(2)} AR</text>
                    <text x="7" y="94" fill="#4c56af" fontSize="4" fontFamily="monospace">pusat: COM</text>
                  </svg>
                )}
              </div>

              {/* Thumbnail gallery to toggle previewIndex */}
              {analyzedFeaturesList.length > 1 && activeStep >= 3 && (
                <div className="mt-4 border-t border-border/60 pt-3">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Pilih gambar pratinjau:</span>
                  <div className="flex flex-wrap gap-2">
                    {analyzedFeaturesList.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPreviewIndex(idx)}
                        className={`relative rounded-md overflow-hidden border-2 transition ${
                          previewIndex === idx ? "border-primary font-bold shadow" : "border-transparent hover:border-muted-foreground/50"
                        }`}
                      >
                        <img src={item.imageUrl} alt={item.name} className="h-10 w-10 object-cover bg-muted" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {activeStep === 2 && !isAnalyzing && (
                <div className="mt-3 flex flex-wrap gap-2 justify-between items-center w-full">
                  <span className="text-xs text-emerald-500 flex items-center gap-1 font-medium">
                    <Sparkles className="h-3 w-3" /> Ekstraksi HSV selesai ({analyzedFeaturesList.length} buah)
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setAnalyzedFeaturesList([]);
                        setCurrentAnalyzingIndex(0);
                      }}
                      className="rounded border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                    >
                      Ulangi
                    </button>
                    <button onClick={() => setActiveStep(3)} className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground font-semibold hover:bg-primary/95 flex items-center gap-1">
                      Selanjutnya: Bentuk <Play className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
              {activeStep === 3 && (
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-xs text-emerald-500 flex items-center gap-1 font-medium"><Sparkles className="h-3 w-3" /> Kontur bentuk berhasil digambar</span>
                  <button onClick={() => setActiveStep(4)} className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground font-semibold hover:bg-primary/95 flex items-center gap-1">Selanjutnya: Klaster <Play className="h-3 w-3" /></button>
                </div>
              )}
            </Section>

            {/* COLUMN 2: EXTRACTED FEATURES */}
            <Section title="Fitur yang Diekstraksi" description="Parameter fisik buah yang dihitung di dalam browser">
              {features ? (
                <div className="space-y-4">
                  {/* HSV Color Preview */}
                  <div className="rounded-lg border border-border p-3 flex items-center gap-3 bg-surface/60">
                    <div
                      className="h-12 w-12 rounded-lg border border-border shadow-inner"
                      style={{ backgroundColor: features.dominantColorHex }}
                    />
                    <div>
                      <div className="text-xs text-muted-foreground uppercase">Warna Dominan</div>
                      <div className="text-sm font-semibold">{features.dominantColorHex}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">H: {features.hue}° · S: {features.saturation} · V: {features.value}</div>
                    </div>
                  </div>

                  {/* Quantitative features list */}
                  <dl className="space-y-2.5 text-sm">
                    {[
                      ["Sudut Hue (Warna)", `${features.hue}°`, "Panjang gelombang pigmen utama pada lingkaran warna 360°"],
                      ["Saturasi", features.saturation.toString(), "Tingkat kemurnian/kepekatan warna (0 hingga 1)"],
                      ["Kecerahan (Value)", features.value.toString(), "Tingkat terang-gelapnya warna (0 hingga 1)"],
                      ["Sirkularitas", features.circularity.toString(), "Kedekatan bentuk batas dengan lingkaran sempurna (0 hingga 1)"],
                      ["Rasio Aspek", features.aspectRatio.toString(), "Rasio dimensi kotak pembatas buah (Lebar / Tinggi)"],
                      ["Luas Segmen", `${features.area} px`, "Total jumlah piksel yang membentuk objek buah"],
                      ["Keliling Batas", `${features.perimeter} px`, "Total jumlah piksel pada batas luar objek buah"],
                    ].map(([label, val, desc]) => (
                      <div key={label} className="border-b border-border/60 pb-2">
                        <div className="flex justify-between items-baseline">
                          <dt className="text-muted-foreground font-medium text-xs">{label}</dt>
                          <dd className="font-mono text-xs font-semibold">{val}</dd>
                        </div>
                        <p className="text-[10px] text-muted-foreground/80 mt-0.5">{desc}</p>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-xl">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
                  <span className="text-xs font-mono">Mengekstraksi fitur...</span>
                </div>
              )}
            </Section>

            {/* COLUMN 3: STAGE & HELP */}
            <Section title="Ikhtisar Tahapan" description={`Langkah ${activeStep} dari 5`}>
              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                {activeStep === 2 && (
                  <>
                    <p className="font-semibold text-foreground text-sm flex items-center gap-1"><Cpu className="h-4 w-4 text-primary" /> Langkah 2: Ekstraksi Warna HSV</p>
                    <p>
                      Sistem membaca buffer piksel pada kanvas gambar untuk menerjemahkan nilai RGB menjadi koordinat tabung warna HSV (Hue, Saturation, Value).
                    </p>
                    <p>
                      Metode ini mengabaikan bayangan atau kecerahan pencahayaan, menghasilkan nilai <strong>Hue</strong> stabil yang mencerminkan pigmen fisik asli buah (seperti Merah, Oranye, Kuning, Hijau, Ungu).
                    </p>
                  </>
                )}
                {activeStep === 3 && (
                  <>
                    <p className="font-semibold text-foreground text-sm flex items-center gap-1"><Award className="h-4 w-4 text-primary" /> Langkah 3: Ekstraksi Fitur Bentuk</p>
                    <p>
                      Dengan memindai batas terluar objek buah, sistem menggambar kontur tepi. Dimensi kotak pembatas digunakan untuk menghitung <strong>Rasio Aspek</strong> (pisang yang lonjong vs apel yang bulat).
                    </p>
                    <p>
                      <strong>Sirkularitas</strong> mengukur seberapa bulat tepi buah tersebut (membedakan jeruk bulat dengan kelompok buah anggur yang bergelombang).
                    </p>
                  </>
                )}
                {activeStep === 4 && (
                  <>
                    <p className="font-semibold text-foreground text-sm flex items-center gap-1"><Sparkles className="h-4 w-4 text-primary" /> Langkah 4: Klasterisasi DBSCAN</p>
                    <p>
                      Sistem memanggil backend server function. DBSCAN memproses seluruh 120+ entri data historis di database bersama dengan sampel baru Anda!
                    </p>
                    <p>
                      Sesuaikan parameter: <strong>eps</strong> untuk mengatur jarak maksimum tetangga, dan <strong>min_samples</strong> untuk kerapatan minimum pembentukan klaster.
                    </p>
                  </>
                )}
                {activeStep === 5 && (
                  <>
                    <p className="font-semibold text-foreground text-sm flex items-center gap-1"><Check className="h-4 w-4 text-emerald-500" /> Langkah 5: Klasifikasi Akhir</p>
                    <p>
                      DBSCAN mengelompokkan sampel buah Anda secara dinamis berdasarkan kemiripan 5 dimensi. Tinjau kembali hasil klasifikasi dan simpan ke database agar tersimpan permanen di dataset sistem.
                    </p>
                  </>
                )}
              </div>
            </Section>
          </div>

          {/* CLUSTERING VIEW (STEP 4) */}
          {activeStep === 4 && features && (
            <Section title="Visualisasi Klasterisasi DBSCAN" description="Atur parameter kepadatan DBSCAN untuk mengamati pembentukan kelompok data.">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Control Panel */}
                <div className="space-y-4">
                  {/* Slider 1: EPS */}
                  <div>
                    <label className="block">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Epsilon (eps)</span>
                        <span className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{eps.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={0.1}
                        max={1.0}
                        step={0.05}
                        value={eps}
                        onChange={(e) => setEps(parseFloat(e.target.value))}
                        className="mt-2 w-full accent-[color:var(--primary)] cursor-ew-resize"
                      />
                    </label>
                    <p className="text-[10px] text-muted-foreground mt-1">Jarak pemindaian maksimum tetangga terdekat. Angka kecil mencari klaster yang sangat rapat.</p>
                  </div>

                  {/* Slider 2: Min Samples */}
                  <div>
                    <label className="block">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Sampel Minimum</span>
                        <span className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{minSamples}</span>
                      </div>
                      <input
                        type="range"
                        min={2}
                        max={15}
                        step={1}
                        value={minSamples}
                        onChange={(e) => setMinSamples(parseInt(e.target.value))}
                        className="mt-2 w-full accent-[color:var(--primary)] cursor-ew-resize"
                      />
                    </label>
                    <p className="text-[10px] text-muted-foreground mt-1">Jumlah titik minimum dalam radius eps untuk membentuk core klaster.</p>
                  </div>

                  {/* Toggles: Feature Mode */}
                  <div>
                    <span className="block text-xs font-semibold text-muted-foreground mb-2">Metrik Fitur Jarak</span>
                    <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-lg">
                      {(["color", "shape", "both"] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => setFeatureMode(mode)}
                          className={`capitalize py-1 text-[10px] font-semibold rounded-md transition ${
                            featureMode === mode
                              ? "bg-card text-foreground shadow"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {mode === "color" ? "warna" : mode === "shape" ? "bentuk" : "keduanya"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Axis Customizer */}
                  <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground">Sumbu X</label>
                      <select
                        value={xAxisKey}
                        onChange={(e) => setXAxisKey(e.target.value as any)}
                        className="w-full mt-1 border border-border bg-card rounded px-1.5 py-1 text-xs"
                      >
                        <option value="hue">Hue (Warna)</option>
                        <option value="saturation">Saturasi</option>
                        <option value="value">Kecerahan</option>
                        <option value="circularity">Sirkularitas</option>
                        <option value="aspectRatio">Rasio Aspek</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground">Sumbu Y</label>
                      <select
                        value={yAxisKey}
                        onChange={(e) => setYAxisKey(e.target.value as any)}
                        className="w-full mt-1 border border-border bg-card rounded px-1.5 py-1 text-xs"
                      >
                        <option value="hue">Hue (Warna)</option>
                        <option value="saturation">Saturasi</option>
                        <option value="value">Kecerahan</option>
                        <option value="circularity">Sirkularitas</option>
                        <option value="aspectRatio">Rasio Aspek</option>
                      </select>
                    </div>
                  </div>

                  {/* DBSCAN Stats Box */}
                  <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
                    <div className="rounded border border-border bg-surface p-2 text-center">
                      <div className="text-[10px] text-muted-foreground font-medium">Klaster Terbentuk</div>
                      <div className="text-base font-bold text-foreground mt-0.5">
                        {isClusteringLoading ? "..." : clusteringResult?.clusterCount ?? 0}
                      </div>
                    </div>
                    <div className="rounded border border-border bg-surface p-2 text-center">
                      <div className="text-[10px] text-muted-foreground font-medium">Titik Derau (Noise)</div>
                      <div className="text-base font-bold text-foreground mt-0.5">
                        {isClusteringLoading ? "..." : clusteringResult?.noiseCount ?? 0}
                      </div>
                    </div>
                  </div>

                  {/* Classification Preview for multiple files */}
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-2 max-h-48 overflow-y-auto">
                    <div className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Hasil Klasifikasi Sementara ({analyzedFeaturesList.length} Gambar):</div>
                    <div className="divide-y divide-primary/15">
                      {analyzedFeaturesList.map((item, idx) => {
                        const ptId = `TEMP-RUN-${idx}`;
                        const pt = clusteringResult?.points.find((p: any) => p.id === ptId);
                        const cLabel = pt?.clusterLabel || "Tidak Terklasifikasi";
                        const conf = pt?.isCore ? "Core" : pt?.isBorder ? "Border" : "Noise";
                        return (
                          <div key={idx} className="py-1.5 flex items-center justify-between text-[11px]">
                            <span className="font-medium truncate max-w-[120px]">{item.name}</span>
                            <div className="text-right">
                              <span className={`font-bold ${pt?.isNoise ? "text-rose-500" : "text-primary"}`}>
                                {cLabel.split(" — ")[0] === "Noise" ? "Derau (Noise)" : cLabel.split(" — ")[0]}
                              </span>
                              <span className="text-[9px] text-muted-foreground block font-mono">({conf})</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveStep(5)}
                    className="w-full rounded bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-md flex items-center justify-center gap-1.5"
                  >
                    Lihat Hasil Klasifikasi <Play className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Scatter Chart */}
                <div className="lg:col-span-2 relative min-h-[300px] border border-border rounded-xl bg-slate-900/40 p-4 flex flex-col justify-between">
                  {isClusteringLoading && (
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl">
                      <div className="flex items-center gap-2 text-xs font-mono text-primary font-semibold">
                        <RefreshCw className="h-4 w-4 animate-spin" /> MENJALANKAN KLASTERISASI BACKEND...
                      </div>
                    </div>
                  )}

                  <div className="h-72 w-full">
                    <ResponsiveContainer>
                      <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3d" />
                        <XAxis
                          type="number"
                          dataKey="xCoord"
                          name={xAxisKey}
                          stroke="#6B7280"
                          fontSize={10}
                          domain={[0, 100]}
                          label={{ value: getAxisLabel(xAxisKey), position: "bottom", offset: 5, fill: "#9ca3af", fontSize: 10 }}
                        />
                        <YAxis
                          type="number"
                          dataKey="yCoord"
                          name={yAxisKey}
                          stroke="#6B7280"
                          fontSize={10}
                          domain={[0, 100]}
                          label={{ value: getAxisLabel(yAxisKey), angle: -90, position: "left", offset: 0, fill: "#9ca3af", fontSize: 10 }}
                        />
                        <ZAxis range={[50, 70]} />
                        <Tooltip
                          cursor={{ strokeDasharray: "3 3", stroke: "#4b5563" }}
                          contentStyle={{ backgroundColor: "#1e293b", borderRadius: 8, border: "1px solid #334155", fontSize: 11, color: "#fff" }}
                          content={({ active, payload }) => {
                            if (!active || !payload || !payload.length) return null;
                            const data = payload[0].payload;
                            const labelStr = data.clusterLabel === "Noise" ? "Derau (Noise)" : data.clusterLabel;
                            return (
                              <div className="p-2 bg-slate-800 border border-slate-700 rounded shadow text-xs space-y-1">
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  {data.id.startsWith("TEMP-RUN") ? (
                                    <span className="inline-block h-2 w-2 rounded-full bg-primary animate-ping" />
                                  ) : null}
                                  {data.id.startsWith("TEMP-RUN") ? `Sampel Baru: ${data.name}` : data.name}
                                </div>
                                <div>ID: <span className="font-mono text-muted-foreground">{data.id}</span></div>
                                <div>Kelas Buah: <span className="font-medium text-emerald-400">{data.fruit === "Unknown" ? "Tidak Diketahui" : data.fruit}</span></div>
                                <div>Grup Klaster: <span className="font-semibold text-indigo-400">{labelStr} ({data.cluster})</span></div>
                                <div>Peran Titik: <span className="text-orange-400 font-medium">
                                  {data.isCore ? "Core (Inti)" : data.isBorder ? "Border (Perbatasan)" : "Noise (Derau)"}
                                </span></div>
                                <div className="text-[10px] text-slate-400 border-t border-slate-700/60 pt-1 mt-1 font-mono">
                                  X: {data.xCoord} | Y: {data.yCoord}
                                </div>
                              </div>
                            );
                          }}
                        />

                        {/* Standard Cluster Points */}
                        <Scatter data={otherScatterPoints}>
                          {otherScatterPoints.map((d: any, idx: number) => {
                            let dotColor = "#9CA3AF"; // Noise default
                            if (d.cluster !== "C-6" && d.clusterId !== -1) {
                              dotColor = COLORS[d.clusterId % COLORS.length];
                            }
                            return <Cell key={`dot-${idx}`} fill={dotColor} fillOpacity={0.65} stroke={d.isCore ? "#fff" : "none"} strokeWidth={1} />;
                          })}
                        </Scatter>

                        {/* Pulsing Temporary Points */}
                        {tempScatterPoints.length > 0 && (
                          <Scatter data={tempScatterPoints}>
                            {tempScatterPoints.map((tp: any, idx: number) => (
                              <Cell
                                key={`temp-${idx}`}
                                fill={tp.clusterId === -1 ? "#EF4444" : COLORS[tp.clusterId % COLORS.length]}
                                stroke="#FFF"
                                strokeWidth={2.5}
                                className="animate-pulse"
                                r={8}
                              />
                            ))}
                          </Scatter>
                        )}
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-2 border-t border-slate-800/80 pt-2">
                    <span>* Lingkaran berbingkai putih menunjukkan titik "Core Point" DBSCAN</span>
                    <span className="flex items-center gap-1 font-medium text-primary"><ZoomIn className="h-3 w-3" /> Arahkan kursor ke titik untuk detail koordinat</span>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* RESULTS DISPLAY & SAVE (STEP 5) */}
          {activeStep === 5 && analyzedFeaturesList.length > 0 && (
            <Section title="Ringkasan Klasifikasi Akhir Batch" description="Tinjau metrik klasterisasi untuk setiap gambar dan simpan semua ke database.">
              <div className="space-y-6">
                {/* Responsive Table for Batch Results */}
                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                        <th className="px-4 py-3">Gambar</th>
                        <th className="px-4 py-3">Nama File</th>
                        <th className="px-4 py-3">Warna (HSV)</th>
                        <th className="px-4 py-3">Bentuk (Sirkularitas)</th>
                        <th className="px-4 py-3">Rasio Aspek</th>
                        <th className="px-4 py-3">Hasil Klaster</th>
                        <th className="px-4 py-3">Tipe Point</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {analyzedFeaturesList.map((item, idx) => {
                        const ptId = `TEMP-RUN-${idx}`;
                        const pt = clusteringResult?.points.find((p: any) => p.id === ptId);
                        const cLabel = pt?.clusterLabel || "Tidak Terklasifikasi";
                        const isNoise = pt?.isNoise || pt?.clusterId === -1;
                        const conf = pt?.isCore ? "Core Point" : pt?.isBorder ? "Border Point" : "Noise (Derau)";

                        return (
                          <tr key={idx} className="hover:bg-muted/30 transition duration-150">
                            <td className="px-4 py-3">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="h-10 w-10 rounded-md border border-border object-cover bg-muted"
                              />
                            </td>
                            <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="h-4 w-4 rounded border border-border" style={{ backgroundColor: item.features.dominantColorHex }} />
                                <span className="font-mono text-xs">{item.features.dominantColorHex}</span>
                                <span className="text-[10px] text-muted-foreground font-mono">({item.features.hue}°)</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs">{item.features.circularity}</td>
                            <td className="px-4 py-3 font-mono text-xs">{item.features.aspectRatio}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                isNoise ? "bg-rose-500/10 text-rose-500" : "bg-primary/10 text-primary"
                              }`}>
                                {cLabel.split(" — ")[0] === "Noise" ? "Derau (Noise)" : cLabel.split(" — ")[0]}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-medium ${
                                pt?.isCore ? "text-emerald-500" : pt?.isBorder ? "text-amber-500" : "text-rose-500"
                              }`}>
                                {conf}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Save and Controls Panel */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="p-5 rounded-xl border border-border bg-card flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-1.5">
                        <Cpu className="h-4 w-4 text-primary" /> Parameter Klasterisasi Terapan
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                        DBSCAN dijalankan dengan epsilon sebesar <strong>{eps.toFixed(2)}</strong> dan sampel minimum sebesar <strong>{minSamples}</strong>. Fitur pemisah yang digunakan adalah <strong>{featureMode === "both" ? "Warna & Bentuk" : featureMode === "color" ? "Hanya Warna" : "Hanya Bentuk"}</strong>.
                      </p>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => setActiveStep(4)}
                        className="rounded border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-muted"
                      >
                        Kembali Atur Slider
                      </button>
                      <button
                        onClick={handleSaveResult}
                        disabled={isSaving}
                        className="flex-1 rounded bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Menyimpan...
                          </>
                        ) : (
                          <>
                            Simpan Semua ke Database <Play className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card/60 p-5 space-y-4">
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-amber-500" /> Penjelasan Klasterisasi DBSCAN
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Dalam analisis ini:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4 leading-relaxed">
                      <li>
                        Gambar buah yang bentuk dan warnanya serupa (misal, beberapa apel merah) dikelompokkan ke klaster yang sama.
                      </li>
                      <li>
                        Jika ada buah yang memiliki karakteristik warna atau bentuk yang berbeda jauh dari mayoritas data (seperti pisang kuning di antara apel merah), buah tersebut terdeteksi sebagai <strong>Derau (Noise)</strong>.
                      </li>
                      <li>
                        Melalui visualisasi ini, Anda dapat memahami bagaimana algoritma DBSCAN mengidentifikasi kelompok berdasarkan kepadatan spasial fitur tanpa perlu ditentukan label kelasnya terlebih dahulu!
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </Section>
          )}
        </div>
      )}
    </AppShell>
  );
}
