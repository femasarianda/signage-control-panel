# Signage Control Panel

Aplikasi digital signage: **dashboard admin** untuk mengelola device dan content, serta **device client** (web + desktop Electron) yang menayangkan content. Status online/offline device diperbarui **real-time lewat WebSocket**, tanpa refresh.

## Fitur

**Requirement wajib**
- Database Supabase (Postgres): tabel `devices` dan `contents`
- REST API CRUD untuk devices dan contents
- WebSocket server: status online/offline device tampil real-time di dashboard
- Dashboard admin: kelola device & content, termasuk upload file (gambar/video) atau attach teks/URL
- Halaman device client yang menampilkan content

**Bonus**
- Playlist per device (urutan + durasi) dan **push** content ke device tertentu secara instan
- Device client sebagai **aplikasi desktop Electron**
- Autentikasi **JWT** untuk dashboard
- **Reconnection** otomatis pada device client (exponential backoff) + cache playlist offline

Tambahan: tema terang/gelap di dashboard.

## Arsitektur

```
┌──────────────┐  REST + JWT   ┌───────────────────┐   service key   ┌──────────────────┐
│  Dashboard   │──────────────▶│                   │────────────────▶│ Supabase         │
│ (React/Vite) │  WS (token)   │  Backend          │                 │  • Postgres      │
│              │◀─────────────▶│  Express + ws     │◀────────────────│  • Storage       │
└──────────────┘               │                   │                 └──────────────────┘
                               │                   │
┌──────────────┐  REST (publik)│                   │
│ Device client│──────────────▶│                   │
│ web/Electron │  WS (device)  │                   │
│              │◀─────────────▶│                   │
└──────────────┘               └───────────────────┘
```

Frontend **tidak pernah** berbicara langsung ke Supabase. Hanya backend yang memegang secret key, sehingga akses data sepenuhnya dikontrol backend (RLS aktif tanpa policy publik).

### Struktur folder

```
backend/          Express + WebSocket + REST API + JWT
  src/routes/       auth, devices (+playlist, push), contents (+upload), public
  src/ws/hub.js     WebSocket hub (presence, heartbeat, push)
  scripts/          create-admin
dashboard/        React + Vite + Tailwind: panel admin
device-client/    React + Vite: player; electron/ membungkusnya jadi aplikasi desktop
```

## Pemilihan teknologi

| Kebutuhan | Pilihan | Alasan |
|---|---|---|
| Database | Supabase Postgres | Relasional cocok untuk device ↔ content ↔ playlist (foreign key + cascade). Storage bawaan dipakai untuk file upload. |
| Real-time | WebSocket (`ws`) di backend sendiri | Presence device butuh kontrol penuh (heartbeat, multi-koneksi, push). Dibuat langsung di atas WebSocket, bukan Supabase Realtime, agar logikanya eksplisit dan mudah diuji. |
| API | Express | Ringan dan sederhana untuk CRUD. |
| Auth | JWT (Bearer) + bcrypt | Stateless, cocok untuk REST dan WebSocket (token dikirim saat handshake). |
| Frontend | React + Vite + Tailwind | Cepat dikembangkan; Tailwind dengan CSS variable untuk tema terang/gelap. |
| Desktop | Electron | Bisa memakai ulang build web device-client tanpa menulis ulang. |

## Menjalankan

Prasyarat: Node.js 20+ dan akun Supabase.

### 1. Supabase
1. Buat project. Pada form: aktifkan **Data API** dan **automatic RLS**, nonaktifkan **automatically expose new tables**.
2. Jalankan SQL berikut di **SQL Editor**:

```sql
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  lokasi text,
  status text not null default 'offline' check (status in ('online','offline')),
  last_seen timestamptz
);

create table public.contents (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  tipe text not null check (tipe in ('image','video','text','url')),
  payload text not null,
  created_at timestamptz not null default now()
);

create table public.device_contents (
  device_id uuid not null references public.devices(id) on delete cascade,
  content_id uuid not null references public.contents(id) on delete cascade,
  position int not null default 0,
  duration_sec int not null default 10,
  primary key (device_id, content_id)
);

create table public.admins (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null
);

grant all on public.devices, public.contents, public.device_contents, public.admins to service_role;
```

3. Buat bucket Storage bernama `contents` dengan opsi **Public bucket**.
4. Ambil **Project URL** dan **Secret key** (`sb_secret_...`) dari *Project Settings → API Keys*.

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env        # lalu isi SUPABASE_URL, SUPABASE_SECRET_KEY, JWT_SECRET
npm run create-admin -- admin passwordAnda
npm run dev                 # http://localhost:3000
```

### 3. Dashboard
```bash
cd dashboard
npm install
npm run dev                 # http://localhost:5173
```
Masuk dengan admin yang dibuat tadi.

### 4. Device client
```bash
cd device-client
npm install
npm run dev                 # http://localhost:5174
```
Di dashboard, buat device lalu klik **Salin link** dan buka link tersebut di tab baru. Tab itu menjadi layar si device.

### 5. Aplikasi desktop (Electron)
```bash
cd device-client
npm run electron:dev        # development (membuka jendela Electron + Vite)
npm run electron:start      # build lalu jalankan versi produksi
npm run electron:build      # membuat installer Windows di device-client/release/
```
Mode kiosk: `"Signage Player.exe" --device=<id>` langsung terhubung ke device tertentu. Tombol **F11** mengaktifkan/mematikan layar penuh, **Esc** keluar dari layar penuh. Build Electron memakai alamat backend dari `device-client/.env.electron` (default `http://localhost:3000`).

## Dokumentasi API

Semua endpoint `/api/devices` dan `/api/contents` membutuhkan header `Authorization: Bearer <token>`.

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/auth/login` | `{username, password}` → `{token}` |
| GET / POST | `/api/devices` | Daftar / tambah device |
| GET / PUT / DELETE | `/api/devices/:id` | Detail / ubah / hapus |
| GET / PUT | `/api/devices/:id/playlist` | Baca / ganti playlist `{items:[{content_id, duration_sec}]}` |
| POST | `/api/devices/:id/push` | Push content `{content_id}` ke device (409 jika offline) |
| GET / POST | `/api/contents` | Daftar / tambah (teks atau URL) |
| POST | `/api/contents/upload` | Upload file gambar/video (`multipart`, field `file`, maks. 50 MB) |
| GET / PUT / DELETE | `/api/contents/:id` | Detail / ubah / hapus |
| GET | `/api/public/devices/:id` | Info device + playlist (tanpa login, untuk device client) |

### Protokol WebSocket (`/ws`)

| Koneksi | Server → client |
|---|---|
| `?role=dashboard&token=<JWT>` | `snapshot`, `device_status {id,status,last_seen}`, `devices_changed` |
| `?role=device&deviceId=<id>` | `registered`, `playlist_updated`, `push_content {content}` |

## Keputusan desain

- **Presence berbasis koneksi.** Device `online` selama minimal satu socket-nya hidup, dan `offline` saat semua socket tertutup. Satu device boleh punya beberapa koneksi (mis. dua tab).
- **Heartbeat.** Server mengirim ping tiap 15 detik. Socket yang tidak membalas (jaringan putus tanpa close) dibuang, sehingga device tidak nyangkut di status online.
- **Reset saat start.** Saat backend hidup, semua status `online` yang tersisa direset ke `offline`.
- **Reconnect di sisi klien.** Dashboard dan device client menyambung ulang dengan exponential backoff (maks. 15 detik) dan menyinkronkan data setelah tersambung.
- **Cache offline.** Device client menyimpan playlist terakhir di `localStorage`, sehingga tayangan berlanjut saat backend tidak terjangkau.
- **Push sementara.** Content hasil push tampil 30 detik (video sampai selesai), lalu playlist dilanjutkan.
- **Keamanan.** Secret key hanya di backend (`.env`, tidak di-commit). RLS aktif tanpa policy publik. Origin `null` (halaman `file://` milik Electron) diizinkan oleh CORS, aman karena autentikasi memakai header Bearer, bukan cookie.

## Catatan

- Content bertipe **URL** ditampilkan lewat iframe; situs yang melarang di-embed (mis. Google, YouTube) tidak akan tampil.
- Video diputar tanpa suara agar autoplay diizinkan browser.
- Installer Electron tidak ditandatangani (*unsigned*), jadi Windows SmartScreen dapat menampilkan peringatan.
