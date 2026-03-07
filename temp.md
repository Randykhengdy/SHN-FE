# API Destroy Item Barang

Digunakan untuk mengubah status item barang menjadi `destroy`.

- **URL:** `POST /api/item-barang/destroy`
- **Method:** `POST`
- **Authentication:** Required (Bearer Token)

### Request Body (JSON)

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `item_barang_id` | Integer | **Yes** | ID dari item barang yang ingin di-destroy. |

**Contoh Request:**
```json
{
    "item_barang_id": 123
}
```

### Response Body (Success 200)

```json
{
    "success": true,
    "message": "Item barang berhasil di-destroy",
    "data": {
        "id": 123,
        "kode_barang": "BRG-001",
        "status": "destroy",
        "updated_at": "2024-03-02T17:20:00.000000Z"
    }
}
```

### Response Body (Error 422)

```json
{
    "success": false,
    "message": "Item barang sudah dalam status destroy"
}
```
