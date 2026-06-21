# FruitCluster — Analisis Gambar Buah dengan DBSCAN

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/)

**FruitCluster** adalah platform akademik inovatif yang dirancang untuk membantu mahasiswa, dosen, dan peneliti dalam melakukan pengelompokan (clustering) gambar buah secara cerdas. Aplikasi ini menggabungkan analisis fitur warna HSV dengan geometri bentuk buah, yang kemudian dikelompokkan menggunakan algoritma **DBSCAN** (Density-Based Spatial Clustering of Applications with Noise).

---

## 🚀 Fitur Utama

Sistem FruitCluster dirancang dengan pipa pemrosesan (pipeline) data citra digital lengkap:

1. **Unggah Dataset Multiguna**
   * Pengunggahan berkas gambar tunggal maupun massal (bulk upload).
   * Dilengkapi dengan pratinjau gambar, pengambilan metadata otomatis, serta pengelolaan dataset terpadu.

2. **Ekstraksi Fitur Warna HSV**
   * Mengonversi representasi warna dari RGB ke HSV (Hue, Saturation, Value).
   * Mengekstrak histogram warna dominan dan tingkat kecerahan untuk membedakan varietas buah berdasarkan warna matang/mentah.

3. **Ekstraksi Deskriptor Bentuk (Geometri)**
   * Mendeteksi kontur tepi objek buah.
   * Menghitung nilai geometri kritis seperti *Aspect Ratio* (rasio dimensi), sirkularitas (momen bundar objek), dan metrik bentuk lainnya.

4. **Algoritma DBSCAN Interaktif**
   * Implementasi algoritma pengelompokan spasial berbasis kepadatan (Density-Based) secara kustom dengan fitur normalisasi data (skala `0` hingga `1`).
   * Parameter jarak euklidian berbobot untuk menyesuaikan pengaruh fitur warna vs fitur bentuk.
   * Kontrol parameter visual interaktif untuk menentukan nilai Jangkauan Tetangga ($Epsilon$ / $\text{eps}$) dan Kepadatan Minimum ($\text{min\_samples}$).

5. **Visualisasi Data & Manajemen Kluster**
   * Grafik *Scatter Plot* interaktif yang membedakan titik-titik data berdasarkan perannya: **Core Points** (inti kluster), **Border Points** (perbatasan), dan **Noise/Outlier Points** (derau).
   * Dasbor administrasi untuk memberikan label nama pada kluster, menggabungkan kluster serupa, atau melakukan audit hasil pengelompokan.

6. **Sistem Pelaporan Penelitian**
   * Ekspor hasil klasterisasi dalam format **PDF** dan **Excel** terstruktur untuk lampiran skripsi, tesis, jurnal ilmiah, atau laporan laboratorium.

---

## 🛠️ Tech Stack

Platform ini dibangun menggunakan teknologi web modern berkinerja tinggi:

* **Framework Utama:** [TanStack Start](https://tanstack.com/router/v1/docs/start/overview) (React 19 + Vite 7)
* **Manajemen Rute & State:** [TanStack Router](https://tanstack.com/router) & [TanStack Query (React Query)](https://tanstack.com/query)
* **Desain UI/UX:** [TailwindCSS v4](https://tailwindcss.com/) & [Radix UI](https://www.radix-ui.com/)
* **Pustaka Ikon:** [Lucide React](https://lucide.dev/)
* **Visualisasi Grafik:** [Recharts](https://recharts.org/)
* **Platform Deployment:** Cloudflare Pages / Workers (dikonfigurasi dengan `wrangler`)
* **Pengelola Paket:** [Bun](https://bun.sh/) (atau dapat menggunakan `npm`)

---

## 📂 Struktur Proyek

Berikut adalah gambaran umum dari direktori utama dalam repositori ini:

```text
fruit-atlas/
├── .lovable/              # Konfigurasi integrasi Lovable
├── dist/                  # Hasil kompilasi siap produksi (build output)
├── src/
│   ├── components/        # Komponen UI modular & kerangka halaman (Shadcn/custom)
│   ├── hooks/             # Custom React hooks
│   ├── lib/
│   │   ├── db-store.ts    # Penyimpanan & pengelolaan data lokal klien
│   │   ├── dbscan.ts      # Algoritma DBSCAN & rumus matematika kalkulasi jarak
│   │   └── utils.ts       # Utility helper functions
│   ├── routes/            # Konfigurasi router aplikasi berbasis berkas (File-based routing)
│   │   ├── admin/         # Area kerja administrator (dashboard, analysis, datasets, dll)
│   │   ├── student/       # Area kerja mahasiswa/peneliti (upload, analysis, results)
│   │   ├── index.tsx      # Landing page utama
│   │   └── __root.tsx     # Layout akar aplikasi
│   ├── server.ts          # Integrasi backend & penanganan SSR (Server-Side Rendering)
│   ├── start.ts           # Entry point client-side untuk TanStack Start
│   └── styles.css         # Styling global & variabel Tailwind v4
├── wrangler.jsonc         # Konfigurasi deployment Cloudflare Pages / Workers
├── package.json           # Dependensi pustaka dan skrip perintah
└── bun.lock               # Lockfile untuk pengelola paket Bun
```

---

## ⚙️ Panduan Instalasi & Pengembangan Lokal

### 1. Prasyarat Sistem
Pastikan komputer Anda telah terinstal salah satu dari perangkat lunak berikut:
* **Node.js** versi `20.x` atau lebih baru
* **Bun** versi `1.0.x` atau lebih baru (Sangat direkomendasikan untuk performa instalasi cepat)

### 2. Kloning Repositori
Lakukan kloning repositori proyek ini ke komputer lokal Anda:
```bash
git clone <url-repositori-anda>
cd fruit-atlas
```

### 3. Memasang Dependensi
Pilih salah satu perintah di bawah ini sesuai pengelola paket yang Anda gunakan:

* **Menggunakan Bun (Direkomendasikan):**
  ```bash
  bun install
  ```
* **Menggunakan NPM:**
  ```bash
  npm install
  ```

### 4. Menjalankan Server Pengembangan (Local Dev Server)
Jalankan server lokal untuk melihat perubahan secara langsung (*hot-reload*):

* **Menggunakan Bun:**
  ```bash
  bun dev
  ```
* **Menggunakan NPM:**
  ```bash
  npm run dev
  ```

Setelah server aktif, buka peramban (browser) Anda dan akses alamat berikut:
```text
http://localhost:3000
```

### 5. Membangun Proyek untuk Produksi
Gunakan perintah berikut untuk melakukan optimasi kode sebelum disebarkan ke server produksi:

* **Menggunakan Bun:**
  ```bash
  bun run build
  ```
* **Menggunakan NPM:**
  ```bash
  npm run build
  ```

### 6. Menjalankan Hasil Kompilasi Produksi (Preview)
Untuk menguji hasil build produksi secara lokal:

* **Menggunakan Bun:**
  ```bash
  bun run preview
  ```
* **Menggunakan NPM:**
  ```bash
  npm run preview
  ```

---

## 📐 Penjelasan Alur Matematika & Algoritma (Pipeline DBSCAN)

Secara garis besar, proses pengelompokan gambar pada **FruitCluster** berjalan dengan alur sebagai berikut:

1. **Ekstraksi Fitur:** Setiap gambar menghasilkan vektor fitur berupa:
   $$\vec{x} = [H, S, V, \text{circularity}, \text{aspect\_ratio}]$$
2. **Normalisasi Min-Max:** Skala nilai setiap dimensi diubah ke rentang $[0, 1]$ agar kontribusi fitur merata:
   $$x_{\text{norm}} = \frac{x - x_{\text{min}}}{x_{\text{max}} - x_{\text{min}}}$$
3. **Kalkulasi Jarak Euclidean Berbobot:** Pengukuran kemiripan antar-gambar dihitung menggunakan bobot kustom $\vec{w}$:
   $$d(\vec{a}, \vec{b}) = \sqrt{\frac{\sum_{i=1}^{n} w_i \cdot (a_i - b_i)^2}{\sum_{i=1}^{n} w_i}}$$
4. **Klasterisasi Spasial:**
   * Titik $P$ dinyatakan sebagai **Core Point** jika jumlah tetangga dalam radius $\text{eps}$ memenuhi syarat $\text{min\_samples}$.
   * Titik $P$ dinyatakan sebagai **Border Point** jika berada dalam jangkauan Core Point tetapi tidak memenuhi syarat kepadatan minimum.
   * Titik $P$ dinyatakan sebagai **Noise** jika tidak memenuhi kedua syarat di atas.

---

## ☁️ Panduan Deployment (Cloudflare Pages)

Proyek ini telah siap digunakan dengan infrastruktur Cloudflare Pages.

### Uji Coba Wrangler Lokal
Gunakan perintah Wrangler untuk mensimulasikan lingkungan Cloudflare secara lokal:
```bash
npx wrangler dev
```

### Menyebarkan Aplikasi (Deploy)
Jika Anda memiliki akun Cloudflare dan ingin menyebarkannya langsung dari terminal:
```bash
npx wrangler deploy
```
Atau hubungkan repositori Git Anda ke panel kontrol **Cloudflare Pages** untuk penanganan deployment otomatis (*Continuous Integration*) setiap kali Anda melakukan `git push` ke cabang utama (`main`).

---

## 📄 Lisensi

Proyek ini dibuat untuk tujuan akademik dan penelitian. Silakan menyesuaikan lisensi ini sesuai dengan kebijakan laboratorium komputer vision atau institusi akademik terkait.
