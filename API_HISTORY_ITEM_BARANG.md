# API Documentation: Item Barang Usage History

This document provides details for the API endpoint to retrieve the usage history of a specific base material (`ItemBarang`).

---

## Get Item Usage History

Retrieves a complete history of where a specific `ItemBarang` (plat dasar/shaft) has been planned for use or has actually been used in production.

- **URL:** `/api/item-barang/{id}/history`
- **Method:** `GET`
- **URL Params:**
  - `id` (required): The ID of the `ref_item_barang` you want to track.

### Success Response (Code 200)

Returns a JSON object containing the usage history.

**Content:**
```json
{
    "success": true,
    "data": [
        {
            "customer": "PT. Pelanggan A",
            "nomor_wo": "WO-2024-001",
            "ukuran_barang_request": "1000 x 2000 x 10",
            "berat_actual": 150.5,
            "saldo_berat_sisa": 849.5,
            "tanggal_actual": "2024-03-18",
            "status": "Actualized"
        },
        {
            "customer": "CV. Pelanggan B",
            "nomor_wo": "WO-2024-002",
            "ukuran_barang_request": "500 x 500 x 20",
            "berat_actual": null,
            "saldo_berat_sisa": null,
            "tanggal_actual": null,
            "status": "Planned"
        }
    ]
}
```

**Field Descriptions:**

| Field                   | Type          | Description                                                                                             |
| ----------------------- | ------------- | ------------------------------------------------------------------------------------------------------- |
| `customer`              | `string|null` | The name of the customer for the Work Order.                                                            |
| `nomor_wo`              | `string|null` | The Work Order number where the item was planned.                                                       |
| `ukuran_barang_request` | `string`      | The formatted dimensions of the final product requested in the Work Order Planning Item.                |
| `berat_actual`          | `float|null`  | The actual weight consumed. `null` if it has only been planned but not yet actualized.                  |
| `saldo_berat_sisa`      | `float|null`  | The remaining weight of the base material after this specific consumption. `null` if not yet actualized. |
| `tanggal_actual`        | `string|null` | The date of actualization (format: `Y-m-d`). `null` if not yet actualized.                              |
| `status`                | `string`      | Indicates the current stage: `Actualized` or `Planned`.                                                 |

### Error Responses

- **Code 404 Not Found**
  - If the `ItemBarang` with the specified `id` does not exist.
  ```json
  {
      "success": false,
      "message": "Item barang tidak ditemukan"
  }
  ```

- **Code 500 Internal Server Error**
  - If a server-side error occurs during processing.
  ```json
  {
      "success": false,
      "message": "Terjadi kesalahan pada server"
  }
  ```

### Example Request (cURL)

```bash
curl http://your-domain.com/api/item-barang/1350/history
```
