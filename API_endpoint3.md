# API Endpoint 3 – Work Order + Saran Plat Dasar (Combined)

## 1. Tujuan Endpoint

- Menggabungkan **penyimpanan canvas saran plat dasar** (ke `ref_item_barang`) dan **pembuatan Work Order Planning** dalam **1 API call**.
- Mengurangi risiko ketidakkonsistenan antara layout canvas di FE dan data WO di BE.
- Mempermudah FE: cukup sekali klik “Save / Create WO” setelah user selesai layout plat dasar.

Endpoint ini cocok dipakai ketika:
- User sudah selesai menggambar layout plat dasar di canvas.
- Sekaligus ingin menyimpan WO Planning (header + items + saran plat per item).

---

## 2. Endpoint & Auth

- **Method**: `POST`
- **URL**: `/api/work-order-planning/with-saran-plat-dasar`
- **Middleware**: `checkrole` (JWT wajib)
- **Header Wajib**:
  - `Authorization: Bearer <jwt_token>`
  - `Content-Type: application/json`

---

## 3. Request Body

Request body = gabungan dari:
- Field canvas global (untuk simpan ke `ref_item_barang`), dan
- Field create WO Planning (sama seperti `POST /api/work-order-planning`).

### 3.1. Field Canvas (Global)

Dipakai untuk menyimpan layout canvas ke satu `item_barang_id` di master `ref_item_barang`.

- `item_barang_id` (integer, optional tapi **required** jika kirim canvas)
  - ID dari item barang plat dasar yang sedang di-layout.
- `canvas_data` (string JSON, optional)
  - String JSON full layout canvas (akan disimpan ke file `canvas/{item_barang_id}/canvas.json`).
  - Dari sini sistem akan hitung dan update `sisa_luas` di `ref_item_barang`.
- `canvas_image` (string base64, optional)
  - Base64 JPG/PNG canvas, disimpan sebagai file JPG `canvas/{item_barang_id}/canvas_image.jpg`.

> Catatan:
> - Jika `item_barang_id` kosong → bagian canvas **di-skip** (tidak error, langsung lanjut ke create WO).
> - Jika `item_barang_id` terisi tapi `canvas_data` dan `canvas_image` kosong → bagian canvas juga di-skip.

### 3.2. Field Work Order Planning (Header)

Sama dengan endpoint:
- `POST /api/work-order-planning`
- Detail lengkap ada di `API_ENDPOINTS.md` (bagian “Create Work Order Planning”).

Field utama:

- `wo_unique_id` (string, required secara konsep, **diabaikan** dan akan digenerate ulang di BE)
- `tanggal_wo` (date, required) – format `YYYY-MM-DD`
- `id_sales_order` (int, required)
- `id_pelanggan` (int, required)
- `id_gudang` (int, required)
- `prioritas` (string, required) – misal: `LOW`, `MEDIUM`, `HIGH`
- `status` (string, required) – misal: `draft`, `On Progress`, dll (mengikuti existing enum di sistem)
- `typeWO` (string, required, enum: `normal`, `pending`, `cancel`)
- `handover_method` (string, required, enum: `pickup`, `delivery`)
- `estimate_done` (date, optional)

### 3.3. Field Items (Detail)

- `items` (array, required)
  - Setiap item mewakili 1 baris WO detail.

Field per item (disederhanakan):

- `wo_item_unique_id` (string, required, unique per item)
- `sales_order_item_id` (int, optional, harus ada di `trx_sales_order_item`)
- `qty` (numeric, optional, default 0)
- `panjang` (numeric, optional, default 0)
- `lebar` (numeric, optional, default 0)
- `tebal` (numeric, optional, default 0)
- `berat` (numeric, optional, default 0)
- `jenis_barang_id` (int, optional)
- `bentuk_barang_id` (int, optional)
- `grade_barang_id` (int, optional)
- `satuan` (string, optional, default `PCS`)
- `diskon` (numeric, optional, default 0)
- `catatan` (string, optional)
- `jenis_potongan` (string, optional, enum: `utuh`, `potongan`)

#### 3.3.1. Pelaksana per Item (Optional)

- `pelaksana` (array, optional)
  - `pelaksana.*.pelaksana_id` (int, required)
  - `pelaksana.*.qty` (int, optional)
  - `pelaksana.*.weight` (numeric, optional)
  - `pelaksana.*.tanggal` (date, optional)
  - `pelaksana.*.jam_mulai` (string `HH:MM`, optional)
  - `pelaksana.*.jam_selesai` (string `HH:MM`, optional)
  - `pelaksana.*.catatan` (string, optional)

#### 3.3.2. Saran Plat Dasar per Item (Optional)

Mapping saran plat dasar dari master ke item WO.

- `saran_plat_dasar` (array, optional)
  - `saran_plat_dasar.*.item_barang_id` (int, required, exists `ref_item_barang.id`)
  - `saran_plat_dasar.*.quantity` (numeric, optional)
  - `saran_plat_dasar.*.canvas_image` (string base64, optional)
  - `saran_plat_dasar.*.canvas_layout` (string JSON, optional)

Behavior:
- Untuk setiap entry `saran_plat_dasar`:
  - Jika `canvas_image` dikirim → disimpan ke `canvas_woitem/{wo_item_id}_{item_barang_id}/canvas_image.jpg`.
  - Jika `canvas_layout` dikirim → dipakai untuk hitung `sisa_luas` dan mengupdate `ref_item_barang.sisa_luas`.
  - Record akan dibuat di `trx_saran_plat_shaft_dasar` dengan link ke `wo_planning_item_id`.

---

## 4. Contoh Request Lengkap

```http
POST /api/work-order-planning/with-saran-plat-dasar
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

```json
{
  "item_barang_id": 11,
  "canvas_data": "{\"baseContainer\":{\"width\":600,\"height\":300},\"boxes\":[{\"width\":100,\"height\":50}],\"metadata\":{\"containerArea\":180000,\"totalArea\":5000}}",
  "canvas_image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",

  "wo_unique_id": "WO-DUMMY-FRONTEND",
  "tanggal_wo": "2025-01-16",
  "id_sales_order": 1,
  "id_pelanggan": 1,
  "id_gudang": 1,
  "prioritas": "HIGH",
  "status": "draft",
  "typeWO": "normal",
  "handover_method": "pickup",
  "estimate_done": "2025-01-20",

  "items": [
    {
      "wo_item_unique_id": "WOI-20250116-001",
      "sales_order_item_id": 10,
      "qty": 5,
      "panjang": 100,
      "lebar": 50,
      "tebal": 2,
      "berat": 12.5,
      "jenis_barang_id": 1,
      "bentuk_barang_id": 1,
      "grade_barang_id": 1,
      "satuan": "PCS",
      "diskon": 0,
      "catatan": "Item pertama",
      "jenis_potongan": "utuh",

      "pelaksana": [
        {
          "pelaksana_id": 3,
          "qty": 5,
          "weight": 12.5,
          "tanggal": "2025-01-17",
          "jam_mulai": "08:00",
          "jam_selesai": "12:00",
          "catatan": "Shift pagi"
        }
      ],

      "saran_plat_dasar": [
        {
          "item_barang_id": 11,
          "quantity": 2.5,
          "canvas_image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
          "canvas_layout": "{\"baseContainer\":{\"width\":600,\"height\":300},\"boxes\":[{\"width\":100,\"height\":50}],\"metadata\":{\"containerArea\":180000,\"totalArea\":5000}}"
        }
      ]
    }
  ]
}
```

---

## 5. Response

### 5.1. Success Response

```json
{
  "success": true,
  "message": "Work Order Planning berhasil ditambahkan",
  "data": {
    "id": 123,
    "wo_unique_id": "WO-65a7f1c8f1c92",
    "nomor_wo": "WO-20250116-0001",
    "tanggal_wo": "2025-01-16",
    "prioritas": "HIGH",
    "status": "draft",
    "handover_method": "pickup",
    "estimate_done": "2025-01-20",
    "id_sales_order": 1,
    "id_pelanggan": 1,
    "id_gudang": 1,
    "sales_order": {
      "id": 1,
      "nomor_so": "SO-20250101-001",
      "tanggal_so": "2025-01-01",
      "tanggal_pengiriman": "2025-01-18",
      "syarat_pembayaran": "COD",
      "handover_method": "pickup"
    },
    "work_order_planning_items": [
      {
        "id": 456,
        "wo_item_unique_id": "WOI-20250116-001",
        "qty": 5,
        "panjang": 100,
        "lebar": 50,
        "tebal": 2,
        "berat": 12.5,
        "jenis_barang_id": 1,
        "bentuk_barang_id": 1,
        "grade_barang_id": 1,
        "jenis_potongan": "utuh",
        "satuan": "PCS",
        "diskon": 0,
        "catatan": "Item pertama",
        "pelaksana": [
          {
            "id": 1,
            "qty": 5,
            "weight": 12.5,
            "tanggal": "2025-01-17",
            "jam_mulai": "08:00",
            "jam_selesai": "12:00",
            "catatan": "Shift pagi",
            "pelaksana_info": {
              "id": 3,
              "nama_pelaksana": "Operator A"
            }
          }
        ],
        "saran_plat_dasar": [
          {
            "id": 1,
            "is_selected": null,
            "quantity": 2.5,
            "item_barang": {
              "id": 11,
              "nama_item_barang": "Plat Dasar AL-001"
            }
          }
        ]
      }
    ]
  }
}
```

> Catatan:
> - Struktur `data` mengikuti response `POST /api/work-order-planning` + relasi `workOrderPlanningItems.hasManyPelaksana` dan `hasManySaranPlatShaftDasar.itemBarang`.

### 5.2. Error Response – Validasi

```json
{
  "success": false,
  "message": "item_barang_id field is required when canvas_data is present."
}
```

Atau error validasi lain (HTTP `422`) dengan pesan pertama dari validator.

### 5.3. Error Response – Server

Jika terjadi error saat proses canvas:

```json
{
  "success": false,
  "message": "Gagal menyimpan canvas: <detail_error>"
}
```

Jika error saat simpan WO:

```json
{
  "success": false,
  "message": "Gagal menyimpan Work Order Planning: <detail_error>"
}
```

---

## 6. Ringkasan Alur Internal

1. **Validasi Canvas (jika dikirim):**
   - Cek `item_barang_id`, `canvas_data` (JSON), `canvas_image` (string).
2. **Simpan Canvas ke `ref_item_barang` (jika valid):**
   - Simpan `canvas_data` → file JSON.
   - Hitung `sisa_luas` dari metadata / ukuran container dan box.
   - Simpan `canvas_image` base64 → JPG.
3. **Panggil logika yang sama dengan `POST /api/work-order-planning`:**
   - Generate nomor WO via `DocumentSequenceController`.
   - Buat header `trx_work_order_planning`.
   - Buat detail `trx_work_order_planning_item`.
   - Insert `work_order_planning_pelaksana`.
   - Insert `saran_plat_shaft_dasar` per item (termasuk simpan canvas per item jika ada).
4. **Jika `typeWO = pending/cancel`:**
   - Update status di `SalesOrder` dan kirim notifikasi ke admin.

Dengan endpoint ini, FE bisa mengunci satu flow:
- Layout canvas → Klik “Create WO + Save Layout” → BE simpan canvas + buat WO secara konsisten.

