# Work Order Actual - Image API

Dokumentasi ini menjelaskan endpoint khusus **image** untuk Work Order Actual, termasuk:
- Foto bukti header Work Order Actual
- Foto bukti per item
- Foto sisa barang per item
- Versi stream (binary image) dan Base64 (untuk JSON)

Semua endpoint berada di bawah middleware `checkrole` dan membutuhkan `Authorization: Bearer {token}`.

---

## 1. Foto Bukti Header Work Order Actual

### 1.1. Stream Image Header

**Endpoint:**  
`GET /api/work-order-actual/{id}/image`

**Deskripsi:**  
Mengembalikan file image **foto bukti header** Work Order Actual sebagai binary stream. Cocok dipakai dengan `fetch → blob → URL.createObjectURL(blob)` di frontend.

**Perilaku Utama:**
- Membaca path relatif dari kolom `work_order_actual.foto_bukti`
  - Contoh: `work-order-actual/10/foto_bukti.jpg`
- Membangun full path: `storage/app/public/{path_relatif}`
- Jika path mengarah ke folder atau file tidak ditemukan:
  - Mencoba beberapa kandidat:
    - `folder/foto_bukti.jpg`
    - `folder/header/foto_bukti.jpg`
  - Jika masih tidak ada, melakukan pencarian recursive file pertama ber-ekstensi `.jpg/.jpeg/.png/.gif` di folder tersebut.

**Response Sukses:**
- Status: `200 OK`
- Body: binary image (`image/jpeg` default)
- Header penting:
  - `Content-Type: image/jpeg`
  - `Content-Disposition: inline; filename="foto_bukti.jpg"`
  - Cache-control di-set agar tidak di-cache agresif.

**Response Error Umum:**
- `404` jika:
  - Work Order Actual tidak ditemukan
  - `foto_bukti` kosong
  - File tidak ditemukan di storage

**Contoh Penggunaan (JS, fetch → blob):**

```js
const token = '...';
fetch('/api/work-order-actual/10/image', {
  headers: { Authorization: `Bearer ${token}` }
})
  .then(res => res.blob())
  .then(blob => {
    const url = URL.createObjectURL(blob);
    imgElement.src = url;
  });
```

---

## 2. Foto Bukti Item Work Order Actual

### 2.1. Stream Image Per Item

**Endpoint:**  
`GET /api/work-order-actual/item/{itemId}/image`

**Deskripsi:**  
Mengembalikan file image **foto bukti** untuk satu Work Order Actual Item (per baris item).

**Perilaku Utama:**
- Cari `WorkOrderActualItem` by `{itemId}`.
- Gunakan `item.foto_bukti` sebagai path relatif:
  - Contoh: `work-order-actual/10/items/4/foto_bukti.jpg`
- Gunakan helper `resolvePublicImagePath` sama seperti header:
  - Coba path langsung
  - Jika folder, coba kandidat `foto_bukti.jpg`
  - Jika belum ada, cari gambar pertama di folder.

**Response Sukses & Error:**
- `200 OK` + binary image (`image/jpeg`) jika sukses.
- `404` jika:
  - Item tidak ditemukan
  - `foto_bukti` kosong
  - File tidak ditemukan di storage.

---

### 2.2. Base64 Image Per Item

**Endpoint:**  
`GET /api/work-order-actual/item/{itemId}/image-base64`

> Catatan: Jika untuk item belum disediakan route terpisah, pola method di controller adalah `getActualItemImageBase64($itemId)`. Tambah route jika perlu:  
`GET /api/work-order-actual/item/{itemId}/image-base64` → `WorkOrderActualController@getActualItemImageBase64`.

**Deskripsi:**  
Mengembalikan foto bukti item dalam bentuk Base64 di dalam JSON. Cocok untuk embed langsung di `<img src="...">` tanpa request kedua.

**Response Sukses:**

```json
{
  "success": true,
  "data": {
    "wo_actual_item_id": 4,
    "wo_actual_id": 10,
    "file_path": "work-order-actual/10/items/4/foto_bukti.jpg",
    "foto_bukti_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
  },
  "message": "Data ditemukan"
}
```

**Jika tidak ada foto / file hilang:**
- Masih `200 OK`, tetapi:
  - `file_path: null` atau path lama
  - `foto_bukti_base64: null`
  - `message` menjelaskan bahwa foto tidak tersedia atau file tidak ada di storage.

---

## 3. Foto Sisa Barang Item Work Order Actual

### 3.1. Base64 Foto Sisa Barang Per Item

**Endpoint:**  
`GET /api/work-order-actual/item/{itemId}/sisa-image-base64`

**Controller:**  
`WorkOrderActualController@getActualItemSisaImageBase64`

**Deskripsi:**  
Mengembalikan image **foto sisa barang** untuk satu item dalam format Base64 (dibungkus JSON).

**Response Sukses:**

```json
{
  "success": true,
  "data": {
    "wo_actual_item_id": 4,
    "wo_actual_id": 10,
    "file_path": "work-order-actual/10/items/4/foto_sisa_barang.jpg",
    "foto_sisa_barang_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
  },
  "message": "Data ditemukan"
}
```

**File / path kosong:**
- `foto_sisa_barang_base64: null`
- `file_path: null` atau path lama
- Message menjelaskan bahwa foto tidak tersedia atau file tidak ditemukan.

---

### 3.2. Stream Foto Sisa Barang Per Item

**Endpoint:**  
`GET /api/work-order-actual/item/{itemId}/sisa-image`

**Controller:**  
`WorkOrderActualController@streamActualItemSisaImage`

**Deskripsi:**  
Mengembalikan file image **foto sisa barang** sebagai binary stream.

**Perilaku Utama:**
- Cari item by `{itemId}`.
- Ambil path relatif dari `item.foto_sisa_barang`, misal:
  - `work-order-actual/10/items/4/foto_sisa_barang.jpg`
- Gunakan `resolvePublicImagePath` dengan kandidat:
  - `foto_sisa_barang.jpg`
- Jika tidak ditemukan → `404` dengan pesan error.

**Response:**
- `200 OK` dengan binary image jika berhasil
- Header mirip dengan endpoint image lainnya (`Content-Type`, `Content-Length`, dsb.)

---

## 4. Get Semua Foto Bukti Item (Base64) per Work Order Actual

### 4.1. Semua Foto Bukti Item per Actual ID

**Endpoint (saran route):**  
`GET /api/work-order-actual/{actualId}/items/image-base64`

**Controller:**  
`WorkOrderActualController@getAllActualItemImagesBase64`

**Deskripsi:**  
Mengembalikan semua foto bukti item dalam satu Work Order Actual, dalam bentuk array Base64.

**Response Sukses:**

```json
{
  "success": true,
  "data": {
    "wo_actual_id": 10,
    "total_images": 2,
    "images": [
      {
        "wo_actual_item_id": 4,
        "file_path": "work-order-actual/10/items/4/foto_bukti.jpg",
        "foto_bukti_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
      },
      {
        "wo_actual_item_id": 5,
        "file_path": "work-order-actual/10/items/5/foto_bukti.jpg",
        "foto_bukti_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
      }
    ]
  },
  "message": "Images berhasil diambil"
}
```

**Jika tidak ada item / foto:**

```json
{
  "success": true,
  "data": {
    "wo_actual_id": 10,
    "total_images": 0,
    "images": []
  },
  "message": "Tidak ada item atau foto bukti untuk WO Actual ini"
}
```

---

## 5. Catatan Implementasi Frontend

- Untuk `<img src="...">` langsung **tidak bisa** kirim header Authorization, jadi:
  - Gunakan endpoint BASE64 (`*image-base64`) untuk embed langsung.
  - Atau gunakan endpoint stream dengan `fetch` + `blob` lalu `URL.createObjectURL`.
- Simpan path relatif yang dikembalikan (`file_path`) jika FE perlu debugging atau menampilkan info lokasi file.

