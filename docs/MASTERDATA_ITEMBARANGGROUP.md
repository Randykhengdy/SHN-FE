# Master Data - Item Barang Group API

Dokumentasi API untuk manajemen **Item Barang Group** (Kelompok Item Barang). Item Barang Group merupakan pengelompokan item barang berdasarkan kombinasi jenis, bentuk, grade, dan seluruh dimensi termasuk panjang, lebar, tebal, diameter, dan sisi.

---

## Daftar Endpoint

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/item-barang/generate-group` | Generate/regenerate seluruh group dari item barang |
| GET | `/api/item-barang/group` | Mengambil daftar seluruh group dengan pagination |
| POST | `/api/item-barang/group` | Membuat group baru secara manual |
| GET | `/api/item-barang/group/{id}` | Mengambil detail satu group berdasarkan ID |
| PUT/PATCH | `/api/item-barang/group/{id}` | Update data group berdasarkan ID |
| DELETE | `/api/item-barang/group/{id}` | Hapus group berdasarkan ID |

---

## Model Item Barang Group

### Struktur Tabel: `ref_item_barang_group`

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | integer | Primary key |
| `jenis_barang_id` | integer | Foreign key ke `ref_jenis_barang` |
| `bentuk_barang_id` | integer | Foreign key ke `ref_bentuk_barang` |
| `grade_barang_id` | integer | Foreign key ke `ref_grade_barang` |
| `panjang` | decimal(8,2) | Panjang item (dalam mm), nullable |
| `lebar` | decimal(8,2) | Lebar item (dalam mm), nullable untuk item 1D |
| `tebal` | decimal(8,2) | Tebal item (dalam mm), nullable |
| `diameter_luar` | decimal(8,2) | Diameter luar (untuk pipa/tube), nullable |
| `diameter_dalam` | decimal(8,2) | Diameter dalam (untuk pipa/tube), nullable |
| `diameter` | decimal(8,2) | Diameter (untuk shaft bulat), nullable |
| `sisi1` | decimal(8,2) | Sisi 1 (untuk shaft kotak/segi), nullable |
| `sisi2` | decimal(8,2) | Sisi 2 (untuk shaft kotak/segi), nullable |
| `quantity_utuh` | integer | Total quantity item dengan `jenis_potongan = 'utuh'` |
| `quantity_potongan` | integer | Total quantity item potongan (selain utuh) |
| `sequence` | integer | Urutan tampilan |
| `nama_group_barang` | string | **Auto-generated** nama group (Format: JENIS BENTUK GRADE DimensionsString) |
| `created_at` | datetime | Waktu pembuatan |
| `updated_at` | datetime | Waktu terakhir diupdate |
| `deleted_at` | datetime | Waktu soft delete (nullable) |

### Relasi

- `jenisBarang` → belongs to `JenisBarang`
- `bentukBarang` → belongs to `BentukBarang`
- `gradeBarang` → belongs to `GradeBarang`

---

## Endpoints

### 1. Generate Group
Membuat atau memperbarui seluruh group berdasarkan item barang yang ada.

**Endpoint:**
```
POST /api/item-barang/generate-group
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:** Tidak diperlukan

**Response Success (200):**
```json
{
  "status": true,
  "message": "Grouping item barang berhasil dibuat/diperbarui",
  "data": {
    "total_groups": 5,
    "created": 2,
    "updated": 3,
    "groups": [
      {
        "id": 1,
        "jenis_barang_id": 1,
        "bentuk_barang_id": 1,
        "grade_barang_id": 1,
        "panjang": "6000.00",
        "lebar": "1200.00",
        "tebal": "10.00",
        "diameter_luar": null,
        "diameter_dalam": null,
        "diameter": null,
        "sisi1": null,
        "sisi2": null,
        "quantity_utuh": 50,
        "quantity_potongan": 15,
        "nama_group_barang": "STAINLESS STEEL PLAT 304 6000x1200x10",
        "jenis_barang": {
          "id": 1,
          "kode": "SS",
          "nama": "Stainless Steel"
        },
        "bentuk_barang": {
          "id": 1,
          "kode": "PLT",
          "nama": "Plat"
        },
        "grade_barang": {
          "id": 1,
          "kode": "304",
          "nama": "Grade 304"
        }
      }
    ]
  }
}
```

---

### 2. Index Group (Get All Groups)
Mengambil daftar seluruh group dengan pagination dan filter.

**Endpoint:**
```
GET /api/item-barang/group
```

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**

| Parameter | Tipe | Required | Deskripsi |
|-----------|------|----------|-----------|
| `per_page` | integer | No | Jumlah data per halaman (default: 10) |
| `page` | integer | No | Halaman yang diminta |
| `jenis_barang_id` | integer | No | Filter berdasarkan jenis barang |
| `bentuk_barang_id` | integer | No | Filter berdasarkan bentuk barang |
| `grade_barang_id` | integer | No | Filter berdasarkan grade barang |
| `panjang` | decimal | No | Filter berdasarkan panjang |
| `lebar` | decimal | No | Filter berdasarkan lebar (null untuk item tanpa lebar) |
| `tebal` | decimal | No | Filter berdasarkan tebal |
| `diameter_luar` | decimal | No | Filter berdasarkan diameter luar |
| `diameter_dalam` | decimal | No | Filter berdasarkan diameter dalam |
| `diameter` | decimal | No | Filter berdasarkan diameter |
| `sisi1` | decimal | No | Filter berdasarkan sisi 1 |
| `sisi2` | decimal | No | Filter berdasarkan sisi 2 |
| `min_quantity_utuh` | integer | No | Filter minimum quantity utuh |
| `max_quantity_utuh` | integer | No | Filter maksimum quantity utuh |
| `min_quantity_potongan` | integer | No | Filter minimum quantity potongan |
| `max_quantity_potongan` | integer | No | Filter maksimum quantity potongan |

**Request Example:**
```
GET /api/item-barang/group?per_page=10&jenis_barang_id=1&min_quantity_utuh=5
```

**Response Success (200):**
```json
{
  "status": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "jenis_barang_id": 1,
      "bentuk_barang_id": 1,
      "grade_barang_id": 1,
      "panjang": "6000.00",
      "lebar": "1200.00",
      "tebal": "10.00",
      "diameter_luar": null,
      "diameter_dalam": null,
      "diameter": null,
      "sisi1": null,
      "sisi2": null,
      "quantity_utuh": 50,
      "quantity_potongan": 15,
      "nama_group_barang": "STAINLESS STEEL PLAT 304 6000x1200x10",
      "jenis_barang": {
        "id": 1,
        "kode": "SS",
        "nama": "Stainless Steel"
      },
      "bentuk_barang": {
        "id": 1,
        "kode": "PLT",
        "nama": "Plat"
      },
      "grade_barang": {
        "id": 1,
        "kode": "304",
        "nama": "Grade 304"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total": 25,
    "last_page": 3,
    "from": 1,
    "to": 10
  }
}
```

---

### 3. Show Group (Get Single Group)
Mengambil detail satu group berdasarkan ID.

**Endpoint:**
```
GET /api/item-barang/group/{id}
```

**Headers:**
```
Authorization: Bearer {token}
```

**Path Parameters:**

| Parameter | Tipe | Required | Deskripsi |
|-----------|------|----------|-----------|
| `id` | integer | Yes | ID dari group yang ingin diambil |

**Request Example:**
```
GET /api/item-barang/group/1
```

**Response Success (200):**
```json
{
  "status": true,
  "message": "Success",
  "data": {
    "id": 1,
    "jenis_barang_id": 1,
    "bentuk_barang_id": 1,
    "grade_barang_id": 1,
    "panjang": "6000.00",
    "lebar": "1200.00",
    "tebal": "10.00",
    "diameter_luar": null,
    "diameter_dalam": null,
    "diameter": null,
    "sisi1": null,
    "sisi2": null,
    "quantity_utuh": 50,
    "quantity_potongan": 15,
    "sequence": 1,
    "nama_group_barang": "STAINLESS STEEL PLAT 304 6000x1200x10",
    "jenis_barang": {
      "id": 1,
      "kode": "SS",
      "nama": "Stainless Steel"
    },
    "bentuk_barang": {
      "id": 1,
      "kode": "PLT",
      "nama": "Plat"
    },
    "grade_barang": {
      "id": 1,
      "kode": "304",
      "nama": "Grade 304"
    }
  }
}
```

**Response Error (404):**
```json
{
  "status": false,
  "message": "Data group tidak ditemukan"
}
```

---

### 4. Create Group (Manual)
Membuat group baru secara manual.

**Endpoint:**
```
POST /api/item-barang/group
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

| Field | Tipe | Required | Deskripsi |
|-------|------|----------|-----------|
| `jenis_barang_id` | integer | Yes | ID jenis barang |
| `bentuk_barang_id` | integer | Yes | ID bentuk barang |
| `grade_barang_id` | integer | Yes | ID grade barang |
| `panjang` | decimal | No | Panjang (mm) |
| `lebar` | decimal | No | Lebar (mm) |
| `tebal` | decimal | No | Tebal (mm) |
| `diameter_luar` | decimal | No | Diameter luar (mm) |
| `diameter_dalam` | decimal | No | Diameter dalam (mm) |
| `diameter` | decimal | No | Diameter (mm) |
| `sisi1` | decimal | No | Sisi 1 (mm) |
| `sisi2` | decimal | No | Sisi 2 (mm) |
| `quantity_utuh` | integer | No | Quantity utuh (default: 0) |
| `quantity_potongan` | integer | No | Quantity potongan (default: 0) |
| `sequence` | integer | No | Urutan tampilan |

**Request Example:**
```json
{
  "jenis_barang_id": 1,
  "bentuk_barang_id": 2,
  "grade_barang_id": 1,
  "panjang": 6000,
  "diameter_luar": 50,
  "diameter_dalam": 40,
  "tebal": 5,
  "quantity_utuh": 10,
  "quantity_potongan": 5
}
```

**Response Success (200):**
```json
{
  "status": true,
  "message": "Data group berhasil ditambahkan",
  "data": {
    "id": 10,
    "jenis_barang_id": 1,
    "bentuk_barang_id": 2,
    "grade_barang_id": 1,
    "panjang": "6000.00",
    "lebar": null,
    "tebal": "5.00",
    "diameter_luar": "50.00",
    "diameter_dalam": "40.00",
    "diameter": null,
    "sisi1": null,
    "sisi2": null,
    "quantity_utuh": 10,
    "quantity_potongan": 5,
    "nama_group_barang": "STAINLESS STEEL PIPA 304 6000x5x50x40",
    "jenis_barang": {
      "id": 1,
      "kode": "SS",
      "nama": "Stainless Steel"
    },
    "bentuk_barang": {
      "id": 2,
      "kode": "PIPE",
      "nama": "Pipa"
    },
    "grade_barang": {
      "id": 1,
      "kode": "304",
      "nama": "Grade 304"
    }
  }
}
```

---

### 5. Update Group
Update data group yang sudah ada.

**Endpoint:**
```
PUT/PATCH /api/item-barang/group/{id}
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Path Parameters:**

| Parameter | Tipe | Required | Deskripsi |
|-----------|------|----------|-----------|
| `id` | integer | Yes | ID dari group yang ingin diupdate |

**Request Body:** (Semua field opsional)

| Field | Tipe | Required | Deskripsi |
|-------|------|----------|-----------|
| `jenis_barang_id` | integer | No | ID jenis barang |
| `bentuk_barang_id` | integer | No | ID bentuk barang |
| `grade_barang_id` | integer | No | ID grade barang |
| `panjang` | decimal | No | Panjang (mm) |
| `lebar` | decimal | No | Lebar (mm) |
| `tebal` | decimal | No | Tebal (mm) |
| `diameter_luar` | decimal | No | Diameter luar (mm) |
| `diameter_dalam` | decimal | No | Diameter dalam (mm) |
| `diameter` | decimal | No | Diameter (mm) |
| `sisi1` | decimal | No | Sisi 1 (mm) |
| `sisi2` | decimal | No | Sisi 2 (mm) |
| `quantity_utuh` | integer | No | Quantity utuh |
| `quantity_potongan` | integer | No | Quantity potongan |
| `sequence` | integer | No | Urutan tampilan |

**Request Example:**
```json
{
  "quantity_utuh": 15,
  "quantity_potongan": 8
}
```

**Response Success (200):**
```json
{
  "status": true,
  "message": "Data group berhasil diperbarui",
  "data": {
    "id": 10,
    "jenis_barang_id": 1,
    "bentuk_barang_id": 2,
    "grade_barang_id": 1,
    "panjang": "6000.00",
    "lebar": null,
    "tebal": "5.00",
    "diameter_luar": "50.00",
    "diameter_dalam": "40.00",
    "diameter": null,
    "sisi1": null,
    "sisi2": null,
    "quantity_utuh": 15,
    "quantity_potongan": 8,
    "nama_group_barang": "STAINLESS STEEL PIPA 304 6000x5x50x40",
    "jenis_barang": {
      "id": 1,
      "kode": "SS",
      "nama": "Stainless Steel"
    },
    "bentuk_barang": {
      "id": 2,
      "kode": "PIPE",
      "nama": "Pipa"
    },
    "grade_barang": {
      "id": 1,
      "kode": "304",
      "nama": "Grade 304"
    }
  }
}
```

**Response Error (404):**
```json
{
  "status": false,
  "message": "Data group tidak ditemukan"
}
```

---

### 6. Delete Group
Menghapus group berdasarkan ID.

**Endpoint:**
```
DELETE /api/item-barang/group/{id}
```

**Headers:**
```
Authorization: Bearer {token}
```

**Path Parameters:**

| Parameter | Tipe | Required | Deskripsi |
|-----------|------|----------|-----------|
| `id` | integer | Yes | ID dari group yang ingin dihapus |

**Request Example:**
```
DELETE /api/item-barang/group/10
```

**Response Success (200):**
```json
{
  "status": true,
  "message": "Data group berhasil dihapus",
  "data": null
}
```

**Response Error (404):**
```json
{
  "status": false,
  "message": "Data group tidak ditemukan"
}
```

**Response Error (409):**
```json
{
  "status": false,
  "message": "Data group tidak dapat dihapus karena masih digunakan oleh data lain"
}
```

---

## Nama Group Barang (Auto-Generated)

Field `nama_group_barang` adalah field yang **auto-generated** (tidak perlu diisi manual) yang mengikuti format:

```
<NAMA_JENIS_KAPITAL> <NAMA_BENTUK_KAPITAL> <GRADE> <DIMENSI_STRING>
```

### Format Dimensi String

Dimensi string dibentuk dari atribut dimensi yang **tidak null**, dipisahkan dengan karakter `x`:

| Contoh Atribut | Dimensi String | Nama Group Barang |
|----------------|----------------|-------------------|
| panjang=6000, lebar=1200, tebal=10 | `6000x1200x10` | `STAINLESS STEEL PLAT 304 6000x1200x10` |
| panjang=6000, tebal=5, diameter_luar=50, diameter_dalam=40 | `6000x5x50x40` | `STAINLESS STEEL PIPA 304 6000x5x50x40` |
| panjang=6000, diameter=25 | `6000x25` | `STAINLESS STEEL SHAFT BULAT 304 6000x25` |
| panjang=6000, sisi1=30, sisi2=30 | `6000x30x30` | `STAINLESS STEEL SHAFT KOTAK 304 6000x30x30` |

> **Note:** Hanya atribut dimensi yang memiliki nilai (tidak null) yang akan dimasukkan ke dalam dimensi string.

---

## Tipe Bentuk Barang & Dimensi

Berikut adalah field dimensi yang digunakan berdasarkan bentuk/tipe barang:

| Tipe Barang | Dimensi yang Digunakan |
|-------------|------------------------|
| **Plat** | `panjang`, `lebar`, `tebal` |
| **Strip** | `panjang`, `tebal` |
| **Pipa** | `panjang`, `tebal`, `diameter_luar`, `diameter_dalam` |
| **Shaft Bulat** | `panjang`, `diameter` |
| **Shaft Kotak** | `panjang`, `sisi1`, `sisi2` |

> **Note:** Field yang tidak relevan dengan tipe barang akan bernilai `null`.

---

## Mekanisme Sinkronisasi Group

Group secara otomatis disinkronisasi ketika terjadi perubahan pada Item Barang:

| Operasi | Behavior |
|---------|----------|
| **Create Item** | Group dibuat/diupdate sesuai kombinasi dimensi baru |
| **Update Item** | Group lama dan baru disinkronisasi |
| **Soft Delete Item** | Quantity group dikurangi |
| **Restore Item** | Quantity group ditambahkan kembali |
| **Force Delete Item** | Quantity group dikurangi permanen |

### Logika Pengelompokan

Item Barang dikelompokkan berdasarkan kombinasi:
- `jenis_barang_id` 
- `bentuk_barang_id`
- `grade_barang_id`
- `panjang` (opsional)
- `lebar` (opsional)
- `tebal` (opsional)
- `diameter_luar` (opsional)
- `diameter_dalam` (opsional)
- `diameter` (opsional)
- `sisi1` (opsional)
- `sisi2` (opsional)

### Perhitungan Quantity

- **quantity_utuh**: Total dari semua item dengan `jenis_potongan = 'utuh'`
- **quantity_potongan**: Total dari semua item dengan `jenis_potongan` selain 'utuh' atau NULL

---

## Error Responses

| HTTP Code | Deskripsi |
|-----------|-----------|
| 401 | Unauthorized - Token tidak valid atau expired |
| 404 | Data tidak ditemukan |
| 422 | Validation error |
| 500 | Internal server error |

**Contoh Error Response:**
```json
{
  "status": false,
  "message": "Token tidak valid"
}
```
