# API Documentation: Report Rincian Keuangan dan Laba Operasional

Dokumentasi endpoint untuk laporan keuangan harian dan rekap bulanan (Keuangan dan Laba Operasional).

## Base Information
- **Method:** `GET`
- **Auth:** `Bearer Token`
- **Base Route:** `/api/report-kas`

---

## 1. Report Rincian Keuangan dan Laba Operasional / Tanggal

Menampilkan laporan keuangan harian secara beruntun di dalam rentang tanggal yang dipilih. (Sesuai menu Finance → "Rincian Keuangan dan Laba Operasional / Tanggal").

- **Endpoint:** `/api/report-kas/rincian-keuangan`
- **Method:** `GET`

### Query Parameters

| Parameter    | Type   | Required | Keterangan                        |
|--------------|--------|----------|-----------------------------------|
| `start_date` | string | ✅ Yes   | Tanggal awal (format: YYYY-MM-DD) |
| `end_date`   | string | ✅ Yes   | Tanggal akhir (format: YYYY-MM-DD)|

### Sumber Data Logic

| Field               | Sumber                                                                                          |
|---------------------|-------------------------------------------------------------------------------------------------|
| `saldo_awal`        | Record terakhir `trx_kas.saldo` sebelum `start_date` (order by tanggal desc, id desc)          |
| `kas_masuk`         | `SUM(trx_kas.kas_masuk)` per tanggal                                                            |
| `kas_keluar`        | `SUM(trx_kas.kas_keluar)` per tanggal                                                           |
| `saldo_kas`         | `trx_kas.saldo` dari record terakhir (MAX id) per tanggal                                       |
| `penjualan`         | `SUM(out_invoicepod.grand_total)` per `DATE(tanggal_cetak_invoice)`                             |
| `lain_lain`         | `SUM(out_invoicepod.biaya_lain)` per `DATE(tanggal_cetak_invoice)`                              |
| `hpp`               | Placeholder `0` (belum diimplementasi per hari)                                                 |
| `pemakaian_kas`     | `SUM(ref_jenis_transaksi_kas.jumlah)` per tanggal                                               |
| `laba_operasional`  | `penjualan - hpp - lain_lain - pemakaian_kas`                                                   |

*Catatan: Hari tanpa aktivitas (kas masuk, kas keluar, penjualan, dan pemakaian kas semua 0) akan di-skip agar report ringkas.*

### Example Request
```
GET /api/report-kas/rincian-keuangan?start_date=2026-03-01&end_date=2026-03-06
```

### Example Response
```json
{
    "success": true,
    "message": "Report Rincian Keuangan berhasil diambil",
    "data": {
        "periode": {
            "start_date": "2026-03-01",
            "end_date": "2026-03-06"
        },
        "saldo_awal": {
            "tanggal": "2026-02-28",
            "saldo": 14521416964.00
        },
        "rows": [
            {
                "tanggal": "2026-03-02",
                "kas_masuk": 33257000.00,
                "kas_keluar": 54405039.00,
                "saldo_kas": 14500268925.00,
                "penjualan": 117060700.00,
                "hpp": 0.00,
                "lain_lain": 0.00,
                "pemakaian_kas": 4714500.00,
                "laba_operasional": 112346200.00
            }
        ],
        "total": {
            "kas_masuk": 33257000.00,
            "kas_keluar": 54405039.00,
            "saldo_kas_akhir": 14500268925.00,
            "penjualan": 117060700.00,
            "hpp": 0.00,
            "lain_lain": 0.00,
            "pemakaian_kas": 4714500.00,
            "laba_operasional": 112346200.00
        }
    }
}
```

---

## 2. Report Rekap Laba Operasional Keuangan

Menampilkan total rekapitulasi laba operasional dan mutasi saldo kas secara global dalam satu rentang waktu. (Sesuai menu Finance → "Rekap Laba Operasional Keuangan").

- **Endpoint:** `/api/report-kas/rekap-laba-operasional`
- **Method:** `GET`

### Query Parameters

| Parameter    | Type   | Required | Keterangan                        |
|--------------|--------|----------|-----------------------------------|
| `start_date` | string | ✅ Yes   | Tanggal awal (format: YYYY-MM-DD) |
| `end_date`   | string | ✅ Yes   | Tanggal akhir (format: YYYY-MM-DD)|

### Sumber Data Logic

**Rugi Laba Operasional:**

| Field                    | Sumber / Kalkulasi                                                                                          |
|--------------------------|-------------------------------------------------------------------------------------------------------------|
| `total_penjualan`        | `SUM(trx_sales_order.total_harga_so)` WHERE `process_status = 'complete'` AND `tanggal_so` dalam rentang   |
| `harga_pokok_pembelian`  | `SUM(ref_item_barang.harga_modal × trx_work_order_actual_item.berat_actual)` via chain WO (lihat di bawah) |
| `discount_pembelian`     | `0` (ignored, sesuai requirement)                                                                           |
| `biaya_lain_pembelian`   | `0` (ignored, sesuai requirement)                                                                           |
| `discount_penjualan`     | `0` (ignored, sesuai requirement)                                                                           |
| `biaya_lain_penjualan`   | `0` (ignored, sesuai requirement)                                                                           |
| `pemakaian_kas_biaya`    | `SUM(ref_jenis_transaksi_kas.jumlah)` dalam rentang tanggal                                                 |
| `laba_operasional`       | `total_penjualan - harga_pokok_pembelian - pemakaian_kas_biaya`                                             |

**Chain Relasi HPP:**
`trx_work_order_actual_item` → `trx_work_order_actual` → `trx_work_order_planning` → `trx_sales_order` (status `complete`, `tanggal_so` dalam rentang) → `ref_item_barang` (via `plat_dasar_id`)

**Saldo Kas Keuangan:**

| Field                          | Sumber / Kalkulasi                                                                    |
|--------------------------------|---------------------------------------------------------------------------------------|
| `saldo_awal`                   | Record terakhir `trx_kas.saldo` sebelum `start_date` (order by tanggal desc, id desc)|
| `uang_muka_penjualan`          | `0` (dummy, belum diimplementasi)                                                     |
| `pembayaran_piutang_penjualan` | `0` (dummy, belum diimplementasi)                                                     |
| `kembali_uang_muka_penjualan`  | `0` (dummy, belum diimplementasi)                                                     |
| `uang_muka_pembelian`          | `0` (dummy, belum diimplementasi)                                                     |
| `pembayaran_hutang_pembelian`  | `0` (dummy, belum diimplementasi)                                                     |
| `adjustment_kas`               | `0` (dummy, belum diimplementasi)                                                     |
| `pemakaian_kas_biaya`          | Sama dengan nilai di `rugi_laba_operasional`                                          |
| `saldo_akhir_kas`              | Record terakhir `trx_kas.saldo` dengan `tanggal <= end_date` (order by tanggal desc)  |

### Example Request
```
GET /api/report-kas/rekap-laba-operasional?start_date=2026-03-01&end_date=2026-03-31
```

### Example Response
```json
{
    "success": true,
    "message": "Report Rekap Laba Operasional berhasil diambil",
    "data": {
        "periode": {
            "start_date": "2026-03-01",
            "end_date": "2026-03-31"
        },
        "rugi_laba_operasional": {
            "total_penjualan": 336029200.00,
            "harga_pokok_pembelian": 251940708.00,
            "discount_pembelian": 0,
            "biaya_lain_pembelian": 0,
            "discount_penjualan": 0,
            "biaya_lain_penjualan": 0,
            "pemakaian_kas_biaya": 5995500.00,
            "laba_operasional": 78092992.00
        },
        "saldo_kas_keuangan": {
            "tanggal_saldo_awal": "2026-03-01",
            "saldo_awal": 14521416964.00,
            "uang_muka_penjualan": 0,
            "pembayaran_piutang_penjualan": 0,
            "kembali_uang_muka_penjualan": 0,
            "uang_muka_pembelian": 0,
            "pembayaran_hutang_pembelian": 0,
            "adjustment_kas": 0,
            "pemakaian_kas_biaya": 5995500.00,
            "saldo_akhir_kas": 14627937925.00
        }
    }
}
```
