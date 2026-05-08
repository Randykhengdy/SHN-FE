# Summary of New Features: Report Rincian Keuangan dan Laba Operasional

Dokumen ini merangkum pengembangan terbaru terkait Modul Laporan Keuangan (Finance). Dua API baru telah ditambahkan ke dalam sistem backend melalui `ReportKasController` untuk mendukung penampilan data keuangan sesuai format laporan yang diminta (menu Finance → item ke-3 dan ke-4).

---

## 1. Controller & Route Baru

- **Controller:** `app/Http/Controllers/Report/ReportKasController.php`
- **Route Namespace:** `/api/report-kas`

Kedua endpoint ini wajib menggunakan token autentikasi (Auth Bearer Token) dan Role Middleware (`checkrole`).

---

## 2. Report 1: Rincian Keuangan dan Laba Operasional / Tanggal

Laporan ini menampilkan rincian aktivitas kas masuk, kas keluar, saldo berjalan, penjualan, hingga laba operasional yang dipilah **per hari (tanggal)** dalam suatu rentang waktu.

- **Endpoint:** `GET /api/report-kas/rincian-keuangan`
- **Tujuan:** Menampilkan detail pergerakan kas dan invoice harian berurut berdasarkan tanggal.
- **Data Logic:**
  - **Saldo Awal:** Record terakhir `trx_kas.saldo` sebelum `start_date` (order by tanggal desc, id desc).
  - **Kas Masuk/Keluar:** `SUM(kas_masuk)` dan `SUM(kas_keluar)` dari `trx_kas` per tanggal.
  - **Saldo Kas:** `trx_kas.saldo` dari record terakhir (MAX id) per tanggal — saldo terakumulasi.
  - **Penjualan:** `SUM(out_invoicepod.grand_total)` per `DATE(tanggal_cetak_invoice)`.
  - **Lain-lain:** `SUM(out_invoicepod.biaya_lain)` per `DATE(tanggal_cetak_invoice)`.
  - **HPP:** Placeholder `0` (belum diimplementasi per hari).
  - **Pemakaian Kas:** `SUM(ref_jenis_transaksi_kas.jumlah)` per tanggal.
  - **Laba Operasional:** `penjualan - hpp - lain_lain - pemakaian_kas`.
  - *Catatan:* Hari tanpa ada aktivitas sama sekali akan di-*skip* agar report ringkas.

---

## 3. Report 2: Rekap Laba Operasional Keuangan

Laporan ini mengakomodasi format cetakan rekap global selama 1 bulan (atau range tanggal tertentu) yang memperhitungkan Harga Pokok Pembelian (HPP) dari *Work Order Actual*.

- **Endpoint:** `GET /api/report-kas/rekap-laba-operasional`
- **Tujuan:** Menampilkan angka kumulatif/total laba operasional dan mutasi saldo kas secara global selama range waktu tertentu.
- **Data Logic Utama:**
  - **Penjualan:** `SUM(total_harga_so)` dari `trx_sales_order` khusus SO berstatus `complete` dalam rentang `tanggal_so`.
  - **HPP (Harga Pokok Pembelian):**
    `SUM(ref_item_barang.harga_modal × trx_work_order_actual_item.berat_actual)`
    *Chain Relasi:* `WO Actual Item` → `WO Actual` → `WO Planning` → `Sales Order (complete, tanggal_so dalam rentang)` → `Item Barang (plat_dasar_id)`.
  - **Pemakaian Kas / Biaya:** `SUM(ref_jenis_transaksi_kas.jumlah)` dalam rentang tanggal.
  - **Laba Operasional:** `Penjualan - HPP - Pemakaian Kas`.
  - **Saldo Awal:** Record terakhir `trx_kas.saldo` sebelum `start_date`.
  - **Saldo Akhir:** Record terakhir `trx_kas.saldo` dengan `tanggal <= end_date`.
  - *Catatan:* Elemen penyesuaian seperti Discount, Uang Muka, dan Biaya Lain-lain sementara di-set `0` (*ignored*) sesuai requirement.

---

## 4. Referensi Lengkap (Dokumentasi API)
Untuk dokumentasi request/response body lengkap dari masing-masing API (termasuk contoh output datanya), kamu bisa melihatnya langsung di file:

👉 `api_docs_report_kas.md`
