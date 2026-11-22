# Anonymous Employee Suggestion Box (LAN / Localhost Demo)

Prototipe aplikasi kotak saran karyawan berbasis jaringan lokal (LAN/localhost) dengan prinsip **Privasi & Anonimitas Mutlak**, dilengkapi aplikasi desktop untuk karyawan dan web console untuk HR.

---

## 🏛️ Arsitektur & Teknologi

1. **Backend:**
   - Node.js + Express
   - SQLite (`node:sqlite` built-in zero-config, database file otomatis dibuat di `server/suggestions.db`)
   - Socket.io (Real-time updates dua arah tanpa perlu refresh)
   - Zero-Logging Middleware: IP address, hostname, dan OS telemetry tidak disimpan demi privasi mutlak karyawan.

2. **Frontend:**
   - React + Vite + Tailwind CSS v4 + Lucide Icons
   - **Sisi Karyawan:** Dijalankan via **Electron** sebagai aplikasi desktop mandiri (`/`).
   - **Sisi HR:** Dibuka lewat browser di `http://localhost:3000/hr` untuk demo berdampingan (*split-screen*).

3. **Sistem Tracking Tanpa Login:**
   - Menghasilkan kode tiket unik (contoh: `ANON-7842`).
   - Karyawan dapat memantau status penanganan (*Submitted / In Review / Resolved / Rejected*) dan membaca tanggapan resmi tim HR.
   - Dilengkapi tab **Riwayat Lokal** (tersimpan di `localStorage` desktop) untuk kemudahan demo.

---

## 🚀 Cara Menjalankan Aplikasi

### Opsi 1: Menggunakan File Batch (Paling Praktis)
Cukup klik dua kali file:
```
g:\anonymous-suggestion-box\run-demo.bat
```

### Opsi 2: Lewat Terminal PowerShell / CMD
Buka terminal di folder proyek:
```bash
cd g:\anonymous-suggestion-box
npm run demo
```
*Perintah ini secara otomatis akan menjalankan Server Express, Vite Web Server, dan langsung membuka jendela Aplikasi Desktop Electron.*

---

## 🖥️ Skenario Pengujian & Demo Tugas (Split-Screen)

1. **Jalankan Aplikasi:** Jalankan perintah `npm run demo`.
2. **Atur Tampilan Layar (Split Screen):**
   - **Sisi Kiri:** Jendela aplikasi desktop Electron **"Kotak Saran Karyawan"**.
   - **Sisi Kanan:** Buka browser Google Chrome / Edge di alamat:
     ```
     http://localhost:3000/hr
     ```
3. **Uji Kirim Saran Anonim (Karyawan):**
   - Di aplikasi desktop, pilih kategori (misal: *Fasilitas & Ruang Kerja*), tingkat urgensi (*Penting & Mendesak*), ketik judul dan detail masukan.
   - Klik **Kirim Saran Secara Anonim**.
   - Salin kode tiket yang muncul (contoh: `ANON-4892`).
4. **Lihat Real-time Update di HR Dashboard (Browser):**
   - Tanpa me-refresh browser HR, saran baru akan langsung muncul seketika di kolom daftar saran dan counter kartu statistik bertambah secara otomatis via Socket.io.
5. **HR Memberi Tanggapan & Mengubah Status:**
   - Di browser HR, klik saran tersebut.
   - Ubah status menjadi **Sedang Ditinjau (In Review)** atau **Selesai (Resolved)**.
   - Ketikkan balasan resmi di kotak respon, lalu klik **Kirim Tanggapan**.
6. **Karyawan Melacak Tiket:**
   - Di aplikasi desktop, buka tab **Lacak Tiket** lalu masukkan kode tiket.
   - Status dan balasan dari HR akan langsung tampil dan ter-update secara *real-time*.

