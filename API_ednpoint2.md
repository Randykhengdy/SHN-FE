# API Endpoint Tambahan (Ringkas)

Ringkasan endpoint baru, dengan contoh singkat request/response.

## Item Barang Request
- Create: `POST /api/item-barang-request`
  - Request (referensi item): `{ "item_barang_id": 6, "quantity": 1 }`
  - Response: menyertakan `nomor_request`, `requested_at`, `asal_gudang`, `tujuan_gudang`
- Get by ID: `GET /api/item-barang-request/{id}`
  - Response: detail request + `asal_gudang`, `tujuan_gudang`, `item_barang.gudang`
- Approve: `PATCH /api/item-barang-request/{id}/approve`
  - Request: `{ "gudang_tujuan_id": 2, "item_barang_id": 42 }`
  - Response: `{ request, updated_item }` (item pindah gudang, `jenis_potongan = "potongan"`)
- Cancel: `DELETE /api/item-barang-request/{id}`
  - Soft delete; hanya untuk status `pending` oleh pemilik

## Notifications
- Create: `POST /api/notifications`
  - Request: `{ "title": "...", "message": "...", "type": "sales_order", "recipients": [2,5] }`
  - Response: notifikasi + recipients
- Get by user: `GET /api/notifications/by-user/{userId}`
  - Query: `per_page`, `unread`
  - Response: daftar notif user dengan `is_read`, `read_at`

## Work Order Planning
- Validate SO coverage: `POST /api/work-order-planning/validate-so-coverage`
  - Request: `{ "id_sales_order": 123, "items": [{ "sales_order_item_id": 1001, "quantity": 2 }] }`
  - Response valid: `{ "success": true, "data": { "valid": true } }`
  - Response tidak valid: `{ "success": true, "data": { "valid": false, "mismatches": [...] } }`
  - Contoh `mismatches`:
    ```json
    [
      {
        "sales_order_item_id": 1003,
        "expected_qty": 3,
        "combined_qty": 2,
        "difference": -1,
        "existing_planned_qty": 1,
        "incoming_qty": 1,
        "jenis_barang": { "id": 8, "nama": "Aluminium" },
        "bentuk_barang": { "id": 9, "nama": "Plat" },
        "grade_barang": { "id": 6, "nama": "A" }
      }
    ]
    ```
- Save WO: `POST /api/work-order-planning`
  - Request wajib menyertakan `typeWO` (`normal`, `pending`, `cancel`)
  - Efek:
    - `pending`: set `sales_order.is_wo_qty_matched = false`, `process_status = 'pending'`, status tetap `active`
    - `normal`: tidak mengubah SO (default `is_wo_qty_matched = true`)
    - `cancel`: set `sales_order.status = 'closed'`, `process_status = 'cancel'`
  - Notifikasi admin: untuk `Pending` dan `Batal` dibuat notifikasi ke semua user role admin dengan pesan bahwa qty WO vs SO tidak match (berisi `nomor_so` dan `nomor_wo`)
  - Contoh request:
    ```json
    {
      "wo_unique_id": "WO-TEMP-123",
      "id_sales_order": 123,
      "id_pelanggan": 45,
      "id_gudang": 3,
      "status": "pending",
      "typeWO": "pending",
      "tanggal_wo": "2025-12-05",
      "prioritas": "normal",
      "handover_method": "pickup",
      "items": [
        {
          "wo_item_unique_id": "WOITEM-001",
          "sales_order_item_id": 1001,
          "qty": 2,
          "satuan": "PCS"
        }
      ]
    }
    ```

## Pelanggan
Fields (data): `kode`, `nama_pelanggan`, `kota`, `telepon_hp`, `contact_person`, `id`

- Create: `POST /api/pelanggan`
  - Request:
    ```json
    {
      "kode": "CUST-001",
      "nama_pelanggan": "PT Contoh",
      "kota": "Jakarta",
      "telepon_hp": "08123456789",
      "contact_person": "Budi",
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "message": "Data berhasil ditambahkan",
      "data": {
        "id": 9,
        "kode": "CUST-001",
        "nama_pelanggan": "PT Contoh",
        "kota": "Jakarta",
        "telepon_hp": "08123456789",
        "contact_person": "Budi",
      }
    }
    ```

- List: `GET /api/pelanggan`
  - Query: `per_page`, `search`, `sort_by`, `order`
  - Response (paginated):
    ```json
    {
      "success": true,
      "message": "Data ditemukan",
      "data": [
        {
          "id": 8,
          "kode": "CUST-0008",
          "nama_pelanggan": "PT Sampoerna",
          "kota": "Surabaya",
          "telepon_hp": "0812xxxx",
          "contact_person": "Agus",
        }
      ],
      "pagination": {
        "current_page": 1,
        "per_page": 100,
        "last_page": 1,
        "total": 1
      }
    }
    ```

- Show: `GET /api/pelanggan/{id}`
  - Response:
    ```json
    {
      "success": true,
      "message": "Data ditemukan",
      "data": {
        "id": 8,
        "kode": "CUST-0008",
        "nama_pelanggan": "PT Sampoerna",
        "kota": "Surabaya",
        "telepon_hp": "0812xxxx",
        "contact_person": "Agus",
      }
    }
    ```

- Update: `PATCH /api/pelanggan/{id}`
  - Request (contoh minimal):
    ```json
    {
      "nama_pelanggan": "PT Sampoerna Tbk",
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "message": "Data berhasil diupdate",
      "data": {
        "id": 8,
        "kode": "CUST-0008",
        "nama_pelanggan": "PT Sampoerna Tbk",
        "kota": "Surabaya",
        "telepon_hp": "0812xxxx",
        "contact_person": "Agus",
        "email": "halo@sampoerna.co.id"
      }
    }
    ```

- Delete (soft): `DELETE /api/pelanggan/{id}`
  - Response:
    ```json
    { "success": true, "message": "Data berhasil di-soft delete", "data": null }
    ```

- Restore: `PATCH /api/pelanggan/{id}/restore`
  - Response:
    ```json
    {
      "success": true,
      "message": "Data berhasil di-restore",
      "data": { "id": 8, "kode": "CUST-0008", "nama_pelanggan": "PT Sampoerna" }
    }
    ```
## Sales Order Header
- List: `GET /api/sales-order/header`
  - Query params:
    - `per_page` (default 100)
    - `search` (mencari di beberapa kolom dasar)
    - `sort_by`, `order` atau `sort` multi
    - `process_status` (exact match)
    - `status` (exact match; nilai enum: `active`, `delete_requested`, `deleted`, `closed`)
  - Contoh:
    - `GET /api/sales-order/header?status=closed&per_page=1000`
    - `GET /api/sales-order/header?status=cancel&sort_by=id&order=desc`
    - `GET /api/sales-order/header?process_status=pending&status=active`
