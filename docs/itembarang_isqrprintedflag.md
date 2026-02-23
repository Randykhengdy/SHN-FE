# Dokumentasi Flag is_qrcode_printed Item Barang

## Deskripsi

Flag `is_qrcode_printed` digunakan untuk menandai apakah QR Code untuk sebuah `ItemBarang` sudah pernah dicetak atau belum. Ini berguna untuk mempermudah operasional gudang dalam melacak item mana yang masih memerlukan label.

---

## Database Schema

### Migration: `2026_02_23_133310_add_is_qrcode_printed_to_ref_item_barang_table.php`

Menambahkan kolom pada tabel `ref_item_barang`:

| Kolom | Tipe | Default | Keterangan |
|---|---|---|---|
| `is_qrcode_printed` | `boolean` | `false` | Penanda apakah QR Code sudah dicetak |

---

## Model Configuration

Pada model `App\Models\MasterData\ItemBarang`:

- **Fillable**: Kolom `is_qrcode_printed` telah ditambahkan ke array `$fillable`.
- **Casts**: Kolom dicast sebagai `boolean`.

---

## API Endpoints

### Update QR Code Status

```
PATCH /api/item-barang/{id}/qrcode-status
```

**Deskripsi:** Memperbarui status `is_qrcode_printed` untuk item barang tertentu.

#### Path Parameter

| Parameter | Tipe | Keterangan |
|---|---|---|
| `id` | integer | ID Item Barang (`ref_item_barang.id`) |

#### Request Body

```json
{
  "is_qrcode_printed": true
}
```

#### Parameter Body

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `is_qrcode_printed` | boolean | ✅ | Status cetak QR Code (`true` atau `false`) |

#### Response Sukses (200)

```json
{
  "success": true,
  "message": "Status QR Code berhasil diperbarui",
  "data": {
    "id": 120,
    "kode_barang": "PL-SS-A-6000x1500x10-000045",
    "is_qrcode_printed": true,
    ...
  }
}
```

#### Response Error (404 / 422)

```json
// Jika ID tidak ditemukan (404)
{
  "success": false,
  "message": "Item barang tidak ditemukan"
}

// Jika validasi gagal (422)
{
  "success": false,
  "message": "The is qrcode printed field must be true or false."
}
```

---

## Integrasi Frontend

Endpoint ini biasanya dipanggil setelah aksi cetak label berhasil dilakukan di sisi client, atau jika operator ingin menandai ulang secara manual.

- **Frontend Suggestion**: Tambahkan indikator visual (seperti icon printer/check) pada list item barang jika `is_qrcode_printed` bernilai `true`.
