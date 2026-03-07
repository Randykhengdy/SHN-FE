
---

## 6. API Utama: Create Work Order Planning (with Saran)
Membuat Work Order Planning baru beserta item-itemnya, termasuk menyimpan informasi saran plat dasar yang dipilih.

- **URL:** `POST /api/work-order-planning/with-saran-plat-dasar`
- **Authentication:** Required (Bearer Token).

### Request Body (JSON)
Payload-nya adalah object Work Order Planning yang memiliki array `items`. Setiap item di dalam `items` harus menyertakan semua atribut dimensi yang relevan.

**Struktur Item dalam `items`:**
```json
{
    "wo_item_unique_id": "WOI-UNIQUE-123",
    "sales_order_item_id": 1,
    "item_barang_group_id": 61,
    "qty_planning": 1,
    "panjang": 100,
    "lebar": 0,
    "tebal": 0,
    "diameter_luar": 0,
    "diameter_dalam": 0,
    "diameter": 1,
    "sisi1": 0,
    "sisi2": 0,
    "jenis_potongan": "potongan",
    "saran_plat_dasar": [
        {
            "item_barang_id": 123,
            "quantity": 1,
            "canvas_image": "data:image/jpeg;base64,..." 
        }
    ]
}
```
