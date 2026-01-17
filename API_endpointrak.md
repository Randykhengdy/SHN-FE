# Dokumentasi API Rak

Dokumentasi ini menjelaskan endpoint API untuk manajemen data Rak (ref_rak).
Semua endpoint memerlukan header Authorization dengan Bearer Token.

## Base URL
`/api/rak`

## 1. Get List Rak (Termasuk Filter by Gudang)

Mengambil daftar rak dengan dukungan pagination dan filtering.

**Endpoint:**
`GET /api/rak`

**Query Parameters:**
| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `gudang_id` | integer | Tidak | **PENTING:** Filter rak berdasarkan ID Gudang. |
| `per_page` | integer | Tidak | Jumlah data per halaman (default: 10). |
| `page` | integer | Tidak | Nomor halaman. |
| `filter[nama_rak]` | string | Tidak | Filter berdasarkan nama rak. |
| `filter[kode]` | string | Tidak | Filter berdasarkan kode rak. |

**Contoh Request (Filter by Gudang):**
```http
GET /api/rak?gudang_id=1&per_page=10
Authorization: Bearer <token>
```

**Contoh Response:**
```json
{
    "status": true,
    "message": "Success",
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 1,
                "kode": "RAK-A1",
                "nama_rak": "Rak Besi A1",
                "gudang_id": 1,
                "telepon_hp": "08123456789",
                "kapasitas": 1000,
                "created_at": "2023-10-27T10:00:00.000000Z",
                "updated_at": "2023-10-27T10:00:00.000000Z",
                "gudang": {
                    "id": 1,
                    "kode": "GDG-UTAMA",
                    "nama_gudang": "Gudang Utama",
                    "tipe_gudang": "gudang",
                    "telepon_hp": "021555555",
                    "kapasitas": 10000
                }
            }
        ],
        "first_page_url": "http://localhost/api/rak?page=1",
        "from": 1,
        "last_page": 1,
        "last_page_url": "http://localhost/api/rak?page=1",
        "links": [
            {
                "url": null,
                "label": "&laquo; Previous",
                "active": false
            },
            {
                "url": "http://localhost/api/rak?page=1",
                "label": "1",
                "active": true
            },
            {
                "url": null,
                "label": "Next &raquo;",
                "active": false
            }
        ],
        "next_page_url": null,
        "path": "http://localhost/api/rak",
        "per_page": 10,
        "prev_page_url": null,
        "to": 1,
        "total": 1
    }
}
```

---

## 2. Get Detail Rak

Mengambil detail satu data rak berdasarkan ID.

**Endpoint:**
`GET /api/rak/{id}`

**Contoh Request:**
```http
GET /api/rak/1
Authorization: Bearer <token>
```

**Contoh Response:**
```json
{
    "status": true,
    "message": "Success",
    "data": {
        "id": 1,
        "kode": "RAK-A1",
        "nama_rak": "Rak Besi A1",
        "gudang_id": 1,
        "telepon_hp": "08123456789",
        "kapasitas": 1000,
        "created_at": "2023-10-27T10:00:00.000000Z",
        "updated_at": "2023-10-27T10:00:00.000000Z",
        "gudang": {
            "id": 1,
            "kode": "GDG-UTAMA",
            "nama_gudang": "Gudang Utama",
            "tipe_gudang": "gudang",
            "telepon_hp": "021555555",
            "kapasitas": 10000
        }
    }
}
```

---

## 3. Create Rak

Menambahkan data rak baru.

**Endpoint:**
`POST /api/rak`

**Body Parameters:**
| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `kode` | string | Ya | Kode unik rak. |
| `nama_rak` | string | Ya | Nama rak. |
| `gudang_id` | integer | Ya | ID Gudang tempat rak berada (harus valid). |
| `telepon_hp` | string | Tidak | Nomor telepon/kontak rak (opsional). |
| `kapasitas` | numeric | Tidak | Kapasitas rak (min: 0). |

**Contoh Request:**
```json
{
    "kode": "RAK-B2",
    "nama_rak": "Rak Kayu B2",
    "gudang_id": 1,
    "telepon_hp": "08987654321",
    "kapasitas": 500
}
```

**Contoh Response:**
```json
{
    "status": true,
    "message": "Data rak berhasil ditambahkan",
    "data": {
        "kode": "RAK-B2",
        "nama_rak": "Rak Kayu B2",
        "gudang_id": 1,
        "telepon_hp": "08987654321",
        "kapasitas": 500,
        "updated_at": "2023-10-27T10:05:00.000000Z",
        "created_at": "2023-10-27T10:05:00.000000Z",
        "id": 2
    }
}
```

---

## 4. Update Rak

Mengupdate data rak yang sudah ada.

**Endpoint:**
`PUT /api/rak/{id}` atau `PATCH /api/rak/{id}`

**Body Parameters:**
Sama seperti Create Rak, namun bersifat opsional untuk PATCH.

**Contoh Request:**
```json
{
    "nama_rak": "Rak Kayu B2 Updated",
    "kapasitas": 750
}
```

**Contoh Response:**
```json
{
    "status": true,
    "message": "Data rak berhasil diperbarui",
    "data": {
        "id": 2,
        "kode": "RAK-B2",
        "nama_rak": "Rak Kayu B2 Updated",
        "gudang_id": 1,
        "telepon_hp": "08987654321",
        "kapasitas": 750,
        "created_at": "2023-10-27T10:05:00.000000Z",
        "updated_at": "2023-10-27T10:10:00.000000Z"
    }
}
```

---

## 5. Delete Rak

Menghapus data rak (Soft Delete).

**Endpoint:**
`DELETE /api/rak/{id}`

**Contoh Request:**
```http
DELETE /api/rak/2
Authorization: Bearer <token>
```

**Contoh Response:**
```json
{
    "status": true,
    "message": "Data rak berhasil dihapus",
    "data": null
}
```
