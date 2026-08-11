# BMD Backlog

Changelog & tugas terbuka. Update file ini di **setiap** perubahan kode.

---

## 2026-08-11 — Fondasi v1: Katalog + Pengajuan

### Done
- [x] Konfigurasi MySQL di `.env.example` + `config/bmd.php`
- [x] Dev auth bypass (`BMD_AUTH_BYPASS`) via middleware `DevAuthBypass`
- [x] Migration: `tokos`, `katalog_items`, `pengajuans`, `pengajuan_items`
- [x] Model + seeder katalog (31 item dari BMD2) + toko mock
- [x] Controller/route Inertia: Katalog index, Pengajuan index + submit
- [x] Aturan branding (PHP + TypeScript) port dari BMD2 `pengajuan-rules.js`
- [x] UI Katalog + Pengajuan (~75% BMD2): kartu horizontal, summary, cart sessionStorage
- [x] Sidebar nav: Katalog, Pengajuan
- [x] CSS domain `resources/css/bmd.css` + remark dokumentasi di section/fungsi utama

### Done (execute 2026-08-11)
- [x] Copy aset foto katalog BMD2 → `public/assets/katalog/` (61 file)
- [x] Install Node LTS via Herd nvm + `npm install` + `npm run build`
- [x] Switch DB lokal ke **SQLite** (Herd) — berhenti pakai MAMP/MySQL
- [x] `.env` / `.env.example`: `DB_CONNECTION=sqlite`, `APP_URL=http://bmd.test`
- [x] Fresh migrate + seed di `database/database.sqlite`

### Done (UI katalog 2026-08-11)
- [x] Hapus badge nomor urut di foto card katalog
- [x] Judul card: `KODE - Nama` (contoh: `B01 - Booth Tinting`)
- [x] Hapus baris meta kode/kategori di bawah judul
- [x] Jalankan `npm run dev` (Vite HMR) agar perubahan FE langsung terlihat di `bmd.test`
- [x] Hapus badge "DEV AUTH BYPASS" dari sidebar kiri (bypass tetap aktif di backend)

### Done (modul Toko 2026-08-11)
- [x] Tabel `brandings` + seed 100 baris dari BMD2
- [x] Sync master `tokos` dari agregasi brandings
- [x] Halaman `/toko`: NO | Cust Id | Nama Toko | Cabang | AVG Omzet | Total Cost | Jumlah Branding | Status Branding
- [x] Filter cabang + search + pagination
- [x] Nav sidebar: Toko
- [x] Sort ASC/DESC di setiap header kolom tabel Toko
- [x] Sembunyikan kolom Nama Toko (sementara; diganti sample Excel 2026-08-03)
- [x] Filter Status Branding di sebelah filter Cabang (halaman Toko)
- [x] Logo apps + favicon diganti Avian Brands (`public/images/branding/`, `favicon.ico`)
- [x] Pengajuan: hapus dropdown toko; jumlah item + total biaya pindah ke panel item; kanan khusus omzet/proyeksi
- [x] Pengajuan: link Kembali ke Katalog & Aturan Branding di bawah card, rata tengah

### Done (katalog UX + admin 2026-08-11)
- [x] Judul card katalog max 2 baris (`-webkit-line-clamp: 2`)
- [x] Warning aturan branding (mis. B03 butuh B01) sebagai modal center, bukan toast
- [x] Lightbox detail: klik foto → semua field katalog + slide galeri foto
- [x] Migration `katalog_item_photos` + model `KatalogItemPhoto`
- [x] Admin `/admin/katalog`: CRUD item, upload foto, set/hapus thumbnail
- [x] Nav sidebar: Admin Katalog

### Done (ops 2026-08-11)
- [x] `php artisan migrate` → `katalog_item_photos` (batch 3)
- [x] `php artisan storage:link` → `public/storage`

### Done (admin katalog UX 2026-08-11)
- [x] Tombol Simpan perubahan dipindah ke bawah halaman (setelah galeri)
- [x] Dropzone tambah foto: klik upload atau drag-and-drop (multi-file di edit)
- [x] Upload otomatis dikonversi/dioptimasi ke WebP (`KatalogImageOptimizer`, max 1600px, q82)

### Done (master kategori + satuan 2026-08-11)
- [x] Tabel master `katalog_kategoris` + seed dari kategori existing
- [x] Admin `/admin/katalog/kategori` (tambah/edit/hapus/aktif)
- [x] Form item: dropdown kategori dari master; satuan dropdown `Unit` | `m2`
- [x] Rename kategori ikut sync ke `katalog_items.kategori`

### Done (ops master kategori 2026-08-11)
- [x] `php artisan migrate` → `katalog_kategoris` (6 kategori: Booth, Cat Toko, Event, Printed Material, Rak, Signage)

### Done (form edit UX 2026-08-11)
- [x] Dropdown admin pakai ikon ChevronDown custom (hide native arrow)
- [x] Tombol Simpan Perubahan diperbesar + tombol Batalkan Perubahan
- [x] Guard pindah halaman bila dirty: modal Review Kembali / Batalkan Perubahan

### Done (katalog card polish 2026-08-11)
- [x] Tombol “Tambahkan ke Pengajuan” lebih subtle (soft tint + outline)
- [x] Line-height judul (+15% → 1.495) & detail card (+15% → 1.38)
- [x] Item m²: estimasi harga di bawah dimensi = (tinggi×lebar/10000)×harga_max
- [x] Container daftar kartu soft-grey + drop shadow pada card item

### Done (repo + package 2026-08-11)
- [x] Git init + push private repo: https://github.com/andidewanto/bmd
- [x] README setup untuk tim + `composer run setup` (sqlite touch, migrate, storage:link, build)
- [x] Script zip deployable: `bin/make-deploy-package.sh` → `dist/bmd-source-*.zip`
- [ ] Re-add `.github/workflows/tests.yml` setelah `gh auth refresh -s workflow`

### Done (production deploy 2026-08-11)
- [x] Live: https://bmd.andizero.my.id (Caddy TLS, PHP 8.4-FPM + WebP)
- [x] Path server: `/srv/apps/web/bmd`, SQLite + seed katalog/toko/branding
- [x] Script redeploy: `bin/deploy-andizero.sh`
- [x] `BMD_AUTH_BYPASS=false` di production

### Done (branding sample + nama toko 2026-08-11)
- [x] Update `brandings.json` dari Excel sample 2026-08-03 (100 baris + Nama Toko)
- [x] Kolom `brandings.nama_toko` + sync ke master `tokos.nama`
- [x] Halaman Toko: tampilkan kembali kolom Nama Toko (sort + search)
- [x] Halaman Toko: kolom Total Cost Branding (SUM) + Jumlah Branding (COUNT) per toko
- [x] Halaman Toko: 4 KPI card (Terbranding, Cost Ratio, 2 placeholder) mengikuti filter

### Done (master data + theme 2026-08-11)
- [x] Master `branding_statuses` dari unik `change_status` log BMD (10 status + urutan proses)
- [x] Admin hub `/admin/master` + halaman Status Branding (CRUD + drag & drop reorder)
- [x] Default theme LIGHT

### Checkpoint (sebelum dashboard 2026-08-11)
- [x] Backup rollback: `version/version134711082026.zip` (~39M)
- [x] Git branch: `cursor/toko-kpi-master-status-light` @ `87ffbe0`

### Checkpoint (sebelum optimasi katalog 2026-08-11)
- [x] Backup rollback: `version/version141311082026.zip` (~39M)

### Checkpoint (setelah katalog Rev3 + fix dashboard/kategori 2026-08-11)
- [x] Backup rollback: `version/version145011082026.zip` (~162M)

### Done (optimasi katalog A–I 2026-08-11)
- [x] Split komponen katalog (Filters, Card, M2Fields) + page lebih ramping
- [x] Shared `useFlashToast`, `BmdWarningDialog`, `BmdSortHeader`
- [x] Estimasi m² pakai `formatRp`; hapus CSS `.katalog-card-no`
- [x] Split `bmd-katalog.css`; paginasi katalog 12 + lazy gallery `/katalog/{id}/detail`
- [x] Tombol kosongkan cart hanya di local/debug

### Done (katalog Rev 3 sync 2026-08-11)
- [x] Import dari `Katalog Branding Avian - Rev 3.xlsx` → `database/data/katalog_items.json`
- [x] Copy 31 foto cell-image Excel → `public/assets/katalog/ID_*.{png,jpeg}`
- [x] `KatalogItemSeeder`: upsert item + thumbnail `katalog_item_photos` + sync master kategori (+Tambahan)
- [x] Seed lokal: 31 item / 31 foto; kategori aktif: Booth, Cat Toko, Event, Printed Material, Rak, Signage, Tambahan

### Done (fix master kategori save 2026-08-11)
- [x] Form edit kategori dipecah ke komponen terpisah (hindari React Compiler cache `useForm` di dalam `.map`)
- [x] Tampilkan error validasi + toast; redirect eksplisit ke index setelah store/update/destroy

### Done (fix dashboard putih 2026-08-11)
- [x] Pindah `Toaster` ke dalam `AppSidebarLayout` (bukan `withApp`) agar error toast tidak blank seluruh app
- [x] Sonner theme pakai `resolvedAppearance` (light/dark)
- [x] `DevAuthBypass` di priority list sebelum `Authenticate`

### Done (form tambah item katalog 2026-08-11)
- [x] No & Kode otomatis (max no+1; prefix kategori + NN)
- [x] Usia Branding dropdown 12/24/26/48; Detail Branding label
- [x] Dimensi 3 field (Tinggi/Panjang/Lebar); harga tunggal (min=max)
- [x] Tombol Batalkan + Buat item berdampingan di tengah

### Done (kode huruf master kategori 2026-08-11)
- [x] Kolom `katalog_kategoris.kode` (unik) untuk prefix pengkodean item
- [x] Admin master kategori: input/tampil Kode (create + edit + tabel)
- [x] Form item: `kategoriPrefix()` baca dari master `kode` (fallback huruf pertama nama)
- [x] Seeder sync kategori mengisi `kode` bila masih kosong (B/C/E/P/R/S/T)
- [x] Feature test store/update/duplikat kode

### Done (dashboard KPI nasional 2026-08-11)
- [x] RINGKASAN NASIONAL 5 KPI card (asumsi Total Toko 250, budget 1000 jt)
- [x] Formula: terpasang/asumsi, avg cost ratio, pencapaian 70.5% (sementara), peremajaan via `installed_at`+lifetime, prospek=asumsi−terpasang
- [x] Progress bar Realisasi Budget = Σ total_cost / alokasi 1 tahun (1000 jt)
- [x] Tabel Kinerja Per Area (area 2-digit, toko terpasang, avg omzet, cost ratio)
- [x] Kinerja Per Area: paginasi 10 + sort ASC/DESC per kolom

### Open / Next
- [ ] Dashboard: formula resmi Avg Pencapaian Target (+ per area)
- [ ] Dashboard: formula Growth Omzet per area
- [ ] Dashboard: peremajaan berbasis tanggal pemasangan item (bukan proxy branding)
- [ ] Sync sample branding + nama_toko + master status ke production `bmd.andizero.my.id`
- [ ] Modul Brandings (detail / monitoring status & history)
- [ ] History status toko pada kartu katalog (pernah diajukan / terpasang)
- [ ] Dashboard ringkasan
- [ ] Import/sync SQL BMD2 production-ready
- [ ] Role/permission (sales vs admin)
- [ ] (Opsional) MySQL untuk staging/shared team — tetap didukung via `.env`
- [ ] Test feature Katalog + Pengajuan (PHPUnit / Pest)

### Notes
- Cart pengajuan tetap di `sessionStorage` (parity BMD2); submit menyimpan ke MySQL.
- Auth wajib di production; bypass **hanya** jika `APP_ENV=local` **dan** `BMD_AUTH_BYPASS=true`.
