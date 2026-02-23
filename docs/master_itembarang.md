# Dokumentasi Master Data: Item Barang

## Deskripsi

**Item Barang** adalah master data yang merepresentasikan satu unit/lembar barang di gudang. Setiap item memiliki atribut berupa bentuk, jenis, grade, dimensi, dan lokasi (gudang & rak). Item juga dikelompokkan ke dalam **Item Barang Group** berdasarkan kombinasi atribut identik.

---

## Database

### Tabel Item Barang

**Tabel:** `ref_item_barang`
**Model:** `App\Models\MasterData\ItemBarang`
**Soft Delete:** ✅

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | integer (PK) | Auto-increment |
| `kode_barang` | string (unique) | Kode unik barang, di-generate otomatis |
| `jenis_barang_id` | integer (FK) | Relasi ke `ref_jenis_barang` |
| `bentuk_barang_id` | integer (FK) | Relasi ke `ref_bentuk_barang` |
| `grade_barang_id` | integer (FK) | Relasi ke `ref_grade_barang` |
| `item_barang_group_id` | integer (FK) | Relasi ke `ref_item_barang_group` |
| `nama_item_barang` | string | Nama item (format: `BENTUK-JENIS-GRADE-DIMENSIxDIMENSI`) |
| `status` | enum | Status item (`active`, `destroy`) |
| `sisa_luas` | decimal | Sisa luas permukaan |
| `panjang` | decimal(2) | Panjang (mm) |
| `lebar` | decimal(2) | Lebar (mm) |
| `tebal` | decimal(2) | Tebal (mm) |
| `berat` | decimal(2) | Berat (kg) |
| `harga_modal` | decimal(2) | Harga modal |
| `quantity` | numeric | Jumlah stok |
| `quantity_tebal_sama` | numeric | Jumlah stok dengan tebal sama |
| `jenis_potongan` | string | Jenis potongan (`utuh`, `potongan`) |
| `is_available` | boolean | Apakah item tersedia |
| `is_edit` | boolean | Flag sedang diedit |
| `is_onprogress_po` | boolean | Sedang dalam proses PO |
| `is_nonpo_processed` | boolean | Flag non-PO sudah diproses |
| `user_id` | integer (FK) | User terakhir yang mengubah |
| `canvas_file` | string | Path file canvas JSON |
| `canvas_image` | string | Path gambar canvas JPG |
| `convert_date` | date | Tanggal konversi |
| `split_date` | date | Tanggal split |
| `merge_date` | date | Tanggal merge |
| `gudang_id` | integer (FK) | Relasi ke `ref_gudang` |
| `id_rak` | integer (FK) | Relasi ke `ref_rak` |
| `frozen_at` | timestamp | Waktu item dibekukan |
| `frozen_by` | integer (FK) | User yang membekukan |
| `parent_id` | integer (FK) | Self-reference, untuk item hasil split |
| `diameter_luar` | decimal(2) | Diameter luar |
| `diameter_dalam` | decimal(2) | Diameter dalam |
| `diameter` | decimal(2) | Diameter |
| `sisi1` | decimal(2) | Sisi 1 |
| `sisi2` | decimal(2) | Sisi 2 |
| `created_at` | timestamp | Waktu pembuatan |
| `updated_at` | timestamp | Waktu update terakhir |
| `deleted_at` | timestamp | Soft delete marker |

### Relasi

| Relasi | Tipe | Model Tujuan | Keterangan |
|---|---|---|---|
| `jenisBarang` | BelongsTo | `JenisBarang` | Jenis material (contoh: ALU, SS) |
| `bentukBarang` | BelongsTo | `BentukBarang` | Bentuk barang (contoh: Plat, Pipa) |
| `gradeBarang` | BelongsTo | `GradeBarang` | Grade kualitas |
| `itemBarangGroup` | BelongsTo | `ItemBarangGroup` | Grup item dengan dimensi identik |
| `gudang` | BelongsTo | `Gudang` | Gudang penyimpanan |
| `rak` | BelongsTo | `Rak` | Rak penyimpanan |
| `stockOpnameDetails` | HasMany | `StockOpnameDetail` | Detail stock opname |
| `parent` | BelongsTo | `ItemBarang` | Item induk (untuk hasil split) |
| `children` | HasMany | `ItemBarang` | Item anak (hasil split dari item ini) |

---

## Format Kode Barang

Kode barang di-generate otomatis menggunakan format:

```
{BENTUK}-{JENIS}-{GRADE}-{DIMENSI}--{DDMMYYYY}-{SEQUENCE}
```

**Contoh:** `PLT-ALU-110-30x1220x2440--10022026-161`

- `PLT` = Kode bentuk barang (Plat)
- `ALU` = Kode jenis barang (Aluminium)
- `110` = Kode grade barang
- `30x1220x2440` = Dimensi (tebalxlebarxpanjang)
- `10022026` = Tanggal (ddmmyyyy)
- `161` = Nomor urut sequence

Dimensi yang ditampilkan tergantung pada **Tipe Barang** yang terkait dengan bentuk barang. Hanya dimensi yang aktif (bernilai `true` pada Tipe Barang) yang akan disertakan.

---

## API Endpoints

Base URL: `/api/item-barang`
Middleware: `checkrole`

### 1. List Item Barang

```
GET /api/item-barang
```

**Query Parameters:**

| Parameter | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `per_page` | integer | ❌ | Jumlah data per halaman |
| `search` | string | ❌ | Pencarian di `kode_barang` dan `nama_item_barang` |
| `gudang_id` | integer | ❌ | Filter berdasarkan gudang |
| `jenis_potongan` / `tipe` | string | ❌ | Filter jenis potongan (`utuh`/`potongan`) |
| `jenis_barang_id` / `tipe_barang` | integer | ❌ | Filter jenis barang |
| `quantity` | numeric | ❌ | Filter quantity exact |
| `min_quantity` | numeric | ❌ | Filter quantity minimum |
| `max_quantity` | numeric | ❌ | Filter quantity maximum |

**Response:** Paginated list dengan relasi `jenisBarang`, `bentukBarang`, `gradeBarang`, `gudang`, `rak`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "kode_barang": "PLT-ALU-110-30x1220x2440--10022026-161",
      "nama_item_barang": "PLT-ALU-110-30x1220x2440",
      "status": "active",
      "jenis_potongan": "utuh",
      "quantity": 5,
      "panjang": "2440.00",
      "lebar": "1220.00",
      "tebal": "30.00",
      "berat": "10.50",
      "gudang_id": 1,
      "jenis_barang": { "id": 1, "kode": "ALU" },
      "bentuk_barang": { "id": 1, "kode": "PLT" },
      "grade_barang": { "id": 1, "kode": "110" },
      "gudang": { "id": 1, "nama_gudang": "Gudang Utama" },
      "rak": { "id": 1, "kode": "A-01" }
    }
  ],
  "meta": { "current_page": 1, "last_page": 1, "per_page": 10, "total": 1 }
}
```

---

### 2. Detail Item Barang

```
GET /api/item-barang/{id}
```

**Response:** Single object dengan relasi `jenisBarang`, `bentukBarang`, `gradeBarang`, `gudang`, `rak`, `itemBarangGroup`

---

### 3. Tambah Item Barang

```
POST /api/item-barang
```

**Request Body:**

```json
{
  "jenis_barang_id": 1,
  "bentuk_barang_id": 1,
  "grade_barang_id": 1,
  "panjang": 2440,
  "lebar": 1220,
  "tebal": 30,
  "berat": 10.5,
  "quantity": 5,
  "jenis_potongan": "utuh",
  "gudang_id": 1,
  "id_rak": 1
}
```

| Field | Tipe | Wajib | Validasi |
|---|---|---|---|
| `jenis_barang_id` | integer | ✅ | Harus ada di `ref_jenis_barang` |
| `bentuk_barang_id` | integer | ✅ | Harus ada di `ref_bentuk_barang` |
| `grade_barang_id` | integer | ✅ | Harus ada di `ref_grade_barang` |
| `panjang` | numeric | ❌ | min: 0 |
| `lebar` | numeric | ❌ | min: 0 |
| `tebal` | numeric | ❌ | min: 0 |
| `berat` | numeric | ❌ | min: 0 |
| `quantity` | numeric | ❌ | min: 0 |
| `quantity_tebal_sama` | numeric | ❌ | min: 0 |
| `jenis_potongan` | string | ❌ | - |
| `is_edit` | boolean | ❌ | - |
| `is_onprogress_po` | boolean | ❌ | - |
| `user_id` | integer | ❌ | Harus ada di `users` |
| `gudang_id` | integer | ❌ | Harus ada di `ref_gudang` |
| `id_rak` | integer | ❌ | Harus ada di `ref_rak` |
| `diameter_luar` | numeric | ❌ | min: 0 |
| `diameter_dalam` | numeric | ❌ | min: 0 |
| `diameter` | numeric | ❌ | min: 0 |
| `sisi1` | numeric | ❌ | min: 0 |
| `sisi2` | numeric | ❌ | min: 0 |

**Catatan:**
- `kode_barang` dan `nama_item_barang` di-generate otomatis berdasarkan bentuk, jenis, grade, dan dimensi.
- Item akan otomatis ditambahkan ke `ItemBarangGroup` yang sesuai (dibuat baru jika belum ada).
- Sequence nomor diambil dari `DocumentSequenceController`.

---

### 4. Update Item Barang

```
PUT /api/item-barang/{id}
PATCH /api/item-barang/{id}
```

**Request Body:** Sama dengan store (semua field opsional). Jika atribut grouping berubah, item akan dipindahkan ke group yang sesuai dan quantity kedua group diperbarui.

---

### 5. Update Status

```
POST /api/item-barang/update-status
```

**Request Body:**

```json
{
  "item_barang_id": 1,
  "status": "active"
}
```

| Field | Tipe | Wajib | Validasi |
|---|---|---|---|
| `item_barang_id` | integer | ✅ | Harus ada di `ref_item_barang` |
| `status` | string | ✅ | `active` atau `destroy` |

---

### 6. Check Stock

```
GET /api/stock/check
```

Mengecek ketersediaan stok berdasarkan filter dimensi dan atribut.

**Query Parameters:**

| Parameter | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `gudang_id` | integer | ❌ | Filter gudang |
| `jenis_barang_id` | integer | ❌ | Filter jenis barang |
| `bentuk_barang_id` | integer | ❌ | Filter bentuk barang |
| `grade_barang_id` | integer | ❌ | Filter grade barang |
| `panjang` | numeric | ❌ | Filter panjang exact |
| `lebar` | numeric | ❌ | Filter lebar exact |
| `tebal` | numeric | ❌ | Filter tebal exact |
| `diameter_luar` | numeric | ❌ | Filter diameter luar |
| `diameter_dalam` | numeric | ❌ | Filter diameter dalam |
| `diameter` | numeric | ❌ | Filter diameter |
| `sisi1` | numeric | ❌ | Filter sisi 1 |
| `sisi2` | numeric | ❌ | Filter sisi 2 |

---

### 7. Item Barang Bulk

```
GET /api/item-barang/bulk
```

Menampilkan item dengan `quantity > 1` dan `jenis_potongan = 'utuh'`.

**Query Parameters:** Sama dengan list (per_page, search, gudang_id).

---

### 8. Item Barang Mergeable

```
GET /api/item-barang/mergeable
```

Menampilkan item yang bisa di-merge (hanya `jenis_potongan = 'utuh'`). Mendukung pencarian di `kode_barang`, `nama_item_barang`, `gudang`, `jenisBarang`, `bentukBarang`, `gradeBarang`.

**Query Parameters:**

| Parameter | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `per_page` | integer | ❌ | Jika tidak disertakan, semua data dikembalikan |
| `search` | string | ❌ | Pencarian multi-kolom |

---

### 9. Similar Type

```
GET /api/item-barang/similar-type/{id}
```

Menampilkan item yang memiliki jenis, bentuk, grade, tebal, dan gudang yang sama dengan item `{id}`, serta `jenis_potongan = 'utuh'`.

---

### 10. Item Barang by Gudang

```
GET /api/item-barang/by-gudang/{gudangId}
```

Menampilkan semua item di gudang tertentu. Mendukung filter dan pencarian yang sama dengan endpoint list.

---

### 11. Freeze Items

```
POST /api/item-barang/freeze
```

Membekukan semua item di suatu gudang (untuk keperluan stock opname).

**Request Body:**

```json
{
  "gudang_id": 1
}
```

| Field | Tipe | Wajib | Validasi |
|---|---|---|---|
| `gudang_id` | integer | ✅ | Harus ada di `ref_gudang` |

**Response:** `{ "updated_count": 50, "gudang_id": 1 }`

---

### 12. Unfreeze Items

```
POST /api/item-barang/unfreeze
```

Melepaskan status beku dari semua item di suatu gudang.

**Request Body:** Sama dengan freeze.

---

### 13. Save Canvas

```
POST /api/item-barang/save-canvas
```

Menyimpan data canvas (pemotongan/layout) ke item barang, serta dapat melakukan split item.

**Request Body:**

```json
{
  "item_barang_id": 1,
  "canvas_data": "{\"baseContainer\": {...}, \"boxes\": [...]}",
  "canvas_image": "data:image/jpeg;base64,...",
  "splits": [
    { "panjang": 500, "lebar": 300 },
    { "panjang": 700, "lebar": 400 }
  ]
}
```

| Field | Tipe | Wajib | Validasi |
|---|---|---|---|
| `item_barang_id` | integer | ✅ | Harus ada di `ref_item_barang` |
| `canvas_data` | json string | ❌ | Data JSON dari canvas editor |
| `canvas_image` | string | ❌ | Base64 encoded JPG |
| `splits` | array | ❌ | Array of split items |
| `splits.*.panjang` | numeric | ✅* | min: 0 (*required jika splits ada) |
| `splits.*.lebar` | numeric | ❌ | min: 0 (required untuk item 2D) |

**Catatan:**
- Jika `canvas_data` disertakan, `sisa_luas` dihitung otomatis dari area container dikurangi total area boxes.
- Jika `splits` disertakan, item baru dibuat sebagai child dari item induk dengan `kode_barang` format: `{KODE_INDUK}-SPLIT-{NNN}-{timestamp}`.

---

### 14. Soft Delete

```
DELETE /api/item-barang/{id}/soft
```

Menandai item sebagai dihapus (soft delete). Group quantity diperbarui otomatis.

---

### 15. Restore

```
PATCH /api/item-barang/{id}/restore
```

Mengembalikan item yang sudah di-soft delete. Group quantity diperbarui otomatis.

---

### 16. Force Delete

```
DELETE /api/item-barang/{id}/force
```

Menghapus item secara permanen. Gagal jika masih digunakan oleh data lain (FK constraint → error `409`).

---

### 17. List With Trashed

```
GET /api/item-barang/with-trashed/all
```

Menampilkan semua item termasuk yang di-soft delete. Mendukung filter yang sama dengan list.

---

### 18. List Trashed Only

```
GET /api/item-barang/with-trashed/trashed
```

Menampilkan hanya item yang di-soft delete. Mendukung filter yang sama dengan list.

---

## Item Barang Group

Endpoints untuk mengelola grouping item barang berdasarkan kombinasi jenis, bentuk, grade, dan dimensi.

### 19. List Group

```
GET /api/item-barang/group
```

**Query Parameters:**

| Parameter | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `per_page` | integer | ❌ | Jumlah data per halaman |
| `jenis_barang_id` | integer | ❌ | Filter jenis barang |
| `bentuk_barang_id` | integer | ❌ | Filter bentuk barang |
| `grade_barang_id` | integer | ❌ | Filter grade barang |
| `panjang` | numeric | ❌ | Filter panjang |
| `lebar` | numeric | ❌ | Filter lebar (null = filter whereNull) |
| `tebal` | numeric | ❌ | Filter tebal |
| `diameter_luar` | numeric | ❌ | Filter diameter luar (null = whereNull) |
| `diameter_dalam` | numeric | ❌ | Filter diameter dalam (null = whereNull) |
| `diameter` | numeric | ❌ | Filter diameter (null = whereNull) |
| `sisi1` | numeric | ❌ | Filter sisi 1 (null = whereNull) |
| `sisi2` | numeric | ❌ | Filter sisi 2 (null = whereNull) |
| `min_quantity_utuh` | integer | ❌ | Minimum quantity utuh |
| `max_quantity_utuh` | integer | ❌ | Maximum quantity utuh |
| `min_quantity_potongan` | integer | ❌ | Minimum quantity potongan |
| `max_quantity_potongan` | integer | ❌ | Maximum quantity potongan |

**Response:** Paginated list dengan relasi `jenisBarang`, `bentukBarang.tipeBarang`, `gradeBarang`

---

### 20. Detail Group

```
GET /api/item-barang/group/{id}
```

---

### 21. Tambah Group

```
POST /api/item-barang/group
```

**Request Body:**

```json
{
  "jenis_barang_id": 1,
  "bentuk_barang_id": 1,
  "grade_barang_id": 1,
  "panjang": 2440,
  "lebar": 1220,
  "tebal": 30
}
```

| Field | Tipe | Wajib | Validasi |
|---|---|---|---|
| `jenis_barang_id` | integer | ✅ | Harus ada di `ref_jenis_barang` |
| `bentuk_barang_id` | integer | ✅ | Harus ada di `ref_bentuk_barang` |
| `grade_barang_id` | integer | ✅ | Harus ada di `ref_grade_barang` |
| `panjang` | numeric | ❌ | min: 0 |
| `lebar` | numeric | ❌ | min: 0 |
| `tebal` | numeric | ❌ | min: 0 |
| `diameter_luar` | numeric | ❌ | min: 0 |
| `diameter_dalam` | numeric | ❌ | min: 0 |
| `diameter` | numeric | ❌ | min: 0 |
| `sisi1` | numeric | ❌ | min: 0 |
| `sisi2` | numeric | ❌ | min: 0 |
| `quantity_utuh` | integer | ❌ | min: 0 |
| `quantity_potongan` | integer | ❌ | min: 0 |
| `sequence` | integer | ❌ | min: 0 |

---

### 22. Update Group

```
PUT /api/item-barang/group/{id}
PATCH /api/item-barang/group/{id}
```

**Request Body:** Sama dengan tambah group.

---

### 23. Delete Group

```
DELETE /api/item-barang/group/{id}
```

Menghapus group. Gagal jika masih memiliki item terkait (error `409`).

---

### 24. Generate Group

```
POST /api/item-barang/generate-group
```

Generate ulang semua group berdasarkan data item barang yang ada. Menghitung ulang `quantity_utuh` dan `quantity_potongan` untuk setiap group.

---

### 25. Canvas Endpoints

```
GET /api/item-barang/{itemBarangId}/canvas
GET /api/item-barang/{itemBarangId}/canvas-image
```

Mengambil file canvas JSON atau gambar canvas untuk item barang tertentu. (Ditangani oleh `WorkOrderPlanningController`)

---

## File Terkait

| File | Keterangan |
|---|---|
| `app/Http/Controllers/MasterData/ItemBarangController.php` | Controller utama |
| `app/Models/MasterData/ItemBarang.php` | Model Item Barang |
| `app/Models/MasterData/ItemBarangGroup.php` | Model Group Item Barang |
| `app/Enums/ItemBarangStatus.php` | Enum status item (`active`, `destroy`) |
| `app/Http/Controllers/MasterData/DocumentSequenceController.php` | Controller sequence numbering |
| `routes/api.php` | Route definitions (line 241-271, 286-287) |
