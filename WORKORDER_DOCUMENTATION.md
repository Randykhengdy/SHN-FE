# Dokumentasi Sistem WorkOrder (WO)

## Overview
Sistem WorkOrder adalah sistem perencanaan dan pelaksanaan pekerjaan yang terintegrasi dengan Sales Order. Sistem ini mengelola perencanaan produksi barang berdasarkan pesanan pelanggan dengan detail spesifikasi teknis dan penugasan pelaksana.

## Entity Utama

### 1. WorkOrderPlanning (Perencanaan WO)
**Tabel:** `trx_work_order_planning`

**Fungsi:** Entity utama yang menyimpan header perencanaan WorkOrder

**Field Utama:**
- `nomor_wo`: Nomor unik WorkOrder
- `tanggal_wo`: Tanggal pembuatan WorkOrder
- `id_sales_order`: Referensi ke SalesOrder
- `id_pelanggan`: Referensi ke Pelanggan
- `id_gudang`: Referensi ke Gudang
- `id_pelaksana`: Referensi ke Pelaksana utama
- `prioritas`: Level prioritas pekerjaan
- `status`: Status WorkOrder

**Relasi:**
- `hasMany` → `WorkOrderPlanningItem` (Detail item WO)
- `belongsTo` → `SalesOrder` (Pesanan yang diproses)
- `belongsTo` → `Pelanggan` (Pelanggan pemesan)
- `belongsTo` → `Gudang` (Lokasi produksi)
- `belongsTo` → `Pelaksana` (Pelaksana utama)

### 2. WorkOrderPlanningItem (Detail Item WO)
**Tabel:** `trx_work_order_planning_item`

**Fungsi:** Menyimpan detail spesifikasi teknis setiap item dalam WorkOrder

**Field Utama:**
- `work_order_planning_id`: Referensi ke WorkOrderPlanning
- `panjang`, `lebar`, `tebal`: Dimensi barang (decimal:2)
- `qty`: Jumlah barang yang diproduksi
- `berat`: Berat per item
- `plat_dasar_id`: Referensi ke ItemBarang (plat dasar)
- `jenis_barang_id`: Referensi ke JenisBarang
- `bentuk_barang_id`: Referensi ke BentukBarang
- `grade_barang_id`: Referensi ke GradeBarang
- `catatan`: Catatan tambahan
- `is_assigned`: Status penugasan (boolean)

**Relasi:**
- `belongsTo` → `WorkOrderPlanning` (Header WO)
- `belongsTo` → `JenisBarang` (Kategori barang)
- `belongsTo` → `BentukBarang` (Bentuk fisik barang)
- `belongsTo` → `GradeBarang` (Kualitas/grade barang)
- `belongsTo` → `ItemBarang` (Plat dasar)
- `hasMany` → `WorkOrderPlanningPelaksana` (Detail pelaksana)
- `hasMany` → `SaranPlatShaftDasar` (Saran plat dasar)

### 3. WorkOrderPlanningPelaksana (Detail Pelaksana)
**Tabel:** `trx_work_order_planning_pelaksana`

**Fungsi:** Mengelola detail penugasan dan jadwal pelaksana untuk setiap item WO

**Field Utama:**
- `work_order_planning_item_id`: Referensi ke WorkOrderPlanningItem
- `pelaksana_id`: Referensi ke Pelaksana
- `qty`: Jumlah yang ditugaskan
- `weight`: Berat yang ditugaskan
- `tanggal`: Tanggal pelaksanaan
- `jam_mulai`, `jam_selesai`: Waktu pelaksanaan
- `catatan`: Catatan pelaksanaan

**Relasi:**
- `belongsTo` → `WorkOrderPlanningItem` (Item WO)
- `belongsTo` → `Pelaksana` (Orang yang ditugaskan)

## Entity Master Data Terkait

### 1. SalesOrder (Pesanan Penjualan)
**Tabel:** `trx_sales_order`

**Fungsi:** Pesanan dari pelanggan yang menjadi trigger pembuatan WorkOrder

**Relasi:**
- `hasMany` → `SalesOrderItem` (Detail item pesanan)
- `belongsTo` → `Pelanggan` (Pelanggan pemesan)
- `belongsTo` → `Gudang` (Lokasi pengiriman)

### 2. Pelanggan
**Tabel:** `ref_pelanggan`

**Fungsi:** Data pelanggan yang memesan barang

### 3. Gudang
**Tabel:** `ref_gudang`

**Fungsi:** Lokasi produksi dan penyimpanan barang

### 4. Pelaksana
**Tabel:** `ref_pelaksana`

**Fungsi:** Orang yang ditugaskan untuk melaksanakan pekerjaan

### 5. JenisBarang
**Tabel:** `ref_jenis_barang`

**Fungsi:** Kategori/jenis barang yang diproduksi

### 6. BentukBarang
**Tabel:** `ref_bentuk_barang`

**Fungsi:** Bentuk fisik barang (contoh: pipa, plat, dll)

### 7. GradeBarang
**Tabel:** `ref_grade_barang`

**Fungsi:** Kualitas/grade barang (contoh: A, B, C)

### 8. ItemBarang
**Tabel:** `ref_item_barang`

**Fungsi:** Data barang/material yang digunakan sebagai plat dasar

## Alur Kerja (Workflow)

### 1. Pembuatan WorkOrder
1. **SalesOrder** dibuat berdasarkan pesanan pelanggan
2. **WorkOrderPlanning** dibuat dengan referensi ke SalesOrder
3. **WorkOrderPlanningItem** dibuat untuk setiap item yang diproduksi
4. Detail spesifikasi teknis (dimensi, jenis, bentuk, grade) diisi

### 2. Penugasan Pelaksana
1. **WorkOrderPlanningPelaksana** dibuat untuk setiap item
2. Pelaksana ditugaskan dengan jadwal dan kuantitas spesifik
3. Status `is_assigned` diupdate menjadi `true`

### 3. Pelaksanaan Produksi
1. Pelaksana mengikuti jadwal yang telah ditentukan
2. Progress dan catatan diupdate di WorkOrderPlanningPelaksana
3. Status WorkOrder diupdate sesuai progress

## Diagram Relasi

```
SalesOrder (1) ←→ (1) WorkOrderPlanning (1) ←→ (N) WorkOrderPlanningItem (1) ←→ (N) WorkOrderPlanningPelaksana
     ↓                    ↓                           ↓                              ↓
Pelanggan           Gudang, Pelaksana         JenisBarang, BentukBarang,      Pelaksana
     ↓                    ↓                           GradeBarang, ItemBarang
Gudang              SalesOrderItem
```

## Fitur Utama

1. **Perencanaan Produksi**: Membuat rencana produksi berdasarkan pesanan
2. **Spesifikasi Teknis**: Detail dimensi, jenis, bentuk, dan grade barang
3. **Penjadwalan**: Penugasan pelaksana dengan jadwal spesifik
4. **Tracking Progress**: Monitoring status dan progress pekerjaan
5. **Integrasi SO**: Terhubung langsung dengan SalesOrder

## Konvensi Penamaan

- **Tabel Transaction**: Prefix `trx_` (contoh: `trx_work_order_planning`)
- **Tabel Reference**: Prefix `ref_` (contoh: `ref_pelanggan`)
- **Nama Tabel**: Singular (tidak ada trailing 's') sesuai preferensi bahasa Indonesia
- **Foreign Key**: Format `id_[nama_entity]` atau `[nama_entity]_id`

## Status dan Prioritas

### Status WorkOrder
- `draft`: Draft perencanaan
- `active`: Sedang aktif/diproses
- `completed`: Selesai
- `cancelled`: Dibatalkan

### Prioritas
- `low`: Rendah
- `medium`: Sedang
- `high`: Tinggi
- `urgent`: Sangat mendesak

## Daftar API WorkOrderPlanning

Semua endpoint yang menggunakan `WorkOrderPlanningController`:

- `GET /work-order-planning`  
  Handler: `index`  
  Fungsi: List WO Planning (header) dengan filter (nomor_wo, nomor_so, pelanggan, gudang, status, tanggal, jumlah item).

- `GET /work-order-planning/report`  
  Handler: `report`  
  Fungsi: Report header WO Planning untuk kebutuhan laporan.

- `POST /work-order-planning`  
  Handler: `store`  
  Fungsi: Membuat WO Planning baru beserta detail item, pelaksana, dan saran plat dasar (di dalam `items[*].saran_plat_dasar`).  
  Catatan: Menerima `items[*].item_barang_group_id` untuk mengikat item WO ke `ItemBarangGroup`.

- `POST /work-order-planning/with-saran-plat`  
  Handler: `storeWithSaranPlatDasar`  
  Fungsi: Simpan canvas (`canvas_data` / `canvas_image`) ke `ItemBarang`, lalu lanjut membuat WO Planning dengan payload yang sama seperti `store` (termasuk `items[*].item_barang_group_id`).

- `GET /work-order-planning/{id}`  
  Handler: `show`  
  Fungsi: Detail lengkap 1 WO Planning (header, items, pelaksana, saran plat dasar, plat_dasar) dan optional auto-create WorkOrderActual.

- `GET /work-order-planning/item/{id}`  
  Handler: `showItem`  
  Fungsi: Detail 1 WorkOrderPlanningItem saja.

- `POST /work-order-planning/validate-so-coverage`  
  Handler: `validateSoCoverage`  
  Fungsi: Validasi apakah total `qty_planning` dari semua WO sudah menutup qty SalesOrder.

- `PUT /work-order-planning/item/{id}`  
  Handler: `updateItem`  
  Fungsi: Update 1 item WO (dimensi, qty, pelaksana, saran plat dasar, plat_dasar_id).  
  Catatan: Bisa mengubah `item_barang_group_id` item WO.

- `PUT /work-order-planning/{id}`  
  Handler: `update`  
  Fungsi: Update header WO Planning (tanggal, prioritas, catatan, dsb).

- `PUT /work-order-planning/{id}/status`  
  Handler: `updateStatus`  
  Fungsi: Update status WO Planning dan update status SalesOrder terkait.

- `DELETE /work-order-planning/{id}`  
  Handler: `destroy`  
  Fungsi: Soft delete WO Planning dan rollback quantity untuk item `utuh`.

- `POST /work-order-planning/{id}/restore`  
  Handler: `restore`  
  Fungsi: Restore WO Planning yang terhapus (soft delete).

- `DELETE /work-order-planning/{id}/force`  
  Handler: `forceDelete`  
  Fungsi: Hard delete WO Planning beserta relasi terkait.

- `GET /work-order-planning/item/{id}/saran-plat-dasar`  
  Handler: `getSaranPlatDasarByItem`  
  Fungsi: Ambil semua saran plat/shaft dasar untuk 1 item WO.

- `GET /work-order-planning/saran-plat/{saranId}/download`  
  Handler: `downloadCanvasFile`  
  Fungsi: Download file canvas dari 1 saran plat dasar.

- `GET /work-order-planning/saran-plat/{saranId}/canvas`  
  Handler: `getCanvasFile`  
  Fungsi: Ambil isi file canvas (JSON) dari 1 saran plat dasar.

- `GET /work-order-planning/item-barang/{itemBarangId}/canvas-file`  
  Handler: `getCanvasFileByItemBarang`  
  Fungsi: Ambil canvas berdasarkan `item_barang_id` dari master `ItemBarang`.

- `GET /work-order-planning/item-barang/{itemBarangId}/canvas`  
  Handler: `getCanvasByItemId`  
  Fungsi: Alias lain untuk ambil canvas dari `item_barang_id`.

- `GET /work-order-planning/item-barang/{itemBarangId}/canvas-image`  
  Handler: `getCanvasImageByItemId`  
  Fungsi: Ambil canvas image (JPG) dari `ItemBarang` dalam bentuk base64.

- `GET /work-order-planning/{id}/print-spk`  
  Handler: `printSpkWorkOrder`  
  Fungsi: Data untuk cetak SPK Work Order (jenis, bentuk, grade, ukuran, qty, berat, pelaksana, plat_dasar).

- `GET /work-order-planning/{id}/images`  
  Handler: `getWorkOrderImages`  
  Fungsi: Kumpulkan semua canvas image dari saran plat dasar di dalam 1 Work Order.
