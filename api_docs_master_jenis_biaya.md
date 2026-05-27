# API Documentation: Master Data Jenis Biaya

Dokumentasi ini berisi detail endpoint untuk Master Data Jenis Biaya, termasuk operasi CRUD, Import CSV, dan Download Template. Operasi ini disamakan dengan standar master data lainnya di sistem.

## Base Information
- **Method:** `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
- **Auth:** `Bearer Token`
- **Base Route:** `/api/jenis-biaya`

---

## 1. Get All Jenis Biaya
Mengambil daftar semua jenis biaya dengan dukungan paginasi dan pencarian (filter).

- **Endpoint:** `/api/jenis-biaya`
- **Method:** `GET`
- **Query Params (Optional):**
  - `per_page` (int) - Default: 10
  - `kode` (string) - Pencarian berdasar kode
  - `jenis_biaya` (string) - Pencarian berdasar jenis biaya

### Example Response
```json
{
    "success": true,
    "message": "Data berhasil diambil",
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 1,
                "kode": "B001",
                "jenis_biaya": "Biaya Transportasi",
                "created_at": "2026-05-07T10:00:00.000000Z",
                "updated_at": "2026-05-07T10:00:00.000000Z"
            }
        ],
        "total": 1,
        "per_page": 10,
        "last_page": 1
    }
}
```

---

## 2. Get Single Jenis Biaya
Mengambil data detail untuk satu jenis biaya berdasarkan ID.

- **Endpoint:** `/api/jenis-biaya/{id}`
- **Method:** `GET`

### Example Response
```json
{
    "success": true,
    "message": "Data berhasil diambil",
    "data": {
        "id": 1,
        "kode": "B001",
        "jenis_biaya": "Biaya Transportasi",
        "created_at": "2026-05-07T10:00:00.000000Z",
        "updated_at": "2026-05-07T10:00:00.000000Z"
    }
}
```

---

## 3. Create Jenis Biaya
Menambahkan data jenis biaya baru. `kode` harus unik.

- **Endpoint:** `/api/jenis-biaya`
- **Method:** `POST`
- **Body:** `JSON` / `FormData`

### Request Body
```json
{
    "kode": "B002",
    "jenis_biaya": "Biaya Listrik"
}
```

### Example Response
```json
{
    "success": true,
    "message": "Data berhasil ditambahkan",
    "data": {
        "kode": "B002",
        "jenis_biaya": "Biaya Listrik",
        "id": 2,
        "created_at": "2026-05-07T10:05:00.000000Z",
        "updated_at": "2026-05-07T10:05:00.000000Z"
    }
}
```

---

## 4. Update Jenis Biaya
Mengubah data jenis biaya yang sudah ada.

- **Endpoint:** `/api/jenis-biaya/{id}`
- **Method:** `PUT` / `PATCH`
- **Body:** `JSON` / `FormData`

### Request Body
```json
{
    "kode": "B002",
    "jenis_biaya": "Biaya Listrik dan Air"
}
```

### Example Response
```json
{
    "success": true,
    "message": "Data berhasil diupdate",
    "data": {
        "id": 2,
        "kode": "B002",
        "jenis_biaya": "Biaya Listrik dan Air",
        "created_at": "2026-05-07T10:05:00.000000Z",
        "updated_at": "2026-05-07T10:10:00.000000Z"
    }
}
```

---

## 5. Delete (Soft Delete) Jenis Biaya
Menghapus data (soft delete) sehingga tidak akan muncul di API GET list biasa.

- **Endpoint:** `/api/jenis-biaya/{id}/soft`
- **Method:** `DELETE`

### Example Response
```json
{
    "success": true,
    "message": "Data berhasil di-soft delete",
    "data": null
}
```

---

## 6. Restore Jenis Biaya
Mengembalikan data yang sudah dihapus (soft delete).

- **Endpoint:** `/api/jenis-biaya/{id}/restore`
- **Method:** `PATCH`

### Example Response
```json
{
    "success": true,
    "message": "Data berhasil di-restore",
    "data": {
        "id": 2,
        "kode": "B002",
        "jenis_biaya": "Biaya Listrik dan Air",
        "created_at": "2026-05-07T10:05:00.000000Z",
        "updated_at": "2026-05-07T10:15:00.000000Z"
    }
}
```

---

## 7. Force Delete Jenis Biaya
Menghapus data secara permanen dari database. Akan gagal (409 Conflict) jika data masih direlasikan/digunakan oleh tabel lain.

- **Endpoint:** `/api/jenis-biaya/{id}/force`
- **Method:** `DELETE`

### Example Response
```json
{
    "success": true,
    "message": "Data berhasil di-force delete",
    "data": null
}
```

---

## 8. Download Template CSV
Download template file CSV untuk kebutuhan fitur Import.

- **Endpoint:** `/api/jenis-biaya/download-template`
- **Method:** `GET`
- **Response:** File Download `Template_JenisBiaya.csv`

---

## 9. Import CSV
Import data masal menggunakan file CSV (Semicolon delimited). File template dapat diunduh melalui endpoint download template.
Kolom yang diperlukan di CSV: `Kode;Jenis Biaya`.

- **Endpoint:** `/api/jenis-biaya/import`
- **Method:** `POST`
- **Body:** `multipart/form-data`
  - `file`: File CSV yang akan di-upload

### Example Response
```json
{
    "success": true,
    "message": "Import selesai (5 berhasil, 1 dilewati, 0 error)",
    "data": {
        "imported": 5,
        "skipped": 1,
        "errors": 0
    }
}
```
