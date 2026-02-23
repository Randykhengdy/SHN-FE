# Dokumentasi Penyesuaian Flow Item Barang Request

## 1. Perubahan Business Flow Utama

Sebelumnya, request item barang dilakukan secara individual (satu per satu). Sekarang, sistem menggunakan struktur **Header-Detail**, di mana satu nomor request bisa berisi banyak item.

**Perubahan Konsep Unit:**
- **Dulu**: Input langsung memilih **ItemBarang** (individu barang dengan kode unik).
- **Sekarang**: Input awal memilih **ItemBarangGroup** (kategori barang berdasarkan spesifikasi dimensi). Admin baru akan memilihkan individu **ItemBarang** yang tersedia saat proses review.

---

## 2. Status Lifecycle

Status pada Header Request sekarang memiliki alur sebagai berikut:

1.  **`pending`**: Status awal saat request baru dibuat oleh User. Belum ada item spesifik yang dipasangkan ke detail.
2.  **`reviewed`**: Status otomatis berubah menjadi `reviewed` jika **minimal satu** detail dalam request tersebut sudah dipilihkan `ItemBarang`-nya oleh Admin.
3.  **`approved`**: Status akhir saat Admin menyetujui seluruh request. **Syarat Approved**: Seluruh detail dalam request tersebut **wajib** sudah memiliki pasangan `ItemBarang`.
4.  **`rejected`**: Request ditolak oleh Admin.

---

## 3. Technical Flow & API untuk Frontend

### A. Membuat Request Baru (Create)
**Endpoint:** `POST /api/item-barang-request`

Frontend sekarang mengirimkan array `details` yang berisi `item_barang_group_id`.

**Payload JSON:**
```json
{
  "gudang_tujuan_id": 2,
  "keterangan": "Request untuk proyek A",
  "details": [
    {
      "item_barang_group_id": 10,
      "quantity": 2,
      "notes": "Cari yang grade A"
    },
    {
      "item_barang_group_id": 15,
      "quantity": 1,
      "notes": null
    }
  ]
}
```

### B. List Pending untuk Admin
**Endpoint:** `GET /api/item-barang-request/pending`
Endpoint ini akan mengembalikan data dengan status `pending` ATAU `reviewed`.

### C. Meng-assign Item ke Detail (Admin)
**Endpoint:** `PATCH /api/item-barang-request/detail/{detailId}/assign-item`

Digunakan admin untuk memilihkan barang fisik (`ItemBarang`) untuk setiap baris detail.

**Payload JSON:**
```json
{
  "id_item_barang": 505
}
```
*Note: Panggilan ke API ini akan otomatis mengubah status Header Request menjadi `reviewed`.*

### D. Approval (Admin)
**Endpoint:** `PATCH /api/item-barang-request/{id}/approve`

**Validasi Backend:** Jika ada detail yang belum di-assign `id_item_barang`, API akan mengembalikan error 422.

---

## 4. Struktur Data (Eager Loading)

Saat memanggil detail request (`GET /api/item-barang-request/{id}`), frontend akan menerima struktur seperti ini:

```json
{
  "id": 1,
  "nomor_request": "RCP-20260223-001",
  "status": "reviewed",
  "details": [
    {
      "id": 10,
      "item_barang_group_id": 10,
      "id_item_barang": 505,
      "quantity": 2,
      "item_barang_group": {
        "id": 10,
        "nama_group_barang": "STAINLESS STEEL PLAT 304 6000x1500x10"
      },
      "item_barang": {
        "id": 505,
        "kode_barang": "PL-SS-304-6000x1500x10-0001",
        "gudang_id": 1
      }
    }
  ]
}
```

---

## 5. Tips Implementasi Frontend

1.  **Form Input**: Ubah dropdown pencarian item dari sebelumnya mencari di `ItemBarang` menjadi mencari di `ItemBarangGroup`.
2.  **Detail View (Admin)**: Tampilkan daftar detail. Setiap baris detail yang belum ada `id_item_barang`-nya harus memiliki tombol/opsi untuk "Assign Item" (membuka modal pencarian barang yang tersedia di grup tersebut).
3.  **Submit Status**: Sembunyikan atau disable tombol **Approve** jika masih ada baris detail yang belum di-assign item barang fisiknya.
