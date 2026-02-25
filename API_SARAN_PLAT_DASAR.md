
---

## 5. API pendukung: Saran Plat Utuh
Mendapatkan daftar stok "utuh" yang tersedia berdasarkan group barang yang sama.

- **URL:** `POST /api/work-order-planning/get-saran-plat-utuh`
- **Authentication:** Required (Bearer Token).

### Request Body (JSON)

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `item_barang_group_id`| Integer | **Yes** | ID group barang yang ingin dicari stok utuhnya. |

**Contoh Request Body:**
```json
{
    "item_barang_group_id": 61
}
```

### Response Body (Success 200)
Response-nya adalah array dari objek item barang, dengan struktur yang sama seperti `get-saran-plat-dasar`.

**Contoh Response Body:**
```json
{
    "success": true,
    "message": "Data retrieved successfully",
    "data": [
        {
            "id": 210,
            "nama": "SILINDER-KMD-3521-100x0x0-001",
            "ukuran": "100.00 x 0.00 x 0.00",
            "sisa_luas": 0.00,
            "sisa_quantity": 5
        }
    ]
}
```
