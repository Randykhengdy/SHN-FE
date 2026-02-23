# Dokumentasi Penerimaan Barang Non-PO

## Deskripsi

Fitur **Penerimaan Barang Non-PO** memungkinkan penerimaan barang ke gudang tanpa memerlukan referensi Purchase Order (PO) atau Stock Mutation. Proses ini terdiri dari 2 tahap:

1. **Store Non-PO** — Membuat data penerimaan barang beserta detail (tanpa membuat ItemBarang)
2. **Process Non-PO** — Admin mengisi harga modal dan berat, **ItemBarang baru dibuat** dengan status `active`

---

## Database Migration

### Migration awal: `2026_02_22_145529_add_harga_modal_and_nonpo_processed_to_item_barang_table.php`

Menambahkan kolom pada tabel `ref_item_barang`:

| Kolom | Tipe | Default | Keterangan |
|---|---|---|---|
| `harga_modal` | `decimal(15,2)` | `NULL` | Harga modal barang |
| `is_nonpo_processed` | `boolean` | `false` | Penanda item sudah diproses admin |

### Migration refactor: `2026_02_23_121800_refactor_nonpo_penerimaan_barang_detail.php`

Perubahan pada tabel `trx_penerimaan_barang_detail`:

| Perubahan | Keterangan |
|---|---|
| `id_item_barang` → **nullable** | Detail non-PO belum punya ItemBarang saat store |
| + `item_barang_group_id` | FK ke `ref_item_barang_group` (nullable) |
| + `tipe_terima` | `bundle` atau `satuan` (nullable) |
| + `is_processed` | boolean, default `false` |

---

## Item Barang Status (Enum)

```php
enum ItemBarangStatus: string
{
    case ACTIVE  = 'active';   // Barang aktif, siap digunakan
    case DESTROY = 'destroy';  // Barang dihancurkan
}
```

> [!NOTE]
> Status `pending` sudah dihapus. ItemBarang sekarang langsung dibuat dengan status `active` saat diproses.

### Alur Status Non-PO:
```
[storeNonPo] → Hanya simpan PenerimaanBarangDetail (id_item_barang = NULL)
      ↓
[processNonPo] → Buat ItemBarang (status: "active", harga_modal, berat terisi)
```

---

## API Endpoints

Base URL: `/api/penerimaan-barang`  
Middleware: `checkrole`

### 1. Store Penerimaan Barang Non-PO

```
POST /api/penerimaan-barang/non-po
```

**Deskripsi:** Membuat data penerimaan barang baru dari sumber Non-PO. **Tidak membuat ItemBarang** — hanya menyimpan metadata group pada `PenerimaanBarangDetail`. ItemBarang dibuat saat tahap `processNonPo`.

#### Request Body

```json
{
  "gudang_id": 1,
  "catatan": "Penerimaan barang dari supplier lama",
  "bukti_foto": "<base64_encoded_image_string>",
  "detail_barang": [
    {
      "item_barang_group_id": 5,
      "qty": 10,
      "tipe_terima": "bundle",
      "id_rak": 3
    },
    {
      "item_barang_group_id": null,
      "jenis_barang_id": 1,
      "bentuk_barang_id": 2,
      "grade_barang_id": 1,
      "panjang": 6000,
      "lebar": 1500,
      "tebal": 10,
      "qty": 5,
      "tipe_terima": "satuan",
      "id_rak": 4
    }
  ]
}
```

#### Parameter Detail

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `gudang_id` | integer | ✅ | ID gudang tujuan penerimaan |
| `catatan` | string | ❌ | Catatan penerimaan |
| `bukti_foto` | string | ❌ | Foto bukti penerimaan (base64) |
| `detail_barang` | array | ✅ | Minimal 1 item |

#### Parameter Detail Barang (per item)

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `item_barang_group_id` | integer | ❌ | ID group yang sudah ada. Jika `null`, group baru dibuat otomatis |
| `jenis_barang_id` | integer | Wajib jika `item_barang_group_id` = null | ID jenis barang |
| `bentuk_barang_id` | integer | Wajib jika `item_barang_group_id` = null | ID bentuk barang |
| `grade_barang_id` | integer | Wajib jika `item_barang_group_id` = null | ID grade barang |
| `panjang` | numeric | ❌ | Dimensi panjang (mm) |
| `lebar` | numeric | ❌ | Dimensi lebar (mm) |
| `tebal` | numeric | ❌ | Dimensi tebal (mm) |
| `diameter_luar` | numeric | ❌ | Diameter luar (mm) |
| `diameter_dalam` | numeric | ❌ | Diameter dalam (mm) |
| `diameter` | numeric | ❌ | Diameter (mm) |
| `sisi1` | numeric | ❌ | Sisi 1 (mm) |
| `sisi2` | numeric | ❌ | Sisi 2 (mm) |
| `qty` | integer | ✅ | Jumlah barang (minimal 1) |
| `tipe_terima` | string | ✅ | `"bundle"` atau `"satuan"` |
| `id_rak` | integer | ✅ | ID rak tempat penyimpanan |

#### Proses Internal (storeNonPo)

```mermaid
flowchart TD
    A[Request masuk] --> B[Validasi input]
    B --> C[Buat PenerimaanBarang<br/>origin = nonpo]
    C --> D{bukti_foto ada?}
    D -->|Ya| E[Simpan foto base64 → JPG]
    D -->|Tidak| F[Lanjut]
    E --> F
    F --> G[Loop detail_barang]
    G --> H{item_barang_group_id<br/>ada?}
    H -->|Ada| I[Ambil group existing]
    H -->|Tidak ada| J[Buat/cari group baru<br/>dari jenis+bentuk+grade+dimensi]
    I --> K[Simpan PenerimaanBarangDetail]
    J --> K
    K --> L["id_item_barang = NULL<br/>item_barang_group_id = group.id<br/>tipe_terima, qty, id_rak<br/>is_processed = false"]
    L --> M{Detail lain?}
    M -->|Ya| G
    M -->|Tidak| N[Commit & Response]
```

> [!IMPORTANT]
> `storeNonPo` **tidak** membuat ItemBarang sama sekali. Detail disimpan dengan `id_item_barang = NULL` dan `is_processed = false`. ItemBarang baru dibuat saat `processNonPo`.

#### Response Sukses (201)

```json
{
  "success": true,
  "message": "Penerimaan barang Non-PO berhasil ditambahkan",
  "data": {
    "id": 15,
    "origin": "nonpo",
    "id_purchase_order": null,
    "id_stock_mutation": null,
    "id_gudang": 1,
    "catatan": "Penerimaan barang dari supplier lama",
    "url_foto": "penerimaan-barang/15/bukti_foto.jpg",
    "gudang": { "id": 1, "nama": "Gudang Utama" },
    "penerimaan_barang_details": [
      {
        "id": 30,
        "id_penerimaan_barang": 15,
        "id_item_barang": null,
        "item_barang_group_id": 5,
        "id_rak": 3,
        "qty": 10,
        "tipe_terima": "bundle",
        "is_processed": false,
        "item_barang_group": { "id": 5, "jenis_barang_id": 1, "bentuk_barang_id": 2, "grade_barang_id": 1 },
        "rak": { "id": 3, "kode": "RAK-A01" }
      }
    ]
  }
}
```

---

### 2. Process Non-PO

```
PATCH /api/penerimaan-barang/process-nonpo/{detailId}
```

**Deskripsi:** Admin mengisi harga modal dan berat. **Di sinilah ItemBarang dibuat** dengan status langsung `active`. Detail yang sudah diproses akan ter-link ke ItemBarang yang baru dibuat.

#### Path Parameter

| Parameter | Tipe | Keterangan |
|---|---|---|
| `detailId` | integer | ID `PenerimaanBarangDetail` yang akan diproses |

#### Request Body

```json
{
  "harga_modal": 150000.00,
  "berat": 25.50
}
```

#### Parameter

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `harga_modal` | numeric | ✅ | Harga modal per item (Rp) |
| `berat` | numeric | ✅ | Berat item (kg) |

#### Validasi

- Detail harus ada di database
- Detail belum pernah diproses (`is_processed = false`)
- Detail harus memiliki `item_barang_group_id`
- Jika sudah diproses → return error `422`

#### Logika `tipe_terima` saat Process

| Tipe | Jumlah ItemBarang Dibuat | Quantity per Item | Detail |
|---|---|---|---|
| `bundle` | 1 record | qty = N | Detail original diupdate |
| `satuan` | N record | qty = 1 per record | Detail original diupdate + detail tambahan dibuat |

**Contoh:** Detail dengan `qty = 10`
- `bundle` → 1 ItemBarang dengan `quantity = 10`, detail original diupdate
- `satuan` → 10 ItemBarang masing-masing `quantity = 1`, detail original diupdate untuk item pertama, 9 detail tambahan dibuat

#### Proses Internal (processNonPo)

```mermaid
flowchart TD
    A[Request masuk] --> B[Validasi harga_modal & berat]
    B --> C{Detail ditemukan?}
    C -->|Tidak| D[Error 404]
    C -->|Ya| E{Sudah diproses?}
    E -->|Ya| F["Error 422:<br/>Detail sudah diproses"]
    E -->|Tidak| G[Load group + relasi]
    G --> H[Build nama_item_barang]
    H --> I[Hitung sisa_luas]
    I --> J{tipe_terima?}
    J -->|bundle| K[Buat 1 ItemBarang<br/>qty = N, status = active]
    J -->|satuan| L[Buat N ItemBarang<br/>qty = 1, status = active]
    K --> M[Update detail:<br/>id_item_barang, is_processed = true]
    L --> N["Update detail original + buat detail tambahan"]
    M --> O[Update group quantities]
    N --> O
    O --> P[Commit & Response]
```

#### Response Sukses (200)

```json
{
  "success": true,
  "message": "Item barang Non-PO berhasil diproses (1 item dibuat)",
  "data": [
    {
      "id": 120,
      "kode_barang": "PL-SS-A-6000x1500x10-000045",
      "nama_item_barang": "PL-SS-A-6000x1500x10",
      "status": "active",
      "harga_modal": "150000.00",
      "berat": "25.50",
      "is_nonpo_processed": true,
      "quantity": 10
    }
  ]
}
```

#### Error Response

```json
// Detail tidak ditemukan (404)
{
  "success": false,
  "message": "Detail penerimaan barang tidak ditemukan"
}

// Detail sudah diproses (422)
{
  "success": false,
  "message": "Detail ini sudah diproses sebelumnya"
}

// Detail tanpa group (422)
{
  "success": false,
  "message": "Detail ini tidak memiliki referensi group barang"
}
```

---

## Helper Methods (Internal)

### resolveItemBarangGroup

Menentukan `ItemBarangGroup` yang akan digunakan:
- Jika `item_barang_group_id` diberikan → ambil group existing
- Jika tidak → buat group baru berdasarkan `jenis_barang_id`, `bentuk_barang_id`, `grade_barang_id`, dan dimensi

### findOrCreateGroupNonPo

Mencari group yang cocok berdasarkan kombinasi jenis + bentuk + grade + dimensi. Jika ditemukan group yang soft-deleted, akan di-restore. Jika tidak ada, buat group baru.

### buildNamaItemBarang

Membuat nama item barang otomatis dari relasi bentuk, jenis, grade, dan dimensi group.

**Format:** `{kode_bentuk}-{kode_jenis}-{kode_grade}-{dimensi}`  
**Contoh:** `PL-SS-A-6000x1500x10`

### createItemBarangNonPo

Membuat record `ItemBarang` baru (dipanggil saat `processNonPo`):
- `kode_barang` = `{nama_item_barang}-{sequence_number}` (auto-generated)
- `status` = `active` (langsung aktif)
- `harga_modal` = dari input admin
- `berat` = dari input admin
- `is_nonpo_processed` = `true`
- `jenis_potongan` = `utuh`
- `is_available` = `true`
- Dimensi diambil dari group

### updateGroupQuantitiesNonPo

Menghitung ulang `quantity_utuh` dan `quantity_potongan` pada `ItemBarangGroup` berdasarkan item-item yang berstatus `active`.

---

## Alur Lengkap (End-to-End)

```mermaid
sequenceDiagram
    actor User as Operator Gudang
    actor Admin as Admin
    participant API as API Server
    participant DB as Database

    User->>API: POST /penerimaan-barang/non-po
    Note right of User: Kirim detail barang,<br/>gudang, rak, qty, tipe_terima
    API->>DB: Create PenerimaanBarang (origin=nonpo)
    API->>DB: Resolve/Create ItemBarangGroup
    API->>DB: Create PenerimaanBarangDetail<br/>(id_item_barang=NULL, is_processed=false)
    API-->>User: Response sukses (detail tanpa ItemBarang)

    Note over User,Admin: Detail belum diproses (is_processed=false)

    Admin->>API: PATCH /penerimaan-barang/process-nonpo/{detailId}
    Note right of Admin: Kirim harga_modal & berat
    API->>DB: Create ItemBarang<br/>(status=active, harga_modal, berat)
    API->>DB: Update detail.id_item_barang
    API->>DB: Update detail.is_processed = true
    API->>DB: Update group quantities
    API-->>Admin: Response sukses (ItemBarang dibuat)

    Note over User,Admin: Item aktif & siap digunakan
```

---

## File Terkait

| File | Keterangan |
|---|---|
| `app/Http/Controllers/MasterData/PenerimaanBarangController.php` | Controller utama (storeNonPo, processNonPo) |
| `app/Models/Transactions/PenerimaanBarangDetail.php` | Model detail (fillable: item_barang_group_id, tipe_terima, is_processed) |
| `app/Models/MasterData/ItemBarang.php` | Model item barang |
| `app/Enums/ItemBarangStatus.php` | Enum status item (active, destroy) |
| `routes/api.php` | Definisi route API |
| `database/migrations/2026_02_22_145529_add_harga_modal_and_nonpo_processed_to_item_barang_table.php` | Migration tambah kolom harga_modal dan is_nonpo_processed |
| `database/migrations/2026_02_23_121800_refactor_nonpo_penerimaan_barang_detail.php` | Migration refactor: nullable id_item_barang + kolom metadata nonpo |
