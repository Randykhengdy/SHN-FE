# API Dokumentasi - Master Data Tipe Barang

## Deskripsi

Master data tipe barang (`ref_tipe_barang`) digunakan untuk mendefinisikan tipe barang berdasarkan atribut dimensi yang dimiliki. Setiap tipe barang memiliki konfigurasi boolean untuk menentukan dimensi apa saja yang relevan untuk tipe tersebut.

### Konsep Tipe Barang

Tipe Barang mendefinisikan dimensi-dimensi yang diperlukan untuk mendeskripsikan barang:
- **TIPE 1**: DiameterLuar x DiameterDalam x Panjang (untuk pipa/tube)
- **TIPE 2**: Sisi1 x Sisi2 x Tebal x Panjang (untuk angle/siku-siku)
- **TIPE 3**: Tebal x Lebar x Panjang (untuk plate/lempengan)
- **TIPE 4**: Diameter x Panjang (untuk shaft/poros)

## Struktur Tabel

### Tabel: `ref_tipe_barang`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | bigint | Primary key |
| `name` | varchar(255) | Nama tipe barang (e.g., "TIPE 1", "TIPE 2") |
| `desc` | text | Deskripsi tipe barang (nullable) |
| `diameter_luar` | boolean | Flag apakah tipe ini memiliki diameter luar (default: false) |
| `diameter_dalam` | boolean | Flag apakah tipe ini memiliki diameter dalam (default: false) |
| `diameter` | boolean | Flag apakah tipe ini memiliki diameter (default: false) |
| `sisi1` | boolean | Flag apakah tipe ini memiliki sisi1 (default: false) |
| `sisi2` | boolean | Flag apakah tipe ini memiliki sisi2 (default: false) |
| `tebal` | boolean | Flag apakah tipe ini memiliki tebal (default: false) |
| `lebar` | boolean | Flag apakah tipe ini memiliki lebar (default: false) |
| `panjang` | boolean | Flag apakah tipe ini memiliki panjang (default: false) |
| `created_at` | timestamp | Waktu dibuat |
| `updated_at` | timestamp | Waktu diupdate |
| `deleted_at` | timestamp | Soft delete (nullable) |

## Endpoint API

Base URL: `/api/tipe-barang`

Semua endpoint memerlukan authentication dengan middleware `checkrole`.

---

## 1. List Tipe Barang

Mendapatkan daftar tipe barang dengan pagination dan filter.

**Endpoint:** `GET /api/tipe-barang`

### Query Parameters

| Parameter | Tipe | Required | Keterangan |
|-----------|------|----------|------------|
| `per_page` | integer | No | Jumlah item per halaman (default: sesuai konfigurasi) |
| `page` | integer | No | Nomor halaman |
| `name` | string | No | Filter berdasarkan nama (supports LIKE search) |
| `desc` | string | No | Filter berdasarkan deskripsi (supports LIKE search) |

### Response Success (200 OK)

```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "name": "TIPE 1",
        "desc": "DiameterLuar x DiameterDalam x Panjang",
        "diameter_luar": true,
        "diameter_dalam": true,
        "diameter": false,
        "sisi1": false,
        "sisi2": false,
        "tebal": false,
        "lebar": false,
        "panjang": true,
        "created_at": "2026-02-06T08:47:51.000000Z",
        "updated_at": "2026-02-06T08:47:51.000000Z"
      },
      {
        "id": 2,
        "name": "TIPE 2",
        "desc": "Sisi1 x Sisi2 x Tebal x Panjang",
        "diameter_luar": false,
        "diameter_dalam": false,
        "diameter": false,
        "sisi1": true,
        "sisi2": true,
        "tebal": true,
        "lebar": false,
        "panjang": true,
        "created_at": "2026-02-06T08:47:51.000000Z",
        "updated_at": "2026-02-06T08:47:51.000000Z"
      },
      {
        "id": 3,
        "name": "TIPE 3",
        "desc": "Tebal x Lebar x Panjang",
        "diameter_luar": false,
        "diameter_dalam": false,
        "diameter": false,
        "sisi1": false,
        "sisi2": false,
        "tebal": true,
        "lebar": true,
        "panjang": true,
        "created_at": "2026-02-06T08:47:51.000000Z",
        "updated_at": "2026-02-06T08:47:51.000000Z"
      },
      {
        "id": 4,
        "name": "TIPE 4",
        "desc": "Diameter x Panjang",
        "diameter_luar": false,
        "diameter_dalam": false,
        "diameter": true,
        "sisi1": false,
        "sisi2": false,
        "tebal": false,
        "lebar": false,
        "panjang": true,
        "created_at": "2026-02-06T08:47:51.000000Z",
        "updated_at": "2026-02-06T08:47:51.000000Z"
      }
    ],
    "first_page_url": "http://localhost:8000/api/tipe-barang?page=1",
    "from": 1,
    "last_page": 1,
    "last_page_url": "http://localhost:8000/api/tipe-barang?page=1",
    "links": [...],
    "next_page_url": null,
    "path": "http://localhost:8000/api/tipe-barang",
    "per_page": 15,
    "prev_page_url": null,
    "to": 4,
    "total": 4
  }
}
```

### Contoh Request

```bash
curl -X GET "http://localhost:8000/api/tipe-barang?per_page=10" \
  -H "Authorization: Bearer {token}"
```

---

## 2. Detail Tipe Barang

Mendapatkan detail satu tipe barang berdasarkan ID.

**Endpoint:** `GET /api/tipe-barang/{id}`

### Path Parameters

| Parameter | Tipe | Required | Keterangan |
|-----------|------|----------|------------|
| `id` | integer | Yes | ID tipe barang |

### Response Success (200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "TIPE 1",
    "desc": "DiameterLuar x DiameterDalam x Panjang",
    "diameter_luar": true,
    "diameter_dalam": true,
    "diameter": false,
    "sisi1": false,
    "sisi2": false,
    "tebal": false,
    "lebar": false,
    "panjang": true,
    "created_at": "2026-02-06T08:47:51.000000Z",
    "updated_at": "2026-02-06T08:47:51.000000Z"
  }
}
```

### Response Error (404 Not Found)

```json
{
  "success": false,
  "message": "Data tidak ditemukan"
}
```

### Contoh Request

```bash
curl -X GET "http://localhost:8000/api/tipe-barang/1" \
  -H "Authorization: Bearer {token}"
```

---

## 3. Create Tipe Barang

Membuat tipe barang baru.

**Endpoint:** `POST /api/tipe-barang`

### Request Body

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| `name` | string | Yes | Nama tipe barang (max 255 karakter) |
| `desc` | string | No | Deskripsi tipe barang |
| `diameter_luar` | boolean | No | Flag diameter luar (default: false) |
| `diameter_dalam` | boolean | No | Flag diameter dalam (default: false) |
| `diameter` | boolean | No | Flag diameter (default: false) |
| `sisi1` | boolean | No | Flag sisi1 (default: false) |
| `sisi2` | boolean | No | Flag sisi2 (default: false) |
| `tebal` | boolean | No | Flag tebal (default: false) |
| `lebar` | boolean | No | Flag lebar (default: false) |
| `panjang` | boolean | No | Flag panjang (default: false) |

### Request Body Example

```json
{
  "name": "TIPE 5",
  "desc": "Diameter x Tebal x Panjang",
  "diameter": true,
  "tebal": true,
  "panjang": true,
  "diameter_luar": false,
  "diameter_dalam": false,
  "sisi1": false,
  "sisi2": false,
  "lebar": false
}
```

### Response Success (200 OK)

```json
{
  "success": true,
  "message": "Data berhasil ditambahkan",
  "data": {
    "id": 5,
    "name": "TIPE 5",
    "desc": "Diameter x Tebal x Panjang",
    "diameter_luar": false,
    "diameter_dalam": false,
    "diameter": true,
    "sisi1": false,
    "sisi2": false,
    "tebal": true,
    "lebar": false,
    "panjang": true,
    "created_at": "2026-02-06T16:20:30.000000Z",
    "updated_at": "2026-02-06T16:20:30.000000Z"
  }
}
```

### Response Error (422 Validation Error)

```json
{
  "success": false,
  "message": "The name field is required."
}
```

### Contoh Request

```bash
curl -X POST "http://localhost:8000/api/tipe-barang" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TIPE 5",
    "desc": "Diameter x Tebal x Panjang",
    "diameter": true,
    "tebal": true,
    "panjang": true
  }'
```

---

## 4. Update Tipe Barang

Mengupdate tipe barang yang sudah ada.

**Endpoint:** `PUT /api/tipe-barang/{id}` atau `PATCH /api/tipe-barang/{id}`

### Path Parameters

| Parameter | Tipe | Required | Keterangan |
|-----------|------|----------|------------|
| `id` | integer | Yes | ID tipe barang |

### Request Body

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| `name` | string | Yes | Nama tipe barang (max 255 karakter) |
| `desc` | string | No | Deskripsi tipe barang |
| `diameter_luar` | boolean | No | Flag diameter luar |
| `diameter_dalam` | boolean | No | Flag diameter dalam |
| `diameter` | boolean | No | Flag diameter |
| `sisi1` | boolean | No | Flag sisi1 |
| `sisi2` | boolean | No | Flag sisi2 |
| `tebal` | boolean | No | Flag tebal |
| `lebar` | boolean | No | Flag lebar |
| `panjang` | boolean | No | Flag panjang |

### Request Body Example

```json
{
  "name": "TIPE 1 - Updated",
  "desc": "DiameterLuar x DiameterDalam x Panjang (untuk pipa)",
  "diameter_luar": true,
  "diameter_dalam": true,
  "panjang": true
}
```

### Response Success (200 OK)

```json
{
  "success": true,
  "message": "Data berhasil diperbarui",
  "data": {
    "id": 1,
    "name": "TIPE 1 - Updated",
    "desc": "DiameterLuar x DiameterDalam x Panjang (untuk pipa)",
    "diameter_luar": true,
    "diameter_dalam": true,
    "diameter": false,
    "sisi1": false,
    "sisi2": false,
    "tebal": false,
    "lebar": false,
    "panjang": true,
    "created_at": "2026-02-06T08:47:51.000000Z",
    "updated_at": "2026-02-06T16:25:15.000000Z"
  }
}
```

### Contoh Request

```bash
curl -X PUT "http://localhost:8000/api/tipe-barang/1" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TIPE 1 - Updated",
    "desc": "DiameterLuar x DiameterDalam x Panjang (untuk pipa)"
  }'
```

---

## 5. Soft Delete Tipe Barang

Menghapus tipe barang secara soft delete.

**Endpoint:** `DELETE /api/tipe-barang/{id}/soft`

### Path Parameters

| Parameter | Tipe | Required | Keterangan |
|-----------|------|----------|------------|
| `id` | integer | Yes | ID tipe barang |

### Response Success (200 OK)

```json
{
  "success": true,
  "message": "Data berhasil dihapus",
  "data": null
}
```

### Response Error (404 Not Found)

```json
{
  "success": false,
  "message": "Data tidak ditemukan"
}
```

### Contoh Request

```bash
curl -X DELETE "http://localhost:8000/api/tipe-barang/1/soft" \
  -H "Authorization: Bearer {token}"
```

---

## 6. Restore Tipe Barang

Memulihkan tipe barang yang sudah di-soft delete.

**Endpoint:** `PATCH /api/tipe-barang/{id}/restore`

### Path Parameters

| Parameter | Tipe | Required | Keterangan |
|-----------|------|----------|------------|
| `id` | integer | Yes | ID tipe barang |

### Response Success (200 OK)

```json
{
  "success": true,
  "message": "Data berhasil di-restore",
  "data": {
    "id": 1,
    "name": "TIPE 1",
    "desc": "DiameterLuar x DiameterDalam x Panjang",
    "diameter_luar": true,
    "diameter_dalam": true,
    "diameter": false,
    "sisi1": false,
    "sisi2": false,
    "tebal": false,
    "lebar": false,
    "panjang": true,
    "created_at": "2026-02-06T08:47:51.000000Z",
    "updated_at": "2026-02-06T08:47:51.000000Z",
    "deleted_at": null
  }
}
```

### Response Error (404 Not Found)

```json
{
  "success": false,
  "message": "Data tidak ditemukan atau tidak soft deleted"
}
```

### Contoh Request

```bash
curl -X PATCH "http://localhost:8000/api/tipe-barang/1/restore" \
  -H "Authorization: Bearer {token}"
```

---

## 7. Force Delete Tipe Barang

Menghapus tipe barang secara permanen.

**Endpoint:** `DELETE /api/tipe-barang/{id}/force`

### Path Parameters

| Parameter | Tipe | Required | Keterangan |
|-----------|------|----------|------------|
| `id` | integer | Yes | ID tipe barang |

### Response Success (200 OK)

```json
{
  "success": true,
  "message": "Data berhasil di-force delete",
  "data": null
}
```

### Response Error (409 Conflict)

Jika data masih digunakan oleh tabel lain (foreign key constraint):

```json
{
  "success": false,
  "message": "Data tidak dapat dihapus permanen karena masih digunakan oleh data lain"
}
```

### Contoh Request

```bash
curl -X DELETE "http://localhost:8000/api/tipe-barang/1/force" \
  -H "Authorization: Bearer {token}"
```

---

## 8. List dengan Trashed

Mendapatkan daftar tipe barang termasuk yang sudah di-soft delete.

**Endpoint:** `GET /api/tipe-barang/with-trashed/all`

### Query Parameters

Sama seperti endpoint list biasa, ditambah:
- Data yang sudah di-soft delete juga akan muncul
- Field `deleted_at` akan terisi jika data sudah dihapus

### Response Success (200 OK)

```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "name": "TIPE 1",
        "desc": "DiameterLuar x DiameterDalam x Panjang",
        "diameter_luar": true,
        "diameter_dalam": true,
        "diameter": false,
        "sisi1": false,
        "sisi2": false,
        "tebal": false,
        "lebar": false,
        "panjang": true,
        "created_at": "2026-02-06T08:47:51.000000Z",
        "updated_at": "2026-02-06T08:47:51.000000Z",
        "deleted_at": null
      },
      {
        "id": 5,
        "name": "TIPE 5",
        "desc": "Diameter x Tebal x Panjang",
        "diameter_luar": false,
        "diameter_dalam": false,
        "diameter": true,
        "sisi1": false,
        "sisi2": false,
        "tebal": true,
        "lebar": false,
        "panjang": true,
        "created_at": "2026-02-06T16:20:30.000000Z",
        "updated_at": "2026-02-06T16:20:30.000000Z",
        "deleted_at": "2026-02-06T16:30:00.000000Z"
      }
    ],
    ...
  }
}
```

---

## 9. List Trashed Only

Mendapatkan daftar tipe barang yang sudah di-soft delete saja.

**Endpoint:** `GET /api/tipe-barang/with-trashed/trashed`

### Query Parameters

Sama seperti endpoint list biasa, tetapi hanya menampilkan data yang sudah di-soft delete.

---

## Relasi dengan Tabel Lain

### Bentuk Barang

Tipe Barang memiliki relasi one-to-many dengan Bentuk Barang (`ref_bentuk_barang`).

Ketika membuat atau mengupdate Bentuk Barang, dapat menambahkan field `tipe_barang_id` untuk menghubungkan dengan Tipe Barang tertentu.

**Contoh:**

```json
{
  "kode": "PIP",
  "nama_bentuk": "Pipe",
  "dimensi": "1D",
  "tipe_barang_id": 1
}
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "Error message"
}
```

### Common Error Codes

| Status Code | Keterangan |
|-------------|------------|
| 200 | Success |
| 404 | Data tidak ditemukan |
| 422 | Validation error |
| 401 | Unauthorized |
| 409 | Conflict (foreign key constraint) |
| 500 | Internal server error |

### Error Messages

- `"Data tidak ditemukan"` - ID tidak ditemukan
- `"The name field is required."` - Validasi nama wajib diisi
- `"Data tidak ditemukan atau tidak soft deleted"` - Restore data yang tidak dihapus
- `"Data tidak dapat dihapus permanen karena masih digunakan oleh data lain"` - Foreign key constraint

---

## Catatan Penting

1. **Boolean Flags**: Setiap flag dimensi (diameter_luar, diameter_dalam, dll) adalah boolean yang menunjukkan apakah dimensi tersebut relevan untuk tipe barang ini.

2. **Default Values**: Jika flag tidak dikirim saat create/update, defaultnya adalah `false`.

3. **Soft Delete**: Data yang dihapus menggunakan soft delete, sehingga masih bisa dipulihkan dengan endpoint restore.

4. **Relasi**: Tipe Barang terkait dengan Bentuk Barang melalui foreign key `tipe_barang_id` di tabel `ref_bentuk_barang`.

5. **Pagination**: Semua endpoint list menggunakan pagination dengan default per_page sesuai konfigurasi sistem.

6. **Seeder Data**: Sistem sudah menyediakan 4 tipe barang default (TIPE 1, TIPE 2, TIPE 3, TIPE 4) yang dapat langsung digunakan.

---

## Contoh Penggunaan Lengkap

### Scenario: Menambahkan Tipe Barang Baru

```bash
# 1. List tipe barang yang ada
GET /api/tipe-barang

# 2. Create tipe barang baru
POST /api/tipe-barang
{
  "name": "TIPE CUSTOM",
  "desc": "DiameterLuar x Tebal x Panjang",
  "diameter_luar": true,
  "tebal": true,
  "panjang": true
}

# 3. Update jika perlu
PUT /api/tipe-barang/5
{
  "name": "TIPE CUSTOM - Updated",
  "desc": "DiameterLuar x Tebal x Panjang (untuk tube tebal)"
}

# 4. Gunakan tipe barang untuk bentuk barang
POST /api/bentuk-barang
{
  "kode": "TUBE",
  "nama_bentuk": "Tube Custom",
  "dimensi": "1D",
  "tipe_barang_id": 5
}
```

### Scenario: Menghapus dan Restore Tipe Barang

```bash
# 1. Soft delete tipe barang
DELETE /api/tipe-barang/5/soft

# 2. List dengan trashed untuk melihat data yang sudah dihapus
GET /api/tipe-barang/with-trashed/all

# 3. Restore jika diperlukan
PATCH /api/tipe-barang/5/restore

# 4. Force delete jika yakin tidak diperlukan lagi
DELETE /api/tipe-barang/5/force
```

---

## Testing dengan Postman

1. Import collection dengan base URL: `http://localhost:8000/api`
2. Set authorization header dengan Bearer token
3. Gunakan endpoint sesuai kebutuhan
4. Pastikan Content-Type: application/json untuk request POST/PUT/PATCH

---

**Dokumentasi ini dibuat pada:** 6 Februari 2026  
**Versi API:** 1.0
