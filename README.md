# BMD — Branding Monitoring Dashboard

Aplikasi monitoring & pengajuan branding toko (Avian Brands).

**Stack:** Laravel 13 · Inertia 3 · React 19 · Tailwind 4 · Fortify · SQLite/MySQL

---

## Untuk tim (setup lokal)

### Prasyarat

- PHP 8.3+ (ekstensi: `gd` dengan WebP, `sqlite` atau `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `fileinfo`)
- Composer 2
- Node.js 20+ (disarankan LTS)
- [Laravel Herd](https://herd.laravel.com/) (opsional, direkomendasikan di macOS) **atau** `php artisan serve`

### Clone & install

```bash
git clone https://github.com/andidewanto/bmd.git
cd bmd

# Satu perintah setup (install deps, .env, key, migrate, npm build)
composer run setup

# Link storage untuk upload foto katalog
php artisan storage:link

# Seed data katalog / branding (opsional, disarankan untuk dev)
php artisan db:seed
```

### Jalankan development

**Terminal 1 — Vite HMR**

```bash
npm run dev
```

**Terminal 2 — app**

- Herd: arahkan site ke folder project, buka URL (contoh `http://bmd.test`)
- Atau: `php artisan serve` → `http://127.0.0.1:8000`

### Login lokal

Di `.env.example` default:

```env
BMD_AUTH_BYPASS=true
BMD_AUTH_BYPASS_EMAIL=dev@bmd.local
```

Dengan bypass aktif (`APP_ENV=local` + `BMD_AUTH_BYPASS=true`), sesi login otomatis diisi user bypass.

Tanpa bypass, gunakan user seed:

| Email | Password |
|-------|----------|
| `test@example.com` | `password` |
| `dev@bmd.local` | `password` |

**Matikan bypass sebelum demo/staging:** `BMD_AUTH_BYPASS=false`

### Database

Default: **SQLite** (`database/database.sqlite` dibuat otomatis saat migrate).

Untuk MySQL, di `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=bmd
DB_USERNAME=root
DB_PASSWORD=
```

Lalu:

```bash
php artisan migrate --seed
```

---

## Modul yang sudah ada

| Path | Keterangan |
|------|------------|
| `/toko` | Daftar toko (dari brandings) |
| `/katalog` | Katalog branding + cart pengajuan |
| `/pengajuan` | Ringkasan cart + submit |
| `/admin/katalog` | CRUD item + galeri foto (WebP) |
| `/admin/katalog/kategori` | Master kategori |

Lihat perubahan & rencana di [`BACKLOG.md`](./BACKLOG.md).

---

## Deploy / paket untuk tim

### Opsi A — Clone dari GitHub (disarankan)

```bash
git clone https://github.com/andidewanto/bmd.git
cd bmd
composer run setup
php artisan db:seed
```

Repo (private): https://github.com/andidewanto/bmd  
Undang kolaborator: GitHub → **Settings → Collaborators** (atau Organization team).

### Production — https://bmd.andizero.my.id

Sudah di-deploy di VPS `adwzero` (`/srv/apps/web/bmd`, Caddy + PHP 8.4-FPM).

Redeploy dari lokal:

```bash
./bin/deploy-andizero.sh
```

Login production (bypass **mati**):

| Email | Password |
|-------|----------|
| `test@example.com` | `password` |
| `dev@bmd.local` | `password` |

**Ganti password segera** setelah tim masuk.

### Opsi B — Zip source (tanpa `vendor` / `node_modules`)

Zip dibuat lewat script:

```bash
./bin/make-deploy-package.sh
```

Hasil: `dist/bmd-source-YYYYMMDD-HHMM.zip`  
Tim unzip → jalankan langkah setup yang sama seperti di atas.

---

## Script berguna

```bash
composer run setup      # install + migrate + build
composer run lint       # Laravel Pint
npm run dev             # Vite HMR
npm run build           # production assets
php artisan test        # tests
```

---

## Catatan kontribusi

1. Jangan commit `.env`, `vendor/`, `node_modules/`, `public/hot`, `public/storage`
2. Update `BACKLOG.md` bila menambah fitur domain
3. Foto upload admin disimpan di `storage/app/public/katalog/{id}/` (WebP)
4. Cart pengajuan tetap di `sessionStorage` browser (parity BMD2)
